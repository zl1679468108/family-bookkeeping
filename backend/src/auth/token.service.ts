import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

// 双 Token TTL：
// - Access Token（访问令牌，短）：每次请求携带，过期即用 Refresh 换发
// - Refresh Token（刷新令牌，长）：仅用于 /auth/refresh 换发新的 Access
// 可通过环境变量覆盖（毫秒）
const ACCESS_TTL_MS = Number(process.env.ACCESS_TOKEN_TTL_MS) || 2 * 60 * 60 * 1000; // 默认 2 小时
const REFRESH_TTL_MS = Number(process.env.REFRESH_TOKEN_TTL_MS) || 14 * 24 * 60 * 60 * 1000; // 默认 14 天
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_CODE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class TokenService {
  /** 生成访问令牌（短，请求携带） */
  generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /** 生成刷新令牌（长，仅用于换发） */
  generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  /** 兼容别名：旧调用方（如有）仍可生成访问令牌 */
  generateSessionToken(): string {
    return this.generateAccessToken();
  }

  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  getAccessExpiresAt(): string {
    return new Date(Date.now() + ACCESS_TTL_MS).toISOString();
  }

  getRefreshExpiresAt(): string {
    return new Date(Date.now() + REFRESH_TTL_MS).toISOString();
  }

  /** 兼容别名：旧调用方（如有）仍返回访问令牌过期时间 */
  getSessionExpiresAt(): string {
    return this.getAccessExpiresAt();
  }

  getResetTokenExpiresAt(): string {
    return new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  }

  getResetCodeExpiresAt(): string {
    return new Date(Date.now() + RESET_CODE_TTL_MS).toISOString();
  }
}
