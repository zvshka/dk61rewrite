import { Message } from 'discord.js'

import { generalConfig } from '@/configs'
import { Database } from '@/services'
import { resolveDependency } from '@/utils/functions'

/**
 * Get prefix from the database or from the config file.
 * @param message
 */
export async function getPrefixFromMessage(message: Message) {
	const db = await resolveDependency(Database)

	const prefixes = [generalConfig.defaultPrefix]

	const guildId = message.guild?.id
	const guildData = await db.prisma.guild.findUnique({
		where: {
			id: guildId,
		},
	})

	if (guildData && guildData.prefix) {
		prefixes.push(guildData.prefix)
	}

	return prefixes
}
