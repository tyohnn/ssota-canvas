/**
 * Markdown Block View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

"use client";

import { cn } from "@workspace/ui/lib/utils";

export interface MarkdownBlockViewProps {
  /** 마크다운 콘텐츠 (HTML로 변환된 상태) */
  htmlContent: string;
  /** 블록 선택 상태 */
  selected?: boolean;
  /** 클래스명 */
  className?: string;
}

/**
 * Markdown Block View
 *
 * NoteView와 유사한 스타일의 마크다운 블록 렌더링
 * (TipTap 대신 HTML 직접 렌더링)
 */
export function MarkdownBlockView({
  htmlContent,
  selected = false,
  className,
}: MarkdownBlockViewProps) {
  return (
    <div
      className={cn(
        "w-full h-full flex flex-col rounded-lg overflow-hidden",
        "bg-background border-2 border-border",
        "shadow-md",
        // 호버 효과 (선택되지 않았을 때만)
        !selected && "hover:shadow-xl",
        // 선택 효과
        selected && "ring-2 ring-blue-400 dark:ring-blue-500",
        selected && "shadow-xl",
        // Transition
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Content */}
      <div
        className={cn(
          "flex-1 p-4 overflow-auto",
          "prose prose-sm dark:prose-invert max-w-none",
          // TipTap 스타일과 유사하게
          "[&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3",
          "[&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-2",
          "[&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-1.5",
          "[&>p]:text-sm [&>p]:leading-relaxed [&>p]:mb-2",
          "[&>ul]:list-disc [&>ul]:pl-4 [&>ul]:mb-2",
          "[&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:mb-2",
          "[&>li]:text-sm [&>li]:mb-1",
          "[&>strong]:font-semibold",
          "[&>em]:italic"
        )}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
