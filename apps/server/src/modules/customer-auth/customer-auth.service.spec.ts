import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { CustomerAuthService } from './customer-auth.service';

describe('CustomerAuthService', () => {
  function createService(options: { autoRegister?: boolean; existingUser?: any } = {}) {
    let customer = options.existingUser ?? null;
    const prisma = {
      customerUser: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve(customer)),
        create: jest.fn().mockImplementation(({ data }) => {
          customer = { id: 1, status: 1, createdAt: new Date(), updatedAt: new Date(), ...data };
          return Promise.resolve(customer);
        }),
        update: jest.fn().mockImplementation(({ data }) => {
          customer = { ...customer, ...data };
          return Promise.resolve(customer);
        }),
      },
    } as any;

    const sms = {
      verifyCode: jest.fn().mockResolvedValue(undefined),
    } as any;

    const tokens = {
      sign: jest.fn((user) => ({ token: `customer-token-${user.id}`, user })),
    } as any;

    const config = new ConfigService({
      auth: { customerLoginAutoRegister: options.autoRegister ?? true },
    });

    return { service: new CustomerAuthService(prisma, sms, tokens, config), prisma, sms, tokens };
  }

  it('registers with sms code and optional password', async () => {
    const { service, prisma, sms } = createService();

    const result = await service.register({ phone: '13800138001', smsCode: '123456', password: 'password123' });

    expect(sms.verifyCode).toHaveBeenCalledWith('13800138001', 'register', '123456');
    expect(prisma.customerUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ phone: '13800138001', status: 1, password: expect.any(String) }),
    });
    expect(result.token).toBe('customer-token-1');
  });

  it('rejects duplicate registration without consuming sms code', async () => {
    const { service, sms } = createService({ existingUser: { id: 1, phone: '13800138001' } });

    await expect(service.register({ phone: '13800138001', smsCode: '123456' })).rejects.toThrow(ConflictException);
    expect(sms.verifyCode).not.toHaveBeenCalled();
  });

  it('logs in by password', async () => {
    const existingUser = {
      id: 1,
      phone: '13800138001',
      password: bcrypt.hashSync('password123', 10),
      status: 1,
    };
    const { service } = createService({ existingUser });

    const result = await service.loginByPassword({ phone: '13800138001', password: 'password123' });

    expect(result.token).toBe('customer-token-1');
  });

  it('rejects password login when password is not set', async () => {
    const { service } = createService({ existingUser: { id: 1, phone: '13800138001', password: null, status: 1 } });

    await expect(service.loginByPassword({ phone: '13800138001', password: 'password123' })).rejects.toThrow(BadRequestException);
  });

  it('auto registers on sms login when enabled', async () => {
    const { service } = createService({ autoRegister: true });

    const result = await service.loginBySms({ phone: '13800138001', smsCode: '123456' });

    expect(result.token).toBe('customer-token-1');
  });

  it('rejects sms login for unknown phone when auto register is disabled', async () => {
    const { service, sms } = createService({ autoRegister: false });

    await expect(service.loginBySms({ phone: '13800138001', smsCode: '123456' })).rejects.toThrow(UnauthorizedException);
    expect(sms.verifyCode).not.toHaveBeenCalled();
  });
});
