import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { loadEnv } from 'vite';
import { config } from '@/config';

export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode || 'development', process.cwd(), '');

  return {
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/__tests__/setup.ts'],
      env: {
        NODE_ENV: 'development',
        POSTGRES_URL: config.database.url,
        POSTGRES_URL_NON_POOLING: config.database.nonPoolingUrl,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/src/__tests__/e2e/**', // E2E 테스트 제외
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/__tests__/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/dist/**',
          '**/build/**',
        ],
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
          },
        },
      },
      testTimeout: 10000,
      hookTimeout: 10000,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  };
});
