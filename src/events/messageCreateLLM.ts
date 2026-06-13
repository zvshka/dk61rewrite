import { ArgsOf, Client } from 'discordx';
import { ChannelType, MessageType } from 'discord.js';

import { isNullOrUndefined, isNullOrWhitespace } from '@/utils/functions';

import type { DiscordContext } from '../services/llm/llm.types';

import { Discord, Guard, Injectable, On } from '@/decorators';
import { ContentFilter, Maintenance, MessageRateLimit } from '@/guards';
import { LLM } from '@/services';
import { splitMessage } from "../utils/functions/splitMessage";

@Discord()
@Injectable()
export default class MessageCreateLLMEvent {
  constructor(private llm: LLM) {}

  @On('messageCreate')
  @Guard(Maintenance, MessageRateLimit, ContentFilter)
  async llmHandler([message]: ArgsOf<'messageCreate'>, client: Client): Promise<void> {
    if (message.type !== MessageType.Default && message.type !== MessageType.Reply) return;
    if (isNullOrWhitespace(message.content)) return;

    const isMentioned = message.mentions.has(client.user!);
    const isReplyToBot = !isNullOrUndefined(message.reference?.messageId)
      ? (await message.fetchReference().catch(() => null))?.author.id === client.user!.id
      : false;

    if (!isMentioned && !isReplyToBot) return;

    let query = message.content;

    if (isMentioned) {
      const mentionPattern = new RegExp(`<@!?${client.user!.id}>`, 'g');
      query = query.replace(mentionPattern, '').trim();
    }

    if (!query) {
      await message.reply('Напиши свой вопрос после упоминания.');
      return;
    }

    await message.channel.sendTyping();

    try {
      const channelId = message.channel.id;
      const userId = message.author.id;

      const discordContext: DiscordContext = {
        guildName: message.guild?.name ?? 'личные сообщения',
        memberCount: message.guild?.memberCount,
        channelName: message.channel.type === ChannelType.GuildText || message.channel.type === ChannelType.PublicThread || message.channel.type === ChannelType.PrivateThread
          ? message.channel.name
          : undefined,
        channelId: message.channel.id,
        authorUsername: message.author.username,
        authorId: message.author.id,
        authorDisplayName: message.member?.displayName ?? message.author.displayName,
        mentionedUsers: message.mentions.users
          .filter(u => u.id !== client.user!.id)
          .map(u => `${u.displayName} (@${u.username})`)
          .join(', ') || undefined,
      };

      const answer = await this.llm.ask(channelId, userId, query, discordContext);

      const chunks = splitMessage(answer);
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await message.reply(`⚠️ Произошла ошибка при генерации ответа:\n\`${errorMessage}\``);
    }
  }
}
