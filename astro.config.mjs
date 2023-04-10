import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import solidJs from "@astrojs/solid-js";
import thalerPlugin from 'unplugin-thaler';
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [tailwind(), solidJs()],
  vite: {
    plugins: [thalerPlugin.vite({
      origin: 'http://localhost:3000',
      mode: 'server'
    })]
  }
});