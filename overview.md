# 静记小程序 · 体验版构建与域名绑定

> 时间：2026-07-20
> 范围：Taro 小程序体验版（dist-prod）+ 微信后台服务器域名绑定

## 一、本次做了什么

1. **构建体验版产物**：`taro/dist-prod/`（微信小程序生产构建，API 基址已固化为 `https://zlspace.site/api`）。
2. **修正陈旧的 CloudBase 域名**：体验版原本指向已停用的 CloudBase 域名 `family-bookkeeping-api-prod-...sh.run.tcloudbase.com`，已全部改为生产域名 `zlspace.site`。涉及文件：
   - `taro/.env.production`（生产环境变量）
   - `taro/src/services/api.ts`（API 默认基址兜底）
   - `docs/微信小程序上架准备清单.md`（第 3 节服务器域名 + 生产接口地址）
   - `docs/TASKS.md`（D1 域名配置项 + 最终审核清单域名块）
3. **验证后端可达**：`https://zlspace.site` → 200，`https://zlspace.site/api` → 404（根路径无路由，说明 Nginx 已正确转发 `/api` 到后端，后端在线）。

## 二、域名绑定清单（核心，需在微信后台粘贴）

入口：**微信公众平台 mp.weixin.qq.com → 开发管理 → 开发设置 → 服务器域名**

```text
request 合法域名：
https://zlspace.site

uploadFile 合法域名：
https://zlspace.site

downloadFile 合法域名：
https://zlspace.site
https://fvggqgeiwewsjojargxe.supabase.co
```

说明：
- `zlspace.site` = 生产后端（自建 CVM + Nginx），所有接口请求 / 文件上传 / 文件下载都经此后端代理。
- `fvggqgeiwewsjojargxe.supabase.co` **必须保留**：交易小票图、自定义图标经后端 `getPublicUrl()` 返回 Supabase 公共直链，`<image>` 组件在真机显示这些图必须在 `downloadFile 合法域名` 中（request / uploadFile 不需要它）。
- 全部 HTTPS，不填 localhost。保存后约 5–10 分钟生效。

## 三、上传为体验版步骤

1. 打开**微信开发者工具** → 导入项目 → 目录选 `taro/dist-prod` → AppID 填 `wx93c16508eff05096` → 导入。
2. 工具编译预览，确认能正常拉起首页（此时若未配域名，需临时勾「详情 → 本地设置 → 不校验合法域名」自测）。
3. 点「上传」→ 版本号如 `1.0.1-experience`、备注写功能范围 → 上传为**开发版**。
4. 回到 mp.weixin.qq.com → 管理 → 版本管理 → 开发版本 → 选刚上传的 → **「设为体验版」**。
5. 体验版 → 添加体验者微信号 → 对方扫码即可体验。

## 四、验证结果

| 项 | 结果 |
|---|---|
| 产物 API 基址 | `dist-prod/common.js` 含 `https://zlspace.site/api` ✅ |
| 主包大小 | 1.2M（上限 2MB，无需分包）✅ |
| 旧 CloudBase 域名残留 | dist-prod 内已无残留 ✅ |
| 生产后端 `zlspace.site` | 200 ✅ |
| 生产接口 `zlspace.site/api` | 404（根路径无路由，代理正常）✅ |

## 五、注意 / 待清理

- 已清理全部 CloudBase 残留：删除 `cloudbaserc.json`（根 + backend 共 2 个）、`scripts/deploy-all.sh`、`config/mcporter.json`；并将 `README.md` / `backend/README.md` / `frontend/README.md` / `docs/PRD.md` / `AGENTS.md` / `docs/TASKS.md` / `backend/Dockerfile` 中的 CloudBase 描述统一改为 CVM（`zlspace.site`）。当前仓库仅保留 CVM 部署链路（`scripts/deploy-cvm.sh` 等）。
- 提交正式审核前，仍需在微信后台完成：服务类目（工具→效率）、隐私保护指引、客服人员添加、审核备注附测试账号。
