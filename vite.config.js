import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':       path.resolve(__dirname, 'src'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  server: {
    host: true, // Listen on all addresses, required for Codespaces
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443 // Use HTTPS port for Codespaces
    }
  },
})
