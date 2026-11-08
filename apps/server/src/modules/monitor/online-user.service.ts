import { Injectable } from '@nestjs/common'
import { RedisService } from '../../redis/redis.service'

/** 在线会话只依赖 Redis；保留原键空间和异常回退，不混入角色或日志数据。 */
@Injectable()
export class OnlineUserService {
  constructor(private readonly redis: RedisService) {}

  /**
   * 获取当前在线的后台管理用户列表
   * @returns 在线用户信息数组（含 userId、username、loginTime、ip 等）
   * @remarks 扫描 `admin:online:*` 模式键，批量获取再过滤空值
   */
  async getOnlineUsers() {
    try {
      const keys = await this.redis.keys('admin:online:*')
      if (!keys.length)
        return []
      const values = await Promise.all(keys.map(key => this.redis.getObject(key)))
      return values.filter(Boolean)
    }
    catch {
      // Redis 异常时静默返回空数组，避免影响主流程
      return []
    }
  }

  /**
   * 强制下线指定用户
   * @param id 用户 ID
   * @returns 固定成功响应（幂等操作）
   * @remarks 直接 DEL 对应 Redis 键，忽略不存在的情况
   */
  async forceLogout(id: number) {
    await this.redis.del(`admin:online:${id}`).catch(() => undefined)
    return { success: true }
  }
}
