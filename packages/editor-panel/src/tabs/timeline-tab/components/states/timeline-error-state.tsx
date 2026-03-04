'use client';

import { AlertCircle } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';

export interface TimelineErrorStateProps {
  error: string;
  hasScript: boolean;
  onExtractScript: () => Promise<void>;
  isExtracting?: boolean;
}

export function TimelineErrorState({
  error,
  hasScript,
  onExtractScript,
  isExtracting = false,
}: TimelineErrorStateProps) {
  return (
    <Box className="space-y-4">
      <p className="text-sm text-destructive">
        <AlertCircle className="inline me-2" size={16} />
        {error}
      </p>
      {!hasScript && (
        <button
          type="button"
          onClick={onExtractScript}
          disabled={isExtracting}
          className="text-sm text-primary hover:underline"
        >
          {isExtracting ? 'Extracting...' : 'Try extract transcript'}
        </button>
      )}
    </Box>
  );
}
