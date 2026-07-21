import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const mailEnabled = this.configService.get('MAIL_ENABLED', 'false');
    this.isEnabled = mailEnabled === 'true';

    if (this.isEnabled) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('MAIL_HOST'),
        port: parseInt(this.configService.get('MAIL_PORT', '587')),
        secure: this.configService.get('MAIL_SECURE', 'false') === 'true',
        auth: {
          user: this.configService.get('MAIL_USER'),
          pass: this.configService.get('MAIL_PASSWORD'),
        },
      });
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    // 子路径部署：重置链接必须包含前端子路径（默认 bookkeeping），否则邮件链接打不开页面
    const frontendSubpath = this.configService.get('FRONTEND_SUBPATH', 'bookkeeping').replace(/^\/+|\/+$/g, '');
    const resetUrl = `${this.configService.get('FRONTEND_URL', 'http://localhost:3001')}/${frontendSubpath}/#/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"家庭记账" <${this.configService.get('MAIL_FROM')}>`,
      to: email,
      subject: '密码重置请求',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">家庭记账</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">密码重置</p>
          </div>
          <div style="background: white; border: 1px solid #E5E7EB; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; margin: 0 0 20px;">您好，</p>
            <p style="color: #374151; margin: 0 0 24px; line-height: 1.6;">
              我们收到了您的密码重置请求。请点击下方链接重置您的密码：
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <a 
                href="${resetUrl}" 
                style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;"
              >
                重置密码
              </a>
            </div>
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
              如果您没有请求重置密码，请忽略此邮件。此链接将在1小时内过期。
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`密码重置邮件已发送到: ${email}`);
    } catch (error) {
      this.logger.error('发送邮件失败:', error);
      throw new Error('发送邮件失败，请稍后重试');
    }
  }

  async sendVerificationCodeEmail(email: string, code: string): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    const mailOptions = {
      from: `"家庭记账" <${this.configService.get('MAIL_FROM')}>`,
      to: email,
      subject: '密码重置验证码',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">家庭记账</h1>
            <p style="margin: 8px 0 0; opacity: 0.9;">密码重置验证</p>
          </div>
          <div style="background: white; border: 1px solid #E5E7EB; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
            <p style="color: #374151; margin: 0 0 24px; line-height: 1.6;">
              您好，以下是您的密码重置验证码：
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #F3F4F6; padding: 16px 32px; border-radius: 8px;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1F2937;">${code}</span>
              </div>
            </div>
            <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 16px;">
              验证码有效期为5分钟，请尽快使用。
            </p>
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
              如果您没有请求重置密码，请忽略此邮件。
            </p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`验证码邮件已发送到: ${email}`);
    } catch (error) {
      this.logger.error('发送邮件失败:', error);
      throw new Error('发送邮件失败，请稍后重试');
    }
  }
}
