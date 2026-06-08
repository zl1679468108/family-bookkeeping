import { defineConfig } from "@tarojs/cli";

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
  outputRoot: "dist",
  plugins: [],
  defineConstants: {
    "process.env.TARO_APP_API_BASE_URL": JSON.stringify(
      process.env.TARO_APP_API_BASE_URL || "http://localhost:3000/api",
    ),
  },
  copy: {
    patterns: [],
    options: {},
  },
  framework: "react",
  compiler: {
    type: "webpack5",
    prebundle: { enable: false },
  },
  cache: { enable: false },
  mini: {
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
