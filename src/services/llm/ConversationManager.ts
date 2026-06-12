import type { LLMMessage } from './llm.types';

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

  getHistory(channelId: string, userId: string, systemPrompt: string): LLMMessage[] {
    const k = this.key(channelId, userId);
    const entry = this.conversations.get(k);

    const messages: LLMMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

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
