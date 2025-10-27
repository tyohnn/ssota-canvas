import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Shape Circle Block Schema
 *
 * 원형 도형 블록의 속성 스키마
 */
export const shapeCircleBlockSchema: BlockPropertySchema = {
  required: ['radius'],
  optional: ['color', 'borderColor', 'borderWidth'],
  defaults: {
    radius: 50,
    color: '#3b82f6',
    borderColor: '#1e40af',
    borderWidth: 2,
  },
  validation: {
    radius: { type: 'number', required: true },
    color: { type: 'string' },
    borderColor: { type: 'string' },
    borderWidth: { type: 'number' },
  },
};
