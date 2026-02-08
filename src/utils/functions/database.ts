import { Database } from '@/services'

export const defaultData = {
	maintenance: false,
	lastMaintenance: Date.now(),
	lastStartup: Date.now(),
}

/**
 * Initiate the EAV Data table if properties defined in the `defaultData` doesn't exist in it yet.
 */
export async function initDataTable(db: Database): Promise<void> {
	const dataRepo = db.dataStore

	for (const [key, value] of Object.entries(defaultData)) {
		const existing = await dataRepo.get(key)

		if (!existing) {
			await dataRepo.set(key, value)
		}
	}
}
