/**
 * e2e/lib/runner.js
 * 微信开发者工具自动化测试基础封装（基于 miniprogram-automator）。
 *
 * 职责：
 *  - 自动定位本机 DevTools CLI 路径（macOS / Windows）
 *  - launch() 打开 taro 工程并连接模拟器（miniprogramRoot = dist/）
 *  - 提供 waitFor / sleep 等常用辅助
 *
 * 注意：miniprogram-automator 是 Node 端 SDK，必须在 node 环境运行，
 * 且要求微信开发者工具已登录微信账号、taro/dist 已构建。
 */
const path = require('path')
const automator = require('miniprogram-automator')

// 本机 DevTools CLI 路径（可用环境变量 WECHAT_CLI_PATH 覆盖）
const CLI_PATH =
  process.env.WECHAT_CLI_PATH ||
  '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

// taro 工程根目录（含 project.config.json 与 dist/）
const PROJECT_PATH = path.resolve(__dirname, '..', '..')

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 打开 DevTools 并连接小程序自动化端口。
 * @param {object} opts
 * @param {number} [opts.port=9420] 自动化端口
 * @param {number} [opts.timeout=180000] 编译/连接超时
 */
async function launch(opts = {}) {
  console.log('[runner] 正在启动 DevTools 自动化连接...')
  console.log('[runner] cliPath   :', CLI_PATH)
  console.log('[runner] project   :', PROJECT_PATH)

  const miniProgram = await automator.launch({
    cliPath: CLI_PATH,
    projectPath: PROJECT_PATH,
    port: opts.port || 9420,
    timeout: opts.timeout || 180000,
  })

  console.log('[runner] DevTools 已连接 ✅')
  return miniProgram
}

/**
 * 轮询等待页面渲染出指定选择器。
 * selector 可为字符串或字符串数组（依次尝试，命中任一即返回）。
 */
async function waitFor(page, selector, timeout = 15000) {
  const selectors = Array.isArray(selector) ? selector : [selector]
  const start = Date.now()
  let lastErr
  while (Date.now() - start < timeout) {
    for (const sel of selectors) {
      try {
        const el = await page.$(sel)
        if (el) return el
      } catch (e) {
        lastErr = e
      }
    }
    await sleep(300)
  }
  throw new Error(
    `waitFor 超时(${timeout}ms): "${selectors.join(' | ')}"${lastErr ? ' | ' + lastErr.message : ''}`,
  )
}

module.exports = { launch, waitFor, sleep, CLI_PATH, PROJECT_PATH, automator }
