import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService admin login', () => {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const admin = {
    id: 1,
    username: 'admin',
    password: passwordHash,
    email: 'admin@example.com',
    phone: '13800138000',
    avatar: null,
    status: 1,
    role: 'admin',
    permissions: ['*:*:*'],
  };

  function createService(user = admin) {
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(user),
      },
      loginLog: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    } as any;

    const jwtService = {
      sign: jest.fn().mockReturnValue('signed-token'),
    } as any;

    const redis = {
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    } as any;

    return { service: new AuthService(prisma, jwtService, redis), prisma, jwtService };
  }

  it('logs in with username and signs an admin token', async () => {
    const { service, prisma, jwtService } = createService();

    const result = await service.login('admin', 'admin123', '127.0.0.1', 'Chrome');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ username: 'admin' }, { phone: 'admin' }] },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      username: 'admin',
      role: 'admin',
      subjectType: 'admin',
    });
    expect(result.token).toBe('signed-token');
    expect(result.user.phone).toBe('13800138000');
  });

  it('logs in with phone', async () => {
    const { service, prisma } = createService();

    await service.login('13800138000', 'admin123');

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { OR: [{ username: '13800138000' }, { phone: '13800138000' }] },
    });
  });

  it('rejects wrong passwords without leaking account existence', async () => {
    const { service } = createService();

    await expect(service.login('admin', 'wrong-password')).rejects.toThrow(UnauthorizedException);
  });
});
