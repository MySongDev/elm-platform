import type { RoleUpsertInput } from './role.inputs'
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { fallbackRoles } from './constants/role-fallback-data'

/**
 * 角色业务独立持有自己的读写与回退数据，不再通过 AdminService 聚合转发。
 * 数据库异常时的内存回退是旧行为，本次保留；不要把它误当成生产数据持久化。
 */
@Injectable()
export class RoleService {
  private memoryRoles = [...fallbackRoles]

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取所有角色列表（按 ID 升序）
   * @returns 角色数组
   */
  async getRoles() {
    try {
      return await (this.prisma as any).role.findMany({ orderBy: { id: 'asc' } })
    }
    catch {
      return this.memoryRoles
    }
  }

  /**
   * 创建角色
   * @param dto 角色创建 DTO
   * @returns 新建角色对象
   * @remarks 缺省值：code=role_${timestamp}、status=ACTIVE、permissions=[]
   */
  async createRole(dto: RoleUpsertInput) {
    try {
      return await (this.prisma as any).role.create({
        data: {
          name: dto.name || '未命名角色',
          code: dto.code || `role_${Date.now()}`,
          status: dto.status ?? 'ACTIVE',
          remark: dto.remark,
          permissions: dto.permissions || [],
        },
      })
    }
    catch {
      const role = {
        id: Date.now(),
        name: dto.name || '未命名角色',
        code: dto.code || `role_${Date.now()}`,
        status: dto.status ?? 'ACTIVE',
        remark: dto.remark || null,
        permissions: dto.permissions || [],
        createdAt: new Date().toISOString(),
      }
      this.memoryRoles.push(role)
      return role
    }
  }

  /**
   * 更新角色
   * @param id 角色 ID
   * @param dto 更新 DTO（部分字段）
   * @returns 更新后的角色对象
   * @throws NotFoundException 内存模式下角色不存在时
   */
  async updateRole(id: number, dto: RoleUpsertInput) {
    try {
      return await (this.prisma as any).role.update({
        where: { id },
        data: dto,
      })
    }
    catch {
      const index = this.memoryRoles.findIndex(item => item.id === id)
      if (index < 0)
        throw new NotFoundException('角色不存在')
      this.memoryRoles[index] = {
        ...this.memoryRoles[index],
        ...dto,
      }
      return this.memoryRoles[index]
    }
  }

  /**
   * 删除角色
   * @param id 角色 ID
   * @returns 固定成功响应（幂等）
   * @remarks 数据库删除失败时仍按旧行为回退到内存过滤，不会把该异常继续抛出。
   */
  async deleteRole(id: number) {
    try {
      await (this.prisma as any).role.delete({ where: { id } })
    }
    catch {
      this.memoryRoles = this.memoryRoles.filter(item => item.id !== id)
    }
    return { success: true }
  }
}
