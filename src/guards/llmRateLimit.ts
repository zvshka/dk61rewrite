import { GuardFunction } from 'discordx';
import { CommandInteraction } from 'discord.js';

import { llmConfig } from '@/configs';

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const LLMRateLimit: GuardFunction<CommandInteraction> = async (arg, client, next) => {
  const userId = arg.user.id;
  const now = Date.now();
  const entry = requestCounts.get(userId);

  if (entry && now < entry.resetAt) {
    if (entry.count >= llmConfig.rateLimit.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      await arg.reply({
        content: `⏳ Too many requests. Try again in ${retryAfter} seconds.`,
        ephemeral: true,
      });
      return;
    }
    entry.count++;
  } else {
    requestCounts.set(userId, {
      count: 1,
      resetAt: now + llmConfig.rateLimit.windowMs,
    });
  }

  await next();
};
