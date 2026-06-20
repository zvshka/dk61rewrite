import { EmbedBuilder, TextChannel } from 'discord.js';
import { delay, inject } from 'tsyringe';
import RssParser from 'rss-parser';
import { PorterStemmer, PorterStemmerRu } from 'natural';

import { rssConfig } from '@/configs';
import { Service } from '@/decorators';
import { Database, LLM, Logger } from '@/services';
import { isNullOrUndefined, isNullOrWhitespace, isValidUrl } from '@/utils/functions';
import { Client } from "discordx";

type FeedItem = {
  guid: string;
  title: string;
  link: string | undefined;
  description: string | undefined;
  author: string | undefined;
  publishedAt: Date | undefined;
};

@Service()
export class RssService {
  private parser: RssParser;

  constructor(
    private db: Database,
    private logger: Logger,
    @inject(delay(() => LLM)) private llm: LLM
  ) {
    this.parser = new RssParser();
  }

  async addFeed(guildId: string, channelId: string, url: string, name?: string): Promise<string> {
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    const existing = await this.db.prisma.rssFeed.findFirst({
      where: { guildId, url },
    });

    if (existing) throw new Error('Feed already exists for this server');

    const feed = await this.db.prisma.rssFeed.create({
      data: { guildId, channelId, url, name },
    });

    return feed.id;
  }

  async removeFeed(guildId: string, feedId: string): Promise<void> {
    const feed = await this.db.prisma.rssFeed.findFirst({
      where: { id: feedId, guildId },
    });

    if (!feed) throw new Error('Feed not found');

    await this.db.prisma.rssFeed.delete({ where: { id: feedId } });
  }

  async listFeeds(guildId: string) {
    return this.db.prisma.rssFeed.findMany({
      where: { guildId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async setChannel(guildId: string, feedId: string, channelId: string): Promise<void> {
    const feed = await this.db.prisma.rssFeed.findFirst({
      where: { id: feedId, guildId },
    });

    if (!feed) throw new Error('Feed not found');

    await this.db.prisma.rssFeed.update({
      where: { id: feedId },
      data: { channelId },
    });
  }

  async checkAllFeeds(client: Client): Promise<void> {
    const feeds = await this.db.prisma.rssFeed.findMany();

    for (const feed of feeds) {
      try {
        await this.checkFeed(feed, client);
      } catch (error) {
        this.logger.log(
          `RSS check failed for feed ${feed.url}: ${error instanceof Error ? error.message : 'Unknown'}`,
          'warn'
        );
      }
    }
  }

  private async checkFeed(
    feed: { id: string; guildId: string; channelId: string; url: string; name: string | null },
    client: Client
  ): Promise<void> {
    const newEntries = await this.fetchNewEntries(feed.url, feed.id);

    if (newEntries.length === 0) return;

    const channel = await client.channels.fetch(feed.channelId);
    if (isNullOrUndefined(channel) || !channel.isSendable()) {
      this.logger.log(`RSS channel ${feed.channelId} not found or not sendable for guild ${feed.guildId}`, 'warn');
      return;
    }

    const textChannel = channel as TextChannel;
    const feedLabel = feed.name ?? feed.url;

    for (const entry of [...newEntries].reverse()) {
      let title = entry.title;
      let description = entry.description;

      if (rssConfig.translateEnabled) {
        try {
          title = await this.translateText(entry.title);
          if (!isNullOrWhitespace(description)) {
            description = await this.translateText(description);
          }
        } catch (error) {
          this.logger.log(
            `Translation failed for entry: ${error instanceof Error ? error.message : 'Unknown'}`,
            'warn'
          );
        }
      }

      const embed = this.buildEntryEmbed({ ...entry, title, description }, feedLabel);
      try {
        await textChannel.send({ embeds: [embed] });
      } catch (error) {
        this.logger.log(
          `Failed to send RSS entry to channel ${feed.channelId}: ${error instanceof Error ? error.message : 'Unknown'}`,
          'warn'
        );
      }
    }

    await this.db.prisma.rssFeed.update({
      where: { id: feed.id },
      data: { lastCheckedAt: new Date() },
    });
  }

  private async translateText(text: string): Promise<string> {
    if (!text || text.length < 3) return text;

    return this.llm.translate(text, rssConfig.translateTargetLang);
  }

  private async fetchNewEntries(url: string, feedId: string): Promise<FeedItem[]> {
    const feed = await this.parser.parseURL(url);
    const newEntries: FeedItem[] = [];

    const items = feed.items.slice(0, rssConfig.maxEntriesPerCheck);

    for (const item of items) {
      const guid = item.guid ?? item.link ?? item.title ?? '';

      if (!guid) continue;

      const existing = await this.db.prisma.rssEntry.findUnique({
        where: { feedId_guid: { feedId, guid } },
      });

      if (existing) continue;

      if (await this.isDuplicateAcrossFeeds({
        link: item.link,
        title: item.title,
        description: item.contentSnippet ?? item.content,
      })) continue;

      const entry = await this.db.prisma.rssEntry.create({
        data: {
          feedId,
          guid,
          title: item.title ?? 'No title',
          link: !isNullOrWhitespace(item.link) ? normalizeUrl(item.link) : undefined,
          description: item.contentSnippet ?? item.content ?? undefined,
          author: item.creator ?? undefined,
          publishedAt: !isNullOrUndefined(item.pubDate) ? new Date(item.pubDate) : undefined,
        },
      });

      newEntries.push({
        guid: entry.guid,
        title: entry.title,
        link: entry.link ?? undefined,
        description: entry.description ?? undefined,
        author: entry.author ?? undefined,
        publishedAt: entry.publishedAt ?? undefined,
      });
    }

    return newEntries;
  }

  private async isDuplicateAcrossFeeds(item: {
    link?: string;
    title?: string;
    description?: string;
  }): Promise<boolean> {
    if (!isNullOrWhitespace(item.link)) {
      const normalized = normalizeUrl(item.link);
      const byLink = await this.db.prisma.rssEntry.findFirst({
        where: { link: normalized },
      });
      if (byLink) return true;

      const byLinkRaw = await this.db.prisma.rssEntry.findFirst({
        where: { link: item.link },
      });
      if (byLinkRaw) return true;
    }

    if (!isNullOrWhitespace(item.title)) {
      return this.isSimilarToExisting(item.title, item.description, item.link);
    }

    return false;
  }

  private async isSimilarToExisting(
    title: string,
    description?: string,
    link?: string
  ): Promise<boolean> {
    const text = !isNullOrWhitespace(description) ? `${title} ${description}` : title;
    const stems = stemText(text);

    if (stems.length < rssConfig.minStemWords) return false;

    const recentEntries = await this.db.prisma.rssEntry.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - rssConfig.dedupWindowHours * 60 * 60 * 1000),
        },
      },
      select: { title: true, description: true, link: true },
      take: 200,
    });

    const candidateDomain = !isNullOrWhitespace(link) ? getDomain(link) : '';

    for (const existing of recentEntries) {
      const existingText = !isNullOrWhitespace(existing.description)
        ? `${existing.title} ${existing.description}`
        : existing.title;
      const existingStems = stemText(existingText);

      const cosScore = cosineSimilarity(stems, existingStems);

      let boost = 0;
      if (candidateDomain && !isNullOrWhitespace(existing.link)) {
        if (candidateDomain === getDomain(existing.link)) {
          boost = 0.15;
        }
      }

      const adjustedScore = Math.min(cosScore + boost, 1);

      if (adjustedScore >= rssConfig.titleSimilarityThreshold) {
        return true;
      }

      if (cosScore >= 0.3 && cosScore < rssConfig.titleSimilarityThreshold) {
        if (bigramSimilarity(stems, existingStems) >= rssConfig.bigramSimilarityThreshold) {
          return true;
        }
      }
    }

    return false;
  }

  async testFeed(url: string): Promise<FeedItem[]> {
    if (!isValidUrl(url)) throw new Error('Invalid URL');

    const feed = await this.parser.parseURL(url);
    return feed.items.slice(0, rssConfig.maxEntriesPerCheck).map(item => ({
      guid: item.guid ?? item.link ?? item.title ?? '',
      title: item.title ?? 'No title',
      link: item.link ?? undefined,
      description: item.contentSnippet ?? item.content ?? undefined,
      author: item.creator ?? undefined,
      publishedAt: !isNullOrUndefined(item.pubDate) ? new Date(item.pubDate) : undefined,
    }));
  }

  buildEntryEmbed(entry: FeedItem, feedLabel: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle(entry.title.slice(0, 256))
      .setAuthor({ name: feedLabel });

    if (!isNullOrWhitespace(entry.link)) embed.setURL(entry.link);
    if (!isNullOrWhitespace(entry.author)) embed.setFooter({ text: entry.author });
    if (entry.publishedAt) embed.setTimestamp(entry.publishedAt);

    if (!isNullOrWhitespace(entry.description)) {
      const cleanDesc = entry.description
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4096);

      if (cleanDesc) embed.setDescription(cleanDesc);
    }

    return embed;
  }
}

function stemText(text: string): string[] {
  const hasCyrillic = /[а-яё]/.test(text.toLowerCase());
  const stemmer = hasCyrillic ? PorterStemmerRu : PorterStemmer;

  if (hasCyrillic) {
    return stemmer.tokenizeAndStem(text, true)
      .filter(w => w.length > 1 && !STOP_RU_STEMMED.has(w.toLowerCase()));
  }

  return stemmer.tokenizeAndStem(text)
    .filter(w => w.length > 1);
}

function cosineSimilarity(a: string[], b: string[]): number {
  const vecA = new Map<string, number>();
  const vecB = new Map<string, number>();
  const vocab = new Set<string>();

  for (const w of a) {
    vecA.set(w, (vecA.get(w) ?? 0) + 1);
    vocab.add(w);
  }
  for (const w of b) {
    vecB.set(w, (vecB.get(w) ?? 0) + 1);
    vocab.add(w);
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const word of vocab) {
    const df = ((vecA.get(word) ?? 0) > 0 ? 1 : 0) + ((vecB.get(word) ?? 0) > 0 ? 1 : 0);
    const idf = Math.log(3 / (df + 1)) + 1;
    const va = (vecA.get(word) ?? 0) * idf;
    const vb = (vecB.get(word) ?? 0) * idf;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }

  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function bigramSimilarity(a: string[], b: string[]): number {
  if (a.length < 2 || b.length < 2) return 0;

  const bigramsA = new Set<string>();
  for (let i = 0; i < a.length - 1; i++) bigramsA.add(`${a[i]}_${a[i + 1]}`);

  const bigramsB = new Set<string>();
  for (let i = 0; i < b.length - 1; i++) bigramsB.add(`${b[i]}_${b[i + 1]}`);

  let matches = 0;
  for (const bg of bigramsA) {
    if (bigramsB.has(bg)) matches++;
  }

  const total = Math.min(bigramsA.size, bigramsB.size);
  return total > 0 ? matches / total : 0;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid', 'ref', 'source',
];

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    for (const param of TRACKING_PARAMS) {
      parsed.searchParams.delete(param);
    }

    parsed.hash = '';
    parsed.search = parsed.searchParams.toString();
    const result = parsed.toString();
    return result.endsWith('/') ? result.slice(0, -1) : result;
  } catch {
    return url;
  }
}

const STOP_RU = new Set([
  'в','и','на','с','по','не','что','как','из','от','за','для','это','так','но',
  'а','о','то','же','бы','у','к','все','его','она','они','мы','вы','ты','я',
  'он','еще','уже','был','была','было','были','кто','где','когда','почему',
  'зачем','какой','которая','которое','которые','будет','весь','там','тут',
  'под','над','перед','после','до','об','про','или','чем','год','есть','нет',
  'да','ещё','раз','один','два','три','более','менее','очень','также','только',
  'сейчас','новый','новое','новая','новые','сообщил','сообщила','заявил',
  'заявила','рассказал','рассказала','отметил','отметила','подчеркнул',
  'подчеркнула','без','бы','во','вот','всех','всё','где','даже','двух','для',
  'других','ещё','здесь','иметь','каждую','кроме','ли','можно','может','над',
  'надо','назад','находится','него','нет','них','ну','однако','опять','перед',
  'по','под','пока','после','потом','почти','при','про','просто','разве',
  'свое','себе','снова','собой','тогда','того','тоже','той','только','тому',
  'тот','тут','уже','хоть','чего','чей','чем','через','чтобы','этим','этих',
  'этот','эту',
]);

const STOP_RU_STEMMED = new Set(
  [...STOP_RU].map(w => PorterStemmerRu.stem(w).toLowerCase())
);
