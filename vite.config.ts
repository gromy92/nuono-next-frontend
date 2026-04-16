import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 9620,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:18080',
        changeOrigin: true
      },
      '/actuator': {
        target: 'http://127.0.0.1:18080',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 9720
  }
});
