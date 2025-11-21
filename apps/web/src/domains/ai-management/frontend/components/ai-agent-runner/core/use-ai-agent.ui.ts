'use client';

import { useState, useCallback } from 'react';

/**
 * AI Agent UI State
 * 순수 UI 상태만 관리 (비즈니스 로직 없음)
 *
 * NoCode 호환: 디자이너가 Framer에서 독립적으로 사용 가능
 */
export interface AIAgentUIState {
  // Conversation 호버 상태
  isHovered: boolean;
  isFocused: boolean;

  // UI 액션
  setHovered: (hovered: boolean) => void;
  focusConversation: () => void;
  autoUnfocus: () => void;
}

/**
 * useAIAgentUI
 * Conversation 호버 및 포커싱 상태 관리
 *
 * 특징:
 * - 비즈니스 로직 없음
 * - 로컬 상태 관리만
 * - NoCode 환경에서 독립적으로 테스트 가능
 */
export function useAIAgentUI(): AIAgentUIState {
  const [isHovered, setHovered] = useState(false);
  const [isFocused, setFocused] = useState(false);

  /**
   * Conversation 포커싱
   * Agent 완료 시 자동으로 호출되어 결과 확인
   */
  const focusConversation = useCallback(() => {
    setFocused(true);
  }, []);

  /**
   * 자동 축소
   * 3초 후 자동으로 포커싱 해제
   */
  const autoUnfocus = useCallback(() => {
    setTimeout(() => {
      setFocused(false);
    }, 3000);
  }, []);

  return {
    isHovered,
    isFocused,
    setHovered,
    focusConversation,
    autoUnfocus,
  };
}
