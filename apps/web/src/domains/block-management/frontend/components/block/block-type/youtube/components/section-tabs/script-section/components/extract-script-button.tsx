/**
 * Extract Script Button
 *
 * 스크립트 추출 버튼 컴포넌트
 */

'use client';

import { Loader2 } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';

/**
 * Extract Script Button Props
 */
interface ExtractScriptButtonProps {
  onExtractScript: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * Extract Script Button Component
 */
export function ExtractScriptButton({
  onExtractScript,
  isLoading = false,
  className,
}: ExtractScriptButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onExtractScript}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Extracting...
        </>
      ) : (
        'Extract Script'
      )}
    </Button>
  );
}
