import type { CustomerPasswordLoginDto, CustomerSmsLoginDto, ResetPasswordDto } from './dto/customer-auth.dto'
import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcryptjs'
import { PrismaService } from '../../prisma/prisma.service'
import { SmsService } from '../sms/sms.service'
import { CustomerTokenService } from './customer-token.service'

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
    private readonly tokens: CustomerTokenService,
    private readonly config: ConfigService,
  ) {}

  async resetPassword(dto: ResetPasswordDto) {
    const user = await (this.prisma as any).customerUser.findUnique({ where: { phone: dto.phone } })
    if (!user) {
      throw new NotFoundException('手机号未注册')
    }

    await this.sms.verifyCode(dto.phone, 'reset_password', dto.smsCode)

    await (this.prisma as any).customerUser.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(dto.password, 10) },
    })

    // 旧密码已失效，撤销该用户的全部刷新令牌，强制其他设备重新登录
    await this.tokens.revokeAll(user.id)

    return { success: true }
  }

  async loginByPassword(dto: CustomerPasswordLoginDto) {
    const user = await (this.prisma as any).customerUser.findUnique({ where: { phone: dto.phone } })
    if (!user) {
      throw new UnauthorizedException('手机号或密码错误')
    }
    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用')
    }
    if (!user.password) {
      throw new BadRequestException('请使用验证码登录或先设置密码')
    }

    const valid = await bcrypt.compare(dto.password, user.password)
    if (!valid) {
      throw new UnauthorizedException('手机号或密码错误')
    }

    const updated = await (this.prisma as any).customerUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.tokens.sign(updated)
  }

  async loginBySms(dto: CustomerSmsLoginDto) {
    let user = await (this.prisma as any).customerUser.findUnique({ where: { phone: dto.phone } })
    if (!user) {
      const autoRegister = this.config.get<boolean>('auth.customerLoginAutoRegister', true)
      if (!autoRegister) {
        throw new UnauthorizedException('手机号未注册，请先注册')
      }
      await this.sms.verifyCode(dto.phone, 'login', dto.smsCode)
      user = await (this.prisma as any).customerUser.create({
        data: {
          phone: dto.phone,
          status: 1,
        },
      })
    }
    else {
      await this.sms.verifyCode(dto.phone, 'login', dto.smsCode)
    }

    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用')
    }

    const updated = await (this.prisma as any).customerUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.tokens.sign(updated)
  }

  async getProfile(userId: number) {
    const user = await (this.prisma as any).customerUser.findUnique({ where: { id: userId } })
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户不存在或已禁用')
    }
    return this.tokens.toProfile(user)
  }

  async refresh(refreshToken: string) {
    const { userId } = await this.tokens.consumeRefreshToken(refreshToken)
    const user = await (this.prisma as any).customerUser.findUnique({ where: { id: userId } })
    if (!user || user.status !== 1) {
      throw new UnauthorizedException('用户不存在或已禁用')
    }

    return this.tokens.sign(user)
  }

  async logout(refreshToken?: string) {
    await this.tokens.revoke(refreshToken)
    return { success: true }
  }
}
