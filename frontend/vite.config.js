import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/zhihu-api': {
        target: 'https://news-at.zhihu.com/api/4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zhihu-api/, '')
      },
    },
  },
})