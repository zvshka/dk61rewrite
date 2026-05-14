import { Client, Discord, ModalComponent } from 'discordx';
import { Injectable } from '@/decorators';
import { Database } from '@/services';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  ModalSubmitInteraction,
} from 'discord.js';
import { getColor, resolveGuild } from '@/utils/functions';
import { getLocaleFromInteraction, L } from '@/i18n';

@Discord()
@Injectable()
export default class ProposalModal {
  constructor(private db: Database) {}

  @ModalComponent({ id: 'proposal-modal' })
  async handleProposalModal(interaction: ModalSubmitInteraction, client: Client) {
    const locale = getLocaleFromInteraction(interaction);
    const localize = L[locale];

    const guild = resolveGuild(interaction);
    if (!guild) return;

    const guildData = await this.db.prisma.guild.findFirst({
      where: { id: guild.id },
    });

    if (!guildData?.proposalChannel) {
      await simpleModalSuccessEmbed(interaction, localize.COMMANDS.PROPOSAL.NO_CHANNEL());
      return;
    }

    const topic = interaction.fields.getField('topic', ComponentType.TextInput).value;
    const description = interaction.fields.getField('description', ComponentType.TextInput).value;

    if (!topic || !description) {
      await simpleModalSuccessEmbed(interaction, localize.PROPOSAL_ERROR.EMPTY_FIELDS());
      return;
    }

    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const proposal = await this.db.prisma.proposal.create({
      data: {
        text: topic,
        description,
        authorId: interaction.user.id,
        guildId: guild.id,
        endsAt,
        usersFor: {
          connect: { id: interaction.user.id },
        },
      },
      include: {
        author: true,
      },
    });

    const channel = await client.channels.fetch(guildData.proposalChannel);
    if (channel?.isSendable() === false) {
      await simpleModalSuccessEmbed(interaction, localize.PROPOSAL_ERROR.CHANNEL_INVALID());
      return;
    }

    const discordUser = await client.users.fetch(proposal.authorId);

    const embed = new EmbedBuilder()
      .setAuthor({ name: discordUser.tag, iconURL: discordUser.displayAvatarURL() })
      .setTitle(proposal.text)
      .setDescription(proposal.description)
      .setColor(getColor('primary'))
      .setFooter({ text: `#${proposal.id}` })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('vote-for').setLabel('1 👍').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('vote-against').setLabel('0 👎').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('vote-remove').setLabel('🤔').setStyle(ButtonStyle.Secondary)
    );

    const sentMessage = await channel.send({ embeds: [embed], components: [row] });

    await this.db.prisma.proposal.update({
      where: { id: proposal.id },
      data: { proposalMessageId: sentMessage.id },
    });

    await simpleModalSuccessEmbed(interaction, localize.COMMANDS.PROPOSAL.SUCCESS());
  }
}

async function simpleModalSuccessEmbed(interaction: ModalSubmitInteraction, message: string) {
  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(0x57f287).setTitle(`✅ ${message}`)],
    flags: ['Ephemeral'],
  });
}
