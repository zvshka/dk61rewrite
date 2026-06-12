export type LLMRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LLMMessage {
  role: LLMRole;
  content: string;
  tool_call_id?: string;
  tool_calls?: LLMToolCall[];
}

export interface LLMToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LLMToolResult {
  tool_call_id: string;
  content: string;
}

export interface LLMProviderConfig {
  model: string;
  baseUrl: string;
  apiKey?: string;
  maxTokens: number;
  temperature: number;
}

export type LLMProviderType = 'local' | 'deepseek';

export interface LLMConfig {
  provider: LLMProviderType;
  local: LLMProviderConfig;
  deepseek: LLMProviderConfig;
  maxTokens: number;
  temperature: number;
  contextLimit: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
  search: {
    provider: 'duckduckgo' | 'custom';
    customUrl?: string;
    customApiKey?: string;
  };
  systemPrompt: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: LLMToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
