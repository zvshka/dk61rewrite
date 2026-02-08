import { Database } from '@/services'
import { resolveDependency } from '@/utils/functions'

/**
 * Get the maintenance state of the bot.
 */
export async function isInMaintenance(): Promise<boolean> {
	const db = await resolveDependency(Database)
	const maintenance = db.dataStore.get('maintenance')

	return maintenance
}

/**
 * Set the maintenance state of the bot.
 */
export async function setMaintenance(maintenance: boolean) {
	const db = await resolveDependency(Database)

	db.dataStore.set('maintenance', maintenance)
}
