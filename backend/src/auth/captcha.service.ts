import { Injectable, BadRequestException } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';

interface CaptchaData {
  text: string;
  svg: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class CaptchaService {
  // 内存存储验证码，key 为 captchaId
  private captchaStore = new Map<string, CaptchaData>();

  // 验证码有效期：5 分钟
  private readonly CAPTCHA_TTL = 5 * 60 * 1000;

  // 最大尝试次数
  private readonly MAX_ATTEMPTS = 5;

  // 定时清理过期验证码
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 每 10 分钟清理一次过期数据
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 10 * 60 * 1000);
  }

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

    const captchaId = this.generateId();
    const expiresAt = Date.now() + this.CAPTCHA_TTL;

    this.captchaStore.set(captchaId, {
      text: captcha.text.toLowerCase(),
      svg: captcha.data,
      expiresAt,
      attempts: 0,
    });

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

    const captcha = this.captchaStore.get(captchaId);

    if (!captcha) {
      throw new BadRequestException('验证码已过期，请刷新');
    }

    // 检查是否过期
    if (Date.now() > captcha.expiresAt) {
      this.captchaStore.delete(captchaId);
      throw new BadRequestException('验证码已过期，请刷新');
    }

    // 检查尝试次数
    captcha.attempts++;
    if (captcha.attempts > this.MAX_ATTEMPTS) {
      this.captchaStore.delete(captchaId);
      throw new BadRequestException('验证码尝试次数过多，请刷新');
    }

    // 校验验证码（不区分大小写）
    const isValid = captcha.text === code.toLowerCase().trim();

    if (isValid) {
      // 验证成功，删除验证码（一次性使用）
      this.captchaStore.delete(captchaId);
    } else {
      // 更新尝试次数
      this.captchaStore.set(captchaId, captcha);
    }

    return isValid;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 清理过期验证码
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, captcha] of this.captchaStore.entries()) {
      if (now > captcha.expiresAt) {
        this.captchaStore.delete(id);
      }
    }
  }
}
