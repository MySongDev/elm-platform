import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import {
  Injectable,
} from '@nestjs/common'
import { map } from 'rxjs/operators'

export interface Response<T> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface RawResponse<T> {
  __rawResponse: true
  payload: T
}

export function rawResponse<T>(payload: T): RawResponse<T> {
  return {
    __rawResponse: true,
    payload,
  }
}

@Injectable()
export class TransformInterceptor<T>
implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const maybeRaw = data as RawResponse<T>

        if (maybeRaw?.__rawResponse) {
          return maybeRaw.payload as Response<T>
        }

        return {
          code: 200,
          message: 'success',
          data,
          timestamp: new Date().toISOString(),
        }
      }),
    )
  }
}
