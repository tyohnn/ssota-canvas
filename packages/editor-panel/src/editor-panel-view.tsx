/**
 * Editor Panel View
 *
 * Contract-first presentational root.
 * - No children prop
 * - No component injection
 * - No outer frame ownership (app wraps this view)
 */

'use client';

import React from 'react';
import { Box } from '@workspace/ui/components/ui/box';

import { TitleInputView } from './content/title-input.view';
import { HeaderView } from './header/header.view';
import { BlockPropertiesSection } from './property/block-properties-section';
import { CustomPropertiesSection } from './property/custom-properties-section';

import type { TitleInputViewProps } from './content/title-input.view';
import type { BlockPropertiesSectionProps } from './property/block-properties-section';
import type { CustomPropertiesSectionProps } from './property/custom-properties-section';
import type { EditorPanelHeaderActions } from './header/header.view';

export interface EditorPanelViewProps {
  headerActions: EditorPanelHeaderActions;
  titleInput: TitleInputViewProps;
  blockProperties: BlockPropertiesSectionProps;
  customProperties: CustomPropertiesSectionProps;
  tabsSection?: React.ReactNode;
}

export function EditorPanelView({
  headerActions,
  titleInput,
  blockProperties,
  customProperties,
  tabsSection,
}: EditorPanelViewProps) {
  return (
    <Box className="flex flex-col h-full">
      <HeaderView
        onClose={headerActions.onClose}
        isExpanded={headerActions.isExpanded}
        onToggleExpand={headerActions.onToggleExpand}
        hideExpand={headerActions.hideExpand}
      />
      <Box
        className="flex-1 min-h-0 overflow-y-auto"
        data-content-area-scroll-container="true"
      >
        <TitleInputView {...titleInput} />
        <BlockPropertiesSection {...blockProperties} />
        <CustomPropertiesSection {...customProperties} />
        {tabsSection}
      </Box>
    </Box>
  );
}
