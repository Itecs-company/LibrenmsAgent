import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use '.' as envDir to avoid reliance on process.cwd() which causes type errors
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Expose the API key from build environment to the client
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 8888,
      host: true
    }
  };
});