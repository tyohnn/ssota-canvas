import type { LinkBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { OpenGraphMetadata } from '@/domains/link-app-space/shared/types/open-graph-metadata';

export type UpdateBlockTitleFn = (input: {
  nodeId: string;
  title: string;
  blockData: LinkBlockNodeData;
}) => Promise<boolean>;

/**
 * Link Block Hook Props
 */
export interface LinkBlockHookProps {
  nodeData: LinkBlockNodeData;
  selected: boolean;
  nodeId: string;
  updateBlockTitle?: UpdateBlockTitleFn;
}

/**
 * Link Block Hook Return / View Props
 *
 * Single return object so the container can spread into LinkView.
 * Presentational view receives the same shape (props only).
 */
export interface UseLinkBlockReturn {
  // State
  url: string;
  metadata: OpenGraphMetadata | null;
  isLoading: boolean;
  hasError: boolean;
  draftUrl: string;

  // Refs
  inputRef: React.RefObject<HTMLInputElement | null>;

  // Computed
  normalizedDomain: string;
  currentFaviconUrl: string | null;

  // Handlers
  handleUrlSubmit: (e?: { preventDefault(): void }) => Promise<void>;
  handleUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;
}

/**
 * Presentational view props (same shape as UseLinkBlockReturn)
 */
export type LinkViewProps = UseLinkBlockReturn & { selected: boolean };
