/**
 * Block type definition: schema, tools, and metadata for a block type.
 * View mode (original/note/card) is not part of this; it is global in block-management.
 *
 * Block data change principle:
 * - 본문(content): Always user-editable; stored in blocks.content.
 * - Block data (properties etc.): Changed only via properties field and Block Tool (or system).
 */

import type { IToolDefinition } from './tool-definition.interface';

export interface SourceCapability {
  sourceType: string;
  extractable: boolean;
  summarizable: boolean;
}

export interface IBlockTypeDefinition {
  typeName: string;
  displayName: string;
  icon: string;
  propertiesSchema: Record<string, unknown>;
  defaultProperties?: Record<string, unknown>;
  blockTools: IToolDefinition[];
  /** Whether properties are directly user-editable in the UI. false = changed only via properties update / Block Tool. Content (blocks.content) is always editable. */
  isEditable: boolean;
  openType: boolean;
  sourceCapability?: SourceCapability;
}
