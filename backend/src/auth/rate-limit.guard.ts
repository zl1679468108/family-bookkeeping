import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, OnModuleDestroy } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleDestroy {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly windowMs: number = 60_000,
    private readonly max: number = 10,
  ) {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.resetAt <= now) this.store.delete(key);
    }
  }

  private getKey(context: ExecutionContext): string {
    const req = context.switchToHttp().getRequest();
    // 使用 x-forwarded-for 获取真实 IP（B-H9: 反向代理后 req.ip 可能是 127.0.0.1）
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : req.ip;
    return `${ip}:${req.route?.path || req.url}`;
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

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
