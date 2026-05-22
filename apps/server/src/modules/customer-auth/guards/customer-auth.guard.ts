import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Injectable()
export class CustomerAuthGuard extends JwtAuthGuard {
  canActivate(context: ExecutionContext) {
    const canActivate = super.canActivate(context);
    if (canActivate instanceof Promise) {
      return canActivate.then(() => this.ensureCustomer(context));
    }
    return canActivate && this.ensureCustomer(context);
  }

  private ensureCustomer(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if (request.user?.subjectType !== 'customer') {
      throw new ForbiddenException('无权访问用户接口');
    }
    return true;
  }
}
