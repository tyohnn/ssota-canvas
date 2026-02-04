'use client';

import dynamic from 'next/dynamic';
import type { TutorialDialogStandaloneProps } from './index';
import { Box } from '@workspace/ui/components/ui/box';
import { Loader2 } from 'lucide-react';

/**
 * Tutorial Dialog Dynamic Loader
 *
 * Loading fallback component shown while the tutorial dialog is being loaded
 */
function TutorialDialogLoader() {
  return (
    <Box className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Box className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading Tutorial...</p>
      </Box>
    </Box>
  );
}

/**
 * Dynamically imported Tutorial Dialog Standalone
 *
 * Benefits:
 * - Reduces initial bundle size by ~200-300KB
 * - Loads only when user clicks tutorial button
 * - Includes ReactFlow, mock components, and all tutorial dependencies
 * - SSR disabled to also reduce server bundle
 */
export const TutorialDialogStandalone = dynamic<TutorialDialogStandaloneProps>(
  () =>
    import('./index').then((mod) => ({
      default: mod.TutorialDialogStandalone,
    })),
  {
    loading: TutorialDialogLoader,
    ssr: false, // Disable SSR - tutorial is client-only interaction
  }
);
