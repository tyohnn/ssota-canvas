/**
 * Edge Label View Types
 *
 * Semantic grouping of props for better readability and maintainability.
 * Each type represents a logical group of related properties.
 *
 * Using `type` instead of `interface` for better IDE hover support.
 */

/**
 * Edge label state
 * - Current label content and editing state
 */
export type EdgeLabelState = {
  label: string;
  isEditing: boolean;
  draftLabel: string;
};

/**
 * Edge label position
 * - Position information for label placement
 */
export type EdgeLabelPosition = {
  x: number;
  y: number;
};

/**
 * Edge label handlers
 * - Event handlers for label interactions
 */
export type EdgeLabelHandlers = {
  onClick: (e: React.MouseEvent) => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * Edge label visual
 * - Visual state and styling
 */
export type EdgeLabelVisual = {
  isSelected: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
};

/**
 * Edge Label View Props
 *
 * Pattern: View (Semantic Grouping)
 * - Props are grouped by semantic meaning
 * - Improves readability and maintainability
 * - Easier to refactor and test
 */
export type EdgeLabelViewProps = {
  state: EdgeLabelState;
  position: EdgeLabelPosition;
  handlers: EdgeLabelHandlers;
  visual: EdgeLabelVisual;
};
