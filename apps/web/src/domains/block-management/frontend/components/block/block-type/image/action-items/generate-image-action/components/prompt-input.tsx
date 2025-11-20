/**
 * Prompt Input Component
 */

'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Textarea } from '@workspace/ui/components/ui/textarea';
import { useGenerateImageActionContext } from '../generate-image-action.context';
import { cn } from '@workspace/ui/lib/utils';
import { Label } from '@workspace/ui/components/ui/label';
import { Box } from '@workspace/ui/components/ui/box';
/**
 * Prompt Input Props
 */
export interface PromptInputProps {
  className?: string;
}

/**
 * Prompt Input Component
 */
export function PromptInput({
  className,
}: PromptInputProps): React.ReactElement | null {
  const {
    prompt,
    setPrompt,
    promptInputRef,
    handleGenerate,
    isGenerating,
    results,
  } = useGenerateImageActionContext();

  // 결과가 있으면 표시하지 않음 (SelectionPanel로 대체)
  if (results.length > 0) {
    return null;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <Box className={cn('p-4 space-y-2', className)}>
      <Label
        htmlFor="prompt-input"
        className="text-xs font-medium text-muted-foreground"
      >
        Prompt
      </Label>
      <Box className="relative">
        <Textarea
          ref={promptInputRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="예: A serene landscape with mountains and a lake at sunset..."
          className="min-h-[80px] resize-none pr-12 text-sm"
          disabled={isGenerating}
        />
        {isGenerating && (
          <Loader2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </Box>
    </Box>
  );
}
