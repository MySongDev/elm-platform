import type { MenuUpsertInput } from './menu.inputs'
import { Injectable, NotFoundException } from '@nestjs/common'
import { buildTree } from '../../common/utils/build-tree'
import { PrismaService } from '../../prisma/prisma.service'
import { fallbackMenus } from './constants/menu-fallback-data'

/**
 * 菜单业务独立持有自己的读写与回退数据，不再通过 AdminService 聚合转发。
 * 数据库异常时的内存回退是旧行为，本次保留；不要把它误当成生产数据持久化。
 */
@Injectable()
export class MenuService {
  private memoryMenus = [...fallbackMenus]

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取菜单树（按 sort、id 升序）
   * @returns 树形菜单数组，每节点含 children 递归结构
   */
  async getMenus() {
    try {
      const list = await (this.prisma as any).menu.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
      return buildTree(list)
    }
    catch {
      return buildTree(this.memoryMenus)
    }
  }

  /**
   * 创建菜单
   * @param dto 菜单创建 DTO
   * @returns 新建菜单对象
   */
  async createMenu(dto: MenuUpsertInput) {
    try {
      return await (this.prisma as any).menu.create({ data: this.normalizeMenu(dto) })
    }
    catch {
      const menu = {
        id: Date.now(),
        ...this.normalizeMenu(dto),
      }
      this.memoryMenus.push(menu)
      return menu
    }
  }

  /**
   * 更新菜单
   * @param id 菜单 ID
   * @param dto 更新 DTO
   * @returns 更新后的菜单对象
   * @throws NotFoundException 内存模式下菜单不存在时
   */
  async updateMenu(id: number, dto: MenuUpsertInput) {
    try {
      return await (this.prisma as any).menu.update({
        where: { id },
        data: this.normalizeMenu(dto),
      })
    }
    catch {
      const index = this.memoryMenus.findIndex(item => item.id === id)
      if (index < 0)
        throw new NotFoundException('菜单不存在')
      this.memoryMenus[index] = {
        ...this.memoryMenus[index],
        ...this.normalizeMenu(dto),
      }
      return this.memoryMenus[index]
    }
  }

  /**
   * 删除菜单
   * @param id 菜单 ID
   * @returns 固定成功响应
   * @remarks 内存回退只过滤目标及直接子节点；保留旧行为，不承诺递归删除所有后代。
   */
  async deleteMenu(id: number) {
    try {
      await (this.prisma as any).menu.delete({ where: { id } })
    }
    catch {
      this.memoryMenus = this.memoryMenus.filter(item => item.id !== id && item.parentId !== id)
    }
    return { success: true }
  }

  /**
   * 归一化菜单 DTO → Prisma create/update data
   * @param dto 原始 DTO
   * @returns 补全默认值后的数据对象
   * @remarks 缺省值：parentId=null、title=未命名菜单、type=menu、sort=0、status=ACTIVE
   */
  private normalizeMenu(dto: MenuUpsertInput) {
    return {
      parentId: dto.parentId ?? null,
      title: dto.title || '未命名菜单',
      path: dto.path || '',
      name: dto.name || null,
      icon: dto.icon || null,
      permission: dto.permission || null,
      component: dto.component || null,
      type: dto.type || 'menu',
      sort: dto.sort ?? 0,
      status: dto.status ?? 'ACTIVE',
    }
  }
}
