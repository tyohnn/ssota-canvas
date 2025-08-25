"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";

// 상태 타입
export interface ControlState {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  toolMode: 'select' | 'hand' | 'connect';
}

// 액션 타입
type ControlAction =
  | { type: 'SET_VIEWPORT'; payload: { x: number; y: number; zoom: number } }
  | { type: 'SET_TOOL_MODE'; payload: 'select' | 'hand' | 'connect' };

// 초기 상태
const initialState: ControlState = {
  viewport: { x: 0, y: 0, zoom: 1 },
  toolMode: 'select',
};

// 리듀서
function controlReducer(
  state: ControlState,
  action: ControlAction
): ControlState {
  switch (action.type) {
    case 'SET_VIEWPORT':
      return { ...state, viewport: action.payload };
    
    case 'SET_TOOL_MODE':
      return { ...state, toolMode: action.payload };
    
    default:
      return state;
  }
}

// 컨텍스트 타입
interface ControlContextValue {
  state: ControlState;
  commands: {
    setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
    setToolMode: (mode: 'select' | 'hand' | 'connect') => void;
  };
}

// 컨텍스트 생성
const ControlContext = createContext<ControlContextValue | null>(null);

// 프로바이더 컴포넌트
export function ControlProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(controlReducer, initialState);

  const commands = {
    setViewport: useCallback((viewport: { x: number; y: number; zoom: number }) => {
      dispatch({ type: 'SET_VIEWPORT', payload: viewport });
    }, []),

    setToolMode: useCallback((mode: 'select' | 'hand' | 'connect') => {
      dispatch({ type: 'SET_TOOL_MODE', payload: mode });
    }, []),
  };

  return (
    <ControlContext.Provider value={{ state, commands }}>
      {children}
    </ControlContext.Provider>
  );
}

// 훅
export function useControl() {
  const context = useContext(ControlContext);
  if (!context) {
    throw new Error('useControl must be used within ControlProvider');
  }
  return context;
}

export function useControlState() {
  return useControl().state;
}

export function useControlCommands() {
  return useControl().commands;
}
