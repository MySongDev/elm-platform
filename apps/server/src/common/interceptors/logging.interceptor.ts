import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    this.logger.log(`[${method}] ${url}`);
    if (Object.keys(body).length) this.logger.debug(`Body: ${JSON.stringify(body)}`);
    if (Object.keys(query).length) this.logger.debug(`Query: ${JSON.stringify(query)}`);
    if (Object.keys(params).length) this.logger.debug(`Params: ${JSON.stringify(params)}`);

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`[${method}] ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}
