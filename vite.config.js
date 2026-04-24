import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return null

          if (id.includes('react-router')) return 'router'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
            return 'motion'
          }
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('react') || id.includes('scheduler')) return 'react'

          return 'vendor'
        },
      },
    },
  },
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  server: {
    host: true, // Listen on all addresses, required for Codespaces
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss', // Required for VS Code Remote Tunnels (devtunnels.ms)
      clientPort: 443
    }
  },
})
