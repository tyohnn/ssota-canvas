/**
 * Search Bar Component
 */

'use client';

import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@workspace/ui/components/ui/input';
import { useImageSearchActionContext } from '../image-search-action.context';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Search Bar Props
 */
export interface SearchBarProps {
  className?: string;
}

/**
 * Search Bar Component
 */
export function SearchBar({ className }: SearchBarProps): React.ReactElement {
  const {
    searchQuery,
    setSearchQuery,
    searchInputRef,
    handleSearch,
    isSearching,
  } = useImageSearchActionContext();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Box className={cn('p-3 pt-10', className)}>
      {/* 검색 입력 */}
      <Box className="relative">
        <Input
          ref={searchInputRef}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search images..."
          className="pr-8 h-9 text-sm"
          disabled={isSearching}
        />
        {isSearching ? (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        )}
      </Box>
    </Box>
  );
}
