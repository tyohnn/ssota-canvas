import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Image Block Schema
 *
 * 이미지 블록의 속성 스키마
 */
export const imageBlockSchema: BlockPropertySchema = {
  required: ['src', 'alt'],
  optional: ['caption', 'width', 'height'],
  defaults: {
    src: '',
    alt: '',
    caption: '',
    width: null,
    height: null,
  },
  validation: {
    src: { type: 'string', minLength: 1, required: true },
    alt: { type: 'string', minLength: 1, required: true },
    caption: { type: 'string', maxLength: 200 },
    width: { type: 'number' },
    height: { type: 'number' },
  },
};
