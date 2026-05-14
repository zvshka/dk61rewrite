import { SimpleCommandMessage } from 'discordx';
import { ButtonInteraction, CommandInteraction } from 'discord.js';

/**
 * Abstraction level to reply to either a slash command or a simple command message.
 * @param interaction
 * @param message
 */
export async function replyToInteraction(
  interaction: CommandInteraction | SimpleCommandMessage | ButtonInteraction,
  message: string | { [key: string]: any }
) {
  if (interaction instanceof CommandInteraction || interaction instanceof ButtonInteraction) {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(message);
    } else {
      await interaction.reply(message);
    }
  } else {
    await interaction.message.reply(message);
  }
}
