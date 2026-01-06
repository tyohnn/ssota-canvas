import { useCallback } from 'react';

import type { DomainDependencies, EdgeLabelBusinessLogic } from './types';

/**
 * Production 비즈니스 로직
 * 실제 API를 호출하고 도메인 상태를 업데이트
 */
export function useEdgeLabelBusiness(
  domainDeps: DomainDependencies
): EdgeLabelBusinessLogic {
  const updateLabel = useCallback(
    async (edgeId: string, label: string): Promise<boolean> => {
      return await domainDeps.updateEdgeLabel({ edgeId, newLabel: label });
    },
    [domainDeps]
  );

  return { updateLabel };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 * 실제 API 호출 없이 로컬에서 동작 테스트
 */
export function useMockEdgeLabelBusiness(): EdgeLabelBusinessLogic {
  const updateLabel = useCallback(
    async (edgeId: string, label: string): Promise<boolean> => {
      console.log('[Mock] Updating edge label:', edgeId, label);
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    },
    []
  );

  return { updateLabel };
}
