import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const RESET_CODE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class TokenService {
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  getSessionExpiresAt(): string {
    return new Date(Date.now() + TOKEN_TTL_MS).toISOString();
  }

  getResetTokenExpiresAt(): string {
    return new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  }

  getResetCodeExpiresAt(): string {
    return new Date(Date.now() + RESET_CODE_TTL_MS).toISOString();
  }
}
