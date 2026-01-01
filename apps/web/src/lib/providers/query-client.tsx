'use client';

import { type ReactNode, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

/**
 * TanStack Query Client Provider
 *
 * Optimistic updates, caching, refetching을 위한 전역 설정
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSR에서는 클라이언트에서만 refetch
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5분
          },
          mutations: {
            // Mutation 실패 시 재시도 안 함 (optimistic update는 즉시 롤백)
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
