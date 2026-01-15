/**
 * Generate Button Component
 */

'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { useGenerateImageActionContext } from '../../generate-image-action.context';

/**
 * Generate Button Component
 */
export function GenerateButton(): React.ReactElement {
  const { handleGenerate, isGenerating, prompt } =
    useGenerateImageActionContext();

  return (
    <Button
      onClick={handleGenerate}
      disabled={!prompt.trim() || isGenerating}
      size="sm"
      className="h-8"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          <span className="text-xs">Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-xs">Generate</span>
        </>
      )}
    </Button>
  );
}
