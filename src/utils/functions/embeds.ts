import { CommandInteraction, User } from 'discord.js';
import { EmbedBuilder } from 'discord.js';

import { getColor, replyToInteraction } from '@/utils/functions';

/**
 * Send a simple success embed
 * @param interaction - discord interaction
 * @param message - message to log
 */
export function simpleSuccessEmbed(interaction: CommandInteraction, message: string) {
  const embed = new EmbedBuilder()
    .setColor(0x57f287) // GREEN // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
    .setTitle(`✅ ${message}`);

  // TODO: Handle error properly
  replyToInteraction(interaction, { embeds: [embed] }).catch(() => {});
}

/**
 * Send a simple error embed
 * @param interaction - discord interaction
 * @param message - message to log
 */
export function simpleErrorEmbed(interaction: CommandInteraction, message: string) {
  const embed = new EmbedBuilder()
    .setColor(0xed4245) // RED // see: https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/util/Colors.js
    .setTitle(`❌ ${message}`);

  replyToInteraction(interaction, { embeds: [embed] }).catch(() => {});
}

export function createProposalEmbed(
  title: string,
  description: string,
  forCount: number,
  againstCount: number,
  author: User,
  isEnded: boolean = false
) {
  const embed = new EmbedBuilder()
    .setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
    .setTitle(title)
    .setDescription(description)
    .setColor(isEnded ? 0x57f287 : getColor('primary'))
    .setFooter({
      text: `${forCount} за · ${againstCount} против${isEnded ? ' • Голосование завершено' : ''}`,
    })
    .setTimestamp();

  return embed;
}
