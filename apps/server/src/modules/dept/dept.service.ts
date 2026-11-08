import type { DeptUpsertInput } from './dept.inputs'
import { Injectable, NotFoundException } from '@nestjs/common'
import { buildTree } from '../../common/utils/build-tree'
import { PrismaService } from '../../prisma/prisma.service'
import { fallbackDepts } from './constants/dept-fallback-data'

/**
 * 部门业务独立持有自己的读写与回退数据，不再通过 AdminService 聚合转发。
 * 数据库异常时的内存回退是旧行为，本次保留；不要把它误当成生产数据持久化。
 */
@Injectable()
export class DeptService {
  private memoryDepts = [...fallbackDepts]

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取部门树（按 sort、id 升序）
   * @returns 树形部门数组
   */
  async getDepts() {
    try {
      const list = await (this.prisma as any).dept.findMany({ orderBy: [{ sort: 'asc' }, { id: 'asc' }] })
      return buildTree(list)
    }
    catch {
      return buildTree(this.memoryDepts)
    }
  }

  /**
   * 创建部门
   * @param dto 部门创建 DTO
   * @returns 新建部门对象
   */
  async createDept(dto: DeptUpsertInput) {
    try {
      return await (this.prisma as any).dept.create({ data: this.normalizeDept(dto) })
    }
    catch {
      const dept = {
        id: Date.now(),
        ...this.normalizeDept(dto),
      }
      this.memoryDepts.push(dept)
      return dept
    }
  }

  /**
   * 更新部门
   * @param id 部门 ID
   * @param dto 更新 DTO
   * @returns 更新后的部门对象
   * @throws NotFoundException 内存模式下部门不存在时
   */
  async updateDept(id: number, dto: DeptUpsertInput) {
    try {
      return await (this.prisma as any).dept.update({
        where: { id },
        data: this.normalizeDept(dto),
      })
    }
    catch {
      const index = this.memoryDepts.findIndex(item => item.id === id)
      if (index < 0)
        throw new NotFoundException('部门不存在')
      this.memoryDepts[index] = {
        ...this.memoryDepts[index],
        ...this.normalizeDept(dto),
      }
      return this.memoryDepts[index]
    }
  }

  /**
   * 删除部门
   * @param id 部门 ID
   * @returns 固定成功响应
   * @remarks 内存回退只过滤目标及直接子节点；不额外增加递归级联行为。
   */
  async deleteDept(id: number) {
    try {
      await (this.prisma as any).dept.delete({ where: { id } })
    }
    catch {
      this.memoryDepts = this.memoryDepts.filter(item => item.id !== id && item.parentId !== id)
    }
    return { success: true }
  }

  /**
   * 归一化部门 DTO → Prisma create/update data
   * @param dto 原始 DTO
   * @returns 补全默认值后的数据对象
   * @remarks 缺省值：parentId=null、name=未命名部门、sort=0、status=ACTIVE
   */
  private normalizeDept(dto: DeptUpsertInput) {
    return {
      parentId: dto.parentId ?? null,
      name: dto.name || '未命名部门',
      leader: dto.leader || null,
      phone: dto.phone || null,
      email: dto.email || null,
      sort: dto.sort ?? 0,
      status: dto.status ?? 'ACTIVE',
    }
  }
}
