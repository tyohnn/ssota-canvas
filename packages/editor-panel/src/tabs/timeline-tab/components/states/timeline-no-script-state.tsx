'use client';

import { FileQuestion } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';

export interface TimelineNoScriptStateProps {
  onExtractScript: () => Promise<void>;
  isExtracting?: boolean;
}

export function TimelineNoScriptState({
  onExtractScript,
  isExtracting = false,
}: TimelineNoScriptStateProps) {
  return (
    <Box className="space-y-4">
      <p className="text-sm text-muted-foreground">
        <FileQuestion className="inline me-2" size={16} />
        No transcript available. Extract to generate one.
      </p>
      <button
        type="button"
        onClick={onExtractScript}
        disabled={isExtracting}
        className="text-sm text-primary hover:underline"
      >
        {isExtracting ? 'Extracting...' : 'Extract transcript'}
      </button>
    </Box>
  );
}
