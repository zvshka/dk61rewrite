import { Client } from 'discordx';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

import { Discord, Injectable, Schedule } from '@/decorators';
import { Database } from '@/services';

@Discord()
@Injectable()
export default class ProposalScheduler {
  constructor(
    private db: Database,
    private client: Client
  ) {}

  @Schedule('*/10 * * * *', 'checkExpiredProposals')
  async checkExpiredProposals() {
    const expiredProposals = await this.db.prisma.proposal.findMany({
      where: {
        endsAt: { lte: new Date() },
        status: 'ACTIVE',
      },
      include: {
        author: true,
        guild: true,
      },
    });

    for (const proposal of expiredProposals) {
      await this.db.prisma.proposal.update({
        where: { id: proposal.id },
        data: { status: 'COMPLETED' },
      });

      const forCount = await this.db.prisma.proposal.count({
        where: { id: proposal.id, usersFor: { some: { id: proposal.authorId } } },
      });

      const againstCount = await this.db.prisma.proposal.count({
        where: { id: proposal.id, usersAgainst: { some: { id: proposal.authorId } } },
      });

      try {
        const channel = await this.client.channels.fetch(proposal.guild.proposalChannel!);
        if (channel?.isSendable() === false) continue;

        const message = await channel.messages.fetch(proposal.proposalMessageId!);
        if (!message) continue;

        const embed = new EmbedBuilder(message.embeds[0]?.data ?? {})
          .setFooter({
            text: `#${proposal.id} • Голосование завершено`,
          });

        if (forCount > againstCount) {
          embed.setColor('Green');
        } else if (againstCount > forCount) {
          embed.setColor('Red');
        } else {
          embed.setColor('Yellow');
        }

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('vote-for')
            .setLabel(`${forCount} 👍`)
            .setStyle(ButtonStyle.Success)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('vote-against')
            .setLabel(`${againstCount} 👎`)
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)
        );

        await message.edit({ embeds: [embed], components: [row] });
      } catch (error) {
        // Message not found or channel invalid - proposal is already completed
      }
    }
  }
}
