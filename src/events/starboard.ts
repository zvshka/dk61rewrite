import { Colors, EmbedBuilder, Events, Message, MessageReaction, PartialMessageReaction, TextChannel } from 'discord.js'
import { ArgsOf, Client } from 'discordx'

import { Discord, Guard, Injectable, On } from '@/decorators'
import { Maintenance } from '@/guards'
import { Database, Logger } from '@/services'

@Discord()
@Injectable()
export default class Starboard {

	constructor(
		private db: Database,
		private logger: Logger
	) {
	}

	private async fetchReaction(reaction: MessageReaction | PartialMessageReaction) {
		if (reaction.partial) {
			// If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
			try {
				await reaction.fetch()
			} catch (error) {
				await this.logger.logError(error, 'Exception')
			}
		}
	}

	private editEmbed(starboardMessage: Message, reactionCount: number, reaction: MessageReaction) {
		const embed = new EmbedBuilder(starboardMessage.embeds[0].data)
		if (reactionCount > 3) embed.setColor(Colors.Yellow)
		if (reactionCount > 5) embed.setColor(Colors.Orange)
		if (reactionCount > 7) embed.setColor(Colors.Blurple)

		if (starboardMessage.editable) {
			return starboardMessage.edit({
				content: `${reaction.emoji.toString()} **${reactionCount}** <#${reaction.message.channelId}>`,
				embeds: [embed],
			})
		}
	}

	@On(Events.MessageReactionAdd)
	@Guard(
		Maintenance
	)
	async starboardAdd(
		[reaction, user]: ArgsOf<'messageReactionAdd'>,
		client: Client
	) {
		if (reaction.partial) await this.fetchReaction(reaction)
		if (!reaction.message.guildId) return
		const guildSettings = await this.db.prisma.guild.findUnique({
			where: {
				id: reaction.message.guildId,
			},
		})
		if (!guildSettings || !guildSettings.starboardChannel) return
		if (reaction.emoji.toString() !== guildSettings.starboardEmoji) return
		if (!reaction.message.guild || !reaction.message.author || reaction.message.author?.id === user.id) return

		const reactionCount = (reaction as MessageReaction).count - (reaction.users.cache.has(reaction.message.author.id) ? 1 : 0)
		if (reactionCount < guildSettings.starboardCount) return

		const starboard = await reaction.message.guild.channels.fetch(guildSettings.starboardChannel)
		if (!starboard || !starboard.isSendable()) return

		const messageInDatabase = await this.db.prisma.starredMessage.findUnique({
			where: {
				guildId_starredMessageId: {
					guildId: reaction.message.guildId,
					starredMessageId: reaction.message.id,
				},
			},
		})

		if (!messageInDatabase) {
			const embed = new EmbedBuilder()
				.setAuthor({ name: reaction.message.author.username, iconURL: reaction.message.author.avatarURL() ?? '' })
				.addFields({ name: 'Souce:', value: `[Jump!](${reaction.message.url})` })
				.setTimestamp()

			if (reaction.message.content && reaction.message.content.length > 0) {
				embed.setDescription(reaction.message.content)
			}

			if (reactionCount > 3) embed.setColor(Colors.Yellow)
			if (reactionCount > 5) embed.setColor(Colors.Orange)
			if (reactionCount > 7) embed.setColor(Colors.Blurple)

			const reactionChannel = reaction.message.channel as TextChannel

			if (!reactionChannel.nsfw) {
				const attachment = reaction.message.attachments.first()
				if (attachment) {
					embed.setImage(attachment.url)
				}
			}

			const starboardMessage = await starboard.send({
				content: `${reaction.emoji.toString()} **${reactionCount}** <#${reaction.message.channelId}>`,
				embeds: [embed],
			})

			if (!starboardMessage) return

			await this.db.prisma.starredMessage.create({
				data: {
					guildId: starboardMessage.guildId,
					starredMessageId: reaction.message.id,
					botMessageId: starboardMessage.id,
				},
			})
		} else {
			const starboardMessage = await starboard.messages.fetch(messageInDatabase.botMessageId)
			if (starboardMessage) {
				await this.editEmbed(starboardMessage, reactionCount, reaction as MessageReaction)
			}
		}
	}

	@On(Events.MessageReactionRemove)
	@Guard(
		Maintenance
	)
	async starboardRemove(
		[reaction, user]: ArgsOf<'messageReactionRemove'>,
		client: Client
	) {
		if (reaction.partial) await this.fetchReaction(reaction)
		if (!reaction.message.guildId) return
		const guildSettings = await this.db.prisma.guild.findUnique({
			where: {
				id: reaction.message.guildId,
			},
		})
		if (!guildSettings || !guildSettings.starboardChannel) return
		if (reaction.emoji.toString() !== guildSettings.starboardEmoji) return
		if (!reaction.message.guild || !reaction.message.author || reaction.message.author?.id === user.id) return

		const starboard = await reaction.message.guild.channels.fetch(guildSettings.starboardChannel)
		if (!starboard || !starboard.isSendable()) return

		const messageInDatabase = await this.db.prisma.starredMessage.findUnique({
			where: {
				guildId_starredMessageId: {
					guildId: reaction.message.guildId,
					starredMessageId: reaction.message.id,
				},
			},
		})

		if (!messageInDatabase) return

		const botMessage = await starboard.messages.fetch(messageInDatabase.botMessageId)
		if (!botMessage) return

		const reactionCount = (reaction as MessageReaction).count - (reaction.users.cache.has(reaction.message.author.id) ? 1 : 0)

		if (reactionCount >= guildSettings.starboardCount) {
			await this.editEmbed(botMessage, reactionCount, reaction as MessageReaction)
		} else {
			await this.db.prisma.starredMessage.delete({
				where: {
					guildId_starredMessageId: {
						guildId: reaction.message.guildId,
						starredMessageId: reaction.message.id,
					},
				},
			})

			if (botMessage.deletable) {
				await botMessage.delete()
			}
		}
	}

}
