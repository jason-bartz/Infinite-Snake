import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'assets',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['lit', '@vercel/analytics'],
          game: [
            './js/core/game-original.js'
          ],
        },
      },
    },

    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },

    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 3000,
    open: true,
    host: true,
    cors: true,
  },

  preview: {
    port: 4173,
    open: true,
  },

  optimizeDeps: {
    include: ['lit', '@vercel/analytics'],
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './js/core'),
      '@entities': resolve(__dirname, './js/core/entities'),
      '@utils': resolve(__dirname, './js'),
      '@assets': resolve(__dirname, './assets'),
      '@config': resolve(__dirname, './config'),
    },
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
      ],
    },
  },
});
