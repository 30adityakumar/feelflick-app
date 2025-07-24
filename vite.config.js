import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

if (typeof globalThis.crypto === "undefined") {
  globalThis.crypto = require("crypto");
  globalThis.crypto.getRandomValues = function (buf) {
    return require("crypto").randomFillSync(buf);
  };
}


export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':        path.resolve(__dirname, 'src'),
      '@assets':  path.resolve(__dirname, 'src/assets'),   // ← add THIS line
      '@shared':  path.resolve(__dirname, 'src/shared'),   // (optional, keeps things tidy)
    },
  },
});
