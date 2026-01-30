'use client';

import { UIPreferencesProvider } from '@/contexts/ui-preferences-context';

/**
 * Public page Providers
 *
 * 공개(읽기 전용) 페이지에서 캔버스 등이 사용하는 Provider
 * - UIPreferencesProvider: CanvasReactFlowWrapper 등에서 useUIPreferences 사용
 */
export function PublicProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UIPreferencesProvider>{children}</UIPreferencesProvider>;
}
