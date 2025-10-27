import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Video Block Schema
 *
 * 비디오 블록의 속성 스키마
 */
export const videoBlockSchema: BlockPropertySchema = {
  required: ['src', 'title'],
  optional: ['description', 'thumbnail', 'duration'],
  defaults: {
    src: '',
    title: '',
    description: '',
    thumbnail: '',
    duration: null,
  },
  validation: {
    src: { type: 'string', minLength: 1, required: true },
    title: { type: 'string', minLength: 1, maxLength: 100, required: true },
    description: { type: 'string', maxLength: 500 },
    thumbnail: { type: 'string' },
    duration: { type: 'number' },
  },
};
