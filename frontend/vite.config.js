import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/content': 'http://localhost:3000',
      '/submit': 'http://localhost:3000',
      '/options': 'http://localhost:3000',
      '/login': 'http://localhost:3000',
      '/submissions': 'http://localhost:3000',
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
})
