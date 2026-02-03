'use client';

import { Box } from '@workspace/ui/components/ui/box';
import { Button } from '@workspace/ui/components/ui/button';
import { GraduationCap } from 'lucide-react';

interface TutorialStartOverlayProps {
  title: string;
  description: string;
  onStart: () => void;
}

/**
 * Tutorial Start Overlay
 *
 * Displays at the beginning of a tutorial with description and Start button
 */
export function TutorialStartOverlay({
  title,
  description,
  onStart,
}: TutorialStartOverlayProps) {
  return (
    <Box className="absolute inset-0 z-50 bg-background/5 flex items-center justify-center">
      <Box className="max-w-md w-full mx-4 bg-card border-2 border-primary rounded-lg shadow-xl p-8">
        <Box className="flex items-center gap-3 mb-4">
          <Box className="p-3 bg-primary/10 rounded-full">
            <GraduationCap className="w-8 h-8 text-primary" />
          </Box>
          <h2 className="text-2xl font-bold">{title}</h2>
        </Box>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>

        <Button onClick={onStart} size="lg" className="w-full">
          Start Tutorial
        </Button>
      </Box>
    </Box>
  );
}
