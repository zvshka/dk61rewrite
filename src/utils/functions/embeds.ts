import { ButtonInteraction, CommandInteraction, EmbedBuilder } from 'discord.js';

import { replyToInteraction, resolveDependency } from '@/utils/functions';
import { Logger } from '@/services';

/**
 * Send a simple success embed
 * @param interaction - discord interaction
 * @param message - message to log
 */
export function simpleSuccessEmbed(interaction: CommandInteraction | ButtonInteraction, message: string) {
  const embed = new EmbedBuilder()
    .setColor(0x57f287) // GREEN // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
    .setTitle(`✅ ${message}`);

  replyToInteraction(interaction, { embeds: [embed] }).catch(err =>
    resolveDependency(Logger).then(logger => {
      logger.logError(err, 'Exception');
    })
  );
}

/**
 * Send a simple error embed
 * @param interaction - discord interaction
 * @param message - message to log
 */
export function simpleErrorEmbed(interaction: CommandInteraction | ButtonInteraction, message: string) {
  const embed = new EmbedBuilder()
    .setColor(0xed4245) // RED // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
    .setTitle(`❌ ${message}`);

  replyToInteraction(interaction, { embeds: [embed] }).catch(err =>
    resolveDependency(Logger).then(logger => {
      logger.logError(err, 'Exception');
    })
  );
}
