import { CommandInteraction } from 'discord.js';
import { Client } from 'discordx';
import { ApplicationCommandOptionType } from 'discord.js';
import { Category } from '@discordx/utilities';

import { Discord, Guard, Injectable, Slash, SlashChoice, SlashOption } from '@/decorators';
import { GuildOnly } from '@/guards';
import { LLM } from '@/services';
import { isNullOrUndefined, isNullOrWhitespace, simpleSuccessEmbed } from '@/utils/functions';

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
      const answer = await this.llmService.ask(channelId, userId, question);

      const chunks = this.splitMessage(answer);
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

  private splitMessage(text: string, maxLength = 1900): string[] {
    if (text.length <= maxLength) return [text];

    const chunks: string[] = [];
    let current = '';

    for (const line of text.split('\n')) {
      if (current.length + line.length + 1 > maxLength) {
        if (current) chunks.push(current.trim());
        current = line;
      } else {
        current += (current ? '\n' : '') + line;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }
}
