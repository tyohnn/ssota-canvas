import type { ReactNode } from 'react';

import type { Edge } from '@xyflow/react';

import type { ColorToken } from '@/domains/block-management/shared/types/style-tokens.types';

// =============================================================================
// 1. Atomic Types & Re-exports
// =============================================================================

/**
 * Edge shape type
 * Re-exported from domain value object for consistency
 */
export type EdgeShape = 'default' | 'straight' | 'smoothstep' | 'simplebezier';

/**
 * Edge width value
 */
export type EdgeWidth = 1 | 2 | 3;

/**
 * Color token type re-export
 */
export { type ColorToken };

// =============================================================================
// 2. Domain Models / Entities
// =============================================================================

/**
 * Current edge state information
 */
export interface EdgeState {
  shape: EdgeShape;
  colorHex: string;
  colorToken: ColorToken;
  width: number;
}

/**
 * Edge shape option with icon
 */
export interface EdgeShapeOption {
  value: EdgeShape;
  label: string;
  icon: ReactNode;
}

/**
 * Edge width option with icon
 */
export interface EdgeWidthOption {
  value: EdgeWidth;
  label: string;
  icon: ReactNode;
}

/**
 * Edge color option with preview box
 */
export interface EdgeColorOption {
  value: ColorToken;
  label: string;
  icon: ReactNode;
}

// =============================================================================
// 3. Dependency Interfaces (External Systems)
// =============================================================================

/**
 * React Flow dependency interface
 * Used to reduce coupling with external library (XYFlow)
 */
export interface FlowDependencies {
  getEdge: (edgeId: string) => Edge | undefined;
}

/**
 * Domain logic dependency interface
 * Used to reduce coupling with internal service hooks
 */
export interface DomainDependencies {
  getEdgeById: (edgeId: string) => Edge | undefined;
  updateEdgeShape: (edgeId: string, shape: string) => Promise<boolean>;
  updateEdgeStyle: (
    edgeId: string,
    style: { stroke?: string; strokeWidth?: number }
  ) => Promise<boolean>;
  deleteEdge: (edgeId: string) => Promise<boolean>;
}

/**
 * Theme dependency interface
 * Used to reduce coupling with theme library
 */
export interface ThemeDependencies {
  theme: string | undefined;
  getHexColor: (token: ColorToken) => string;
  getHexColorDark: (token: ColorToken) => string;
  getColorTokenFromHex: (hex: string) => ColorToken;
}

// =============================================================================
// 4. Functional / Business Logic Interfaces
// =============================================================================

/**
 * Edge Toolbar business logic interface
 *
 * This interface defines all business operations performed by the toolbar.
 * In production environments, it performs actual API calls,
 * while in test/storybook environments, mock implementations can be injected.
 *
 * @interface EdgeToolbarBusinessLogic
 *
 * @example
 * ```tsx
 * // Production implementation
 * const business = useEdgeToolbarBusiness(flowDeps, domainDeps, themeDeps);
 *
 * // Mock implementation
 * const mockBusiness = useMockEdgeToolbarBusiness();
 * ```
 */
export interface EdgeToolbarBusinessLogic {
  /**
   * Updates the edge shape (default, straight, smoothstep)
   *
   * @param edgeId - Edge ID to update
   * @param shape - New edge shape
   * @returns Promise<boolean> - Resolves to true on success, false on failure
   * @example
   * ```tsx
   * await business.updateShape('edge-1', 'straight');
   * ```
   */
  updateShape: (edgeId: string, shape: EdgeShape) => Promise<boolean>;

  /**
   * Updates the edge color
   *
   * @param edgeId - Edge ID to update
   * @param colorToken - New color token
   * @returns Promise<boolean> - Resolves to true on success, false on failure
   * @example
   * ```tsx
   * await business.updateColor('edge-1', ColorToken.BLUE);
   * ```
   */
  updateColor: (edgeId: string, colorToken: ColorToken) => Promise<boolean>;

  /**
   * Updates the edge width
   *
   * @param edgeId - Edge ID to update
   * @param width - New edge width (1, 2, or 3)
   * @returns Promise<boolean> - Resolves to true on success, false on failure
   * @example
   * ```tsx
   * await business.updateWidth('edge-1', 2);
   * ```
   */
  updateWidth: (edgeId: string, width: EdgeWidth) => Promise<boolean>;

  /**
   * Deletes the edge
   *
   * @param edgeId - Edge ID to delete
   * @returns Promise<boolean> - Resolves to true on success, false on failure
   * @example
   * ```tsx
   * await business.deleteEdge('edge-1');
   * ```
   */
  deleteEdge: (edgeId: string) => Promise<boolean>;
}

// =============================================================================
// 5. Public Entry Point (Props)
// =============================================================================

/**
 * Edge Toolbar Hook Props
 *
 * @interface EdgeToolbarProps
 */
export interface EdgeToolbarProps {
  /**
   * Unique ID of the current page being worked on
   * Used for server API calls when updating or deleting edges
   */
  pageId: string;

  /**
   * Unique ID of the edge to edit
   */
  edgeId: string;

  /**
   * Unique ID of the organization
   * Used for permission validation and data access control
   * Optional: can be extracted from edge data if not provided
   */
  orgId?: string;

  /**
   * Unique ID of the workspace
   * Used for context identification during edge operations
   * Optional: can be extracted from edge data if not provided
   */
  workspaceId?: string;

  /**
   * Business logic injection (optional)
   *
   * By default, the actual business logic for production environments is used,
   * but mock logic can be injected in test or storybook environments.
   *
   * @default undefined - Uses default business logic when omitted
   *
   * @example
   * ```tsx
   * // Production (default)
   * const toolbar = useEdgeToolbar({
   *   pageId: 'page-1',
   *   edgeId: 'edge-1',
   *   orgId: 'org-1',
   *   workspaceId: 'ws-1',
   * });
   *
   * // Test/Storybook (Mock injection)
   * const mockBusiness = useMockEdgeToolbarBusiness();
   * const toolbar = useEdgeToolbar(
   *   { pageId: 'page-1', edgeId: 'edge-1', orgId: 'org-1', workspaceId: 'ws-1' },
   *   mockBusiness
   * );
   * ```
   */
  businessLogic?: EdgeToolbarBusinessLogic;
}

/**
 * Edge Toolbar Hook return type
 *
 * This interface defines all values returned by the `useEdgeToolbar` hook.
 * It includes UI state, handler functions, and edge state information.
 *
 * @interface UseEdgeToolbarReturn
 */
export interface UseEdgeToolbarReturn {
  /**
   * Reference to the toolbar DOM element
   * Used for positioning calculations or external click detection
   */
  toolbarRef: React.RefObject<HTMLDivElement | null>;

  /**
   * Current edge state (shape, color, width)
   */
  edgeState: EdgeState;

  /**
   * Handler to update edge shape
   * @param shape - New edge shape: 'default' | 'straight' | 'smoothstep'
   * @example
   * ```tsx
   * const { handleShapeChange } = useEdgeToolbar(props);
   * handleShapeChange('straight'); // Change edge to straight line
   * ```
   */
  handleShapeChange: (shape: EdgeShape) => Promise<void>;

  /**
   * Handler to update edge color
   * @param colorToken - New color token
   * @example
   * ```tsx
   * const { handleColorChange } = useEdgeToolbar(props);
   * handleColorChange(ColorToken.BLUE); // Change edge color to blue
   * ```
   */
  handleColorChange: (colorToken: ColorToken) => Promise<void>;

  /**
   * Handler to update edge width
   * @param width - New edge width: 1 | 2 | 3
   * @example
   * ```tsx
   * const { handleWidthChange } = useEdgeToolbar(props);
   * handleWidthChange(2); // Change edge width to medium
   * ```
   */
  handleWidthChange: (width: EdgeWidth) => Promise<void>;

  /**
   * Handler to delete edge
   * @example
   * ```tsx
   * const { handleDelete } = useEdgeToolbar(props);
   * handleDelete(); // Delete the edge
   * ```
   */
  handleDelete: () => Promise<void>;

  /**
   * Whether the toolbar should be visible based on zoom level
   * Toolbar is hidden when zoom is below 0.5 (semantic zooming)
   * @example
   * ```tsx
   * const { isZoomVisible } = useEdgeToolbar(props);
   * if (!isZoomVisible) return null; // Hide toolbar when zoomed out
   * ```
   */
  isZoomVisible: boolean;

  /**
   * Current zoom level
   * @example
   * ```tsx
   * const { zoom } = useEdgeToolbar(props);
   * console.log(zoom); // Current zoom level
   * ```
   */
  zoom: number;
}
