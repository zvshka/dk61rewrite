import { Category } from '@discordx/utilities'
import { CommandInteraction, Message } from 'discord.js'
import { Client, SimpleCommandMessage } from 'discordx'

import { Discord, SimpleCommand, Slash } from '@/decorators'

@Discord()
@Category('General')
export default class PingCommand {

	@Slash({
		name: 'ping',
	})
	@SimpleCommand({
		name: 'ping',
	})
	async ping(
		interaction: CommandInteraction | SimpleCommandMessage,
		client: Client,
		{ localize }: InteractionData
	) {
		let msg: Message | null = null

		if (interaction instanceof SimpleCommandMessage) {
			if (interaction.message.channel?.isSendable()) {
				msg = await interaction.message.channel?.send('Pinging...')
			}
		} else {
			msg = await interaction.followUp({ content: 'Pinging...', fetchReply: true })
		}

		if (!msg) return

		let content
		if (interaction instanceof SimpleCommandMessage) {
			content = localize.COMMANDS.PING.MESSAGE({
				member: msg.inGuild() ? `${interaction.message.member},` : '',
				time: msg.createdTimestamp - interaction.message.createdTimestamp,
				heartbeat: client.ws.ping ? ` The heartbeat ping is ${Math.round(client.ws.ping)}ms.` : '',
			})
		} else {
			content = localize.COMMANDS.PING.MESSAGE({
				member: msg.inGuild() ? `${interaction.member},` : '',
				time: msg.createdTimestamp - interaction.createdTimestamp,
				heartbeat: client.ws.ping ? ` The heartbeat ping is ${Math.round(client.ws.ping)}ms.` : '',
			})
		}

		await msg.edit(content)
	}

}
