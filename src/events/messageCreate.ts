import { ArgsOf, Client } from 'discordx'

import { generalConfig } from '@/configs'
import { Discord, Guard, Injectable, On } from '@/decorators'
import { Maintenance } from '@/guards'
import { Database } from '@/services'

import { quoteMessage } from '../utils/functions/messageQuoting'

@Discord()
@Injectable()
export default class MessageCreateEvent {

	constructor(private db: Database) {
	}

	@On('messageCreate')
	@Guard(
		Maintenance
	)
	async messageCreateHandler(
		[message]: ArgsOf<'messageCreate'>,
		client: Client
	) {
		await client.executeCommand(message, false)
	}

	@On('messageCreate')
	@Guard(
		Maintenance
	)
	async quotingHandler(
		[message]: ArgsOf<'messageCreate'>,
		client: Client
	) {
		const background = message.attachments.filter(x => x.height != null).first()

		let quotesPrefix = generalConfig.quoting
		if (message.guildId) {
			const guildSettings = await this.db.prisma.guild.findUnique({
				where: {
					id: message.guildId,
				},
			})

			quotesPrefix = guildSettings?.quotesPrefix ?? generalConfig.quoting
		}

		if (message.content === quotesPrefix) {
			await quoteMessage(message, background)
		}
	}

}
