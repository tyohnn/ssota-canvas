/**
 * Server-only extension list for ProseMirror schema.
 *
 * Must NOT import from:
 * - @tiptap/extension-image (triggers "Cannot access src" client reference on server)
 * - Frontend paths (admonition.extension from components)
 *
 * Uses ImageServerSafe and AdmonitionServerSafe instead.
 */
import {
  BackgroundColor,
  Color,
  TextStyle,
} from '@tiptap/extension-text-style';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import { TableKit } from '@tiptap/extension-table';
import { Mathematics } from '@tiptap/extension-mathematics';
import {
  Details,
  DetailsSummary,
  DetailsContent,
} from '@tiptap/extension-details';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { ImageServerSafe } from './image-server.extension';
import { AdmonitionServerSafe } from './admonition-server.extension';

/** Code with excludes: '' so it can coexist with bold, italic, color, etc. */
const CodeAllowOtherMarks = Code.extend({ excludes: '' });

export const SCHEMA_EXTENSIONS_SERVER = [
  StarterKit.configure({
    dropcursor: false,
    code: false,
  }),
  CodeAllowOtherMarks,
  TextStyle,
  Color.configure({ types: ['textStyle'] }),
  BackgroundColor.configure({ types: ['textStyle'] }),
  ImageServerSafe,
  TableKit,
  Mathematics.configure({ katexOptions: { throwOnError: false } }),
  Details,
  DetailsSummary,
  DetailsContent,
  TaskList,
  TaskItem,
  AdmonitionServerSafe,
];
