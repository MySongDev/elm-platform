/**
 * 头像孤儿文件静默清理。
 *
 * 上传头像时删除上一个无引用的旧文件（已在 customer-avatar.service.ts 处理）；
 * 本文件新增定时全量对账清扫任务，回收历史遗留孤儿，Redis 租约保证多实例同一
 * 时刻仅一个在扫；宽限期保护在途/被浏览器引用的文件不被误删。
 *
 * @domain modules/customer-avatar
 */
import { randomUUID } from 'node:crypto'
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../prisma/prisma.service'
import { RedisService } from '../../redis/redis.service'
import { UPLOAD_DIR } from '../storage/local-disk.storage'

// 定时任务"同一时刻只有一个实例执行"的租约
const CLEANUP_LOCK_KEY = 'avatar:cleanup:lock'
const CLEANUP_LOCK_TTL_SECONDS = 5 * 60

@Injectable()
export class CustomerAvatarCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CustomerAvatarCleanupService.name)
  private timer: NodeJS.Timeout | null = null

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  onModuleInit() {
    const intervalMs = Number(this.configService.get('AVATAR_CLEANUP_INTERVAL_MINUTES', 10)) * 60 * 1000
    // 先异步跑一次（处理历史遗留孤儿），之后固定间隔；不阻塞应用启动
    this.runScheduled()
    this.timer = setInterval(() => this.runScheduled(), intervalMs)
    // 避免定时器持有句柄导致 jest / 进程无法自然退出
    this.timer.unref?.()
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private runScheduled() {
    void this.runCleanup().catch(err => this.logger.warn('头像清理任务执行失败', err))
  }

  /**
   * 静默清扫：扫描 uploads/ 下所有"库里任何用户都不再引用"且落盘超过宽限期的文件，直接删除。
   *
   * WHY 扫描整个 uploads 根目录而不只是 avatars/：
   *   历史上多次替换头像留下的第 1~N-2 个文件没有任何数据库引用，
   *   只盯"上一个"文件永远收不到它们，按"全目录 vs 现存 avatar 集合"对账才是真正的全量回收。
   *
   * WHY 48h 宽限期（AVATAR_CLEANUP_GRACE_HOURS）：
   *   刚上传的头像可能正被浏览器 <img> 引用或还在途（上传完成、前端还没刷新），
   *   立即删会让部分用户看到 404；宽限期之后才算"已无引用"。
   *
   * 多实例安全：Redis SET NX 租约保证同一时刻只有一个实例在扫。
   */
  async runCleanup() {
    const acquirer = await this.acquireLock()
    if (!acquirer)
      return

    try {
      const deleted = await this.sweepOrphanFiles()
      if (deleted > 0)
        this.logger.log(`头像清理完成，删除孤儿文件 ${deleted} 个`)
    }
    finally {
      await this.releaseLock(acquirer)
    }
  }

  /** 遍历 uploads/ 下所有普通文件，返回删除数量 */
  private async sweepOrphanFiles(): Promise<number> {
    const graceHours = Number(this.configService.get('AVATAR_CLEANUP_GRACE_HOURS', 48))
    const cutoff = Date.now() - graceHours * 60 * 60 * 1000

    // 库里当前所有用户引用的头像路径，命中即保留
    const inUse = new Set<string>(
      await this.prisma.customerUser.findMany({
        where: { avatar: { not: null } },
        select: { avatar: true },
      }).then(rows => rows.map(r => r.avatar!).filter(Boolean)),
    )

    const files = await this.walk(UPLOAD_DIR)
    let deleted = 0

    for (const absolutePath of files) {
      const relativePath = path.relative(UPLOAD_DIR, absolutePath).split(path.sep).join('/')

      // 已被任何用户引用 → 保留
      if (inUse.has(relativePath))
        continue

      // 宽限期内 → 可能是刚上传还没写库，保留
      const info = await stat(absolutePath)
      if (info.mtimeMs >= cutoff)
        continue

      // 删前再查一次：扫描集合是"任务开始时刻"的快照，期间可能有用户上传了新头像，
      // 该路径若已被新写入库，上面 inUse.has 的快照就漏了它，此处必须重查
      const nowInUse = await this.prisma.customerUser.findFirst({
        where: { avatar: relativePath },
        select: { id: true },
      })
      if (nowInUse)
        continue

      await unlink(absolutePath)
      deleted += 1
    }

    return deleted
  }

  /** 递归收集目录下所有普通文件的绝对路径 */
  private async walk(dir: string): Promise<string[]> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    }
    catch {
      // uploads 目录尚未创建过任何文件时不存在，本轮直接跳过
      return []
    }

    const files: string[] = []
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...await this.walk(full))
      }
      else {
        files.push(full)
      }
    }
    return files
  }

  /** 抢租约成功返回 owner 值，否则返回 null（有别的实例在跑） */
  private async acquireLock(): Promise<string | null> {
    const owner = randomUUID()
    const ok = await this.redis.setIfAbsent(CLEANUP_LOCK_KEY, owner, CLEANUP_LOCK_TTL_SECONDS)
    return ok ? owner : null
  }

  /** 释放租约；仅当锁仍属于自己时才删，避免误删别的实例后来抢到的租约 */
  private async releaseLock(owner: string) {
    const current = await this.redis.get(CLEANUP_LOCK_KEY)
    if (current === owner) {
      await this.redis.del(CLEANUP_LOCK_KEY)
    }
  }
}
