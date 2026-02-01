/**
 * Editor Panel Header Container
 */

'use client';

import React from 'react';
import { useEditorPanelContext } from '../core/context';
import { HeaderView } from './header.view';

export function Header() {
  const { onClose, isExpanded, setIsExpanded } = useEditorPanelContext();

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <HeaderView
      onClose={onClose}
      isExpanded={isExpanded}
      onToggleExpand={handleToggleExpand}
    />
  );
}

