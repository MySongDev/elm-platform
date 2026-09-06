import { UnauthorizedException } from '@nestjs/common'
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy'

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

  it('accepts standard JWT claims without exposing them on the authenticated user', async () => {
    await expect(strategy.validate({
      sub: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    })).resolves.toEqual({
      id: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    })
  })

  it.each([
    {
      name: '非对象载荷',
      payload: null,
    },
    {
      name: '缺少用户类型',
      payload: {
        sub: 1,
        username: 'legacy-admin',
      },
    },
    {
      name: '不支持的用户类型',
      payload: {
        sub: 1,
        subjectType: 'partner',
      },
    },
    {
      name: '管理员缺少角色',
      payload: {
        sub: 1,
        username: 'admin',
        subjectType: 'admin',
      },
    },
    {
      name: '顾客缺少手机号',
      payload: {
        sub: 7,
        subjectType: 'customer',
      },
    },
    {
      name: '用户 ID 类型错误',
      payload: {
        sub: '1',
        username: 'admin',
        role: 'admin',
        subjectType: 'admin',
      },
    },
  ])('rejects $name', async ({ payload }) => {
    await expect(strategy.validate(payload))
      .rejects
      .toThrow(UnauthorizedException)
  })
})
