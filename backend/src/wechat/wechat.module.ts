import { Global, Module } from '@nestjs/common';
import { WechatService } from './wechat.service';

/**
 * WechatModule — 微信小程序集成（内容安全检测等）
 *
 * 标记为 @Global()，让所有模块无需重复 import 即可注入 WechatService。
 */
@Global()
@Module({
  providers: [WechatService],
  exports: [WechatService],
})
export class WechatModule {}
