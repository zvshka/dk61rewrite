import type { LLMMessage, LLMResponse, LLMToolDefinition } from './llm.types';

export abstract class LLMProvider {
  abstract get model(): string;

  abstract generate(
    messages: LLMMessage[],
    tools?: LLMToolDefinition[],
  ): Promise<LLMResponse>;
}
