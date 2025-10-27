import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Code Block Schema
 *
 * 코드 블록의 속성 스키마
 */
export const codeBlockSchema: BlockPropertySchema = {
  required: ['language', 'code'],
  optional: ['title', 'description', 'lineNumbers'],
  defaults: {
    language: 'javascript',
    code: '',
    title: '',
    description: '',
    lineNumbers: true,
  },
  validation: {
    language: { type: 'string', minLength: 1, required: true },
    code: { type: 'string', minLength: 1, required: true },
    title: { type: 'string', maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    lineNumbers: { type: 'boolean' },
  },
};
