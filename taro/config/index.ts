import { defineConfig } from "@tarojs/cli";

// 开发构建(dev:*)输出到 dist/，生产构建(build:*)输出到 dist-prod/
// 两个目录物理隔离，避免 watch 模式与一次性构建争抢同一目录导致产物残缺
const isProd = process.env.NODE_ENV === "production";
const OUTPUT_ROOT = isProd ? "dist-prod" : "dist";

export default defineConfig({
  projectName: "family-bookkeeping",
  date: "2026-6-6",
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2 / 1,
  },
  sourceRoot: "src",
  outputRoot: OUTPUT_ROOT,
  plugins: [],
  defineConstants: {
    // 编译期注入 API 基址：开发连本地后端，生产连公网域名。
    // 注意：小程序运行时无 Node process，此值必须在编译期由 defineConstants 替换为字面量字符串。
    "process.env.TARO_APP_API_BASE_URL": JSON.stringify(
      isProd ? "https://zlspace.site/api" : "http://127.0.0.1:3000/api",
    ),
  },
  copy: {
    patterns: [
      { from: "src/assets/icons/", to: `${OUTPUT_ROOT}/assets/icons/` },
      { from: "src/assets/icons-png/", to: `${OUTPUT_ROOT}/assets/icons-png/` },
      { from: "src/sitemap.json", to: `${OUTPUT_ROOT}/sitemap.json` },
    ],
    options: {},
  },
  framework: "react",
  compiler: {
    type: "webpack5",
    prebundle: { enable: false },
  },
  cache: { enable: false },
  mini: {
    miniCssExtractPluginOption: { ignoreOrder: true },
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
  h5: {
    publicPath: "/",
    staticDirectory: "static",
    postcss: {
      autoprefixer: { enable: true, config: {} },
      cssModules: { enable: false },
    },
  },
});
