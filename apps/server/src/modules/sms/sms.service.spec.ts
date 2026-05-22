import { BadRequestException, HttpException, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  const fixedNow = new Date('2026-05-23T10:00:00.000Z');

  function createService(config: Record<string, unknown> = {}, injectProvider = true) {
    jest.useFakeTimers().setSystemTime(fixedNow);

    const store = new Map<string, string>();
    const expirations = new Map<string, number>();
    const redis = {
      set: jest.fn(async (key: string, value: string | number | object, ttl?: number) => {
        const stored = typeof value === 'object' ? JSON.stringify(value) : String(value);
        store.set(key, stored);
        if (ttl !== undefined) {
          expirations.set(key, ttl);
        }
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      getObject: jest.fn(async <T>(key: string) => {
        const value = store.get(key);
        return value ? (JSON.parse(value) as T) : null;
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      exists: jest.fn(async (key: string) => store.has(key)),
      expire: jest.fn(async (key: string, seconds: number) => {
        expirations.set(key, seconds);
      }),
      incr: jest.fn(async (key: string) => {
        const next = Number(store.get(key) ?? '0') + 1;
        store.set(key, String(next));
        return next;
      }),
    };

    const configService = {
      get: jest.fn((key: string, defaultValue?: unknown) =>
        Object.prototype.hasOwnProperty.call(config, key) ? config[key] : defaultValue,
      ),
    };

    const provider = {
      sendCode: jest.fn().mockResolvedValue(undefined),
    };

    const service = new SmsService(redis as any, configService as any, injectProvider ? provider : undefined);

    return { service, redis, configService, provider, store, expirations };
  }

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('stores a mock code in Redis and returns it for debugging', async () => {
    const { service, redis, provider, store, expirations } = createService({
      'sms.mockCode': '123456',
      'sms.codeTtlSeconds': 300,
      'sms.cooldownSeconds': 60,
      'sms.dailyLimit': 10,
    });

    const result = await service.sendCode('13800138000', 'login');

    expect(result).toEqual({ success: true, debugCode: '123456' });
    expect(provider.sendCode).toHaveBeenCalledWith('13800138000', '123456', 'login');
    expect(redis.set).toHaveBeenCalledWith(
      'sms:code:login:13800138000',
      expect.objectContaining({ hash: expect.any(String), createdAt: fixedNow.toISOString() }),
      300,
    );
    expect(store.get('sms:code:login:13800138000')).toContain('"hash"');
    expect(expirations.get('sms:cooldown:13800138000')).toBe(60);
  });

  it('rejects invalid phone numbers', async () => {
    const { service, provider } = createService();

    await expect(service.sendCode('12345', 'login')).rejects.toThrow(BadRequestException);
    expect(provider.sendCode).not.toHaveBeenCalled();
  });

  it('rejects requests during cooldown', async () => {
    const { service, store, provider } = createService();
    store.set('sms:cooldown:13800138000', '1');

    await expectTooManyRequests(service.sendCode('13800138000', 'login'));
    expect(provider.sendCode).not.toHaveBeenCalled();
  });

  it('rejects unsupported non-mock providers when no real provider is injected', async () => {
    const { service } = createService({ 'sms.provider': 'aliyun' }, false);

    await expect(service.sendCode('13800138000', 'login')).rejects.toThrow(InternalServerErrorException);
  });

  it('consumes the verification code after a successful verify', async () => {
    const { service, redis } = createService({ 'sms.mockCode': '654321' });

    await service.sendCode('13800138000', 'login');
    await expect(service.verifyCode('13800138000', 'login', '654321')).resolves.toBe(true);

    expect(redis.del).toHaveBeenCalledWith('sms:code:login:13800138000');
    await expect(service.verifyCode('13800138000', 'login', '654321')).rejects.toThrow(BadRequestException);
  });
});

async function expectTooManyRequests(action: Promise<unknown>) {
  try {
    await action;
    throw new Error('Expected request to be rate limited');
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
  }
}
