import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const target = 'https://rmizhq2lxoty3l-4000.proxy.runpod.net';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', target);
            });
          },
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
  };
});
