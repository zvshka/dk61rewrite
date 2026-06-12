import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  CommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Client } from 'discordx';
import { Category } from '@discordx/utilities';

import { Discord, Injectable, SkipDefer, Slash, SlashOption } from '@/decorators';
import { UnknownReplyError } from '@/errors';
import { Guard, GuildOnly } from '@/guards';
import { Database } from '@/services';
import { isNullOrWhitespace, resolveGuild, simpleErrorEmbed } from '@/utils/functions';

@Discord()
@Injectable()
@Category('General')
export default class ProposalCommand {
  constructor(private db: Database) {}

  @Slash({
    name: 'proposal',
    localizationSource: 'COMMANDS.PROPOSAL',
  })
  @Guard(GuildOnly)
  @SkipDefer()
  async proposal(
    @SlashOption({ name: 'text', type: ApplicationCommandOptionType.String, required: false })
    _text: string | undefined,
    @SlashOption({
      name: 'topic',
      localizationSource: 'COMMANDS.PROPOSAL.OPTIONS.TOPIC',
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    _topic: string | undefined,
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const guild = resolveGuild(interaction);

    if (!guild) throw new UnknownReplyError(interaction);

    const guildData = await this.db.prisma.guild.findFirst({
      where: {
        id: guild.id,
      },
    });

    if (!guildData || isNullOrWhitespace(guildData.proposalChannel)) {
      return simpleErrorEmbed(interaction, localize.COMMANDS.PROPOSAL.NO_CHANNEL());
    }

    const modal = new ModalBuilder()
      .setCustomId('proposal-modal')
      .setTitle(localize.COMMANDS.PROPOSAL.MODAL.TITLE());

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('topic')
          .setLabel(localize.COMMANDS.PROPOSAL.MODAL.TOPIC())
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      )
    );

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('description')
          .setLabel(localize.COMMANDS.PROPOSAL.MODAL.DESCRIPTION())
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
      )
    );

    await interaction.showModal(modal);
  }
}
