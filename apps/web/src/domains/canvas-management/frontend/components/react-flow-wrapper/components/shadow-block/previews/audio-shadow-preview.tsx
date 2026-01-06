'use client';

import React from 'react';

import { Music } from 'lucide-react';

import { Box } from '@/components/ui/box';

import type { ShadowPreviewProps } from '../core/types';

export function AudioShadowPreview({ width, height }: ShadowPreviewProps) {
  return (
    <Box
      className="relative border-2 border-blue-400 border-dashed bg-blue-50/50 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      {/* Audio Icon */}
      <Box className="text-center">
        <Music className="h-8 w-8 text-blue-500 mx-auto mb-2" />
        <span className="text-xs font-medium text-blue-600">Audio Block</span>
      </Box>
    </Box>
  );
}
