"use client";

import React from "react";
import { useSelectionState } from "../contexts/SelectionContext";

// 드래그 선택 박스 컴포넌트
export function SelectionBox() {
  const { dragSelection } = useSelectionState();

  // dragSelection이 undefined이거나 드래그 중이 아니거나 선택 박스가 없으면 렌더링하지 않음
  if (!dragSelection || !dragSelection.isDragging || !dragSelection.selectionBox) {
    return null;
  }

  const { start, current } = dragSelection.selectionBox;

  // 선택 박스의 위치와 크기 계산
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const width = Math.abs(current.x - start.x);
  const height = Math.abs(current.y - start.y);

  return (
    <div
      className="absolute border-2 border-blue-500 bg-blue-100/10 pointer-events-none z-50"
      style={{
        left,
        top,
        width,
        height,
      }}
    />
  );
}
