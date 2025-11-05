/**
 * Image Block UI Schema
 *
 * 이미지 블록의 UI 렌더링 스키마
 */

import { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const imageBlockUISchema: BlockUISchema = {
  blockType: BlockType.IMAGE,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: '이미지 블럭의 기본 정보',
      defaultCollapsed: false,
      order: 1,
      properties: ['imageUrl', 'caption', 'alt'],
    },
    {
      id: 'style',
      label: '스타일',
      description: '이미지 스타일 설정',
      defaultCollapsed: false,
      order: 2,
      properties: ['objectFit'],
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
    imageUrl: {
      label: '이미지',
      inputType: 'image-upload',
      icon: 'Image',
      description: '이미지 파일 업로드',
      order: 1,
      readonly: false,
    },
    caption: {
      label: '캡션',
      inputType: 'text',
      icon: 'MessageSquare',
      description: '이미지 설명 또는 캡션 (하단에 작게 표시됨)',
      placeholder: '캡션을 입력하세요...',
      order: 2,
    },
    alt: {
      label: '대체 텍스트',
      inputType: 'text',
      icon: 'AudioLines',
      description: '접근성을 위한 대체 텍스트',
      placeholder: '이미지 설명...',
      order: 3,
    },

    // 스타일
    objectFit: {
      label: '맞춤 방식',
      inputType: 'select',
      icon: 'Maximize',
      description: '이미지를 컨테이너에 맞추는 방식',
      order: 4,
      options: [
        { value: 'contain', label: '전체 표시' },
        { value: 'cover', label: '채우기' },
        { value: 'fill', label: '늘리기' },
      ],
    },

    // 메타데이터 (읽기 전용)
    createdAt: {
      label: '생성일',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록이 생성된 날짜',
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
    updatedAt: {
      label: '수정일',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: '블록이 마지막으로 수정된 날짜',
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
    createdBy: {
      label: '작성자',
      inputType: 'readonly-profile',
      icon: 'User',
      description: '블록을 생성한 사용자',
      order: 7,
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
