import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private store = new Map<string, RateLimitEntry>();

  constructor(
    private readonly windowMs: number = 60_000,
    private readonly max: number = 10,
  ) {
    setInterval(() => this.cleanup(), 60_000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt <= now) this.store.delete(key);
    }
  }

  private getKey(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    return `${req.ip}:${req.route?.path || req.url}`;
  }

  canActivate(context: ExecutionContext): boolean {
    const key = this.getKey(context);
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      throw new HttpException(
        { message: `请求过于频繁，请 ${retryAfter} 秒后重试` },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    entry.count++;
    return true;
  }
}
