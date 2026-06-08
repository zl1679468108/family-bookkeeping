import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('请先登录');
    }

    if (user.role !== 'admin') {
      throw new ForbiddenException('权限不足，需要管理员身份');
    }

    if (user.status !== 'active') {
      throw new ForbiddenException('账户已被停用');
    }

    return true;
  }
}
