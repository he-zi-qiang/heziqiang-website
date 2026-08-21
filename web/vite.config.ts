import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 开发时把 /api 与 /uploads 反代到后端，生产由 nginx（或后端自己）做同样的事，
// 这样前端代码里永远只写相对路径，不需要区分环境。
const apiTarget = `http://127.0.0.1:${process.env.SERVER_PORT || 3001}`

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // 端口可由 PORT 覆盖，方便和别的本地服务错开
    port: Number(process.env.PORT) || 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/uploads': { target: apiTarget, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
