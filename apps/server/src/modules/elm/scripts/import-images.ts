/**
 * 独立图片导入命令。
 *
 *   下载本地库引用的图片：
 *     pnpm --filter @elm-platform/server run elm:import:images
 *
 *   离线盘点（只读本地资产，不向任一上游发请求）：
 *     pnpm --filter @elm-platform/server run elm:import:images -- --check
 *
 * 为什么独立成命令而不是塞进 import-upstream.ts（011 §4.1 / §5.2）：
 * ・图片导入只需要「配置 + Prisma + 图片 provider」，不依赖 Redis / 短信 / 支付。
 *   因此这里用最小 Nest 上下文（ElmImageImportModule），不启动整个 AppModule，
 *   避免被无关模块阻断（比如 Redis 连不上时也能盘点本地图片）。
 * ・下载是显式、幂等的一次性动作，和商家数据导入（elm:import）分开，
 *   上游补录新图 / 重跑补图都不必重抓商家数据。
 *
 * 副作用导入（reflect-metadata + dotenv）必须排在其它 import 之前，
 * 否则 Nest DI / DATABASE_URL 来不及生效（见 import-upstream.ts 头部说明）。
 */
/* eslint-disable perfectionist/sort-imports */
import 'reflect-metadata'
import 'dotenv/config'
import { Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import configuration from '@/config/configuration'
import { validateEnv } from '@/config/env.schema'
import { PrismaModule } from '@/prisma/prisma.module'
import { ElmImageImportService } from '../services/elm-image-import.service'
import { ElmImageProxyService } from '../services/elm-image-proxy.service'
import { ElmImageStorageService } from '../services/elm-image-storage.service'

/**
 * 最小图片导入模块：只装配配置、Prisma 与三个图片 provider。
 * PrismaModule 是 @Global()，其 PrismaService 在本模块 provider 里可直接注入。
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/server/.env', '.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
  ],
  providers: [ElmImageStorageService, ElmImageProxyService, ElmImageImportService],
})
class ElmImageImportModule {}

interface ImportArgs {
  check: boolean
  concurrency?: number
}

function parseArgs(argv: string[]): ImportArgs {
  const check = argv.includes('--check')
  const idx = argv.indexOf('--concurrency')
  let concurrency: number | undefined
  if (idx !== -1) {
    const value = Number(argv[idx + 1])
    if (Number.isInteger(value) && value >= 1)
      concurrency = value
  }
  return {
    check,
    concurrency,
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}

function printSummary(result: {
  mode: 'import' | 'check'
  validRefs: number
  uniqueImages: number
  emptyRefs: number
  invalidRefs: number
  localComplete: number
  downloaded: number
  missing: number
  localBytes: number
  failures: Array<{
    path: string
    reason: string
    detail: string
    sources: string[]
  }>
  emptyDatabase: boolean
}, startedAt: number): void {
  const elapsedMs = Date.now() - startedAt
  const line = (s: string) => console.log(s)

  line('')
  line(`[elm:import:images] 模式 = ${result.mode}`)
  line(`[elm:import:images] 有效引用 ${result.validRefs} / 空引用 ${result.emptyRefs} / 无效引用 ${result.invalidRefs}`)
  line(`[elm:import:images] 唯一图片 ${result.uniqueImages} / 本地完整 ${result.localComplete}`)
  line(`[elm:import:images] 本次下载 ${result.downloaded} / 缺失 ${result.missing}`)
  line(`[elm:import:images] 本地图片字节 ${formatBytes(result.localBytes)} / 耗时 ${(elapsedMs / 1000).toFixed(1)}s`)

  if (result.failures.length > 0) {
    const shown = result.failures.slice(0, 20)
    line(`[elm:import:images] 失败/缺失清单（前 ${shown.length} / 共 ${result.failures.length}）：`)
    for (const f of shown) {
      line(`  - ${f.reason}: ${f.path}（来源 ${f.sources.length} 条）${f.detail ? ` — ${f.detail}` : ''}`)
    }
    if (result.failures.length > shown.length)
      line(`  … 其余 ${result.failures.length - shown.length} 条见 import-result.json`)
  }
}

async function main(): Promise<void> {
  const { check, concurrency } = parseArgs(process.argv.slice(2))
  const startedAt = Date.now()

  let app: Awaited<ReturnType<typeof NestFactory.createApplicationContext>>
  try {
    app = await NestFactory.createApplicationContext(ElmImageImportModule, {
      logger: ['log', 'warn', 'error'],
    })
  }
  catch (error) {
    // 数据库连不上 / 上下文初始化失败：清晰报错，退出 1，不宣称完成。
    console.error('[elm:import:images] 无法建立数据库连接或初始化上下文：')
    console.error(error instanceof Error ? error.stack : String(error))
    process.exitCode = 1
    return
  }

  try {
    const importer = app.get(ElmImageImportService)
    const result = check ? await importer.checkLocal() : await importer.importImages({ concurrency })

    printSummary(result, startedAt)

    if (result.emptyDatabase)
      console.error('[elm:import:images] ⚠️ 数据库为空：请先运行 `pnpm --filter @elm-platform/server run elm:import` 导入商家数据，再重跑本命令')

    // 退出码（011 §5.3）：
    // ・全部完整且无无效引用 → 0
    // ・仍有缺失 / 有无效引用 / 库空 → 1（成功图与失败清单已保存）
    const pass = result.missing === 0 && result.invalidRefs === 0 && !result.emptyDatabase
    process.exitCode = pass ? 0 : 1
  }
  finally {
    await app.close()
  }
}

main().catch((error) => {
  console.error('[elm:import:images] 导入失败：', error)
  process.exit(1)
})
