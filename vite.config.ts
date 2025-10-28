import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  return {
    plugins: [reactRouter(), tsconfigPaths()],
    base: mode === 'production' ? '/api/service/' : '',
  }
});
