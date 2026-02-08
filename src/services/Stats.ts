import process from 'node:process'

import { constant } from 'case'
import { Client, SimpleCommandMessage } from 'discordx'
import { OSUtils } from 'node-os-utils'
import pidusage from 'pidusage'
import { delay, inject } from 'tsyringe'

import { statsConfig } from '@/configs'
import { Schedule, Service } from '@/decorators'
import { Database } from '@/services'
import {
	datejs,
	formatDate,
	getTypeOfInteraction,
	resolveAction,
	resolveChannel,
	resolveGuild,
	resolveUser,
} from '@/utils/functions'

const allInteractions = {
	OR: [
		{ type: 'SIMPLE_COMMAND_MESSAGE' },
		{ type: 'CHAT_INPUT_COMMAND_INTERACTION' },
		{ type: 'USER_CONTEXT_MENU_COMMAND_INTERACTION' },
		{ type: 'MESSAGE_CONTEXT_MENU_COMMAND_INTERACTION' },
	],
}

@Service()
export class Stats {

	private osu: OSUtils

	constructor(
		private db: Database,
		@inject(delay(() => Client)) private client: Client
	) {
		this.osu = new OSUtils()
	}

	/**
	 * Add an entry to the stats table.
	 * @param type
	 * @param value
	 * @param additionalData in JSON format
	 */
	async register(type: string, value: string, additionalData?: any) {
		await this.db.prisma.stat.create({
			data: {
				type,
				value,
				additionalData,
			},
		})
	}

	/**
	 * Record an interaction and add it to the database.
	 * @param interaction
	 */
	async registerInteraction(interaction: AllInteractions) {
		// we extract data from the interaction
		const type = constant(getTypeOfInteraction(interaction)) as InteractionsConstants
		if (statsConfig.interaction.exclude.includes(type))
			return

		const value = resolveAction(interaction)
		const additionalData = {
			user: resolveUser(interaction)?.id,
			guild: resolveGuild(interaction)?.id || 'dm',
			channel: resolveChannel(interaction)?.id,
		}

		// add it to the db
		await this.register(type, value, additionalData)
	}

	/**
	 * Record a simple command message and add it to the database.
	 * @param command
	 */
	async registerSimpleCommand(command: SimpleCommandMessage) {
		// we extract data from the interaction
		const type = 'SIMPLE_COMMAND_MESSAGE'
		const value = command.name
		const additionalData = {
			user: command.message.author.id,
			guild: command.message.guild?.id || 'dm',
			channel: command.message.channel?.id,
		}

		// add it to the db
		await this.register(type, value, additionalData)
	}

	/**
	 * Returns an object with the total stats for each type.
	 */
	async getTotalStats() {
		return {
			TOTAL_USERS: this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
			TOTAL_GUILDS: this.client.guilds.cache.size,
			TOTAL_ACTIVE_USERS: await this.db.prisma.user.count(),
			TOTAL_COMMANDS: await this.db.prisma.stat.count({ where: allInteractions }),
		}
	}

	/**
	 * Get the last saved interaction.
	 */
	async getLastInteraction() {
		return this.db.prisma.stat.findFirst({
			where: allInteractions,
			orderBy: {
				createdAt: 'desc',
			},
		})
	}

	/**
	 * Get the last guild added to the database.
	 */
	async getLastGuildAdded() {
		return this.db.prisma.guild.findFirst({
			orderBy: { createdAt: 'desc' },
		})
	}

	/**
	 * Get commands sorted by total amount of uses in DESC order.
	 */
	async getTopCommands() {
		try {
			// Для SQLite/PostgreSQL используем raw SQL для оптимизации
			return await this.db.prisma.$queryRaw`
                SELECT type,
                       value as name,
                       COUNT(*) as count
                FROM "stat"
                WHERE type IN (${allInteractions.OR.map(x => x.type).join(', ')})
                GROUP BY type, value
                ORDER BY count DESC
			`
		} catch (e) {
			return []
		}
	}

	/**
	 * Get the users activity per slice of interactions amount in percentage.
	 */
	async getUsersActivity() {
		const usersActivity = {
			'1-10': 0,
			'11-50': 0,
			'51-100': 0,
			'101-1000': 0,
			'>1000': 0,
		}

		const users = await this.db.prisma.user.findMany()

		for (const user of users) {
			const commandsCount = await this.db.prisma.stat.count({
				where: {
					...allInteractions,
					additionalData: {
						path: ['user'],
						equals: user.id,
					},
				},
			})

			if (commandsCount <= 10)
				usersActivity['1-10']++
			else if (commandsCount <= 50)
				usersActivity['11-50']++
			else if (commandsCount <= 100)
				usersActivity['51-100']++
			else if (commandsCount <= 1000)
				usersActivity['101-1000']++
			else usersActivity['>1000']++
		}

		return usersActivity
	}

	/**
	 * Get guilds sorted by total amount of commands in DESC order.
	 */
	async getTopGuilds() {
		const topGuilds: {
			id: string
			name: string
			totalCommands: number
		}[] = []

		const guilds = await this.db.prisma.guild.findMany({
			where: {
				deleted: false,
			},
		})

		for (const guild of guilds) {
			const discordGuild = await this.client.guilds.fetch(guild.id).catch(() => null)
			if (!discordGuild)
				continue

			const commandsCount = await this.db.prisma.stat.count({
				where: {
					...allInteractions,
					additionalData: {
						path: ['guild'],
						equals: guild.id,
					},
				},
			})

			topGuilds.push({
				id: guild.id,
				name: discordGuild?.name || '',
				totalCommands: commandsCount,
			})
		}

		return topGuilds.sort((a, b) => b.totalCommands - a.totalCommands)
	}

	/**
	 * Returns the amount of row for a given type per day in a given interval of days from now.
	 * @param type the type of the stat to retrieve
	 * @param days interval of days from now
	 */
	async countStatsPerDays(type: string, days: number): Promise<StatPerInterval> {
		const now = Date.now()
		const stats: StatPerInterval = []

		for (let i = 0; i < days; i++) {
			const date = new Date(now - (i * 24 * 60 * 60 * 1000))
			const statCount = await this.getCountForGivenDay(type, date)

			stats.push({
				date: formatDate(date, 'onlyDate'),
				count: statCount,
			})
		}

		return this.cumulateStatPerInterval(stats)
	}

	/**
	 * Transform individual day stats into cumulated stats.
	 * @param stats
	 */
	cumulateStatPerInterval(stats: StatPerInterval): StatPerInterval {
		return stats
			.reverse()
			.reduce((acc, stat, i) => {
				if (acc.length === 0) {
					acc.push(stat)
				} else {
					acc.push({
						date: stat.date,
						count: acc[i - 1].count + stat.count,
					})
				}

				return acc
			}, [] as StatPerInterval)
			.reverse()
	}

	/**
	 * Sum two array of stats.
	 * @param stats1
	 * @param stats2
	 */
	sumStats(stats1: StatPerInterval, stats2: StatPerInterval): StatPerInterval {
		const allDays = [...new Set(stats1.concat(stats2).map(stat => stat.date))]
			.sort((a, b) => {
				const aa = a.split('/').reverse().join()
				const bb = b.split('/').reverse().join()

				return aa < bb ? -1 : (aa > bb ? 1 : 0)
			})

		return allDays.map(day => ({
			date: day,
			count: (stats1.find(stat => stat.date === day)?.count || 0)
			+ (stats2.find(stat => stat.date === day)?.count || 0),
		}))
	}

	/**
	 * Returns the total count of row for a given type at a given day.
	 * @param type
	 * @param date - day to get the stats for (any time of the day will work as it extract the very beginning and the very ending of the day as the two limits)
	 */
	async getCountForGivenDay(type: string, date: Date): Promise<number> {
		const start = datejs(date).startOf('day').toDate()
		const end = datejs(date).endOf('day').toDate()

		const stats = await this.db.prisma.stat.findMany({
			where: {
				type,
				createdAt: {
					gte: start,
					lte: end,
				},
			},
		})

		return stats.length
	}

	/**
	 * Get the current process usage (CPU, RAM, etc).
	 */
	async getPidUsage() {
		const pidUsage = await pidusage(process.pid)

		return {
			...pidUsage,
			cpu: pidUsage.cpu.toFixed(1),
			memory: {
				usedInMb: (pidUsage.memory / (1024 * 1024)).toFixed(1),
				percentage: (pidUsage.memory / Number(this.osu.memory.totalMem()) * 100).toFixed(1),
			},
		}
	}

	/**
	 * Get the current host health (CPU, RAM, etc).
	 */
	async getHostUsage() {
		return {
			cpu: await this.osu.cpu.usage(),
			memory: await this.osu.memory.info(),
			os: this.osu.getPlatformInfo().arch,
			uptime: await this.osu.system.uptime(),
			hostname: '',
			platform: this.osu.getPlatformInfo().platform,

			// drive: osu.drive.info(),
		}
	}

	/**
	 * Get latency from the discord websocket gate.
	 */
	getLatency() {
		return {
			ping: this.client.ws.ping,
		}
	}

	/**
	 * Run each day at 23:59 to update daily stats.
	 */
	@Schedule('59 59 23 * * *')
	async registerDailyStats() {
		const totalStats = await this.getTotalStats()

		for (const type of Object.keys(totalStats)) {
			const value = JSON.stringify(totalStats[type as keyof typeof totalStats])
			await this.register(type, value)
		}
	}

}
