'use client';

import React, { useState } from 'react';
import { BlockAddDialog } from './block-add-dialog';

/**
 * BlockToolbar Props
 */
export interface BlockToolbarProps {
  pageId: string;
  onAddBlock?: () => void;
}

/**
 * BlockToolbar Component
 *
 * 블럭 선택 시 나타나는 컨텍스트 툴바 컴포넌트
 * (CanvasToolbar와 구분됨 - 이는 캔버스 상단 메인 툴바)
 *
 * Features:
 * - 선택된 블럭에 대한 편집 도구 제공
 * - 블럭 복제, 삭제 등의 액션 버튼
 * - 블럭별 세부 설정 옵션
 *
 * 렌더링 조건: isSingleSelectionMode() === true && isSelected(blockId)
 *
 * TODO: CM-002에서 BlockMountToolbar로 확장
 * TODO: BlockAddDialog 컴포넌트 연동
 */
export function BlockToolbar({ pageId, onAddBlock }: BlockToolbarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleAddBlock = () => {
    setShowAddDialog(true);
    onAddBlock?.();
  };

  const handleSelectBlockType = (blockType: string) => {
    console.log('Selected block type:', blockType, 'for page:', pageId);
    // TODO: createAndMountBlockAction 호출
    // TODO: 캔버스에 블럭 추가 로직
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* 블럭 추가 버튼 */}
        <button
          onClick={handleAddBlock}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          aria-label="블럭 추가"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>블럭 추가</span>
        </button>

        {/* TODO: 추가 도구들 */}
        {/* 정렬, 분포, 그룹화 등 */}
      </div>

      {/* 블럭 추가 다이얼로그 */}
      <BlockAddDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSelectBlockType={handleSelectBlockType}
      />
    </>
  );
}
