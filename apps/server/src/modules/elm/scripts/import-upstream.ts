// ⚠️ 这两个是**副作用导入**，必须排在其它 import 之前：
// ・reflect-metadata 提供装饰器元数据，Nest 的 DI 依赖它
// ・dotenv/config 把 .env 注入 process.env，PrismaService 构造时要读 DATABASE_URL
// eslint 的 import 排序规则会把它们挪到末尾（已实测发生），那会让 AppModule 先求值、
// 副作用来不及生效，所以这里显式关闭该规则。
/* eslint-disable perfectionist/sort-imports */
import 'reflect-metadata'
import 'dotenv/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '@/app.module'
import { ElmUpstreamImportService } from '../services/elm-upstream-import.service'

/**
 * 上游数据导入命令。
 *
 * 商家 + 首页分类（默认）：
 *   pnpm --filter @elm-platform/server run elm:import
 *
 * 连菜单一起全量预导（实测仅 149 家店有菜单 / 约 2 MB / 约 80 秒，跑完即可彻底断上游）：
 *   pnpm --filter @elm-platform/server run elm:import -- --with-menus
 *
 * 为什么是独立命令而不是塞进 prisma/seed.ts：
 * ・商家 4295 行约 7 MB，会让每次 seed 都变慢，而 seed 是高频操作
 * ・导入依赖上游可达，seed 不应该有这个外部依赖
 * ・重复执行安全（按 id upsert / 按 menu_synced_at 取待办），中断后可直接重跑
 */
async function main() {
  // pnpm 会把 `--` 之后的参数透传过来，所以两种写法都认。
  const withMenus = process.argv.includes('--with-menus')
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  })

  try {
    const importer = app.get(ElmUpstreamImportService)

    console.log('[elm:import] 开始导入商家…')
    const restaurants = await importer.importRestaurants()
    console.log(`[elm:import] 商家完成：抓取 ${restaurants.total} 条 / 唯一 id ${restaurants.unique} 个`)

    console.log('[elm:import] 开始导入首页分类…')
    const entries = await importer.importCategoryEntries()
    console.log(`[elm:import] 首页分类完成：${entries.total} 条`)

    if (withMenus) {
      console.log('[elm:import] 开始全量预导菜单（实测 149 家店有菜单 / 约 2 MB / 约 80 秒）…')
      const menus = await importer.importAllMenus()
      console.log(
        `[elm:import] 菜单完成：成功 ${menus.imported}（无菜单 ${menus.empty}）`
        + `失败 ${menus.failed}，共 ${menus.categories} 个分类`,
      )
      if (menus.failed)
        console.log('[elm:import] ⚠️ 有失败的商家，重跑本命令会自动重试这些店（按 menu_synced_at 取待办）')
    }

    console.log('[elm:import] 全部完成。')
  }
  finally {
    await app.close()
  }
}

main().catch((error) => {
  console.error('[elm:import] 导入失败：', error)
  process.exit(1)
})
