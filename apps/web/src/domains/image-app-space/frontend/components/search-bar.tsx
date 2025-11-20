'use client';

import { Search, RefreshCw } from 'lucide-react';
import { Input } from '@workspace/ui/components/ui/input';
import { Button } from '@workspace/ui/components/ui/button';
import { useImageSpaceContext } from '../core/image-space.context';

/**
 * Image Space Search Bar
 *
 * 검색창 + 새로고침 버튼 (Context 기반)
 */
export function ImageSpaceSearchBar() {
  const { searchQuery, setSearchQuery, triggerRefresh, activeExploreTab } =
    useImageSpaceContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // TODO: 검색 실행 (각 탭에서 처리)
      console.log('Search:', searchQuery);
    }
  };

  return (
    <div className="flex gap-2 p-4 border-b bg-background">
      <Input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search images..."
        className="flex-1"
      />
      <Button
        size="sm"
        disabled={!searchQuery.trim()}
        onClick={() => console.log('Search:', searchQuery)}
      >
        <Search className="h-4 w-4" />
      </Button>
      {/* 새로고침 버튼 (Unsplash 탭에서만 표시) */}
      {activeExploreTab === 'unsplash' && (
        <Button variant="outline" size="sm" onClick={triggerRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
