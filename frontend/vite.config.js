import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your backend server address
        changeOrigin: true,
        // Optional: if your backend API paths don't start with /api,
        // you might need to rewrite the path:
        // rewrite: (path) => path.replace(/^\/api/, '') 
      },
      '/pic': {
        target: 'http://localhost:8000', // Proxy static image files
        changeOrigin: true,
      }
    }
  }
})
