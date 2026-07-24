import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 本地开发: base=/  → http://127.0.0.1:3001/#/transactions
// 生产构建: base=/bookkeeping/ → https://zlspace.site/bookkeeping/#/transactions
// 可用 VITE_BASE 覆盖（例如预览子路径：VITE_BASE=/bookkeeping/ npm run start）
export default defineConfig(({ mode }) => {
  const base =
    process.env.VITE_BASE ?? (mode === 'production' ? '/bookkeeping/' : '/')

  return {
    plugins: [react()],
    base,
    server: {
      host: '127.0.0.1',
      port: 3001,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    css: {
      postcss: './postcss.config.js',
    },
  }
})
