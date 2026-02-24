/**
 * Shared ProseMirror schema for block content (TipTap-compatible).
 * Used by:
 * - Server: applying steps in apply-block-content-steps.service
 * - Must match the client editor schema so steps apply correctly.
 *
 * Uses SCHEMA_EXTENSIONS_SERVER from schema-extensions.server.ts to avoid
 * loading @tiptap/extension-image or frontend Admonition—both trigger
 * "Cannot access src" client reference errors on the server.
 */
import { getSchema } from '@tiptap/core';

import { SCHEMA_EXTENSIONS_SERVER } from './schema-extensions.server';

export const pmSchema = getSchema(SCHEMA_EXTENSIONS_SERVER);
