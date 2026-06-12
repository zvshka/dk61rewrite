import type { Logger } from '@/services';

import type { LLMToolCall, LLMToolDefinition, LLMToolResult } from './llm.types';
import { WebSearchTool } from './tools/WebSearchTool';

interface SearchConfig {
  provider: 'microservice' | 'custom';
  serviceUrl?: string;
  customUrl?: string;
  customApiKey?: string;
}

export class ToolManager {
  private webSearch: WebSearchTool;

  constructor(searchConfig: SearchConfig, logger: Logger) {
    this.webSearch = new WebSearchTool(searchConfig, logger);
  }

  getToolDefinitions(): LLMToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'web_search',
          description: 'Search the internet for current information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query',
              },
            },
            required: ['query'],
          },
        },
      },
    ];
  }

  async execute(toolCalls: LLMToolCall[]): Promise<LLMToolResult[]> {
    const results: LLMToolResult[] = [];

    for (const call of toolCalls) {
      if (call.function.name === 'web_search') {
        const args: Record<string, string> = JSON.parse(call.function.arguments);
        const query = typeof args.query === 'string' ? args.query : '';
        const content = await this.webSearch.execute(query);
        results.push({ tool_call_id: call.id, content });
      }
    }

    return results;
  }
}
