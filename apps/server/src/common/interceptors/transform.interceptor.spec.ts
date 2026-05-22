import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { rawResponse, TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  const context = {} as ExecutionContext;

  function createHandler<T>(value: T): CallHandler<T> {
    return {
      handle: () => of(value),
    };
  }

  it('wraps ordinary controller data in the standard response envelope', async () => {
    const interceptor = new TransformInterceptor();

    const response = await firstValueFrom(
      interceptor.intercept(context, createHandler({ id: 1, name: 'Alice' })),
    );

    expect(response).toMatchObject({
      code: 200,
      message: 'success',
      data: { id: 1, name: 'Alice' },
    });
    expect(response.timestamp).toEqual(expect.any(String));
    expect(new Date(response.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('passes through raw responses without wrapping them again', async () => {
    const interceptor = new TransformInterceptor();
    const payload = {
      status: 1,
      success: 'legacy elm payload',
    };

    const response = await firstValueFrom(
      interceptor.intercept(context, createHandler(rawResponse(payload))),
    );

    expect(response).toBe(payload);
  });
});
