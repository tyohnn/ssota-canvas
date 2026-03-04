/**
 * Editor Panel logic types
 *
 * BlockNodeData is imported from block-management when used in apps/web.
 * For package isolation, we use a minimal interface - callers ensure compatibility.
 */
export interface EditorPanelBusinessLogic {
  onTitleSave: (params: {
    resourceId: string;
    title: string;
    data: unknown;
  }) => Promise<void>;
  onClose: () => void;
}
