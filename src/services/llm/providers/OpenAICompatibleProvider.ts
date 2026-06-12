import axios from 'axios';

import { isNullOrUndefined } from '@/utils/functions';

import type { LLMMessage, LLMProviderConfig, LLMResponse, LLMToolDefinition } from '../llm.types';
import { LLMProvider } from '../LLMProvider';

interface OpenAIChoiceMessage {
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface OpenAIChoice {
  message: OpenAIChoiceMessage;
}

interface OpenAIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface OpenAIResponse {
  choices: OpenAIChoice[];
  usage?: OpenAIUsage;
}

export class OpenAICompatibleProvider extends LLMProvider {
  private readonly config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    super();
    this.config = config;
  }

  get model(): string {
    return this.config.model;
  }

  async generate(
    messages: LLMMessage[],
    tools?: LLMToolDefinition[],
  ): Promise<LLMResponse> {
    const body: Record<string, unknown> = {
      model: this.config.model || undefined,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    if (!isNullOrUndefined(tools) && tools.length > 0) {
      body.tools = tools;
      body.tool_choice = 'auto';
    }

    const { data } = await axios.post<OpenAIResponse>(
      `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(!isNullOrUndefined(this.config.apiKey) ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        timeout: 60_000,
      },
    );

    const choice = data.choices[0];
    if (isNullOrUndefined(choice)) {
      return { content: '' };
    }

    return {
      content: choice.message.content ?? '',
      toolCalls: choice.message.tool_calls,
      usage: !isNullOrUndefined(data.usage)
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
