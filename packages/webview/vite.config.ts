import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Icons from 'unplugin-icons/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    Icons({
      compiler: 'vue3',
      customCollections: {
        app: FileSystemIconLoader(fileURLToPath(new URL('./src/assets/svg-icons', import.meta.url))),
      },
    }),
    vue(),
  ],
  base: './',
  build: {
    emptyOutDir: true,
    outDir: path.resolve(__dirname, '../../dist/webview'),
  },
  esbuild: {
    //drop: ['console', 'debugger'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vue: 'vue/dist/vue.esm-bundler.js', // 使用包含运行时编译的包
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
        additionalData: `
          @use "@/assets/style/mixin/screen.scss" as *;
          @use "@/assets/style/mixin/font.scss" as *;
          @use "@/assets/style/mixin/common.scss" as *;
        `,
      },
    },
  },
  server: {
    port: 23333,
  },
});
