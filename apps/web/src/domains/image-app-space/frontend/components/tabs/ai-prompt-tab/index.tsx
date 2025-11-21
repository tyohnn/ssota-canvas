/**
 * AI Prompt Tab
 *
 * AI 이미지 생성 탭
 *
 * Frontend Specification 참조: 04-frontend-specification.md
 */

'use client';

import { Box } from '@workspace/ui/components/ui/box';

/**
 * AI Prompt Tab (임시)
 *
 * TODO: Context + Hooks + Components 구현
 */
export function AIPromptTab() {
  return (
    <Box className="flex-1 min-h-0 overflow-y-auto">
      <div className="text-center text-muted-foreground p-6">
        <p className="text-lg font-medium mb-2">AI Image Generation</p>
        <p className="text-sm">Coming soon...</p>
        <p className="text-xs mt-2">
          OpenAI GPT Image 1 & Google Gemini 2.5 Flash Image
        </p>
      </div>
    </Box>
  );
}
