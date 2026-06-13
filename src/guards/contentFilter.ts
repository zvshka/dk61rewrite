import { ArgsOf, GuardFunction } from 'discordx';

import { antispamConfig } from '@/configs';

const SWASTIKA_PATTERN = /[卐卍]/;

const REPEATED_CHAR_PATTERN = /(.)\1{20,}/;

const HATE_PATTERNS = [
  /✡️?\s*(?:[卐卍]|ss|zog|1488)/i,
];

function isCapsSpam(content: string): boolean {
  if (content.length < 50) return false;
  const letters = content.replace(/[^a-zA-Zа-яА-ЯёЁ]/g, '');
  if (letters.length === 0) return false;
  const upperCount = letters.replace(/[a-zа-яё]/g, '').length;
  return upperCount / letters.length > 0.7;
}

function isLowInformationDensity(content: string): boolean {
  const nonAlpha = content.replace(/[\w\sа-яёА-ЯЁ]/gi, '');
  return content.length > 0 && nonAlpha.length / content.length > 0.6;
}

export const ContentFilter: GuardFunction<ArgsOf<'messageCreate'>> = async ([message], client, next) => {
  const content = message.content;

  if (content.length > antispamConfig.maxMessageLength) return;
  if (SWASTIKA_PATTERN.test(content)) return;
  if (REPEATED_CHAR_PATTERN.test(content)) return;
  if (isCapsSpam(content)) return;
  if (isLowInformationDensity(content)) return;
  for (const pattern of HATE_PATTERNS) {
    if (pattern.test(content)) return;
  }

  await next();
};
