/**
 * Landing Block Property Renderer
 * 
 * Replicated from Block Property Renderer
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import React from 'react';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { BlockPropertyRendererView } from '@/domains/block-management/frontend/components/editor-panel/components/content-area/components/block-properties-section/components/block-property-renderer.view';

interface LandingBlockPropertyRendererProps {
  propertyKey: string;
  propertyDef: PropertyUIDefinition;
  value: any;
}

export function LandingBlockPropertyRenderer({
  propertyKey,
  propertyDef,
  value,
}: LandingBlockPropertyRendererProps) {
  // Mock readonly state
  const canvasReadonly = false;

  const handleValueChange = (newValue: any) => {
    console.log(`Property ${propertyKey} changed to:`, newValue);
  };

  const handleImmediateChange = (newValue: any) => {
    console.log(`Property ${propertyKey} changed immediately to:`, newValue);
  };

  return (
    <BlockPropertyRendererView
      propertyKey={propertyKey}
      propertyDef={propertyDef}
      value={value}
      onChange={handleValueChange}
      onImmediateChange={handleImmediateChange}
      readOnly={canvasReadonly || propertyDef.readonly || false}
    />
  );
}
