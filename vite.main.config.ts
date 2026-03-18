import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    conditions: ['node'],
  },
  build: {
    rollupOptions: {
      external: ['electron', 'better-sqlite3', 'keytar'],
    },
  },
});
