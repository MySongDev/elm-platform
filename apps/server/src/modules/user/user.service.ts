import type { PrismaService } from '../../prisma/prisma.service'
import type { RedisService } from '../../redis/redis.service'
import type { CreateUserDto, UpdateUserDto } from './dto/create-user.dto'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import * as bcrypt from 'bcryptjs'

interface UserWithoutPassword {
  id: number
  username: string
  email: string | null
  phone: string | null
  avatar: string | null
  status: number
  role: string
  permissions: string[]
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto): Promise<UserWithoutPassword> {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    })

    if (existingUser) {
      throw new ConflictException('用户名已存在')
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      select: this.userSelect(),
    })

    // 清除列表缓存
    await this.redis.del('users:all')

    return user
  }

  /**
   * 获取所有用户
   */
  async findAll(): Promise<UserWithoutPassword[]> {
    // 尝试从缓存获取
    const cachedUsers = await this.redis.getObject<UserWithoutPassword[]>('users:all')
    if (cachedUsers) {
      return cachedUsers
    }

    // 从数据库获取
    const users = await this.prisma.user.findMany({
      select: this.userSelect(),
    })

    // 存入缓存，5 分钟过期
    await this.redis.set('users:all', users, 300)

    return users
  }

  /**
   * 根据 ID 获取用户
   */
  async findOne(id: number): Promise<UserWithoutPassword> {
    // 尝试从缓存获取
    const cachedUser = await this.redis.getObject<UserWithoutPassword>(`users:${id}`)
    if (cachedUser) {
      return cachedUser
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect(),
    })

    if (!user) {
      throw new NotFoundException('用户不存在')
    }

    // 存入缓存，10 分钟过期
    await this.redis.set(`users:${id}`, user, 600)

    return user
  }

  /**
   * 更新用户
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserWithoutPassword> {
    await this.findOne(id)

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
        select: this.userSelect(),
      })

      await this.redis.del(`users:${id}`)
      await this.redis.del('users:all')
      return user
    }
    catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('用户名、邮箱或手机号已存在')
      }
      throw error
    }
  }

  /**
   * 删除用户
   */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id)

    await this.prisma.user.delete({
      where: { id },
    })

    // 清除缓存
    await this.redis.del(`users:${id}`)
    await this.redis.del('users:all')
  }

  private userSelect() {
    return {
      id: true,
      username: true,
      email: true,
      phone: true,
      avatar: true,
      status: true,
      role: true,
      permissions: true,
      createdAt: true,
      updatedAt: true,
    } as const
  }
}
