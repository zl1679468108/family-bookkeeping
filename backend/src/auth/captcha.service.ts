import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import * as svgCaptcha from 'svg-captcha';

@Injectable()
export class CaptchaService {
  // 验证码有效期：5 分钟
  private readonly CAPTCHA_TTL = 5 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 生成验证码
   * @returns captchaId 和 SVG 字符串
   */
  generate(): { captchaId: string; svg: string } {
    const captcha = svgCaptcha.create({
      size: 4, // 验证码字符数
      noise: 1, // 干扰线数量（减少干扰，更清晰）
      color: true, // 彩色字符
      background: '#ffffff', // 白色背景
      width: 160,
      height: 56,
      fontSize: 56,
      ignoreChars: '0o1ilI', // 去除易混淆字符
      charPreset: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', // 大写+数字，更易辨识
    });

    const payload = {
      text: captcha.text.toLowerCase(),
      exp: Date.now() + this.CAPTCHA_TTL,
      nonce: randomBytes(8).toString('hex'),
    };
    const captchaId = this.signPayload(payload);

    return { captchaId, svg: captcha.data };
  }

  /**
   * 校验验证码
   * @param captchaId 验证码 ID
   * @param code 用户输入的验证码
   * @returns true 校验通过
   */
  validate(captchaId: string, code: string): boolean {
    if (!captchaId || !code) {
      throw new BadRequestException('请输入验证码');
    }

    const payload = this.verifyPayload(captchaId);
    if (!payload) {
      throw new BadRequestException('验证码已过期，请刷新');
    }

    if (Date.now() > payload.exp) {
      throw new BadRequestException('验证码已过期，请刷新');
    }

    return payload.text === code.toLowerCase().trim();
  }

  private getSecret(): string {
    return (
      this.configService.get<string>('CAPTCHA_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'family-bookkeeping-captcha-secret'
    );
  }

  private signPayload(payload: { text: string; exp: number; nonce: string }): string {
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = createHmac('sha256', this.getSecret()).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  private verifyPayload(captchaId: string): { text: string; exp: number; nonce: string } | null {
    const [body, sig] = captchaId.split('.');
    if (!body || !sig) {
      return null;
    }

    const expectedSig = createHmac('sha256', this.getSecret()).update(body).digest('base64url');
    if (sig !== expectedSig) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
        text: string;
        exp: number;
        nonce: string;
      };
      if (!payload?.text || typeof payload.exp !== 'number') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}
