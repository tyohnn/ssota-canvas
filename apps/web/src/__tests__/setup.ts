import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// MSW 서버 설정
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// 환경 변수 Mock
vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
    rls: vi.fn(),
  })),
}));

// Next.js 라우터 Mock
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
  redirect: vi.fn(),
}));

// Next.js 쿠키 Mock
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));
