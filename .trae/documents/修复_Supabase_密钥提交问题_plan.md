# 修复 Git push 被拦截问题（Supabase Secret Key / 邮件密码 等密钥被提交到历史）

## 1. 现状 / 根因分析

### 1.1 问题现象
`git push` 被 GitHub 拒绝，错误信息：

```
error: GH013: Repository rule violations found for refs/heads/main.
remote: --- GITHUB PUSH PROTECTION ---
remote: Push cannot contain secrets
remote: -- Supabase Secret Key ---
```

核心原因：**待推送的 commit 中包含了真实的 Supabase 密钥 / 邮件密码等敏感信息**，被 GitHub Secret Scanning 拦截。

### 1.2 已定位的具体问题

经检查仓库内涉及敏感信息的文件：

- backend/.env.development
  - `SUPABASE_SERVICE_ROLE_KEY=sb_secret_********`（真实密钥，此处已替换为占位符）
  - `JWT_SECRET=********`（真实密钥，此处已替换为占位符）
  - `MAIL_PASSWORD=********`（真实密码，此处已替换为占位符）
  - `MAIL_USER=********@qq.com`（真实邮箱，此处已替换为占位符）
- backend/.env.production 同样包含上述密钥
- frontend/.env.development
  - `REACT_APP_AMAP_KEY=********`（真实 key，此处已替换为占位符）
  - `REACT_APP_AMAP_SECRET=********`（真实 secret，此处已替换为占位符）
- frontend/.env.production 同上

这些文件被 Git 追踪并已出现在本地 commit 中（被 push 保护拦截的那批提交）。

### 1.3 .gitignore 缺陷

- 仓库根目录 `.gitignore` 仅排除 `.env` / `.env.local` / `.env.*.local`，**未排除 `.env.development` / `.env.production`**
- [backend/.gitignore](file:///Users/zhaolong/前端/family-bookkeeping/backend/.gitignore) 中第 19 行注释明确写着：`# 环境变量 (注意: .env.development / .env.production 为项目模板，这里不排除)`——这直接导致密钥文件被提交
- [frontend/.gitignore](file:///Users/zhaolong/前端/family-bookkeeping/frontend/.gitignore) / [taro/.gitignore](file:///Users/zhaolong/前端/family-bookkeeping/taro/.gitignore) 同样对 `.env.development` / `.env.production` 不加排除

因此，即使前端的 `REACT_APP_AMAP_*` 本身是可公开的"浏览器可读取"的键值，但 **Supabase Service Role Key / JWT Secret / 邮件密码** 属于服务端特权凭据，**绝对不应入库**。

---

## 2. 修复方案

### 2.1 整体思路

1. **从本地仓库历史中剔除**含密钥的 `.env.*` 文件（整个历史链路都清掉，否则 GitHub 仍会拦截）
2. **完善 `.gitignore`**，把 `.env.development` / `.env.production` 也加入忽略范围
3. **创建 `.env.example` 模板文件**（仅写占位符，不写真实值），方便新克隆者参考
4. **在 Supabase / QQ 邮箱 等平台上轮换已泄露的密钥**（这个必须在控制台手动操作，代码层面只负责"替换为新值"）
5. **本地用新的密钥填入** `.env.development` / `.env.production`（本地保留，不入库）
6. 重新 `git push`

### 2.2 需要编辑 / 新增的文件

#### 2.2.1 完善 .gitignore

- [/.gitignore](file:///Users/zhaolong/前端/family-bookkeeping/.gitignore)：增加 `.env.development` / `.env.production` 的忽略规则（根项目只需要根目录规则即可）
- 或仅修改根目录 `.gitignore` 即可覆盖所有子目录，通常更推荐。下方采用"根目录 `.gitignore` 统一管控 + 各子目录保留"策略。

#### 2.2.2 新建模板文件（不含真实值）

- `backend/.env.example`：提供 `SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY / JWT_SECRET / PORT / NODE_ENV / FRONTEND_URL / MAIL_*` 的占位模板
- `frontend/.env.example`：提供 `REACT_APP_API_BASE_URL / REACT_APP_AMAP_KEY / REACT_APP_AMAP_SECRET` 的占位模板
- `taro/.env.example`：提供 `TARO_APP_API_BASE_URL / TARO_APP_AMAP_KEY / TARO_APP_AMAP_SECRET` 的占位模板

> ⚠️ 注意：`frontend/.env.*` 中的 `REACT_APP_*` 在构建后会被打包进前端代码，**即便不在 Git 中也对浏览器可见**，因此 **不能放真正的 Secret**。Supabase Service Role Key 这类密钥 **只应存在于 backend/.env.* 中**，且不应提交至仓库。

#### 2.2.3 代码层安全加固（可选 / 长期项）

- `backend/src/mail/mail.service.ts` / `backend/src/supabase/supabase.service.ts`：若当前代码存在硬编码或依赖 `.env.*` 文件但缺省值时有敏感默认值 → 检查并改成"从环境变量读取，缺失则直接报错"
- `backend/src/auth/token.service.ts`：检查 JWT Secret 是否使用默认值

### 2.3 清理 Git 历史（命令行操作，非文件编辑）

使用 `git filter-repo` 或 `git-filter-branch` 把以下文件从 **所有** commit 中剔除：

- `backend/.env.development`
- `backend/.env.production`
- `frontend/.env.development`
- `frontend/.env.production`
- `taro/.env.development`
- `taro/.env.production`

推荐命令：

```bash
# 方案 A：使用 git-filter-repo（官方推荐，需先安装 pip install git-filter-repo）
git filter-repo --path backend/.env.development \
                --path backend/.env.production \
                --path frontend/.env.development \
                --path frontend/.env.production \
                --path taro/.env.development \
                --path taro/.env.production \
                --invert-paths

# 方案 B：使用 BFG（另一个常用工具，适合只"清某类文件"）
bfg --delete-files '.env.*'

# 清理后需要重新建立 refs 并 gc
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

> **重要**：清理历史会 **重写 commit hash**。如果仓库已经推到远端且别人有 fork / clone，需要告知协作者重新 clone 或强制 pull。
>
> GitHub Push Protection 的规则：只要待推送的历史中 **任一 commit** 里仍有密钥字符串，就会被拦。因此 **必须清干净历史**，或者使用"允许此密钥"的那个 URL 临时放行（**不推荐**，因为等于把密钥永远留在公开历史里）。

### 2.4 本地环境文件的处理

1. 将 `backend/.env.development` / `backend/.env.production` / `frontend/.env.development` / `frontend/.env.production` / `taro/.env.development` **复制备份**到本地（如 `~/Desktop`），避免在历史清理过程中丢失
2. 历史清理完成后，重新把它们粘贴回项目目录（它们会被新的 `.gitignore` 自动忽略）
3. **强烈建议**在 Supabase 控制台**轮换** Service Role Key / JWT Secret；在 QQ 邮箱**修改** SMTP 授权码；在高德地图控制台**生成新的** Web Key + Security Code，然后用新值替换

### 2.5 新增 .gitignore 规则示意（将合并到仓库）

在根目录 `.gitignore` 中"环境变量"段落追加：

```
# 环境变量（包含所有 .env.*，只保留 .env.example）
.env
.env.local
.env.*.local
.env.development
.env.production
# 保留模板文件（如果后面想提交 .env.example）
# !.env.example
```

并在 `backend/.gitignore` / `frontend/.gitignore` / `taro/.gitignore` 中把原本"模板不排除"的说明去掉或改成"全部排除，模板使用 `.env.example` 单独提供"。

---

## 3. 步骤清单（实施顺序）

1. **备份**本地 `.env.development` / `.env.production` 到本地桌面安全位置
2. 在仓库根目录执行 `git filter-repo`（或 BFG）**清除历史**中的这 5 个环境文件
3. 编辑各 `.gitignore`：统一忽略 `.env.development` / `.env.production`
4. 新增 `backend/.env.example` / `frontend/.env.example` / `taro/.env.example`（只放占位符）
5. 在 Supabase / QQ 邮箱 / 高德地图控制台，**生成新密钥**并作废旧密钥
6. 把备份的 env 文件粘贴回项目目录，并把其中的值替换为新生成的密钥（只保留在本地，不入库）
7. 验证 `git status` 中不再出现 `.env.*`
8. 尝试 `git push`，应当可成功推送

---

## 4. 风险与注意事项

| 风险 | 说明 | 处理方式 |
| --- | --- | --- |
| 历史 commit hash 变更 | 清历史会重写 commit id，可能与远端分支冲突 | 清理后需要 `git push --force`；告知协作者重新 clone |
| 误删模板文件 | `.env.example` 不应被过滤 | 忽略规则中用 `!.env.example` 保留模板 |
| 本地真实值丢失 | 历史清理可能删当前工作区文件 | **先备份**再清理，清理完再贴回 |
| GitHub 仍拦截 | 说明还有其他文件（或 cloudbaserc.json 等）含密钥 | 继续搜索仓库中其他密钥字符串 |
| 密钥已经泄露 | 历史中已有密钥被扫描工具捕获，即使从 git 清掉也不算彻底安全 | **必须在控制台轮换密钥**，不要只靠 git 清理 |

---

## 5. 我可以代你执行的部分

- ✅ 编辑各目录 `.gitignore`，阻止 `*.env.development` / `*.env.production` 再次入库
- ✅ 新建 `backend/.env.example` / `frontend/.env.example` / `taro/.env.example` 模板文件
- ✅ 使用 `git filter-repo` 在本地清除历史中的密钥文件
- ✅ 帮助校验 `git status`，确认敏感文件已不被追踪

需要**你手动**做的：
- 在 Supabase / QQ 邮箱 / 高德地图 控制台**轮换密钥**（安全层面的必要动作）
- 将新密钥填回本地 `.env.*` 文件
- 第一次推送需要 `git push --force`（历史重写后）
