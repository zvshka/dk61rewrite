import { Category } from '@discordx/utilities'
import { ApplicationCommandOptionType, CommandInteraction } from 'discord.js'
import { Client } from 'discordx'

import { generalConfig } from '@/configs'
import { Discord, Injectable, Slash, SlashOption } from '@/decorators'
import { UnknownReplyError } from '@/errors'
import { Guard, GuildOnly, UserPermissions } from '@/guards'
import { Database } from '@/services'
import { resolveGuild, simpleSuccessEmbed } from '@/utils/functions'

@Discord()
@Injectable()
@Category('Admin')
export default class PrefixCommand {

	constructor(
		private db: Database
	) {
	}

	@Slash({ name: 'prefix' })
	@Guard(
		UserPermissions(['Administrator']),
		GuildOnly
	)
	async prefix(
		@SlashOption({
			name: 'prefix',
			localizationSource: 'COMMANDS.PREFIX.OPTIONS.PREFIX',
			type: ApplicationCommandOptionType.String,
		}) prefix: string | undefined,
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
			await this.db.prisma.guild.update({
				where: {
					id: guild.id,
				},
				data: {
					prefix: prefix || null,
				},
			})

			simpleSuccessEmbed(
				interaction,
				localize.COMMANDS.PREFIX.EMBED.DESCRIPTION({
					prefix: prefix || generalConfig.defaultPrefix,
				})
			)
		}
	}

}
