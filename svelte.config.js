import adapter from '@sveltejs/adapter-vercel'; // Cambia esta línea
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter() // Esto ya funcionará
  }
};

export default config;