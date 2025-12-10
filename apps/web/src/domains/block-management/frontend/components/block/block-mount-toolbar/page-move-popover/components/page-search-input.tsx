'use client';

import React from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Search } from 'lucide-react';
import { usePageMovePopoverContext } from '../core/context';
import { Box } from '@workspace/ui/components/ui/box';

export function PageSearchInput() {
  const { searchQuery, setSearchQuery } = usePageMovePopoverContext();

  return (
    <Box className="relative mb-2">
      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search for a page..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="pl-8"
        autoFocus
      />
    </Box>
  );
}
