/**
 * Script Section Business Logic Hook
 *
 * YouTube 스크립트 로드 및 관리 로직
 *
 * ✅ TanStack Query 사용:
 * - 컴포넌트가 렌더링될 때만 스크립트 로드 (enabled 옵션)
 * - 자동 캐싱: 같은 blockId/youtubeId로 여러 번 호출해도 한 번만 요청
 * - staleTime: 24시간 (스크립트는 한번 추출되면 거의 변경되지 않음)
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import {
  useCheckVideoScriptTransaction,
  useExtractVideoScript,
  useVideoScript,
} from '@/domains/youtube-app-space/frontend/hooks';

import type { ScriptSectionBusinessLogic } from './types';

/**
 * Script Section Business Logic Hook
 *
 * YouTube 블록의 스크립트를 로드하고 관리하는 비즈니스 로직
 */
export function useScriptSectionBusiness(
  blockId: string,
  blockData: BlockNodeData | undefined
): ScriptSectionBusinessLogic {
  // Block properties에서 YouTube 정보 추출
  const properties = blockData?.properties as
    | YoutubeBlockProperties
    | undefined;

  // YoutubeBlockPropertiesVO로 변환하여 타입 안전하게 youtubeId와 youtubeTitle 추출
  let youtubeId: string | undefined;
  let youtubeTitle: string | undefined;
  let scriptAccessGranted: boolean | undefined;
  try {
    if (properties) {
      const youtubeProperties = YoutubeBlockPropertiesVO.fromJSON(properties);
      youtubeId = youtubeProperties.youtubeId;
      youtubeTitle = youtubeProperties.youtubeTitle;
      scriptAccessGranted = youtubeProperties.scriptAccessGranted;
    }
  } catch (error) {
    console.warn('[ScriptSection] Failed to parse YouTube properties:', error);
  }

  // Action Transaction 확인 (추출 액션이 실행된 적이 있는지)
  // ⚠️ scriptAccessGranted가 true면 건너뛰기 (Action Transaction 확인 불필요)
  const { exists: hasActionTransaction, isLoading: isCheckingTransaction } =
    useCheckVideoScriptTransaction({
      blockId,
      enabled: !!blockId && scriptAccessGranted !== true,
    });

  const hasExtractAction = scriptAccessGranted === true || hasActionTransaction;

  // 스크립트 로드
  const {
    script,
    isLoading: isLoadingScript,
    error: scriptError,
  } = useVideoScript({
    blockId,
    youtubeId: youtubeId || '',
    scriptAccessGranted,
    enabled:
      !!blockId &&
      !!youtubeId &&
      (scriptAccessGranted === true ||
        (hasExtractAction && !isCheckingTransaction)),
  });

  // 스크립트 추출 훅
  const { extractScript, isExtracting } = useExtractVideoScript({
    blockId,
    youtubeId: youtubeId || '',
  });

  // 에러 처리
  const error = scriptError
    ? scriptError.message
    : null;

  // 스크립트 추출 핸들러
  const handleExtractScript = async () => {
    await extractScript();
  };

  return {
    youtubeId,
    youtubeTitle,
    script,
    isLoading: isLoadingScript || isCheckingTransaction,
    error,
    handleExtractScript,
    hasExtractAction,
    isExtracting,
  };
}
