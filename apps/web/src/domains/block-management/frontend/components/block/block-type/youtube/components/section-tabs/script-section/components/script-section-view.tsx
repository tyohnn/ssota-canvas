/**
 * Script Section View
 *
 * Presentational 컴포넌트
 * Props만 받아서 UI를 렌더링합니다.
 */

'use client';

import type { GetScriptDTO } from '@/domains/youtube-app-space/shared/dtos/responses/video.responses';

import { ScriptContent } from './script-content';
import { ScriptErrorState } from './script-error-state';
import { ScriptLoadingState } from './script-loading-state';
import { ScriptNoScriptState } from './script-no-script-state';
import { ScriptSectionContainer } from './script-section-container';

/**
 * Script Section View Props
 */
interface ScriptSectionViewProps {
  youtubeId: string | undefined;
  youtubeTitle: string | undefined;
  script: GetScriptDTO['youtube']['script'] | undefined;
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
  isLoading,
  error,
  onExtractScript,
  isExtracting,
}: ScriptSectionViewProps) {
  if (isLoading) {
    return (
      <ScriptSectionContainer>
        <ScriptLoadingState />
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
        onRefresh={onExtractScript}
      />
    </ScriptSectionContainer>
  );
}
