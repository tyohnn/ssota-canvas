/**
 * Block Content Tabs Section Types
 *
 * Generic tab types for deps-driven API (no domain imports)
 */

import type { ComponentType } from 'react';

export interface BlockEditorTabLike {
  id: string;
  label: string;
  componentPath?: string;
  component?: ComponentType<{ resourceId: string; data: unknown }>;
  isDefault?: boolean;
  hideInReadonly?: boolean;
}

export interface BlockEditorTabsConfigLike {
  blockType: string;
  tabs: BlockEditorTabLike[];
  defaultTabId?: string;
}

export interface BlockContentTabsSectionDeps {
  loadTabsConfig: (
    blockType: string
  ) => Promise<BlockEditorTabsConfigLike | null>;
  renderTabContent: (
    tab: BlockEditorTabLike,
    ctx: {
      resourceId: string;
      data: unknown;
      instanceId: string;
      switchToTab: (tabId: string) => void;
    }
  ) => React.ReactNode;
  /** Register the tab switch callback. Pass null to unregister. */
  registerTabSwitch: (fn: ((tabId: string) => void) | null) => void;
  /** Passed to renderTabContent ctx so tab content can switch tabs (e.g. "Add quote" → note tab). */
  switchToTab: (tabId: string) => void;
  readonly?: boolean;
}
