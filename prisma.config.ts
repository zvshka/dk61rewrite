import 'dotenv/config'

import process from 'node:process'

import type { PrismaConfig } from 'prisma'

export default {
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'database/migrations',
		seed: 'tsx prisma/seed.ts',
	},
	datasource: {
		url: process.env.DATABASE_URL ?? '',
	},
} satisfies PrismaConfig
