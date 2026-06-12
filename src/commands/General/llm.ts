import { ApplicationCommandOptionType, ChannelType, CommandInteraction } from 'discord.js';
import { Client } from 'discordx';
import { Category } from '@discordx/utilities';

import type { DiscordContext } from '../../services/llm/llm.types';

import { Discord, Guard, Injectable, Slash, SlashChoice, SlashOption } from '@/decorators';
import { GuildOnly } from '@/guards';
import { LLM } from '@/services';
import { isNullOrUndefined, isNullOrWhitespace, simpleSuccessEmbed } from '@/utils/functions';
import { splitMessage } from "../../utils/functions/splitMessage";

@Discord()
@Injectable()
@Category('General')
export default class LLMCommand {
  constructor(private llmService: LLM) {}

  @Slash({ name: 'llm' })
  @Guard(GuildOnly)
  async handle(
    @SlashOption({
      name: 'subcommand',
      type: ApplicationCommandOptionType.String,
      required: true,
    })
    @SlashChoice({ name: 'Ask', value: 'ask' })
    @SlashChoice({ name: 'Reset', value: 'reset' })
    subcommand: string,
    @SlashOption({
      name: 'question',
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    question: string | undefined,
    interaction: CommandInteraction,
    _client: Client,
    _interactionData: InteractionData,
  ): Promise<void> {
    const channelId = interaction.channel?.id;
    const userId = interaction.user.id;

    if (isNullOrUndefined(channelId)) {
      await interaction.reply('This command can only be used in a channel.');
      return;
    }

    if (subcommand === 'reset') {
      this.llmService.resetConversation(channelId, userId);
      simpleSuccessEmbed(interaction, 'Conversation history has been reset.');
      return;
    }

    if (isNullOrWhitespace(question)) {
      await interaction.reply('Please provide a question after selecting "Ask".');
      return;
    }

    await interaction.deferReply();

    try {
      const discordContext: DiscordContext = {
        guildName: interaction.guild?.name ?? 'Личные сообщения',
        memberCount: interaction.guild?.memberCount,
        channelName: interaction.channel?.type === ChannelType.GuildText
          ? interaction.channel.name
          : 'Личные сообщения',
        channelId: interaction.channel?.id,
        authorUsername: interaction.user.username,
        authorId: interaction.user.id,
        authorDisplayName: !isNullOrUndefined(interaction.member) && 'displayName' in interaction.member ?
          interaction.member.displayName : interaction.user.displayName,
      };

      const answer = await this.llmService.ask(channelId, userId, question, discordContext);

      const chunks = splitMessage(answer);
      if (chunks.length === 1) {
        await interaction.editReply(chunks[0]);
      } else {
        await interaction.editReply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp(chunks[i]);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await interaction.editReply(`⚠️ Error generating response:\n\`${errorMessage}\``);
    }
  }
}
