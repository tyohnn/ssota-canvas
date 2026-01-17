'use client';

import React from 'react';

import { Search } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';
import { Input } from '@workspace/ui/components/ui/input';

export interface PageSearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function PageSearchInput({
  searchQuery,
  setSearchQuery,
}: PageSearchInputProps) {
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
