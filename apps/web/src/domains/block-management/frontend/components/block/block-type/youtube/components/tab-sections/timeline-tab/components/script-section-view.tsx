/**
 * Script Section View
 *
 * Presentational 컴포넌트
 * Props만 받아서 UI를 렌더링합니다.
 */

'use client';

import type { YoutubeScript } from '@/domains/youtube-app-space/shared/types/transcript.types';

import { ScriptContent } from './script-content';
import { ScriptErrorState } from './script-error-state';
import { ScriptLoadingState } from './script-loading-state';
import { ScriptNoScriptState } from './script-no-script-state';
import { ScriptSectionContainer } from './script-section-container';

interface ScriptSectionViewProps {
  youtubeId: string | undefined;
  youtubeTitle: string | undefined;
  script: YoutubeScript | undefined;
  extractedAt?: Date | string | null;
  isLoading: boolean;
  error: string | null;
  onExtractScript: () => Promise<void>;
  isExtracting: boolean;
}

/**
 * Script Section View Component
 *
 * YouTube 블록의 스크립트를 표시하는 Presentational 컴포넌트
 */
export function ScriptSectionView({
  youtubeId,
  youtubeTitle,
  script,
  extractedAt,
  isLoading,
  error,
  onExtractScript,
  isExtracting,
}: ScriptSectionViewProps) {
  if (isLoading) {
    // 스크립트가 없고 로딩 중이면 추출 중으로 간주
    const isActuallyExtracting = isExtracting || (!script && isLoading);
    return (
      <ScriptSectionContainer>
        <ScriptLoadingState isExtracting={isActuallyExtracting} />
      </ScriptSectionContainer>
    );
  }

  if (error) {
    return (
      <ScriptSectionContainer>
        <ScriptErrorState
          error={error}
          hasScript={!!script}
          onExtractScript={onExtractScript}
          isExtracting={isExtracting}
        />
      </ScriptSectionContainer>
    );
  }

  if (!script) {
    return (
      <ScriptSectionContainer>
        <ScriptNoScriptState
          onExtractScript={onExtractScript}
          isExtracting={isExtracting}
        />
      </ScriptSectionContainer>
    );
  }

  return (
    <ScriptSectionContainer>
      <ScriptContent
        script={script}
        youtubeTitle={youtubeTitle}
        extractedAt={extractedAt}
        onRefresh={onExtractScript}
      />
    </ScriptSectionContainer>
  );
}
