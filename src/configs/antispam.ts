import { env } from '@/env';

export const antispamConfig = {
  rateLimit: {
    maxRequests: env.ANTISPAM_RATE_LIMIT_MAX,
    windowMs: env.ANTISPAM_RATE_LIMIT_WINDOW,
  },

  maxMessageLength: env.ANTISPAM_MAX_LENGTH,
};
