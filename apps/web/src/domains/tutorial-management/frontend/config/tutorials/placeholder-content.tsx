'use client';

import type { TutorialContentProps } from '@/domains/tutorial-management/shared/types/tutorial.types';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Placeholder content for tutorials that are not yet implemented.
 */
export function PlaceholderTutorialContent(_props: TutorialContentProps) {
  return (
    <Box className="h-full flex items-center justify-center p-8">
      <Box className="text-center text-muted-foreground">
        <p className="text-sm">This tutorial is under development.</p>
      </Box>
    </Box>
  );
}
