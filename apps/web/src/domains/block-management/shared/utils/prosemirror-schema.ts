/**
 * Shared ProseMirror schema for block content (TipTap-compatible).
 * Used by:
 * - Server: applying steps in apply-block-content-steps.service
 * - Must match the client editor schema (MARKDOWN_EXTENSIONS) so steps apply correctly.
 */
import { getSchema } from '@tiptap/core';

import { MARKDOWN_EXTENSIONS } from './tiptap-markdown.utils';

export const pmSchema = getSchema(MARKDOWN_EXTENSIONS);
