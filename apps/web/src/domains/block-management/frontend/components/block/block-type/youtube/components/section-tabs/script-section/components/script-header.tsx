/**
 * Script Header
 *
 * 스크립트 섹션의 헤더 (제목)
 */

'use client';

import { forwardRef } from 'react';

/**
 * Script Header Props
 */
interface ScriptHeaderProps {
  youtubeTitle: string | undefined;
}

/**
 * Script Header Component
 */
export const ScriptHeader = forwardRef<HTMLHeadingElement, ScriptHeaderProps>(
  ({ youtubeTitle }, ref) => {
    const displayTitle = youtubeTitle || 'Script';

    return (
      <h3
        ref={ref}
        className="text-sm font-medium truncate max-w-[300px]"
        title={youtubeTitle || undefined}
      >
        {displayTitle}
      </h3>
    );
  }
);

ScriptHeader.displayName = 'ScriptHeader';
