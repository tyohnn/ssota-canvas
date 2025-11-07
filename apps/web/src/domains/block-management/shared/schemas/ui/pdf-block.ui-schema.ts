/**
 * PDF Block UI Schema
 *
 * PDF 문서 뷰어 블록의 Editor Panel UI를 정의하는 스키마
 */

import type { BlockUISchema } from './block-ui-schema.interface';
import { BlockType } from '../../types/block-types';

export const pdfBlockUISchema: BlockUISchema = {
  blockType: BlockType.PDF,

  groups: [
    {
      id: 'basic-info',
      label: '기본 정보',
      description: 'PDF 파일 정보',
      defaultCollapsed: false,
      order: 1,
      properties: ['url', 'filename', 'pageCount'],
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
      label: 'PDF URL',
      inputType: 'url',
      icon: 'Link',
      description: 'PDF 파일 URL',
      placeholder: 'https://example.com/document.pdf',
      order: 1,
    },
    filename: {
      label: '파일명',
      inputType: 'text',
      icon: 'FileText',
      description: 'PDF 파일명',
      placeholder: 'document.pdf',
      order: 2,
    },
    pageCount: {
      label: '총 페이지 수',
      inputType: 'readonly-text',
      icon: 'Hash',
      description: '총 페이지 수',
      order: 3,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        return `${value} pages`;
      },
    },

    // 표시 옵션
    showPageNav: {
      label: '페이지 네비게이션',
      inputType: 'checkbox',
      icon: 'Navigation',
      description: '페이지 네비게이션 표시',
      order: 4,
      defaultDisplay: (value: any) => {
        return value ? '표시' : '숨김';
      },
    },
    showToolbar: {
      label: '툴바',
      inputType: 'checkbox',
      icon: 'Menu',
      description: '툴바 표시',
      order: 5,
      defaultDisplay: (value: any) => {
        return value ? '표시' : '숨김';
      },
    },
    enableAnnotations: {
      label: '주석 기능',
      inputType: 'checkbox',
      icon: 'Edit',
      description: '주석 기능 활성화',
      order: 6,
      defaultDisplay: (value: any) => {
        return value ? '활성화' : '비활성화';
      },
    },

    // 메타데이터 (공통)
    createdAt: {
      label: '생성 일시',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '블록 생성 일시',
      order: 101,
      readonly: true,
    },
    updatedAt: {
      label: '수정 일시',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: '마지막 수정 일시',
      order: 102,
      readonly: true,
    },
    createdBy: {
      label: '작성자',
      inputType: 'readonly-profile',
      icon: 'User',
      description: '블록 작성자',
      order: 103,
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
