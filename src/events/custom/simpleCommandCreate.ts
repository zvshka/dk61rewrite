import { ArgsOf, Client, Guard, SimpleCommandMessage } from 'discordx'

import { Discord, Injectable, On, OnCustom } from '@/decorators'
import { Maintenance } from '@/guards'
import { Database, EventManager, Logger, Stats } from '@/services'
import { syncUser } from '@/utils/functions'

@Discord()
@Injectable()
export default class SimpleCommandCreateEvent {

	constructor(
		private stats: Stats,
		private logger: Logger,
		private db: Database,
		private eventManager: EventManager
	) {}

	// =============================
	// ========= Handler ===========
	// =============================

	@OnCustom('simpleCommandCreate')
	async simpleCommandCreateHandler(command: SimpleCommandMessage) {
		// insert user in db if not exists
		await syncUser(command.message.author)

		// update last interaction time of both user and guild
		await this.db.prisma.user.update({
			where: {
				id: command.message.author.id,
			},
			data: {
				lastInteract: new Date(),
			},
		})

		await this.db.prisma.guild.update({
			where: {
				id: command.message.guild?.id,
			},
			data: {
				lastInteract: new Date(),
			},
		})

		await this.stats.registerSimpleCommand(command)
		this.logger.logInteraction(command)
	}

	// =============================
	// ========== Emitter ==========
	// =============================

	@On('messageCreate')
	@Guard(
		Maintenance
	)
	async simpleCommandCreateEmitter(
		[message]: ArgsOf<'messageCreate'>,
		client: Client
	) {
		const command = await client.parseCommand(message, false)

		if (command && command instanceof SimpleCommandMessage) {
			/**
			 * @param {SimpleCommandMessage} command
			 */
			this.eventManager.emit('simpleCommandCreate', command)
		}
	}

}
