// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';

import sitemap from '@astrojs/sitemap';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
const site = process.env.SITE_URL || env.SITE_URL;

// https://astro.build/config
export default defineConfig({
  ...(site ? { site } : {}),

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});