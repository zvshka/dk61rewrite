import {
  ApplicationCommandOptionType,
  Channel,
  CommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { Client } from 'discordx';
import { Category } from '@discordx/utilities';
import { Discord, Injectable, Slash, SlashGroup, SlashOption } from '@/decorators';
import { Guard, GuildOnly, UserPermissions } from '@/guards';
import { RssService } from '@/services';
import { isNullOrWhitespace, simpleErrorEmbed, simpleSuccessEmbed } from '@/utils/functions';

@Discord()
@Injectable()
@Category('Admin')
@SlashGroup({ name: 'rss', localizationSource: 'COMMANDS.RSS' })
@Guard(UserPermissions(['Administrator']), GuildOnly)
export default class RssCommand {
  constructor(private rssService: RssService) {}

  @SlashGroup('rss')
  @Slash({ name: 'add', localizationSource: 'COMMANDS.RSS.ADD' })
  async addCmd(
    @SlashOption({
      name: 'url',
      localizationSource: 'COMMANDS.RSS.OPTIONS.URL',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    url: string,
    @SlashOption({
      name: 'name',
      localizationSource: 'COMMANDS.RSS.OPTIONS.NAME',
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    name: string | undefined,
    @SlashOption({
      name: 'channel',
      localizationSource: 'COMMANDS.RSS.OPTIONS.CHANNEL',
      type: ApplicationCommandOptionType.Channel,
      required: false,
    })
    rssChannel: Channel | undefined,
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const guildId = interaction.guildId;
    if (isNullOrWhitespace(guildId)) return simpleErrorEmbed(interaction, 'Guild only');

    try {
      const channelId = rssChannel?.id ?? interaction.channelId;
      await this.rssService.addFeed(guildId, channelId, url, name ?? undefined);
      return simpleSuccessEmbed(interaction, localize.COMMANDS.RSS.ADDED());
    } catch (error) {
      return simpleErrorEmbed(
        interaction,
        `${localize.ERRORS.UNKNOWN()}: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  @SlashGroup('rss')
  @Slash({ name: 'remove', localizationSource: 'COMMANDS.RSS.REMOVE' })
  async removeCmd(
    @SlashOption({
      name: 'feed_id',
      localizationSource: 'COMMANDS.RSS.OPTIONS.FEED_ID',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    feedId: string,
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const guildId = interaction.guildId;
    if (isNullOrWhitespace(guildId)) return simpleErrorEmbed(interaction, 'Guild only');

    try {
      await this.rssService.removeFeed(guildId, feedId);
      return simpleSuccessEmbed(interaction, localize.COMMANDS.RSS.REMOVED());
    } catch (error) {
      return simpleErrorEmbed(
        interaction,
        `${localize.ERRORS.UNKNOWN()}: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  @SlashGroup('rss')
  @Slash({ name: 'list', localizationSource: 'COMMANDS.RSS.LIST' })
  async listCmd(interaction: CommandInteraction, client: Client, { localize }: InteractionData) {
    const guildId = interaction.guildId;
    if (isNullOrWhitespace(guildId)) return simpleErrorEmbed(interaction, 'Guild only');

    try {
      const feeds = await this.rssService.listFeeds(guildId);

      if (feeds.length === 0) {
        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle(`📡 ${localize.COMMANDS.RSS.LIST_TITLE()}`)
          .setDescription(localize.COMMANDS.RSS.NO_FEEDS());

        return interaction.followUp({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(`📡 ${localize.COMMANDS.RSS.LIST_TITLE()}`)
        .setDescription(
          feeds
            .map(
              (f, i) =>
                `${i + 1}. **${f.name ?? f.url}**\n   ID: \`${f.id}\` | <#${f.channelId}> | ${f.lastCheckedAt ? `<t:${Math.floor(f.lastCheckedAt.getTime() / 1000)}:R>` : '—'}`
            )
            .join('\n\n')
        );

      return interaction.followUp({ embeds: [embed] });
    } catch (error) {
      return simpleErrorEmbed(
        interaction,
        `${localize.ERRORS.UNKNOWN()}: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  @SlashGroup('rss')
  @Slash({ name: 'channel', localizationSource: 'COMMANDS.RSS.CHANNEL' })
  async channelCmd(
    @SlashOption({
      name: 'feed_id',
      localizationSource: 'COMMANDS.RSS.OPTIONS.FEED_ID',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    feedId: string,
    @SlashOption({
      name: 'channel',
      localizationSource: 'COMMANDS.RSS.OPTIONS.CHANNEL',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    })
    rssChannel: Channel,
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const guildId = interaction.guildId;
    if (isNullOrWhitespace(guildId)) return simpleErrorEmbed(interaction, 'Guild only');

    try {
      await this.rssService.setChannel(guildId, feedId, rssChannel.id);
      return simpleSuccessEmbed(interaction, localize.COMMANDS.RSS.CHANNEL_UPDATED());
    } catch (error) {
      return simpleErrorEmbed(
        interaction,
        `${localize.ERRORS.UNKNOWN()}: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }

  @SlashGroup('rss')
  @Slash({ name: 'test', localizationSource: 'COMMANDS.RSS.TEST' })
  async testCmd(
    @SlashOption({
      name: 'url',
      localizationSource: 'COMMANDS.RSS.OPTIONS.URL',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    url: string,
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    if (isNullOrWhitespace(interaction.guildId)) return simpleErrorEmbed(interaction, 'Guild only');

    try {
      const entries = await this.rssService.testFeed(url);

      if (entries.length === 0) {
        return interaction.followUp(localize.COMMANDS.RSS.TEST_EMPTY());
      }

      const embeds = entries.map(entry => this.rssService.buildEntryEmbed(entry, url));

      return interaction.followUp({ embeds: embeds.slice(0, 10) });
    } catch (error) {
      if (interaction.deferred) {
        return interaction.followUp(
          `${localize.ERRORS.UNKNOWN()}: ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
      return simpleErrorEmbed(
        interaction,
        `${localize.ERRORS.UNKNOWN()}: ${error instanceof Error ? error.message : 'Unknown'}`
      );
    }
  }
}
