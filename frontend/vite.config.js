import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/options': 'http://backend:3000',
      '/submit': 'http://backend:3000',
      '/content': 'http://backend:3000',
      '/login': 'http://backend:3000',
      '/submissions': 'http://backend:3000',
    }
  },
  preview: {
    port: 4173,
    host: true
  }
})
