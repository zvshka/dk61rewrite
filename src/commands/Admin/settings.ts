import { Channel, CommandInteraction } from 'discord.js';
import { Client } from 'discordx';
import { Database } from '@/services';
import { Category } from '@discordx/utilities';
import { parse } from '@twemoji/parser';

import { ApplicationCommandOptionType } from 'discord.js';
import { Discord, Injectable, Slash, SlashOption } from '@/decorators';
import { UnknownReplyError } from '@/errors';
import { Guard, GuildOnly, UserPermissions } from '@/guards';
import { isNullOrUndefined, isNullOrWhitespace, resolveGuild, simpleSuccessEmbed } from '@/utils/functions';

@Discord()
@Injectable()
@Category('Admin')
export default class SettingsCommand {
  constructor(private db: Database) {}

  @Slash({ name: 'settings' })
  @Guard(UserPermissions(['Administrator']), GuildOnly)
  async settings(
    @SlashOption({
      name: 'starboard_channel',
      localizationSource: 'COMMANDS.SETTINGS.OPTIONS.STARBOARD_CHANNEL',
      type: ApplicationCommandOptionType.Channel,
      required: false,
    })
    starboardChannel: Channel | undefined,
    @SlashOption({
      name: 'starboard_emoji',
      localizationSource: 'COMMANDS.SETTINGS.OPTIONS.STARBOARD_EMOJI',
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    starboardEmoji: string | undefined,
    @SlashOption({
      name: 'starboard_emoji_count',
      localizationSource: 'COMMANDS.SETTINGS.OPTIONS.STARBOARD_COUNT',
      type: ApplicationCommandOptionType.Number,
      required: false,
    })
    starboardEmojiCount: number | undefined,
    @SlashOption({
      name: 'quotes_prefix',
      localizationSource: 'COMMANDS.SETTINGS.OPTIONS.QUOTES_PREFIX',
      type: ApplicationCommandOptionType.String,
      required: false,
    })
    quotesPrefix: string | undefined,
    @SlashOption({
      name: 'proposal_channel',
      localizationSource: 'COMMANDS.SETTINGS.OPTIONS.PROPOSAL_CHANNEL',
      type: ApplicationCommandOptionType.Channel,
      required: false,
    })
    proposalChannel: Channel | undefined,
    interaction: CommandInteraction,
    client: Client,
    { localize }: InteractionData
  ) {
    const guild = resolveGuild(interaction);

    if (!guild) throw new UnknownReplyError(interaction);

    const guildData = await this.db.prisma.guild.findFirst({
      where: {
        id: guild.id || '',
      },
    });

    if (guildData) {
      if (starboardChannel?.isSendable() === true) {
        await this.db.prisma.guild.update({
          where: {
            id: guild.id,
          },
          data: {
            starboardChannel: starboardChannel.id,
          },
        });
      }

      if (!isNullOrWhitespace(starboardEmoji)) {
        const parsed = parse(starboardEmoji); // parsing to check later if emote is an twemoji
        const regExToSearch = /<?(a:|:)\w*:(\d*)>/;
        const matched = starboardEmoji.match(regExToSearch);

        if (parsed.length > 0 || matched) {
          await this.db.prisma.guild.update({
            where: {
              id: guild.id,
            },
            data: {
              starboardEmoji,
            },
          });
        }
      }

      if (!isNullOrUndefined(starboardEmojiCount) && starboardEmojiCount > 0) {
        await this.db.prisma.guild.update({
          where: {
            id: guild.id,
          },
          data: {
            starboardCount: starboardEmojiCount,
          },
        });
      }

      if (!isNullOrUndefined(quotesPrefix) && quotesPrefix.length > 0) {
        await this.db.prisma.guild.update({
          where: {
            id: guild.id,
          },
          data: {
            quotesPrefix,
          },
        });
      }

      if (proposalChannel?.isSendable() === true) {
        await this.db.prisma.guild.update({
          where: {
            id: guild.id,
          },
          data: {
            proposalChannel: proposalChannel.id,
          },
        });
      }

      return simpleSuccessEmbed(interaction, localize.COMMANDS.SETTINGS.EMBED.DESCRIPTION());
    }
  }
}
