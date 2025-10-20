'use client';

import React, { useState } from 'react';

/**
 * Block Type 정의 (임시)
 * TODO: Block Management Domain의 BlockTypeInfo 타입 import
 */
interface BlockType {
  type: string;
  displayName: string;
  icon: string;
  description: string;
}

/**
 * 기본 블럭 타입 목록 (임시)
 * TODO: Block Management Domain의 useBlockManagement Hook에서 가져오기
 */
const DEFAULT_BLOCK_TYPES: BlockType[] = [
  {
    type: 'text',
    displayName: '텍스트',
    icon: '📝',
    description: '일반 텍스트 블럭',
  },
  {
    type: 'image',
    displayName: '이미지',
    icon: '🖼️',
    description: '이미지 블럭',
  },
  {
    type: 'code',
    displayName: '코드',
    icon: '💻',
    description: '코드 블럭',
  },
  {
    type: 'shape',
    displayName: '도형',
    icon: '⬜',
    description: '기본 도형',
  },
  {
    type: 'youtube',
    displayName: '유튜브',
    icon: '▶️',
    description: '유튜브 영상',
  },
  {
    type: 'map',
    displayName: '지도',
    icon: '🗺️',
    description: '지도 블럭',
  },
];

/**
 * BlockAddDialog Props
 */
export interface BlockAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlockType: (blockType: string) => void;
  workspaceId?: string;
}

/**
 * BlockAddDialog Component
 *
 * 블럭 타입 선택을 위한 다이얼로그 컴포넌트
 *
 * Features:
 * - 카테고리별 블럭 타입 목록 표시 (도형, 유튜브, 이미지, 영상, 지도 등)
 * - 각 타입에 아이콘과 이름 표시
 * - 검색 기능으로 타입 필터링
 * - 선택 시 블럭 생성 모드 활성화
 *
 * TODO: Block Management Domain의 BlockTypeSelector 컴포넌트 재사용
 * TODO: useBlockManagement Hook으로 블록 타입 정보 조회
 * TODO: 워크스페이스 권한 기반 타입 활성화/비활성화
 */
export function BlockAddDialog({
  isOpen,
  onClose,
  onSelectBlockType,
  workspaceId,
}: BlockAddDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 검색 필터링
  const filteredBlockTypes = DEFAULT_BLOCK_TYPES.filter(
    blockType =>
      blockType.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blockType.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBlockType = (blockType: string) => {
    onSelectBlockType(blockType);
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              블럭 타입 선택
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 검색 */}
          <input
            type="text"
            placeholder="블럭 타입 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 블럭 타입 그리드 */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredBlockTypes.map(blockType => (
              <button
                key={blockType.type}
                onClick={() => handleSelectBlockType(blockType.type)}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl">{blockType.icon}</span>
                  <span className="font-semibold text-gray-900">
                    {blockType.displayName}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{blockType.description}</p>
              </button>
            ))}
          </div>

          {/* 검색 결과 없음 */}
          {filteredBlockTypes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t p-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            💡 Tip: 블럭을 선택하면 캔버스에 추가할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
