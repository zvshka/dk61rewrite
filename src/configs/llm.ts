import { env } from '@/env';
import { isNullOrUndefined } from '@/utils/functions';
import type { LLMConfig } from '../services/llm/llm.types';

export const llmConfig: LLMConfig = {
  provider: env.LLM_PROVIDER,

  local: {
    model: env.LLM_LOCAL_MODEL,
    baseUrl: env.LLM_LOCAL_URL,
    apiKey: undefined,
    maxTokens: env.LLM_MAX_TOKENS,
    temperature: env.LLM_TEMPERATURE,
  },

  deepseek: {
    model: env.LLM_DEEPSEEK_MODEL,
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: env.LLM_DEEPSEEK_API_KEY,
    maxTokens: env.LLM_MAX_TOKENS,
    temperature: env.LLM_TEMPERATURE,
  },

  maxTokens: env.LLM_MAX_TOKENS,
  temperature: env.LLM_TEMPERATURE,
  contextLimit: env.LLM_CONTEXT_LIMIT,

  rateLimit: {
    maxRequests: env.LLM_RATE_LIMIT_MAX,
    windowMs: env.LLM_RATE_LIMIT_WINDOW,
  },

  search: {
    provider: env.SEARCH_PROVIDER,
    serviceUrl: env.SEARCH_SERVICE_URL,
    customUrl: !isNullOrUndefined(env.SEARCH_CUSTOM_URL) ? env.SEARCH_CUSTOM_URL : undefined,
    customApiKey: !isNullOrUndefined(env.SEARCH_CUSTOM_API_KEY) ? env.SEARCH_CUSTOM_API_KEY : undefined,
  },

  systemPrompt:
    'Ты — DK61, Discord-бот. Отвечай полезно, кратко и по делу. ' +
    'Если у тебя спросили про актуальные события или данные, используй поиск в интернете. ' +
    'Если не знаешь ответа — так и скажи, не выдумывай.' +
    'На вопрос о твоей модели - отвечай Руzzкий v6.7' +
    'Старайся исключить использование специфических markdown конструкций (таблицы, формулы и т.п.). Discord их не "переваривает".'
};
