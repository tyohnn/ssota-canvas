'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface SummaryTOCSlotContextValue {
  tiptapContent: unknown | null;
  showTOC: boolean;
  setTOCData: (data: { tiptapContent: unknown; showTOC: boolean } | null) => void;
}

const SummaryTOCSlotContext = createContext<SummaryTOCSlotContextValue | null>(null);

export function SummaryTOCSlotProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<{ tiptapContent: unknown; showTOC: boolean } | null>(null);

  const setTOCData = useCallback((newData: { tiptapContent: unknown; showTOC: boolean } | null) => {
    setData((prev) => {
      if (newData === null) return null;
      if (prev && prev.tiptapContent === newData.tiptapContent && prev.showTOC === newData.showTOC)
        return prev;
      return newData;
    });
  }, []);

  const value = useMemo(
    () => ({
      tiptapContent: data?.tiptapContent ?? null,
      showTOC: data?.showTOC ?? false,
      setTOCData,
    }),
    [data?.tiptapContent, data?.showTOC, setTOCData]
  );

  return (
    <SummaryTOCSlotContext.Provider value={value}>{children}</SummaryTOCSlotContext.Provider>
  );
}

export function useSummaryTOCSlot() {
  return useContext(SummaryTOCSlotContext);
}
