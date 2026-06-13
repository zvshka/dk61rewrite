import process from 'node:process';

import { cleanEnv, num, str } from 'envalid';

import { apiConfig, generalConfig } from '@/configs';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production'], default: 'development' }),

  BOT_TOKEN: str(),
  TEST_GUILD_ID: str(),
  BOT_OWNER_ID: str(),
  BOT_CLIENT_ID: str({ default: undefined }),

  DATABASE_URL: str(),

  DATABASE_HOST: str({ default: undefined }),
  DATABASE_PORT: num({ default: undefined }),
  DATABASE_NAME: str({ default: undefined }),
  DATABASE_USER: str({ default: undefined }),
  DATABASE_PASSWORD: str({ default: undefined }),

  API_PORT: num({ default: undefined }),
  API_ADMIN_TOKEN: str({ default: undefined }),

  IMGUR_CLIENT_ID: str({ default: undefined }),

  LLM_PROVIDER: str({ choices: ['local', 'deepseek'], default: 'local' }),
  LLM_LOCAL_URL: str({ default: 'http://localhost:1234/v1' }),
  LLM_LOCAL_MODEL: str({ default: '' }),
  LLM_DEEPSEEK_API_KEY: str({ default: undefined }),
  LLM_DEEPSEEK_MODEL: str({ default: 'deepseek-chat' }),
  LLM_MAX_TOKENS: num({ default: 2048 }),
  LLM_TEMPERATURE: num({ default: 0.7 }),
  LLM_CONTEXT_LIMIT: num({ default: 10 }),
  LLM_RATE_LIMIT_MAX: num({ default: 10 }),
  LLM_RATE_LIMIT_WINDOW: num({ default: 60000 }),

  ANTISPAM_RATE_LIMIT_MAX: num({ default: 5 }),
  ANTISPAM_RATE_LIMIT_WINDOW: num({ default: 10000 }),
  ANTISPAM_MAX_LENGTH: num({ default: 1500 }),

  SEARCH_SERVICE_URL: str({ default: 'http://localhost:8020' }),

  SEARCH_PROVIDER: str({ choices: ['microservice', 'custom'], default: 'microservice' }),
  SEARCH_CUSTOM_URL: str({ default: undefined }),
  SEARCH_CUSTOM_API_KEY: str({ default: undefined }),
});

export function checkEnvironmentVariables() {
  if (apiConfig.enabled) {
    cleanEnv(process.env, {
      API_PORT: num(),
      API_ADMIN_TOKEN: str(),
    });
  }

  if (generalConfig.automaticUploadImagesToImgur) {
    cleanEnv(process.env, {
      IMGUR_CLIENT_ID: str(),
    });
  }

  if (env.LLM_PROVIDER === 'deepseek') {
    cleanEnv(process.env, {
      LLM_DEEPSEEK_API_KEY: str(),
    });
  }
}
