import type { UserMenuNode } from '@/entities/session'
import { describe, expect, it } from 'vitest'
import { getDevMockUserMenus } from '../../../../mock/fixtures/session'
import { buildRoutes } from '../permission'

/** 递归拍平菜单树，便于逐节点断言 */
function collectMenus(nodes: UserMenuNode[]): UserMenuNode[] {
  return nodes.flatMap(node => [node, ...(node.children ? collectMenus(node.children) : [])])
}

/**
 * mock 菜单数据与前端路由解析之间的契约测试。
 *
 * 存在意义：mock 的造数逻辑（`mock/fixtures/session.ts`）与菜单消费逻辑
 * （`permission.ts` 的 status 过滤 + component 解析）之间原本没有任何测试跨越。
 * 两端的单测各自都过，接起来才会出错，历史缺陷正是这样藏住的：
 *   - `status: 1`（数字）→ permission 判断 `!== 'ACTIVE'` → 菜单被全部过滤
 *   - `component: 'dashboard/index'` → 解析到不存在的路径 → 页面 404
 *
 * 本测试不依赖 `tsconfig` 是否覆盖 `mock/`，即使那段配置被移除也仍然生效。
 */
describe('mock menu <-> router contract', () => {
  const menus = collectMenus(getDevMockUserMenus())

  it('keeps every mock menu status within the AccountStatus enum', () => {
    const invalid = menus
      .filter(menu => menu.status !== 'ACTIVE' && menu.status !== 'DISABLED')
      .map(menu => ({
        title: menu.title,
        status: menu.status,
      }))

    expect(invalid).toEqual([])
  })

  it('resolves every mock leaf menu component to a real page file', () => {
    const pageModules = import.meta.glob('/src/pages/**/index.vue')
    const missing = menus.flatMap(menu =>
      menu.type === 'menu' && menu.component && !pageModules[`/src/pages/${menu.component}/index.vue`]
        ? [{
            path: menu.path,
            component: menu.component,
          }]
        : [],
    )

    expect(missing).toEqual([])
  })

  it('builds non-empty routes from mock menus (status filter keeps them alive)', () => {
    expect(buildRoutes(getDevMockUserMenus()).length).toBeGreaterThan(0)
  })
})
