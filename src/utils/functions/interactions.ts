import { SimpleCommandMessage } from 'discordx';
import { CommandInteraction } from 'discord.js';

/**
 * Abstraction level to reply to either a slash command or a simple command message.
 * @param interaction
 * @param message
 */
export async function replyToInteraction(
  interaction: CommandInteraction | SimpleCommandMessage,
  message: string | { [key: string]: any }
) {
  if (interaction instanceof CommandInteraction) {
    await interaction.followUp(message);
  } else {
    await interaction.message.reply(message);
  }
}
