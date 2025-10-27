import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Basic Block Schema
 *
 * 기본 텍스트 블록의 속성 스키마
 */
export const basicBlockSchema: BlockPropertySchema = {
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
