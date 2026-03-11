import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  define: {
    __SW_CACHE_VERSION__: JSON.stringify(
      `synthreel-${process.env.npm_package_version || 'dev'}-${Date.now()}`,
    ),
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      all: false,
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
})
