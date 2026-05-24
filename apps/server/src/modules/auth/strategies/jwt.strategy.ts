import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'elm-admin-secret',
    })
  }

  async validate(payload: any) {
    if (payload.subjectType !== 'admin' && payload.subjectType !== 'customer') {
      throw new UnauthorizedException('登录状态无效，请重新登录')
    }

    return {
      id: payload.sub,
      username: payload.username,
      phone: payload.phone,
      role: payload.role,
      subjectType: payload.subjectType,
    }
  }
}
