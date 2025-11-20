/**
 * Editor Panel UI State Hook
 *
 * 디자이너가 Framer에서 사용하는 순수 UI 상태
 */

'use client';

import { useState, useRef, type RefObject } from 'react';

export interface EditorPanelUIState {
  // Animation state
  isAnimating: boolean;
  shouldRender: boolean;
  setIsAnimating: (value: boolean) => void;
  setShouldRender: (value: boolean) => void;

  // Title state
  title: string;
  setTitle: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

/**
 * UI 상태 관리 (로컬 상태만)
 */
export function useEditorPanelUI(): EditorPanelUIState {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return {
    isAnimating,
    shouldRender,
    setIsAnimating,
    setShouldRender,
    title,
    setTitle,
    inputRef,
  };
}
