import { ArgsOf, GuardFunction } from 'discordx';

import { antispamConfig } from '@/configs';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const MessageRateLimit: GuardFunction<ArgsOf<'messageCreate'>> = async ([message], client, next) => {
  const userId = message.author.id;
  const now = Date.now();
  const entry = requestCounts.get(userId);

  if (entry && now < entry.resetAt) {
    if (entry.count >= antispamConfig.rateLimit.maxRequests) {
      entry.resetAt = now + antispamConfig.rateLimit.windowMs;
      return;
    }
    entry.count++;
  } else {
    requestCounts.set(userId, {
      count: 1,
      resetAt: now + antispamConfig.rateLimit.windowMs,
    });
  }

  await next();
};
