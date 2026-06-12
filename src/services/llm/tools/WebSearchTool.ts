import axios from 'axios';

import type { Logger } from '@/services';
import { isNullOrWhitespace } from '@/utils/functions';

interface SearchResult {
  title: string;
  href: string;
  body: string;
}

interface SearchConfig {
  provider: 'microservice' | 'custom';
  serviceUrl?: string;
  customUrl?: string;
  customApiKey?: string;
}

export class WebSearchTool {
  constructor(
    private readonly config: SearchConfig,
    private readonly logger: Logger,
  ) {}

  async execute(query: string): Promise<string> {
    if (this.config.provider === 'microservice') {
      return this.searchViaMicroservice(query);
    }

    return this.searchCustom(query);
  }

  private async searchViaMicroservice(query: string): Promise<string> {
    if (isNullOrWhitespace(this.config.serviceUrl)) {
      return 'Search service URL is not configured.';
    }

    try {
      const { data } = await axios.post<SearchResult[]>(
        `${this.config.serviceUrl}/search`,
        { query, max_results: 8 },
        { timeout: 15_000 },
      );

      this.logger.log(
        `[WebSearch] query="${query}" results=${data?.length ?? 0}`,
        'info',
      );

      if (!data || data.length === 0) {
        return 'No results found.';
      }

      return data
        .map(r => `**${r.title}**\n${r.body}\n${r.href}`)
        .join('\n\n');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.log(
        `[WebSearch] query="${query}" failed: ${message}`,
        'error',
      );
      return 'Web search is currently unavailable.';
    }
  }

  private async searchCustom(query: string): Promise<string> {
    if (isNullOrWhitespace(this.config.customUrl)) {
      return 'Custom search URL is not configured.';
    }

    try {
      const { data } = await axios.get(this.config.customUrl, {
        params: { q: query, api_key: this.config.customApiKey },
        timeout: 10_000,
      });

      return typeof data === 'string' ? data : JSON.stringify(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.log(
        `[WebSearch] custom query="${query}" failed: ${message}`,
        'error',
      );
      return 'Custom search is currently unavailable.';
    }
  }
}
