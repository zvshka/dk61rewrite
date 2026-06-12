import { inject, delay } from 'tsyringe';

import { isNullOrUndefined } from '@/utils/functions';

import { llmConfig } from '@/configs';
import { Service } from '@/decorators';
import { Logger } from '@/services';

import { ConversationManager } from './llm/ConversationManager';
import type { DiscordContext, LLMMessage, LLMResponse } from './llm/llm.types';
import { LLMProvider } from './llm/LLMProvider';
import { OpenAICompatibleProvider } from './llm/providers/OpenAICompatibleProvider';
import { ToolManager } from './llm/ToolManager';

@Service()
export class LLM {
  private provider: LLMProvider;
  private conversation: ConversationManager;
  private tools: ToolManager;

  constructor(
    @inject(delay(() => Logger)) private logger: Logger,
  ) {
    const activeConfig = llmConfig.provider === 'deepseek' ? llmConfig.deepseek : llmConfig.local;
    this.provider = new OpenAICompatibleProvider(activeConfig);
    this.conversation = new ConversationManager(llmConfig.contextLimit);
    this.tools = new ToolManager(llmConfig.search, this.logger);
  }

  async ask(
    channelId: string,
    userId: string,
    userMessage: string,
    discordContext?: DiscordContext,
  ): Promise<string> {
    this.conversation.addMessage(channelId, userId, {
      role: 'user',
      content: userMessage,
    });

    const history = this.conversation.getHistory(channelId, userId, llmConfig.systemPrompt, discordContext);
    const response = await this.generateWithTools(history);

    this.conversation.addMessage(channelId, userId, {
      role: 'assistant',
      content: response.content,
      tool_calls: response.toolCalls,
    });

    return response.content;
  }

  resetConversation(channelId: string, userId: string): void {
    this.conversation.reset(channelId, userId);
  }

  private async generateWithTools(
    messages: LLMMessage[],
    depth = 0,
  ): Promise<LLMResponse> {
    if (depth > 5) {
      return { content: 'Maximum tool call depth reached.' };
    }

    const toolDefs = this.tools.getToolDefinitions();
    const response = await this.provider.generate(messages, toolDefs);

    if (!isNullOrUndefined(response.toolCalls) && response.toolCalls.length > 0) {
      const toolResults = await this.tools.execute(response.toolCalls);

      messages.push({
        role: 'assistant',
        content: response.content || '',
        tool_calls: response.toolCalls,
      });

      for (const result of toolResults) {
        messages.push({
          role: 'tool',
          content: result.content,
          tool_call_id: result.tool_call_id,
        });
      }

      return this.generateWithTools(messages, depth + 1);
    }

    return response;
  }
}
