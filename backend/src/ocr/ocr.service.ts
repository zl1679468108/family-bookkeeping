import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * OCR 识别结果
 */
export interface OcrResult {
  /** 原始识别文本（可直接用作备注） */
  rawText: string;
  /** 提取的金额（纯数字字符串，如 "2182.00"） */
  amount?: string;
  /** 提取的日期（YYYY-MM-DD 格式） */
  date?: string;
  /** 交易类型 */
  type?: 'expense' | 'income';
  /** 识别文本摘录（适合做备注，取最长有意义的行） */
  note?: string;
}

/**
 * 百度 OCR 通用文字识别（高精度版）响应
 */
interface BaiduOcrResponse {
  words_result: Array<{ words: string }>;
  words_result_num: number;
  log_id: number;
  error_code?: number;
  error_msg?: string;
}

/**
 * 百度 OAuth token 响应
 */
interface BaiduTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  // 百度 OCR 通用文字识别（标准版）- 50,000 次/天免费
  private readonly BAIDU_OCR_URL =
    'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic';
  // 百度 OAuth token 地址
  private readonly BAIDU_TOKEN_URL =
    'https://aip.baidubce.com/oauth/2.0/token';

  // 缓存的 access_token
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取百度 OCR access_token（带 TTL 缓存）
   */
  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    const apiKey = this.configService.get<string>('BAIDU_OCR_API_KEY');
    const secretKey = this.configService.get<string>('BAIDU_OCR_SECRET_KEY');

    if (!apiKey || !secretKey) {
      throw new InternalServerErrorException(
        'OCR 服务未配置（缺少百度 OCR API 密钥）',
      );
    }

    const url = new URL(this.BAIDU_TOKEN_URL);
    url.searchParams.set('grant_type', 'client_credentials');
    url.searchParams.set('client_id', apiKey);
    url.searchParams.set('client_secret', secretKey);

    try {
      const response = await fetch(url.toString(), { method: 'POST' });
      const data: BaiduTokenResponse = await response.json();

      if (data.error || !data.access_token) {
        this.logger.error(
          `获取百度 Access Token 失败: ${data.error} - ${data.error_description}`,
        );
        throw new InternalServerErrorException('OCR 服务认证失败');
      }

      // token 有效期 30 天，提前 5 分钟刷新
      this.cachedToken = data.access_token;
      this.tokenExpiresAt = Date.now() + (data.expires_in! - 300) * 1000;

      return data.access_token;
    } catch (err) {
      if (err instanceof InternalServerErrorException) throw err;
      this.logger.error('获取百度 Access Token 失败', err);
      throw new InternalServerErrorException('OCR 服务连接失败');
    }
  }

  /**
   * 对图片进行 OCR 识别
   * @param imageBuffer 图片二进制数据
   * @returns 结构化识别结果
   */
  async recognize(imageBuffer: Buffer): Promise<OcrResult> {
    const accessToken = await this.getAccessToken();
    const imageBase64 = imageBuffer.toString('base64');

    try {
      const fetchResponse = await fetch(
        `${this.BAIDU_OCR_URL}?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ image: imageBase64 }),
        },
      );

      // 处理 HTTP 403（token 失效）
      if (fetchResponse.status === 403) {
        this.cachedToken = null;
        throw new InternalServerErrorException('OCR 服务认证失败');
      }

      const data: BaiduOcrResponse = await fetchResponse.json();

      // 检查百度 API 错误码
      if (data.error_code) {
        // 17 = 每日请求量超限（免费额度用完）
        if (data.error_code === 17) {
          this.logger.warn(`百度 OCR 免费额度已用完: ${data.error_msg}`);
          throw new ServiceUnavailableException(
            'OCR 免费额度已用完，请明天再试',
          );
        }
        // token 失效，清缓存下次重试
        if (data.error_code === 100 || data.error_code === 110 || data.error_code === 111) {
          this.cachedToken = null;
        }
        this.logger.error(
          `百度 OCR 识别失败 [${data.error_code}]: ${data.error_msg}`,
        );
        throw new InternalServerErrorException('OCR 识别失败');
      }

      const allWords = (data.words_result || []).map((w) => w.words);
      const rawText = allWords.join('\n');

      if (!rawText.trim()) {
        return { rawText: '' };
      }

      return {
        rawText,
        ...this.extractAmount(rawText),
        ...this.extractDate(rawText),
        ...this.extractType(rawText),
        ...this.extractNote(rawText),
      };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.error('OCR 识别请求失败', err);
      throw new InternalServerErrorException('OCR 识别请求失败');
    }
  }

  /**
   * 从 OCR 文本中提取金额
   * 策略：
   * 1. 优先找带明确金额标签（支付金额、合计、实付等）的数字
   * 2. 其次找带 ¥ 符号的数字
   * 3. 最后找有 2 位小数的数字中最大的（金额通常有 2 位小数，日期/订单号没有）
   */
  private extractAmount(text: string): { amount?: string } {
    // 模式 A：带金额标签 + 可选 ¥/￥ + 数字
    const labelPattern =
      /(?:支付金额|实付金额|总金额|合计|实付|支付|应付|价格|票价|售价|金额|支出|收入|转账|消费|小计|总计)[：:]?\s*[¥￥]?\s*(-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?)/i;
    let match = text.match(labelPattern);
    if (match) {
      const raw = match[1].replace(/,/g, '');
      const val = parseFloat(raw);
      if (!isNaN(val) && val !== 0 && Math.abs(val) < 100000000) {
        return { amount: String(Math.abs(val)) };
      }
    }

    // 模式 B：带 ¥/￥ 符号的数字
    const currencyPattern = /[¥￥]\s*(-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?)/;
    match = text.match(currencyPattern);
    if (match) {
      const raw = match[1].replace(/,/g, '');
      const val = parseFloat(raw);
      if (!isNaN(val) && val !== 0 && Math.abs(val) < 100000000) {
        return { amount: String(Math.abs(val)) };
      }
    }

    // 模式 C：收集所有合理数字，按优先级排序
    const allNumbers = text.match(/-?\d{1,10}(?:,\d{3})*(?:\.\d{1,2})?/g) || [];
    const withDecimals: number[] = [];   // 有 2 位小数的（最可能是金额）
    const withoutDecimals: number[] = []; // 无小数点的（可能是日期、数量等）

    for (const n of allNumbers) {
      const raw = n.replace(/,/g, '');
      const val = parseFloat(raw);
      if (isNaN(val) || val === 0) continue;
      const absVal = Math.abs(val);
      if (absVal < 0.01 || absVal >= 100000000) continue;

      // 排除明显不是金额的数字
      // 1. 排除 8 位纯数字（日期格式如 20250407）
      if (/^\d{8}$/.test(raw)) continue;
      // 2. 排除 11 位纯数字（手机号）
      if (/^1\d{10}$/.test(raw)) continue;
      // 3. 排除 20+ 位数字（交易单号）
      if (/^\d{20,}$/.test(raw)) continue;

      if (raw.includes('.')) {
        withDecimals.push(absVal);
      } else {
        withoutDecimals.push(absVal);
      }
    }

    // 优先取有 2 位小数的候选中的最大值（金额通常比小计、单价大）
    if (withDecimals.length > 0) {
      withDecimals.sort((a, b) => b - a);
      return { amount: String(withDecimals[0]) };
    }

    // 兜底：取无小数点的最大合理数字（极少场景，如纯整数金额）
    if (withoutDecimals.length > 0) {
      withoutDecimals.sort((a, b) => b - a);
      // 只取 1-99999 范围的整数（避免把年份、数量当金额）
      const candidates = withoutDecimals.filter((v) => v >= 1 && v <= 99999);
      if (candidates.length > 0) {
        return { amount: String(candidates[0]) };
      }
    }

    return {};
  }

  /**
   * 从 OCR 文本中提取日期
   */
  private extractDate(text: string): { date?: string } {
    const patterns = [
      /(\d{4})年(\d{1,2})月(\d{1,2})日/,
      /(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/,
      /(\d{1,2})月(\d{1,2})日/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let y: string, m: string, d: string;
        if (match.length === 4) {
          y = match[1];
          m = match[2];
          d = match[3];
        } else {
          y = String(new Date().getFullYear());
          m = match[1];
          d = match[2];
        }
        const yi = parseInt(y, 10);
        const mi = parseInt(m, 10);
        const di = parseInt(d, 10);
        if (yi >= 2000 && yi <= 2099 && mi >= 1 && mi <= 12 && di >= 1 && di <= 31) {
          return { date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` };
        }
      }
    }
    return {};
  }

  /**
   * 从 OCR 文本中提取交易类型
   * 检测 + 和 - 前缀（微信/支付宝截图常见：-¥128.00、+¥500.00）
   * 策略：逐行扫描，找行首的 -/+ 后跟数字或货币符号
   * 默认返回 expense（个人记账 90%+ 是支出）
   */
  private extractType(text: string): { type?: 'expense' | 'income' } {
    const textLower = text.toLowerCase();

    // 逐行扫描：行首的 - 或 + 后跟数字/货币符号 → 金额符号
    for (const line of text.split('\n')) {
      const t = line.trim();

      // 支出：行首 - 后跟数字或 ¥/￥
      if (/^[-—－]\s*([¥￥]|\d)/.test(t)) {
        return { type: 'expense' };
      }

      // 收入：行首 + 后跟数字或 ¥/￥
      if (/^[+＋]\s*([¥￥]|\d)/.test(t)) {
        return { type: 'income' };
      }
    }

    // 跨行匹配：- 和 ¥/￥ 可能被拆到不同行，搜索全文
    if (/[-—－]\s*[¥￥]/.test(text)) return { type: 'expense' };
    if (/[+＋]\s*[¥￥]/.test(text)) return { type: 'income' };

    const incomeKeywords = /工资|收入|退款|奖金|利息|理财|报销|补贴|津贴|退货|返现|红包|转账收入|收款|到账|入账|转入/i;
    const expenseKeywords = /消费|支出|支付|购买|付款|实付|应付|商品|购物|餐饮|交通|加油|停车|超市|药店|医院|电影|门票|酒店|住宿|美团|饿了么|滴滴|淘宝|京东/i;

    if (incomeKeywords.test(textLower)) return { type: 'income' };
    if (expenseKeywords.test(textLower)) return { type: 'expense' };

    // 兜底：个人记账场景下，绝大多数是支出
    return { type: 'expense' };
  }

  /**
   * 从 OCR 文本中提取备注
   * 取最长的非金额、非日期行作为备注内容
   */
  private extractNote(text: string): { note?: string } {
    const lines = text.split('\n').filter((line) => {
      const l = line.trim();
      if (!l) return false;
      // 过滤纯金额行
      if (/^[¥￥]?\s*-?\d[\d,]*\.?\d{0,2}\s*$/.test(l)) return false;
      // 过滤纯日期行
      if (/^\d{4}[-/年]\d{1,2}[-/月]\d{1,2}/.test(l)) return false;
      // 过滤纯时间行
      if (/^\d{2}:\d{2}/.test(l)) return false;
      // 过滤超长数字（交易单号等）
      if (/^\d{16,}$/.test(l)) return false;
      // 过滤太短的行
      if (l.length <= 2) return false;
      return true;
    });

    // 取最长的行（通常是商户名或商品描述）
    const sorted = [...lines].sort((a, b) => b.trim().length - a.trim().length);
    if (sorted.length > 0) {
      const best = sorted[0].trim().slice(0, 50);
      return { note: best };
    }

    return {};
  }
}