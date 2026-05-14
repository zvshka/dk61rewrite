import { Interaction } from 'discord.js';
import { GuardFunction } from 'discordx';
import {
  ButtonInteraction,
  CommandInteraction,
  ContextMenuCommandInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import { SimpleCommandMessage } from 'discordx';

import { getLocaleFromInteraction, L } from '@/i18n';

/**
 * Extract locale from any interaction and pass it as guard data
 */
export const ExtractLocale: GuardFunction<Interaction> = async (
  interaction,
  client,
  next,
  guardData
) => {
  if (
    interaction instanceof SimpleCommandMessage ||
    interaction instanceof CommandInteraction ||
    interaction instanceof ContextMenuCommandInteraction ||
    interaction instanceof StringSelectMenuInteraction ||
    interaction instanceof ButtonInteraction
  ) {
    const sanitizedLocale = getLocaleFromInteraction(interaction);

    guardData.sanitizedLocale = sanitizedLocale;
    guardData.localize = L[sanitizedLocale];
  }

  await next(guardData);
};
