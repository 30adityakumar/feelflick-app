import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    // Exclude legacy manual browser test scripts (not proper test suites)
    exclude: [
      '**/node_modules/**',
      'src/shared/services/recommendations.test.js',
      'src/shared/services/__tests__/services.test.js',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
    },
  },
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
