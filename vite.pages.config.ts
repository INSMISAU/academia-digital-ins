import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('./pages-src', import.meta.url)),
  base: '/academia-digital-ins/',
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  resolve: {alias: {'@': fileURLToPath(new URL('.', import.meta.url))}},
  define: {
    __ACADEMY_API_ORIGIN__: JSON.stringify('https://ins-academia-digital.perciliamuianga.chatgpt.site'),
  },
  css: {postcss: fileURLToPath(new URL('.', import.meta.url))},
  build: {
    outDir: fileURLToPath(new URL('./dist-pages', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
  },
});
