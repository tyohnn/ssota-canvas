/**
 * Property detail popover types (generic, package-owned)
 */

export interface DetailPopoverFieldLike {
  id: string;
  name: string;
  type: string;
  icon?: string | null;
  options?: Array<{
    id: string;
    label: string;
    value: string;
    color?: string;
    order: number;
    group?: string;
  }>;
}

export interface PropertyDetailPopoverDeps {
  /** Save property label (debounced) */
  saveLabel: (
    entityId: string,
    propertyId: string,
    label: string
  ) => Promise<void>;
  /** Save property icon (optimistic) */
  saveIcon: (
    entityId: string,
    propertyId: string,
    icon: string | null
  ) => Promise<void>;
  /** Delete property, then caller should close popover */
  deleteProperty: (entityId: string, propertyId: string) => Promise<void>;
  /** Duplicate property, then caller should close popover */
  duplicateProperty: (entityId: string, propertyId: string) => Promise<void>;
  /** Called when user requests close (Escape, etc.) */
  onRequestClose: () => void;
}
