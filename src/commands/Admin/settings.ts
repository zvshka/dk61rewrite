import { Category } from '@discordx/utilities'
import { parse } from '@twemoji/parser'
import { ApplicationCommandOptionType, Channel, CommandInteraction } from 'discord.js'
import { Client } from 'discordx'

import { Discord, Injectable, Slash, SlashOption } from '@/decorators'
import { UnknownReplyError } from '@/errors'
import { Guard, GuildOnly, UserPermissions } from '@/guards'
import { Database } from '@/services'
import { resolveGuild, simpleSuccessEmbed } from '@/utils/functions'

@Discord()
@Injectable()
@Category('Admin')
export default class SettingsCommand {

	constructor(
		private db: Database
	) {
	}

	@Slash({ name: 'settings' })
	@Guard(
		UserPermissions(['Administrator']),
		GuildOnly
	)
	async settings(
		@SlashOption({
			name: 'starboard_channel',
			localizationSource: 'COMMANDS.SETTINGS.OPTIONS.STARBOARD_CHANNEL',
			type: ApplicationCommandOptionType.Channel,
			required: false,
		}) starboardChannel: Channel | undefined,
		@SlashOption({
			name: 'starboard_emoji',
			localizationSource: 'COMMANDS.SETTINGS.OPTIONS.STARBOARD_EMOJI',
			type: ApplicationCommandOptionType.String,
			required: false,
		}) starboardEmoji: string | undefined,
		@SlashOption({
			name: 'starboard_emoji_count',
			localizationSource: 'COMMANDS.SETTINGS.OPTIONS.STARBOARD_COUNT',
			type: ApplicationCommandOptionType.Number,
			required: false,
		}) starboardEmojiCount: number | undefined,
		@SlashOption({
			name: 'quotes_prefix',
			localizationSource: 'COMMANDS.SETTINGS.OPTIONS.QUOTES_PREFIX',
			type: ApplicationCommandOptionType.String,
			required: false,
		}) quotesPrefix: string | undefined,
		interaction: CommandInteraction,
		client: Client,
		{ localize }: InteractionData
	) {
		const guild = resolveGuild(interaction)

		if (!guild) throw new UnknownReplyError(interaction)

		const guildData = await this.db.prisma.guild.findFirst({
			where: {
				id: guild?.id || '',
			},
		})

		if (guildData) {
			if (starboardChannel && starboardChannel.isSendable()) {
				await this.db.prisma.guild.update({
					where: {
						id: guild.id,
					},
					data: {
						starboardChannel: starboardChannel.id,
					},
				})
			}

			if (starboardEmoji && starboardEmoji.length > 0) {
				const parsed = parse(starboardEmoji) // parsing to check later if emote is an twemoji
				const regExToSearch = /<?(a:|:)\w*:(\d*)>/
				const matched = starboardEmoji.match(regExToSearch)

				if (parsed.length > 0 || matched) {
					await this.db.prisma.guild.update({
						where: {
							id: guild.id,
						},
						data: {
							starboardEmoji,
						},
					})
				}
			}

			if (starboardEmojiCount && starboardEmojiCount > 0) {
				await this.db.prisma.guild.update({
					where: {
						id: guild.id,
					},
					data: {
						starboardCount: starboardEmojiCount,
					},
				})
			}

			if (quotesPrefix && quotesPrefix.length > 0) {
				await this.db.prisma.guild.update({
					where: {
						id: guild.id,
					},
					data: {
						quotesPrefix,
					},
				})
			}

			simpleSuccessEmbed(
				interaction,
				localize.COMMANDS.SETTINGS.EMBED.DESCRIPTION()
			)
		}
	}

}
