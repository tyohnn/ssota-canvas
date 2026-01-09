/**
 * Note View UI Hook
 *
 * UI 상태 관리 및 UI 관련 로직
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { NoteViewUIState } from './types';

export interface UseNoteViewUIDependencies {
  canvasMode: {
    setTextareaEditing: (editing: boolean) => void;
  };
}

/**
 * Note View UI Hook
 *
 * UI 상태 관리 및 UI 이벤트 처리 담당
 * - 편집 상태 관리
 * - Debounce timer 관리
 * - Ref 관리
 * - 이벤트 리스너 등록 (ESC 키, 스크롤, 키보드 단축키)
 */
export function useNoteViewUI(
  selected: boolean,
  dependencies: UseNoteViewUIDependencies
): NoteViewUIState {
  // 편집 상태
  const [isEditing, setIsEditing] = useState(false);
  const [isDoubleClickMode, setIsDoubleClickMode] = useState(false);

  // Refs
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const previousContentRef = useRef<string>('');
  const editorReadyRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 블럭 더블클릭 핸들러 (편집 모드 진입)
  const handleBlockDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (selected) {
        e.stopPropagation();
        setIsDoubleClickMode(true);
      }
    },
    [selected]
  );

  // 에디터 클릭 핸들러 (편집 모드일 때만 propagation 차단)
  const handleEditorClick = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) {
        e.stopPropagation(); // 편집 중일 때만 전파 차단
      }
    },
    [isEditing]
  );

  // 편집 모드 진입 핸들러
  const handleEnterEditing = useCallback(() => {
    setIsEditing(true);
    dependencies.canvasMode.setTextareaEditing(true);
  }, [setIsEditing, dependencies.canvasMode]);

  // 편집 모드 종료 핸들러 (UI 상태만 관리)
  const handleExitEditing = useCallback(() => {
    setIsEditing(false);
    dependencies.canvasMode.setTextareaEditing(false);

    // Debounce timer 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [setIsEditing, debounceTimerRef, dependencies.canvasMode]);

  // ESC 키 핸들러
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleExitEditing();
        setIsDoubleClickMode(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, handleExitEditing, setIsDoubleClickMode]);

  // Editor 스크롤을 위해 네이티브 휠 이벤트 전파 막기
  // Container div를 스크롤 타겟으로 사용 (편집 모드일 때만)
  useEffect(() => {
    // 편집 중이 아니거나 container가 없으면 리스너 등록하지 않음
    if (!isEditing || !editorContainerRef.current) {
      return;
    }

    const editorContainer = editorContainerRef.current;

    const handleWheel = (e: WheelEvent) => {
      // React Flow로 이벤트 전파 차단
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();

      // Container div 스크롤 처리
      const newScrollTop = editorContainer.scrollTop + e.deltaY;
      editorContainer.scrollTop = newScrollTop;
    };

    // 캡처 단계에서 먼저 이벤트 리스너 등록하여 다른 리스너보다 우선 실행
    editorContainer.addEventListener('wheel', handleWheel, {
      passive: false,
      capture: true, // 캡처 단계에서 처리
    });

    return () => {
      editorContainer.removeEventListener('wheel', handleWheel, {
        capture: true,
      });
    };
  }, [isEditing, editorContainerRef]);

  // 편집 모드에서 키보드 단축키 이벤트 전파 막기 (사이드바 토글 방지)
  useEffect(() => {
    if (!isEditing || !editorContainerRef.current) {
      return;
    }

    const editorContainer = editorContainerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + B 조합 감지 (사이드바 토글)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'b') {
        // 브라우저 기본 동작 차단 (북마크바 토글 방지)
        e.preventDefault();
        // 이벤트 전파 차단 (사이드바가 토글되지 않도록)
        e.stopPropagation();
      }
    };

    // 버블링 단계에서 이벤트 리스너 등록 (Tiptap이 먼저 처리한 후 전파 차단)
    editorContainer.addEventListener('keydown', handleKeyDown);

    return () => {
      editorContainer.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, editorContainerRef]);

  return {
    isEditing,
    setIsEditing,
    isDoubleClickMode,
    setIsDoubleClickMode,
    editorContainerRef,
    previousContentRef,
    editorReadyRef,
    isInitialMountRef,
    debounceTimerRef,
    handleBlockDoubleClick,
    handleEditorClick,
    handleEnterEditing,
    handleExitEditing,
  };
}
