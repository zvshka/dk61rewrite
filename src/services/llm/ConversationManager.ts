import type { DiscordContext, LLMMessage } from './llm.types';
import { isNullOrUndefined } from '@/utils/functions';

interface ConversationEntry {
  messages: LLMMessage[];
  lastActive: number;
}

export class ConversationManager {
  private conversations = new Map<string, ConversationEntry>();

  constructor(private readonly contextLimit: number) {}

  private key(channelId: string, userId: string): string {
    return `${channelId}:${userId}`;
  }

  addMessage(channelId: string, userId: string, message: LLMMessage): void {
    const k = this.key(channelId, userId);
    let entry = this.conversations.get(k);

    if (!entry) {
      entry = { messages: [], lastActive: Date.now() };
      this.conversations.set(k, entry);
    }

    entry.messages.push(message);
    entry.lastActive = Date.now();

    if (entry.messages.length > this.contextLimit * 2) {
      const systemMessages = entry.messages.filter(m => m.role === 'system');
      const others = entry.messages.filter(m => m.role !== 'system');
      const trimmed = others.slice(-this.contextLimit);
      entry.messages = [...systemMessages, ...trimmed];
    }
  }

  getHistory(
    channelId: string,
    userId: string,
    systemPrompt: string,
    discordContext?: DiscordContext
  ): LLMMessage[] {
    const k = this.key(channelId, userId);
    const entry = this.conversations.get(k);

    const now = new Date().toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      dateStyle: 'full',
      timeStyle: 'short',
    });

    const contextParts = [`Текущие дата и время: ${now}.`];

    if (discordContext) {
      contextParts.push(
        `Ты находишься на сервере «${discordContext.guildName}»${!isNullOrUndefined(discordContext.memberCount) ? ` (${discordContext.memberCount} участников)` : ''}.`
      );
      if (!isNullOrUndefined(discordContext.channelName)) {
        contextParts.push(`Канал: #${discordContext.channelName}.`);
      }
      contextParts.push(
        `Пользователь: ${discordContext.authorDisplayName} (@${discordContext.authorUsername}).`
      );
      if (!isNullOrUndefined(discordContext.mentionedUsers)) {
        contextParts.push(`Упомянутые участники: ${discordContext.mentionedUsers}.`);
      }
    }

    const systemContent = `${systemPrompt}\n\n${contextParts.join('\n')}`;

    const messages: LLMMessage[] = [{ role: 'system', content: systemContent }];

    if (entry) {
      const nonSystem = entry.messages.filter(m => m.role !== 'system');
      messages.push(...nonSystem);
    }

    return messages;
  }

  reset(channelId: string, userId: string): void {
    const k = this.key(channelId, userId);
    this.conversations.delete(k);
  }
}
