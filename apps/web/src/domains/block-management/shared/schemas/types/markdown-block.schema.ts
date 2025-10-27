import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Markdown Block Schema
 *
 * 마크다운 블록의 속성 스키마
 */
export const markdownBlockSchema: BlockPropertySchema = {
  required: ['title', 'content'],
  optional: ['description', 'tags'],
  defaults: {
    title: '',
    content: '',
    description: '',
    tags: [],
  },
  validation: {
    title: { type: 'string', minLength: 1, maxLength: 100, required: true },
    content: { type: 'string', minLength: 1, required: true },
    description: { type: 'string', maxLength: 500 },
    tags: { type: 'array' },
  },
};
