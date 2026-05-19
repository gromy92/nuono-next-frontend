import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.NUONO_NEXT_API_TARGET ?? 'http://127.0.0.1:18080';
const publicBasePath = process.env.NUONO_NEXT_PUBLIC_BASE_PATH ?? '/';

export default defineConfig({
  base: publicBasePath,
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) {
            return undefined;
          }
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('/node_modules/antd/')) {
            return 'antd-vendor';
          }
          if (id.includes('/node_modules/dayjs/')) {
            return 'date-vendor';
          }
          return undefined;
        }
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 9620,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      },
      '/actuator': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 9720
  }
});
