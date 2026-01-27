'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIPreferencesContextType {
  mouseSensitivity: number;
  setMouseSensitivity: (value: number) => void;
}

const UIPreferencesContext = createContext<UIPreferencesContextType | undefined>(
  undefined
);

export function UIPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 기본값 1.0
  const [mouseSensitivity, setMouseSensitivity] = useState(1.0);

  // 초기 로드: 로컬 스토리지 확인
  useEffect(() => {
    // SSR safe check
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ui_mouse_sensitivity');
      if (saved) {
        setMouseSensitivity(parseFloat(saved));
      }
    }
  }, []);

  // 값 변경 시: 로컬 스토리지 저장
  const handleSetSensitivity = (value: number) => {
    setMouseSensitivity(value);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui_mouse_sensitivity', value.toString());
    }
  };

  return (
    <UIPreferencesContext.Provider
      value={{
        mouseSensitivity,
        setMouseSensitivity: handleSetSensitivity,
      }}
    >
      {children}
    </UIPreferencesContext.Provider>
  );
}

export const useUIPreferences = () => {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error(
      'useUIPreferences must be used within UIPreferencesProvider'
    );
  }
  return context;
};
