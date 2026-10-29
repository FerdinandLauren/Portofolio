// @ts-check
import { defineConfig } from 'astro/config';

// Deploy target: GitHub Pages. If the site lives at
// https://<user>.github.io/portfolio/, build with BASE_PATH=/portfolio.
export default defineConfig({
  site: 'https://ferdinandlauren.github.io',
  base: process.env.BASE_PATH || '/',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
