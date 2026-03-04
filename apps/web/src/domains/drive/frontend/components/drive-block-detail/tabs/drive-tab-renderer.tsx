/**
 * Drive Tab Renderer
 *
 * Renders tab content for Drive editor panel. Uses Drive-specific components
 * for summary, timeline, extract (no Canvas context). Metadata tab is loaded
 * from block-management (presentational, no context).
 */

'use client';

import { useEffect, useState } from 'react';

import {
  getTabComponent,
  isTabComponentLoaded,
  prefetchTabComponent,
  type TabComponentProps,
} from '@/domains/block-management/frontend/components/block-editor-tabs';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { DriveSummaryTab } from './drive-summary-tab';
import { DriveTimelineTab } from './drive-timeline-tab';
import { DriveMarkdownTab } from './drive-markdown-tab';
import { DriveNoteTabWrapper } from '../drive-note-tab-wrapper';

export interface DriveTabRendererProps {
  tabId: string;
  componentPath?: string | null;
  blockId: string;
  blockData: DriveBlockData | undefined;
  blockMountId: string;
  orgId: string;
  switchToTab?: (tabId: string) => void;
}

/**
 * Renders tab content for Drive. Tab id 'note' is handled by the parent;
 * this is used for other tabs (summary, timeline, extract, metadata).
 */
export function DriveTabRenderer({
  tabId,
  componentPath,
  blockId,
  blockData,
  blockMountId,
  orgId,
  switchToTab,
}: DriveTabRendererProps) {
  if (!blockData) return null;

  if (tabId === 'note') {
    return (
      <DriveNoteTabWrapper
        blockId={blockId}
        blockData={blockData}
        orgId={orgId}
      />
    );
  }

  if (tabId === 'summary') {
    return <DriveSummaryTab blockId={blockId} blockData={blockData} />;
  }

  if (tabId === 'timeline') {
    return (
      <DriveTimelineTab
        blockId={blockId}
        blockData={blockData}
        blockMountId={blockMountId}
        switchToTab={switchToTab}
      />
    );
  }

  if (tabId === 'extract') {
    return <DriveMarkdownTab blockId={blockId} blockData={blockData} />;
  }

  if (tabId === 'metadata' && componentPath) {
    return (
      <DriveMetadataTabLoader
        componentPath={componentPath}
        blockId={blockId}
        blockData={blockData}
        blockMountId={blockMountId}
        switchToTab={switchToTab}
      />
    );
  }

  return null;
}

function DriveMetadataTabLoader({
  componentPath,
  blockId,
  blockData,
  blockMountId,
  switchToTab,
}: {
  componentPath: string;
  blockId: string;
  blockData: DriveBlockData | undefined;
  blockMountId: string;
  switchToTab?: (tabId: string) => void;
}) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (isTabComponentLoaded(componentPath)) return;
    prefetchTabComponent(componentPath).catch(() => {});
    const interval = setInterval(() => {
      if (isTabComponentLoaded(componentPath)) {
        setTick(n => n + 1);
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [componentPath]);

  const TabComponent = getTabComponent(componentPath);
  if (!TabComponent) return null;

  const tabProps: TabComponentProps = {
    blockId,
    blockData,
    blockMountId,
    switchToTab,
  };
  return <TabComponent {...tabProps} />;
}
