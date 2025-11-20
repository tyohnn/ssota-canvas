/**
 * Ssota Tab
 *
 * 시맨틱 검색 기반 이미지 탐색 (SSOTA Image Vault)
 *
 * Frontend Specification 참조: 04-frontend-specification.md
 */

'use client';

import { SsotaTabContext } from './core/ssota-tab.context';
import { useSsotaTab } from './core/use-ssota-tab';
import { SsotaImageGrid } from './components/image-grid';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Ssota Tab
 *
 * Provider + Image Grid
 */
export function SsotaTab() {
  const contextValue = useSsotaTab();

  return (
    <SsotaTabContext.Provider value={contextValue}>
      <Box className="flex-1 min-h-0 overflow-y-auto">
        <SsotaImageGrid />
      </Box>
    </SsotaTabContext.Provider>
  );
}
