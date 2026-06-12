import {
  Message,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  TextChannel,
  User,
} from 'discord.js';
import { ArgsOf } from 'discordx';
import { Database, Logger } from '@/services';
import { isNullOrWhitespace } from '@/utils/functions';

import { Colors, EmbedBuilder, Events } from 'discord.js';
import { Discord, Guard, Injectable, On } from '@/decorators';
import { Maintenance } from '@/guards';

@Discord()
@Injectable()
export default class Starboard {
  constructor(
    private db: Database,
    private logger: Logger
  ) {}

  private async fetchReaction(reaction: MessageReaction | PartialMessageReaction) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        this.logger.logError(error as Error, 'Exception');
      }
    }
  }

  private editEmbed(starboardMessage: Message, reactionCount: number, reaction: MessageReaction) {
    const embed = new EmbedBuilder(starboardMessage.embeds[0].data);
    if (reactionCount > 3) embed.setColor(Colors.Yellow);
    if (reactionCount > 5) embed.setColor(Colors.Orange);
    if (reactionCount > 7) embed.setColor(Colors.Blurple);

    if (starboardMessage.editable) {
      return starboardMessage.edit({
        content: `${reaction.emoji.toString()} **${reactionCount}** <#${reaction.message.channelId}>`,
        embeds: [embed],
      });
    }
  }

  private async getStarboardContext(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (reaction.partial) await this.fetchReaction(reaction);
    if (isNullOrWhitespace(reaction.message.guildId)) return null;

    const guildSettings = await this.db.prisma.guild.findUnique({
      where: { id: reaction.message.guildId },
    });
    if (!guildSettings || isNullOrWhitespace(guildSettings.starboardChannel)) return null;
    if (reaction.emoji.toString() !== guildSettings.starboardEmoji) return null;

    // После fetch() можно безопасно привести к полному типу
    const fullReaction = reaction as MessageReaction;
    const fullUser = user as User;

    if (
      !fullReaction.message.guild ||
      !fullReaction.message.author ||
      fullReaction.message.author.id === fullUser.id
    ) {
      return null;
    }

    const starboard = await fullReaction.message.guild.channels.fetch(guildSettings.starboardChannel);
    if ((starboard?.isSendable()) === false) return null;

    const messageInDatabase = await this.db.prisma.starredMessage.findUnique({
      where: {
        guildId_starredMessageId: {
          guildId: fullReaction.message.guild.id,
          starredMessageId: fullReaction.message.id,
        },
      },
    });

    return {
      reaction: fullReaction,
      user: fullUser,
      author: fullReaction.message.author,
      guildId: fullReaction.message.guild.id,
      messageId: fullReaction.message.id,
      guildSettings,
      starboard,
      messageInDatabase,
    };
  }

  @On(Events.MessageReactionAdd)
  @Guard(Maintenance)
  async starboardAdd([reaction, user]: ArgsOf<'messageReactionAdd'>) {
    const ctx = await this.getStarboardContext(reaction, user);
    if (!ctx) return;

    const { reaction: fullReaction, author, guildSettings, starboard, messageInDatabase, guildId, messageId } = ctx;

    const reactionCount =
      (fullReaction.count ?? 0) -
      (fullReaction.users.cache.has(author.id) ? 1 : 0);

    if (reactionCount < guildSettings.starboardCount) return;

    if (!messageInDatabase) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: author.username,
          iconURL: author.avatarURL() ?? '',
        })
        .addFields({ name: 'Source:', value: `[Jump!](${fullReaction.message.url})` }) // (Исправлена опечатка Souce -> Source)
        .setTimestamp();

      if (!isNullOrWhitespace(fullReaction.message.content)) {
        embed.setDescription(fullReaction.message.content);
      }

      if (reactionCount > 3) embed.setColor(Colors.Yellow);
      if (reactionCount > 5) embed.setColor(Colors.Orange);
      if (reactionCount > 7) embed.setColor(Colors.Blurple);

      const reactionChannel = fullReaction.message.channel as TextChannel;

      if (!reactionChannel.nsfw) {
        const attachment = fullReaction.message.attachments.first();
        if (attachment) {
          embed.setImage(attachment.url);
        }
      }

      const starboardMessage = await starboard.send({
        content: `${fullReaction.emoji.toString()} **${reactionCount}** <#${fullReaction.message.channelId}>`,
        embeds: [embed],
      });

      if (!starboardMessage) return;

      await this.db.prisma.starredMessage.create({
        data: {
          guildId,
          starredMessageId: messageId,
          botMessageId: starboardMessage.id,
        },
      });
    } else {
      const starboardMessage = await starboard.messages.fetch(messageInDatabase.botMessageId);
      if (starboardMessage) {
        await this.editEmbed(starboardMessage, reactionCount, fullReaction);
      }
    }
  }

  @On(Events.MessageReactionRemove)
  @Guard(Maintenance)
  async starboardRemove([reaction, user]: ArgsOf<'messageReactionRemove'>) {
    const ctx = await this.getStarboardContext(reaction, user);
    if (!ctx) return;

    const { reaction: fullReaction, author, guildSettings, starboard, messageInDatabase, guildId, messageId } = ctx;
    if (!messageInDatabase) return;

    const botMessage = await starboard.messages.fetch(messageInDatabase.botMessageId);
    if (!botMessage) return;

    const reactionCount =
      (fullReaction.count ?? 0) -
      (fullReaction.users.cache.has(author.id) ? 1 : 0);

    if (reactionCount >= guildSettings.starboardCount) {
      await this.editEmbed(botMessage, reactionCount, fullReaction);
    } else {
      await this.db.prisma.starredMessage.delete({
        where: {
          guildId_starredMessageId: {
            guildId,
            starredMessageId: messageId,
          },
        },
      });

      if (botMessage.deletable) {
        await botMessage.delete();
      }
    }
  }
}
