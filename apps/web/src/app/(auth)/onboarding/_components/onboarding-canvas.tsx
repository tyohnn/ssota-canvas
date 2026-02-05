'use client';

import { useMemo } from 'react';
import type { Node } from '@xyflow/react';
import { OnboardingCanvasContent } from './onboarding-canvas-content';

type OnboardingCanvasProps = {
  step: 'language' | 'name' | 'organization';
  language?: string;
  greeting?: string;
  organizationName?: string;
};

export function OnboardingCanvas({
  step,
  language,
  greeting,
  organizationName,
}: OnboardingCanvasProps) {
  const nodes = useMemo(() => {
    const baseNodes: Node[] = [];

    if (step === 'language' || step === 'name') {
      // Step 1 & 2: Show a centered shape block with greeting
      baseNodes.push({
        id: 'greeting-block',
        type: 'onboarding-shape',
        position: { x: 350, y: 280 },
        data: {
          blockId: 'greeting-block',
          blockMountId: 'greeting-block',
          blockType: 'shape',
          title: greeting || "Hello, I'm Ssota.",
          properties: {},
          customProperties: [],
        },
        width: 320,
        height: 180,
      });
    } else if (step === 'organization') {
      // Step 3: Show magnified org switcher mock
      baseNodes.push({
        id: 'org-switcher-mock',
        type: 'onboarding-org',
        position: { x: 280, y: 220 },
        data: {
          blockId: 'org-switcher-mock',
          blockMountId: 'org-switcher-mock',
          blockType: 'text',
          title: organizationName || 'Organization',
          properties: {},
          customProperties: [],
        },
        width: 420,
        height: 280,
      });
    }

    return baseNodes;
  }, [step, greeting, organizationName]);

  return <OnboardingCanvasContent nodes={nodes} />;
}
