import { ArgsOf, Client } from 'discordx';
import { MessageType } from 'discord.js';

import { isNullOrUndefined, isNullOrWhitespace } from '@/utils/functions';

import { Discord, Guard, Injectable, On } from '@/decorators';
import { Maintenance } from '@/guards';
import { LLM } from '@/services';

@Discord()
@Injectable()
export default class MessageCreateLLMEvent {
  constructor(private llm: LLM) {}

  @On('messageCreate')
  @Guard(Maintenance)
  async llmHandler([message]: ArgsOf<'messageCreate'>, client: Client): Promise<void> {
    if (message.type !== MessageType.Default) return;
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
      const answer = await this.llm.ask(channelId, userId, query);

      const chunks = this.splitMessage(answer);
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await message.reply(`⚠️ Произошла ошибка при генерации ответа:\n\`${errorMessage}\``);
    }
  }

  private splitMessage(text: string, maxLength = 1900): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let current = '';

    for (const line of text.split('\n')) {
      if (current.length + line.length + 1 > maxLength) {
        if (current) chunks.push(current.trim());
        current = line;
      } else {
        current += (current ? '\n' : '') + line;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }
}
