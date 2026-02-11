'use client';

import { createContext, useCallback, useContext, useState } from 'react';

export interface CanvasLayoutContextValue {
  /** 우측 사이드바(채팅 패널) 열림 여부 */
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
  toggleRightSidebar: () => void;
}

const CanvasLayoutContext = createContext<CanvasLayoutContextValue | null>(null);

export function useCanvasLayout() {
  const ctx = useContext(CanvasLayoutContext);
  if (!ctx) {
    throw new Error('useCanvasLayout must be used within CanvasLayoutProvider');
  }
  return ctx;
}

interface CanvasLayoutProviderProps {
  children: React.ReactNode;
  defaultRightSidebarOpen?: boolean;
}

/**
 * 캔버스 페이지 레이아웃 컨텍스트
 * 좌측 사이드바 | (캔버스 | 우측 사이드바) 구조에서 우측 사이드바 상태 공유
 */
export function CanvasLayoutProvider({
  children,
  defaultRightSidebarOpen = true,
}: CanvasLayoutProviderProps) {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(
    defaultRightSidebarOpen
  );
  const toggleRightSidebar = useCallback(() => {
    setRightSidebarOpen(prev => !prev);
  }, []);

  return (
    <CanvasLayoutContext.Provider
      value={{
        rightSidebarOpen,
        setRightSidebarOpen,
        toggleRightSidebar,
      }}
    >
      {children}
    </CanvasLayoutContext.Provider>
  );
}
