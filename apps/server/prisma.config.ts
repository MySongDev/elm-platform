import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    // generate 只读取 schema，不连接数据库；CI 的生成步骤不提供 DATABASE_URL。
    // 迁移和 seed 仍会校验它，缺失时在那里失败。
    url: process.env.DATABASE_URL ?? '',
  },
})
