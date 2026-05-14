import { CommandInteraction } from 'discord.js';
import { Client } from 'discordx';
import { Category } from '@discordx/utilities';
import { EmbedBuilder } from 'discord.js';

import { generalConfig } from '@/configs';
import { Discord, Slash } from '@/decorators';
import { Guard } from '@/guards';
import { getColor } from '@/utils/functions';

@Discord()
@Category('General')
export default class InviteCommand {
  @Slash({
    name: 'invite',
  })
  @Guard()
  async invite(
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ): Promise<void> {
    const embed = new EmbedBuilder()
      .setTitle(localize.COMMANDS.INVITE.EMBED.TITLE())
      .setDescription(
        localize.COMMANDS.INVITE.EMBED.DESCRIPTION({ link: generalConfig.links.invite })
      )
      .setColor(getColor('primary'))
      .setFooter({ text: 'Powered by best ZVSHKA' });

    await interaction.followUp({
      embeds: [embed],
    });
  }
}
