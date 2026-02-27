import type React from 'react';

/**
 * Link Block Types (minimal, package-agnostic)
 *
 * View가 보지 않아야 하는 것: blockId, nodeId, nodeData, workspaceId, updateProperty, fetchMetadata 등.
 * 모두 onUrlSubmit 콜백으로 Parameterization.
 */

/**
 * Link/Open Graph Metadata (minimal interface for View components)
 * Compatible with LinkBlockProperties but does not depend on block-management
 */
export interface LinkMetadata {
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  domain: string;
  faviconUrl: string;
  type: string;
  author?: string;
  publishedAt?: string;
}

/** Properties shape for link block (url + og fields) */
export interface LinkPropertiesLike {
  url?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  siteName?: string;
  domain?: string;
  faviconUrl?: string;
  author?: string;
  publishedAt?: string;
  pageType?: string;
}

/** Key to check if Link metadata has been fetched */
export const LINK_METADATA_TITLE_KEY = 'ogTitle' as const;

/** Safely check if properties has Link metadata (type-safe access) */
export function hasLinkMetadata(
  properties: LinkPropertiesLike | null | undefined
): boolean {
  if (!properties || typeof properties !== 'object') return false;
  const value = (properties as Record<string, unknown>)[LINK_METADATA_TITLE_KEY];
  return typeof value === 'string' && value.length > 0;
}

/**
 * UseLinkBlock deps - all domain/framework deps injected by caller.
 * YouTube 패턴: 단일 onUrlSubmit 콜백. Caller가 fetch, persistence 전부 담당.
 */
export interface UseLinkBlockDeps {
  /**
   * Process URL: persist url, fetch metadata, update og properties, etc.
   * Caller handles all persistence. Called on user submit and when url exists but needs fetch.
   */
  onUrlSubmit: (url: string) => Promise<void>;
}

export interface LinkBlockHookProps {
  /** URL from properties */
  url: string;
  /** Block properties (url, og fields) */
  properties: LinkPropertiesLike;
  /** Whether the block is selected/active (Result Injection) */
  isActive: boolean;
  /** Instance identifier (e.g. blockMountId) - for focus, callbacks */
  instanceId: string;
  /** Whether persistence is allowed - caller computes (e.g. !nodeId.startsWith('optimistic-')) */
  canPersist: boolean;
}

export interface UseLinkBlockReturn {
  url: string;
  metadata: LinkMetadata | null;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  normalizedDomain: string;
  currentFaviconUrl: string | null;
  handleUrlSubmit: (e?: { preventDefault(): void }) => Promise<void>;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;
}

/** Presentational view props */
export type LinkViewProps = UseLinkBlockReturn & { isActive: boolean };
