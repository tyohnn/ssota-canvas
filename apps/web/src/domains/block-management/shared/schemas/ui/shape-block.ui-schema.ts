/**
 * Shape Block UI Schema
 *
 * 도형 블록의 UI 렌더링 스키마
 */

import { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const shapeBlockUISchema: BlockUISchema = {
  blockType: BlockType.SHAPE,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: '도형의 기본 정보',
      defaultCollapsed: false,
      order: 1,
      properties: ['shapeType', 'content', 'color', 'borderStyle'],
    },
    {
      id: 'metadata',
      label: '메타데이터',
      description: '생성 및 수정 정보',
      defaultCollapsed: true,
      order: 2,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // 기본 정보
    shapeType: {
      label: '도형 타입',
      inputType: 'select',
      icon: 'Shapes',
      description: '도형의 종류를 선택',
      order: 1,
      options: [
        { value: 'rectangle', label: '사각형' },
        { value: 'circle', label: '원' },
        { value: 'ellipse', label: '타원' },
        { value: 'triangle', label: '삼각형' },
        { value: 'diamond', label: '다이아몬드' },
        { value: 'hexagon', label: '육각형' },
        { value: 'parallelogram', label: '평행사변형' },
        { value: 'cylinder', label: '원기둥' },
      ],
    },
    content: {
      label: '텍스트',
      inputType: 'textarea',
      icon: 'Type',
      description: '도형 내부에 표시할 텍스트',
      placeholder: '텍스트를 입력하세요...',
      order: 2,
    },
    color: {
      label: '색상',
      inputType: 'color',
      icon: 'Palette',
      description: '도형의 색상',
      order: 3,
    },
    borderStyle: {
      label: '테두리 스타일',
      inputType: 'select',
      icon: 'Minus',
      description: '테두리 스타일',
      order: 4,
      options: [
        { value: 'solid', label: '실선' },
        { value: 'dashed', label: '대시선' },
        { value: 'dotted', label: '점선' },
      ],
    },

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: '생성일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
      order: 4,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    updatedAt: {
      label: '수정일',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: '블록이 마지막으로 수정된 날짜',
      order: 5,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    createdBy: {
      label: '작성자',
      inputType: 'readonly-profile',
      icon: 'User',
      description: '블록을 생성한 사용자',
      order: 6,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '알 수 없음';
        if (typeof value === 'string') return value;
        // UserProfile 타입: userId, email, name, profileImageUrl
        return value.name || value.email || '알 수 없음';
      },
    },
  },
};

