import { UnauthorizedException } from '@nestjs/common'
import { JwtStrategy } from './jwt.strategy'

describe('jwtStrategy subject boundaries', () => {
  const strategy = new JwtStrategy()

  it('keeps explicit admin and customer subject types', async () => {
    await expect(strategy.validate({
      sub: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    })).resolves.toMatchObject({
      id: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    })

    await expect(strategy.validate({
      sub: 7,
      phone: '13800138000',
      subjectType: 'customer',
    })).resolves.toMatchObject({
      id: 7,
      phone: '13800138000',
      subjectType: 'customer',
    })
  })

  it('rejects tokens that do not declare a supported subject type', async () => {
    await expect(strategy.validate({ sub: 1, username: 'legacy-admin' }))
      .rejects
      .toThrow(UnauthorizedException)

    await expect(strategy.validate({ sub: 1, subjectType: 'partner' }))
      .rejects
      .toThrow(UnauthorizedException)
  })
})
