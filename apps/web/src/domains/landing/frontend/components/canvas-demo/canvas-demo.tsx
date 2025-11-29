/**
 * Canvas Demo Component
 *
 * Main Canvas Demo wrapper with providers
 */

'use client';

import { ReactFlowProvider } from '@xyflow/react';
import { CanvasModeProvider } from '@/domains/canvas-management/frontend/contexts/canvas-mode-context';
import { CanvasDemoController } from './canvas-demo-controller';

export function CanvasDemo() {
  return (
    <ReactFlowProvider>
      <CanvasModeProvider>
        <CanvasDemoController />
      </CanvasModeProvider>
    </ReactFlowProvider>
  );
}
