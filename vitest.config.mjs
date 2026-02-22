import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.js'],
    include: ['tests/unit/**/*.test.{js,jsx}']
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd())
    }
  }
});
