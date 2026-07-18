/**
 * WechatService — 微信小程序内容安全检测
 *
 * 功能：
 *   1. 获取并缓存微信小程序全局接口调用凭据 access_token（有效期 2h，提前 5 分钟刷新）
 *   2. 提供 checkText(text) 方法调用 msg_sec_check 检测文本是否含违规内容
 *
 * 使用场景：
 *   - 交易备注、账本描述、分类名称、模板名称、用户昵称等 UGC 文本入库前检测
 *
 * 配置（环境变量）：
 *   - WECHAT_APPID：小程序 AppID
 *   - WECHAT_SECRET：小程序 AppSecret
 *   - WECHAT_MSG_SEC_CHECK_ENABLED：是否启用内容检测（'true' 启用，其他禁用，默认禁用）
 *     未配置或配置非 'true' 时，checkText 直接返回 safe=true，便于本地开发
 *
 * 安全策略：
 *   - 检测失败（网络错误/微信侧异常）时记录日志但放行，避免影响主流程
 *   - 检测到违规内容时抛 BadRequestException，由全局异常过滤器统一处理
 */
import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface WechatAccessTokenResponse {
  access_token?: string;
  expires_in?: number;
  errcode?: number;
  errmsg?: string;
}

interface MsgSecCheckResponse {
  errcode: number;
  errmsg?: string;
  detail?: Array<{
    strategy: string;
    errcode: number;
    suggest: string;
    label: number;
    keyword?: string;
  }>;
  trace_id?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number; // 毫秒时间戳
}

@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);
  private readonly appid: string;
  private readonly secret: string;
  private readonly enabled: boolean;
  private cachedToken: CachedToken | null = null;

  constructor(private configService: ConfigService) {
    this.appid = this.configService.get('WECHAT_APPID', '');
    this.secret = this.configService.get('WECHAT_SECRET', '');
    this.enabled =
      this.configService.get('WECHAT_MSG_SEC_CHECK_ENABLED', 'false') ===
      'true';

    if (this.enabled && (!this.appid || !this.secret)) {
      this.logger.warn(
        'WECHAT_MSG_SEC_CHECK_ENABLED=true 但 WECHAT_APPID/WECHAT_SECRET 未配置，内容检测将被跳过',
      );
    }
  }

  /**
   * 检测文本是否合规
   * @param text 待检测文本（建议 ≤ 2500 字符，微信接口限制）
   * @param scene 场景值，1=资料 2=评论 3=论坛 4=社交日志 5=广告，默认 1
   * @param openid 用户 openid（v2 必填，但 v1 不需要）；当前用 v1 接口
   * @throws BadRequestException 文本含违规内容时
   */
  async checkText(
    text: string,
    scene: 1 | 2 | 3 | 4 | 5 = 1,
    openid?: string,
  ): Promise<void> {
    if (!this.enabled || !this.appid || !this.secret) {
      return;
    }
    if (!text || !text.trim()) {
      return;
    }

    // 微信接口单次检测文本上限 2500 字符（GBK 编码字节数），这里按字符数粗略截断
    const truncated = text.length > 2500 ? text.slice(0, 2500) : text;

    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        this.logger.warn('获取微信 access_token 失败，跳过内容检测');
        return;
      }

      // 使用 v1 接口 msg_sec_check（无需 openid，简单场景够用）
      const url = `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`;
      const body = {
        content: truncated,
        scene,
        version: 2,
        ...(openid ? { openid } : {}),
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        this.logger.warn(
          `msg_sec_check HTTP ${res.status}，跳过内容检测`,
        );
        return;
      }

      const data = (await res.json()) as MsgSecCheckResponse;

      // errcode=0 表示调用成功；需进一步检查 detail 中各项 suggest
      if (data.errcode !== 0) {
        this.logger.warn(
          `msg_sec_check 调用失败 errcode=${data.errcode} errmsg=${data.errmsg}`,
        );
        return;
      }

      // 检查每一项检测结果，suggest=pass 通过 / review 需人工 / block 拦截
      if (data.detail && data.detail.length > 0) {
        const blocked = data.detail.find((d) => d.suggest === 'block');
        if (blocked) {
          throw new BadRequestException(
            '内容含违规信息，请修改后再提交',
          );
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      // 其他异常记录日志但放行，避免影响主流程
      this.logger.warn(
        `内容检测异常：${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  /**
   * 获取微信 access_token（带缓存，提前 5 分钟刷新）
   */
  private async getAccessToken(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 5 * 60 * 1000) {
      return this.cachedToken.token;
    }

    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appid}&secret=${this.secret}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.warn(`获取 access_token HTTP ${res.status}`);
        return null;
      }
      const data = (await res.json()) as WechatAccessTokenResponse;
      if (!data.access_token || data.errcode) {
        this.logger.warn(
          `获取 access_token 失败 errcode=${data.errcode} errmsg=${data.errmsg}`,
        );
        return null;
      }
      const expiresInSec = data.expires_in || 7200;
      this.cachedToken = {
        token: data.access_token,
        expiresAt: now + expiresInSec * 1000,
      };
      this.logger.log(`微信 access_token 刷新成功，有效期 ${expiresInSec}s`);
      return this.cachedToken.token;
    } catch (e) {
      this.logger.warn(
        `获取 access_token 异常：${e instanceof Error ? e.message : String(e)}`,
      );
      return null;
    }
  }
}
