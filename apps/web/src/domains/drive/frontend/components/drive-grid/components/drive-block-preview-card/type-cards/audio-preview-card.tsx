'use client';

import { Music } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';

export interface AudioPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

function formatDuration(seconds?: number): string {
  if (seconds == null || !Number.isFinite(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPreviewCard({ title, properties }: AudioPreviewCardProps) {
  const filename = properties.filename as string | undefined;
  const duration = properties.duration as number | undefined;

  const displayTitle = filename || title || 'Audio';

  return (
    <Box className="flex flex-col h-full min-h-0 p-4 justify-center items-center gap-2">
      <Music className="w-12 h-12 shrink-0 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground truncate w-full text-center">
        {displayTitle}
      </h3>
      {duration != null && (
        <p className="text-xs text-muted-foreground">
          {formatDuration(duration)}
        </p>
      )}
    </Box>
  );
}
