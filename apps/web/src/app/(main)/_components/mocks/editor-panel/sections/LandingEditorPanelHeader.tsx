/**
 * Landing Editor Panel Header
 * 
 * Replicated from Editor Panel Header
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import React from 'react';
import { HeaderView } from '@/domains/block-management/frontend/components/editor-panel/components/header.view';

interface LandingEditorPanelHeaderProps {
  onClose?: () => void;
}

export function LandingEditorPanelHeader({ onClose }: LandingEditorPanelHeaderProps) {
  // Mock context values
  const isExpanded = false;
  const handleToggleExpand = () => console.log('Expand toggled');

  return (
    <HeaderView
      onClose={onClose}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
    />
  );
}
