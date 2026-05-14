import { generalConfig } from '@/configs';
import { resolveLocale } from '@/utils/functions';

import { detectLocale } from './i18n-util';

function allInteractionsLocaleDetector(interaction: AllInteractions) {
  return () => {
    let locale = resolveLocale(interaction);

    if (['en-US', 'en-GB'].includes(locale)) locale = 'en';
    else if (locale === 'default') locale = generalConfig.defaultLocale;

    return [locale];
  };
}

export function getLocaleFromInteraction(interaction: AllInteractions) {
  return detectLocale(allInteractionsLocaleDetector(interaction));
}
