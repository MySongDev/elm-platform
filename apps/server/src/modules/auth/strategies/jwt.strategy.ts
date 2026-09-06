import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { z } from 'zod'

const adminJwtPayloadSchema = z.object({
  sub: z.number().int().positive(),
  username: z.string().min(1),
  role: z.string().min(1),
  subjectType: z.literal('admin'),
})

const customerJwtPayloadSchema = z.object({
  sub: z.number().int().positive(),
  phone: z.string().min(1),
  subjectType: z.literal('customer'),
})

const jwtPayloadSchema = z.discriminatedUnion('subjectType', [
  adminJwtPayloadSchema,
  customerJwtPayloadSchema,
])

type JwtPayload = z.infer<typeof jwtPayloadSchema>

type AuthenticatedUser
  = | {
    id: number
    username: string
    role: string
    subjectType: 'admin'
  }
  | {
    id: number
    phone: string
    subjectType: 'customer'
  }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'elm-admin-secret',
    })
  }

  async validate(payload: unknown): Promise<AuthenticatedUser> {
    const result = jwtPayloadSchema.safeParse(payload)

    if (!result.success) {
      throw new UnauthorizedException('登录状态无效，请重新登录')
    }

    return this.toAuthenticatedUser(result.data)
  }

  private toAuthenticatedUser(payload: JwtPayload): AuthenticatedUser {
    if (payload.subjectType === 'admin') {
      return {
        id: payload.sub,
        username: payload.username,
        role: payload.role,
        subjectType: payload.subjectType,
      }
    }
    // 用户端返回的数据对象
    return {
      id: payload.sub,
      phone: payload.phone,
      subjectType: payload.subjectType,
    }
  }
}
