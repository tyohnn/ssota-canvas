import type { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';
import { ColorToken } from '../../types/style-tokens.types';

/**
 * Markdown Block UI Schema
 *
 * 마크다운 블록의 속성 UI 정의
 * - 최소한의 속성만 포함 (color)
 * - content는 block.content JSONB로 별도 관리
 */
export const markdownBlockUISchema: BlockUISchema = {
  blockType: BlockType.MARKDOWN,
  groups: [
    {
      id: 'style',
      label: '스타일',
      description: '블록 스타일 설정',
      defaultCollapsed: true,
      order: 1,
      properties: ['color'],
    },
    {
      id: 'metadata',
      label: '메타데이터',
      description: '생성 및 수정 정보',
      defaultCollapsed: true,
      order: 100,
      properties: ['createdAt', 'updatedAt'],
    },
  ],
  properties: {
    color: {
      label: '배경 색상',
      inputType: 'color',
      description: '블록의 배경 색상',
      options: Object.values(ColorToken).map(token => ({
        value: token,
        label: token,
      })),
      order: 1,
    },
    createdAt: {
      label: '생성 일시',
      inputType: 'readonly-datetime',
      description: '블록이 생성된 일시',
      order: 101,
      readonly: true,
    },
    updatedAt: {
      label: '수정 일시',
      inputType: 'readonly-datetime',
      description: '블록이 마지막으로 수정된 일시',
      order: 102,
      readonly: true,
    },
  },
};
