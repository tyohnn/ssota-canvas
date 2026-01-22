/**
 * Script Error State
 *
 * 스크립트 로드 에러가 발생했을 때 표시하는 컴포넌트
 */

'use client';

import { AlertCircle } from 'lucide-react';

import { Box } from '@/components/ui/box';


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
      <Box className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3 mb-4">
        <p className="text-center text-sm text-destructive">
          <AlertCircle
            aria-hidden="true"
            className="-mt-0.5 me-3 inline-flex opacity-80"
            size={16}
          />
          {error}
        </p>
      </Box>
    </>
  );
}
