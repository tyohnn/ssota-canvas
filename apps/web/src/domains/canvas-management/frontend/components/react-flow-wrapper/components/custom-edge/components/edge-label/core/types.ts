import type { RefObject } from 'react';

import type { Edge } from '@xyflow/react';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

/**
 * Edge label editing state
 */
export interface EdgeLabelState {
  label: string;
  isEditing: boolean;
  draftLabel: string;
  originalLabel: string;
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * Flow dependency interface for getting edge data
 */
export interface FlowDependencies {
  getEdge: (edgeId: string) => Edge | undefined;
  getEdges: () => Edge[];
}

/**
 * Domain dependency interface for edge label operations
 */
export interface DomainDependencies {
  updateEdgeLabel: (input: { edgeId: string; newLabel: string }) => Promise<boolean>;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

/**
 * Edge Label business logic interface
 */
export interface EdgeLabelBusinessLogic {
  /**
   * Updates the edge label
   * Performs optimistic update: immediately updates React Flow Store, then calls server.
   * Automatically rolls back on failure.
   *
   * @param edgeId - Edge ID to update
   * @param label - New label text
   * @returns Promise<boolean> - Resolves to true on success, false on failure
   */
  updateLabel: (edgeId: string, label: string) => Promise<boolean>;
}

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * Edge Label Hook Props
 */
export interface EdgeLabelHookProps {
  edgeId: string;
  label: string;
  // Optional: 테스트/Storybook용 override
  canvasMetadata?: {
    pageId: string;
    orgId: string;
    workspaceId: string;
  };
}

/**
 * Edge Label Hook return type
 */
export interface UseEdgeLabelReturn {
  // Label state
  labelState: EdgeLabelState;
  setIsEditing: (editing: boolean) => void;
  setDraftLabel: (label: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;

  // Handlers
  handleLabelClick: (e: React.MouseEvent) => void;
  handleLabelBlur: () => Promise<void>;
  handleLabelChange: (value: string) => void;
  handleLabelKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Edge Label Component Props
 */
export interface EdgeLabelProps {
  edgeId: string;
  label: string;
  position: { x: number; y: number };
  isSelected: boolean;
  // Optional overrides (테스트/Storybook용)
  canvasMetadata?: {
    pageId: string;
    orgId: string;
    workspaceId: string;
  };
  businessLogic?: EdgeLabelBusinessLogic;
  flowDeps?: FlowDependencies;
}
