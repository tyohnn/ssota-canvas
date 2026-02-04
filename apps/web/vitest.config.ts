import { resolve } from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

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
        POSTGRES_URL: process.env.POSTGRES_URL || '',
        POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || '',
        YOUTUBE_API_KEY:
          env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY || '',
        ZENROWS_API_KEY:
          env.ZENROWS_API_KEY || process.env.ZENROWS_API_KEY || '',
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/src/__tests__/e2e/**', // E2E 테스트 제외
        '**/*.e2e.spec.ts', // Playwright E2E 테스트 제외
        // DB/통합 테스트: POSTGRES_URL 없을 때 기본 run에서 제외 (test:integration으로 별도 실행)
        ...(process.env.POSTGRES_URL
          ? []
          : [
              '**/drizzle-*.repository*.test.ts',
              '**/drizzle-*.integration.test.ts',
              '**/workspace-management.actions.test.ts',
              '**/block.actions.test.ts',
              '**/context-assembly.service.test.ts',
              '**/page-hierarchy.service.test.ts',
              '**/workspace-crud.service.test.ts',
              '**/workspace-invitation.service.test.ts',
              '**/workspace-navigation.service.test.ts',
              '**/drizzle-organization.repository.test.ts',
              '**/drizzle-image-asset.repository.test.ts',
              '**/page.repository.test.ts',
              '**/workspace.repository.test.ts',
              '**/workspace-invitation.repository.test.ts',
              '**/workspace-member.repository.test.ts',
              '**/user-management.actions.integration.test.ts',
            ]),
      ],
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
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
      testTimeout: 60000, // 네트워크 요청을 위한 긴 타임아웃
      hookTimeout: 10000,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  };
});
