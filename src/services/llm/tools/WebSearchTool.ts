import axios from 'axios';

import { isNullOrUndefined, isNullOrWhitespace } from '@/utils/functions';

interface SearchConfig {
  provider: 'duckduckgo' | 'custom';
  customUrl?: string;
  customApiKey?: string;
}

interface DuckDuckGoResponse {
  AbstractText?: string;
  Answer?: string;
  AbstractURL?: string;
  RelatedTopics?: Array<{ Text: string; FirstURL?: string } | string>;
}

export class WebSearchTool {
  constructor(private readonly config: SearchConfig) {}

  async execute(query: string): Promise<string> {
    if (this.config.provider === 'duckduckgo') {
      return this.searchDuckDuckGo(query);
    }

    return this.searchCustom(query);
  }

  private async searchDuckDuckGo(query: string): Promise<string> {
    try {
      const { data } = await axios.get<DuckDuckGoResponse>('https://api.duckduckgo.com/', {
        params: { q: query, format: 'json', no_html: 1 },
        timeout: 10_000,
      });

      const parts: string[] = [];

      if (!isNullOrWhitespace(data.AbstractText)) {
        parts.push(`Abstract: ${data.AbstractText}`);
      }
      if (!isNullOrWhitespace(data.Answer)) {
        parts.push(`Answer: ${data.Answer}`);
      }
      if (!isNullOrWhitespace(data.AbstractURL)) {
        parts.push(`Source: ${data.AbstractURL}`);
      }
      if (!isNullOrUndefined(data.RelatedTopics) && data.RelatedTopics.length > 0) {
        const topics = data.RelatedTopics.slice(0, 5)
          .map(t => (typeof t === 'string' ? t : t.Text))
          .join('\n');
        parts.push(`Related:\n${topics}`);
      }

      return parts.length > 0 ? parts.join('\n\n') : 'No results found.';
    } catch {
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
    } catch {
      return 'Custom search is currently unavailable.';
    }
  }
}
