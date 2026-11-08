import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    watch: {
      // 忽略 IDE（Visual Studio / IDEA）生成的索引目录，
      // 这些文件被编辑器独占占用，会让文件监听报 EBUSY 并导致 dev server 崩溃
      ignored: ['**/.vs/**', '**/.idea/**', '**/dist/**', '**/node_modules/**']
    }
  }
})
