'use client';

import React from 'react';
import { PopoverTrigger } from '@workspace/ui/components/ui/popover';
import { MoveRight } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';

export function Trigger() {
  return (
    <PopoverTrigger asChild>
      <Box className="w-full flex items-center px-2 py-1.5 text-sm hover:bg-accent rounded-sm cursor-pointer">
        <MoveRight className="h-4 w-4 mr-2" />
        Move Page
      </Box>
    </PopoverTrigger>
  );
}
