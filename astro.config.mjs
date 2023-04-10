import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import thalerPlugin from 'unplugin-thaler';


export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [tailwind(), solidJs()],
  vite: {
    plugins: [
      thalerPlugin.vite({
        origin: 'http://localhost:3000',
        mode: 'server',
      }),
    ],
  },
});
