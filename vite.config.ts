import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    open: false,
    host: true,
    proxy: {
      '/zoom-tiles': {
        target: 'https://tiles.zoom.earth',
        changeOrigin: true,
        headers: {
          Referer: 'https://zoom.earth/',
          Origin: 'https://zoom.earth',
        },
        rewrite: (path) => path.replace(/^\/zoom-tiles/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
            delete proxyRes.headers['content-security-policy'];
          });
        },
      },
    },
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 1600
  }
});
