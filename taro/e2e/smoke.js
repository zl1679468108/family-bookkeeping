/**
 * e2e/smoke.js
 * 静记 Taro 小程序 — 微信开发者工具端到端冒烟测试
 *
 * 覆盖范围：
 *   阶段1  启动 & 首屏渲染（验证 DevTools 连接 + 编译 + 小程序启动）
 *   阶段2  全页面可达性 & 渲染健康度扫描（23 个页面逐个打开、截图、断言根节点渲染）
 *   阶段3  TabBar 交互切换（4 个 tab 互相切换，验证自定义 tabBar 可用性）
 *
 * 运行： node e2e/smoke.js   （需先确保 taro/dist 已构建 & DevTools 已登录）
 * 依赖：  miniprogram-automator
 */
const path = require('path')
const fs = require('fs')
const { launch, waitFor, sleep, PROJECT_PATH } = require('./lib/runner')

// 前置检查
const distApp = path.resolve(PROJECT_PATH, 'dist', 'app.js')
if (!fs.existsSync(distApp)) {
  console.error(
    '[错误] 未找到 dist/app.js。请先运行 `npm run build:weapp` 或一次性 `taro build --type weapp` 生成构建产物。',
  )
  process.exit(3)
}
const { CLI_PATH } = require('./lib/runner')
if (!fs.existsSync(CLI_PATH)) {
  console.error('[错误] 未找到微信开发者工具 CLI：' + CLI_PATH)
  process.exit(3)
}

// ---- 页面清单（与 src/app.config.ts 同步） ----
const TAB_PAGES = [
  'pages/Home/index',
  'pages/Transactions/index',
  'pages/Workbench/index',
  'pages/Profile/index',
]
const SUB_PAGES = [
  'pages/AddTransaction/index',
  'pages/EditProfile/index',
  'pages/User/Login/index',
  'pages/User/Register/index',
  'pages/User/ForgotPassword/index',
  'pages/Budgets/index',
  'pages/Categories/index',
  'pages/CategoryEdit/index',
  'pages/Books/index',
  'pages/BookMembers/index',
  'pages/BookSettings/index',
  'pages/TemplateManager/index',
  'pages/TemplateEdit/index',
  'pages/About/index',
  'pages/Onboarding/index',
  'pages/MapPicker/index',
  'pages/Terms/index',
  'pages/Privacy/index',
]

const SHOT_DIR = path.resolve(__dirname, 'screenshots')
fs.mkdirSync(SHOT_DIR, { recursive: true })

const results = []
const MARK = { pass: '✅', fail: '❌', warn: '⚠️', redirect: '↪️' }
function record(key, status, info) {
  results.push({ key, status, info: info || '' })
  console.log(`  ${MARK[status] || '·'} ${key}${info ? '  — ' + info : ''}`)
}
const pageSafe = (p) => p.replace(/\//g, '_')

async function openPage(miniProgram, pagePath) {
  const url = '/' + pagePath
  if (TAB_PAGES.includes(pagePath)) {
    await miniProgram.switchTab({ url })
  } else {
    await miniProgram.redirectTo({ url })
  }
  await sleep(1000) // 等待渲染稳定
}

async function main() {
  const miniProgram = await launch()
  try {
    // ---------- 阶段1：启动 & 首屏渲染 ----------
    console.log('\n=== 阶段1：启动 & 首屏渲染 ===')
    let page = await miniProgram.currentPage()
    await waitFor(page, ['view', '.page-layout', 'page'], 20000)
    await page.screenshot({ path: path.join(SHOT_DIR, '00-initial.png') })
    record('启动/首屏渲染', 'pass', '当前页: ' + page.path)

    // ---------- 阶段2：全页面可达性 & 渲染扫描 ----------
    console.log('\n=== 阶段2：全页面可达性 & 渲染扫描（共 ' + (TAB_PAGES.length + SUB_PAGES.length) + ' 页）===')
    for (const p of [...TAB_PAGES, ...SUB_PAGES]) {
      try {
        await openPage(miniProgram, p)
        const cur = await miniProgram.currentPage()
        const curPath = cur.path.replace(/\?.*$/, '')
        let hasView = false
        try {
          const el = await cur.$('view')
          hasView = !!el
        } catch (e) {
          /* ignore */
        }
        try {
          await cur.screenshot({ path: path.join(SHOT_DIR, pageSafe(p) + '.png') })
        } catch (e) {
          /* ignore screenshot failure */
        }
        if (curPath !== p) {
          record(p, 'redirect', '落在 ' + cur.path + '（可能未登录被守卫重定向）')
        } else if (!hasView) {
          record(p, 'warn', '页面已打开但无 view 节点（可能白屏/渲染异常）')
        } else {
          record(p, 'pass', '')
        }
      } catch (e) {
        record(p, 'fail', String(e.message || e).split('\n')[0])
      }
    }

    // ---------- 阶段3：TabBar 交互切换 ----------
    console.log('\n=== 阶段3：TabBar 交互切换 ===')
    for (const tab of TAB_PAGES) {
      try {
        await miniProgram.switchTab({ url: '/' + tab })
        await sleep(800)
        const cur = await miniProgram.currentPage()
        if (cur.path.replace(/\?.*$/, '') === tab) {
          record('tab→' + tab, 'pass', '')
        } else {
          record('tab→' + tab, 'fail', '当前 ' + cur.path)
        }
      } catch (e) {
        record('tab→' + tab, 'fail', String(e.message || e).split('\n')[0])
      }
    }
  } finally {
    await miniProgram.close()
  }

  // ---------- 报告 ----------
  console.log('\n================ 测试报告 ================')
  const summary = { pass: 0, fail: 0, warn: 0, redirect: 0 }
  results.forEach((r) => (summary[r.status] = (summary[r.status] || 0) + 1))
  console.log(
    `通过 ${summary.pass} | 失败 ${summary.fail} | 警告 ${summary.warn} | 重定向 ${summary.redirect}`,
  )
  console.log('截图目录: ' + SHOT_DIR)
  console.log('=========================================')

  process.exit(results.some((r) => r.status === 'fail') ? 1 : 0)
}

main().catch((e) => {
  console.error('\n[FATAL] 测试运行异常:', e)
  process.exit(2)
})
