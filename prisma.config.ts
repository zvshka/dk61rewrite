import { PrismaConfig } from 'prisma'

import process from 'node:process'

import 'dotenv/config'

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
