import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,

        // Remove the /api prefix before forwarding requests to the backend.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

