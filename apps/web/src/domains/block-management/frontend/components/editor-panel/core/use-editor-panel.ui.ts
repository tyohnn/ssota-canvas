/**
 * Editor Panel UI state
 *
 * Expanded, open/close animation, tab switch registration.
 * Title lives in TitleInputView; no domain deps here.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useEditorPanelUI(isOpen: boolean) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const tabSwitchCallbackRef = useRef<((tabId: string) => void) | null>(null);
  const [tabSwitchCallback, setTabSwitchCallback] = useState<
    ((tabId: string) => void) | null
  >(null);

  const switchToTab = useCallback((tabId: string) => {
    if (tabSwitchCallbackRef.current) {
      tabSwitchCallbackRef.current(tabId);
    }
  }, []);

  useEffect(() => {
    tabSwitchCallbackRef.current = tabSwitchCallback;
  }, [tabSwitchCallback]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const t = setTimeout(() => setIsAnimating(true), 10);
      return () => clearTimeout(t);
    } else {
      setIsAnimating(false);
      const t = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  return {
    isExpanded,
    setIsExpanded,
    shouldRender,
    isAnimating,
    tabSwitchCallback,
    setTabSwitchCallback,
    switchToTab,
  };
}
