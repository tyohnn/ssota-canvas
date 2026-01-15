/**
 * Script Error State
 *
 * 스크립트 로드 에러가 발생했을 때 표시하는 컴포넌트
 */

'use client';

import { ExtractScriptButton } from './extract-script-button';

/**
 * Script Error State Props
 */
interface ScriptErrorStateProps {
  error: string;
  hasScript: boolean;
  onExtractScript: () => Promise<void>;
  isExtracting?: boolean;
}

/**
 * Script Error State Component
 */
export function ScriptErrorState({
  error,
  hasScript,
  onExtractScript,
  isExtracting = false,
}: ScriptErrorStateProps) {
  return (
    <>
      <p className="text-sm text-red-500">{error}</p>
      {!hasScript && (
        <ExtractScriptButton
          onExtractScript={onExtractScript}
          isLoading={isExtracting}
          className="mt-2"
        />
      )}
    </>
  );
}
