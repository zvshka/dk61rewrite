import { User as DiscordUser } from 'discord.js'
import { Client } from 'discordx'

import { Database, Logger, Stats } from '@/services'
import { resolveDependencies, resolveDependency } from '@/utils/functions'

/**
 * Add an active user to the database if it doesn't exist.
 * @param user
 */
export async function syncUser(user: DiscordUser) {
	const [db, stats, logger] = await resolveDependencies([Database, Stats, Logger])

	const userData = await db.prisma.user.findUnique({
		where: {
			id: user.id,
		},
	})

	if (!userData) {
		// add user to the db
		await db.prisma.user.create({
			data: {
				id: user.id,
			},
		})

		// record new user both in logs and stats
		stats.register('NEW_USER', user.id)
		logger.logNewUser(user)
	}
}

/**
 * Sync a guild with the database.
 * @param guildId
 * @param client
 */
export async function syncGuild(guildId: string, client: Client) {
	const [db, stats, logger] = await resolveDependencies([Database, Stats, Logger])

	const guildData = await db.prisma.guild.findFirst({
		where: { id: guildId, deleted: false },
	})

	const fetchedGuild = await client.guilds.fetch(guildId).catch(() => null)

	// check if this guild exists in the database, if not it creates it (or recovers it from the deleted ones)
	if (!guildData) {
		const deletedGuildData = await db.prisma.guild.findFirst({
			where: { id: guildId, deleted: true },
		})

		if (deletedGuildData) {
			// recover deleted guild

			await db.prisma.guild.update({
				where: {
					id: guildId,
				},
				data: {
					deleted: false,
				},
			})

			stats.register('RECOVER_GUILD', guildId)
			logger.logGuild('RECOVER_GUILD', guildId)
		} else {
			// create new guild

			await db.prisma.guild.create({
				data: {
					id: guildId,
				},
			})

			stats.register('NEW_GUILD', guildId)
			logger.logGuild('NEW_GUILD', guildId)
		}
	} else if (!fetchedGuild) {
		// guild is deleted but still exists in the database

		await db.prisma.guild.update({
			where: {
				id: guildId,
			},
			data: {
				deleted: true,
			},
		})

		stats.register('DELETE_GUILD', guildId)
		logger.logGuild('DELETE_GUILD', guildId)
	}
}

/**
 * Sync all guilds with the database.
 * @param client
 */
export async function syncAllGuilds(client: Client) {
	const db = await resolveDependency(Database)

	// add missing guilds
	const guilds = client.guilds.cache
	for (const guild of guilds)
		await syncGuild(guild[1].id, client)

	// remove deleted guilds
	const guildsData = await db.prisma.guild.findMany({
		where: {
			deleted: false,
		},
	})
	for (const guildData of guildsData)
		await syncGuild(guildData.id, client)
}
