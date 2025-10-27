/**
 * Text Block UI Schema
 *
 * 텍스트 블록의 UI 렌더링 스키마
 */

import { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const textBlockUISchema: BlockUISchema = {
  blockType: BlockType.TEXT,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: '블록의 기본 정보',
      defaultCollapsed: false,
      order: 1,
      properties: ['content', 'title'],
    },
    {
      id: 'style',
      label: '스타일',
      description: '텍스트 스타일 설정',
      defaultCollapsed: true,
      order: 2,
      properties: ['color', 'textAlign', 'fontSize', 'richStyle'],
    },
    {
      id: 'metadata',
      label: '메타데이터',
      description: '생성 및 수정 정보',
      defaultCollapsed: true,
      order: 3,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
    },
  ],

  properties: {
    // 기본 정보
    content: {
      label: '내용',
      inputType: 'textarea',
      icon: 'FileText',
      description: '텍스트 블록의 내용',
      placeholder: '내용을 입력하세요',
      order: 1,
    },

    // 스타일
    color: {
      label: '텍스트 색상',
      inputType: 'color',
      icon: 'Palette',
      description: '텍스트의 색상',
      order: 2,
    },
    textAlign: {
      label: '텍스트 정렬',
      inputType: 'select',
      icon: 'AlignLeft',
      description: '텍스트 정렬 방향',
      order: 3,
      options: [
        { value: 'left', label: '왼쪽' },
        { value: 'center', label: '가운데' },
        { value: 'right', label: '오른쪽' },
      ],
    },
    fontSize: {
      label: '폰트 크기',
      inputType: 'select',
      icon: 'Type',
      description: '텍스트 크기',
      order: 4,
      options: [
        { value: '14px', label: '작게 (14px)' },
        { value: '16px', label: '보통 (16px)' },
        { value: '20px', label: '크게 (20px)' },
        { value: '24px', label: '매우 크게 (24px)' },
      ],
    },
    richStyle: {
      label: '리치 스타일',
      inputType: 'checkbox',
      icon: 'Bold',
      description: '리치 텍스트 스타일 활성화',
      order: 5,
    },

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: '생성일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
      order: 6,
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
      order: 8,
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
      order: 9,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '알 수 없음';
        if (typeof value === 'string') return value;
        return value.fullName || value.email || '알 수 없음';
      },
    },
  },
};
