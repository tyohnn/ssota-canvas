/**
 * Community Tab
 *
 * Frontend Specification 참조: 04-frontend-specification.md
 * Scenario 3: Community Feed 탐색 및 상호작용
 */

'use client';

import { CommunityFeedProvider } from './core/provider';
import { CommunitySidebar } from './components/sidebar';
import { CommunityImageGrid } from './components/image-grid';

/**
 * Community Tab
 *
 * Provider + Sidebar + Image Grid
 */
export function CommunityTab() {
  return (
    <CommunityFeedProvider>
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* 좌측 사이드바 */}
        <CommunitySidebar />

        {/* 메인 컨텐츠 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <CommunityImageGrid />
        </div>
      </div>
    </CommunityFeedProvider>
  );
}
