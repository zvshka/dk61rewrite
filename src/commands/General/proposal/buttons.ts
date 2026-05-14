import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  Client,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';

import { ButtonComponent, Discord, Injectable } from '@/decorators';
import { Database } from '@/services';
import { resolveGuild, simpleErrorEmbed } from '@/utils/functions';
import ProposalScheduler from "./scheduler";

@Discord()
@Injectable()
export default class ProposalButtonHandler {
  constructor(private db: Database, private scheduler: ProposalScheduler) {}

  async getVoteData(interaction: ButtonInteraction, localize: InteractionData['localize']) {
    const guild = resolveGuild(interaction);
    if (!guild) return;

    const proposalId = interaction.message.embeds[0]?.footer?.text?.match(/#(\d+)/)?.[1];

    if (!proposalId) {
      await this._handleError(interaction, localize.PROPOSAL_ERROR.NOT_PROPOSAL());
      return;
    }

    const proposal = await this.db.prisma.proposal.findUnique({
      where: { id: parseInt(proposalId) },
      include: { usersFor: true, usersAgainst: true },
    });

    if (!proposal) {
      await this._handleError(interaction, localize.PROPOSAL_ERROR.NOT_FOUND());
      return;
    }

    if (proposal.status !== 'ACTIVE') {
      await this._handleError(interaction, localize.PROPOSAL_ERROR.ENDED());
      return;
    }

    const hasVotedFor = proposal.usersFor.some(u => u.id === interaction.user.id);
    const hasVotedAgainst = proposal.usersAgainst.some(u => u.id === interaction.user.id);

    return { hasVotedFor, hasVotedAgainst, proposal };
  }

  @ButtonComponent({ id: 'vote-remove' })
  async handleVoteRemove(
    interaction: ButtonInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const voteData = await this.getVoteData(interaction, localize);

    if (!voteData) return;
    const { hasVotedFor, hasVotedAgainst, proposal } = voteData;
    if (!hasVotedFor && !hasVotedAgainst) return;

    await this.db.prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        usersFor: { disconnect: { id: interaction.user.id } },
        usersAgainst: { disconnect: { id: interaction.user.id } },
      },
    });

    await this._refreshEmbedAndButtons(interaction);
  }

  @ButtonComponent({ id: 'vote-for' })
  async handleVoteFor(
    interaction: ButtonInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const voteData = await this.getVoteData(interaction, localize);

    if (!voteData) return;
    const { hasVotedFor, hasVotedAgainst, proposal } = voteData;

    if (hasVotedFor) {
      await this._handleError(interaction, localize.PROPOSAL_ERROR.ALREADY_VOTED_FOR());
      return;
    }

    await this.db.prisma.$transaction([
      this.db.prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          usersFor: { connect: { id: interaction.user.id } },
        },
      }),
      ...(hasVotedAgainst
        ? [
            this.db.prisma.proposal.update({
              where: { id: proposal.id },
              data: {
                usersAgainst: { disconnect: { id: interaction.user.id } },
              },
            }),
          ]
        : []),
    ]);

    await this._refreshEmbedAndButtons(interaction);
  }

  @ButtonComponent({ id: 'vote-against' })
  async handleVoteAgainst(
    interaction: ButtonInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const voteData = await this.getVoteData(interaction, localize);

    if (!voteData) return;
    const { hasVotedFor, hasVotedAgainst, proposal } = voteData;

    if (hasVotedAgainst) {
      await this._handleError(interaction, localize.PROPOSAL_ERROR.ALREADY_VOTED_AGAINST());
      return;
    }

    await this.db.prisma.$transaction([
      this.db.prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          usersAgainst: { connect: { id: interaction.user.id } },
        },
      }),
      ...(hasVotedFor
        ? [
            this.db.prisma.proposal.update({
              where: { id: proposal.id },
              data: {
                usersFor: { disconnect: { id: interaction.user.id } },
              },
            }),
          ]
        : []),
    ]);

    await this._refreshEmbedAndButtons(interaction);
  }

  private async _handleError(interaction: ButtonInteraction, message: string) {
    await interaction.reply({ content: message, flags: ['Ephemeral'] });
  }

  private async _refreshEmbedAndButtons(interaction: ButtonInteraction) {
    const proposalId = interaction.message.embeds[0]?.footer?.text?.match(/#(\d+)/)?.[1];
    if (!proposalId) return;

    const proposal = await this.db.prisma.proposal.findUnique({
      where: { id: parseInt(proposalId) },
      include: { usersFor: true, usersAgainst: true },
    });

    if (!proposal) return;

    const forCount = proposal.usersFor.length;
    const againstCount = proposal.usersAgainst.length;

    const embed = new EmbedBuilder(interaction.message.embeds[0]?.data ?? {}).setFooter({
      text: `#${proposal.id}`,
    });

    const component0 = interaction.message.components.at(0);
    if (component0?.type === ComponentType.ActionRow) {
      const buttonForComponent = component0.components.at(0);
      const buttonAgainstComponent = component0.components.at(1);
      const buttonRemoveComponent = component0.components.at(2);

      if (
        buttonForComponent?.type === ComponentType.Button &&
        buttonAgainstComponent?.type === ComponentType.Button &&
        buttonRemoveComponent?.type === ComponentType.Button
      ) {
        const buttonFor = new ButtonBuilder(buttonForComponent.data);
        buttonFor.setStyle(ButtonStyle.Success).setLabel(`${forCount} 👍`);

        const buttonAgainst = new ButtonBuilder(buttonAgainstComponent.data);
        buttonAgainst.setStyle(ButtonStyle.Danger).setLabel(`${againstCount} 👎`);

        const buttonRemove = new ButtonBuilder(buttonRemoveComponent.data);
        buttonRemove.setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          buttonFor,
          buttonAgainst,
          buttonRemove
        );
        await interaction.update({ embeds: [embed], components: [row] }).catch(() => {
          simpleErrorEmbed(interaction, 'Что-то пошло нет... попробуй еще раз позже.')
        });
      }
    }

    // TODO Вынести в настройки?
    if (forCount + againstCount >= 20 && Math.abs(forCount - againstCount) >= 15) {
      await this.db.prisma.proposal.update({
        where: {
          id: proposal.id
        },
        data: {
          endsAt: new Date(),
        }
      })
      await this.scheduler.checkExpiredProposals()
      return;
    }
  }
}
