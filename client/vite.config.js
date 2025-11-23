import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    build: {
      outDir: '../public',
      emptyOutDir: false,
      rollupOptions: {
        output: {
          entryFileNames: `assets/react-[name].js`,
          chunkFileNames: `assets/react-[name].js`,
          assetFileNames: `assets/react-[name].[ext]`
        }
      }
    },

    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          ws: true,
        }
      }
    }
  }
})