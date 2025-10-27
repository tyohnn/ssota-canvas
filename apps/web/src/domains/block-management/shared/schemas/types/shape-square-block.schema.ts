import { BlockPropertySchema } from '../block-schema.interface';

/**
 * Shape Square Block Schema
 *
 * 사각형 도형 블록의 속성 스키마
 */
export const shapeSquareBlockSchema: BlockPropertySchema = {
  required: ['width', 'height'],
  optional: ['color', 'borderColor', 'borderWidth'],
  defaults: {
    width: 100,
    height: 100,
    color: '#3b82f6',
    borderColor: '#1e40af',
    borderWidth: 2,
  },
  validation: {
    width: { type: 'number', required: true },
    height: { type: 'number', required: true },
    color: { type: 'string' },
    borderColor: { type: 'string' },
    borderWidth: { type: 'number' },
  },
};
