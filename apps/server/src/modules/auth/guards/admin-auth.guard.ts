import type { ExecutionContext } from '@nestjs/common'
import { ForbiddenException, Injectable } from '@nestjs/common'
import { JwtAuthGuard } from './jwt-auth.guard'

@Injectable()
export class AdminAuthGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const canActivate = super.canActivate(context)
    if (canActivate instanceof Promise) {
      return canActivate.then(() => this.ensureAdmin(context))
    }
    return canActivate && this.ensureAdmin(context)
  }

  private ensureAdmin(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    if (request.user?.subjectType !== 'admin') {
      throw new ForbiddenException('无权访问后台接口')
    }
    return true
  }
}
