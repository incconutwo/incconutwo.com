import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://incconutwo.com',
  server: {
    host: true
  },
  adapter: vercel(),
  vite: {
    build: {
      chunkSizeWarningLimit: 1500,
    }
  }
});
