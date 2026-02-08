import { CommandInteraction } from 'discord.js'
import { ArgsOf, Client } from 'discordx'

import { generalConfig } from '@/configs'
import { Discord, Guard, Injectable, On } from '@/decorators'
import { Maintenance } from '@/guards'
import { Database, Logger, Stats } from '@/services'
import { syncUser } from '@/utils/functions'

@Discord()
@Injectable()
export default class InteractionCreateEvent {

	constructor(
		private stats: Stats,
		private logger: Logger,
		private db: Database
	) {}

	@On('interactionCreate')
	@Guard(
		Maintenance
	)
	async interactionCreateHandler(
		[interaction]: ArgsOf<'interactionCreate'>,
		client: Client
	) {
		// defer the reply
		if (
			generalConfig.automaticDeferring
			&& interaction instanceof CommandInteraction
		) await interaction.deferReply()

		// insert user in db if not exists
		await syncUser(interaction.user)

		// update last interaction time of both user and guild
		await this.db.prisma.user.update({
			where: {
				id: interaction.user.id,
			},
			data: {
				lastInteract: new Date(),
			},
		})

		await this.db.prisma.guild.update({
			where: {
				id: interaction.guild?.id,
			},
			data: {
				lastInteract: new Date(),
			},
		})

		// register logs and stats
		await this.stats.registerInteraction(interaction as AllInteractions)
		this.logger.logInteraction(interaction as AllInteractions)

		client.executeInteraction(interaction)
	}

}
