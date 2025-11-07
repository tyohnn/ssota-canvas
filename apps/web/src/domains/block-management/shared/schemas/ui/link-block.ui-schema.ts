/**
 * Link Block UI Schema
 *
 * URL 프리뷰 블록의 Editor Panel UI를 정의하는 스키마
 */

import type { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const linkBlockUISchema: BlockUISchema = {
  blockType: BlockType.LINK,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: '링크 블럭의 기본 정보',
      defaultCollapsed: false,
      order: 1,
      properties: ['url'],
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
    url: {
      label: 'URL',
      inputType: 'url',
      icon: 'Link',
      description: '링크 URL (오픈그래프 메타데이터가 자동으로 표시됩니다)',
      placeholder: 'https://...',
      order: 1,
    },

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: '생성일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
      order: 2,
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
      order: 3,
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
      order: 4,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '알 수 없음';
        if (typeof value === 'string') return value;
        // UserProfile 타입: id, email, name, avatarUrl
        return value.name || value.email || '알 수 없음';
      },
    },
  },
};
