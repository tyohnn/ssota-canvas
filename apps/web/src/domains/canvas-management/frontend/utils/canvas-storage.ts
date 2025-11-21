// 로컬 스토리지 키 상수
export const CANVAS_STORAGE_KEYS = {
  VIEWPORT_STATE: 'canvas-viewport-state',
  SELECTED_BLOCKS: 'canvas-selected-blocks',
  SNAP_SETTINGS: 'canvas-snap-settings',
} as const;

// 뷰포트 상태 인터페이스
export interface ViewportState {
  pageId: string;
  zoomLevel: number;
  center: { x: number; y: number };
  lastUpdated: string;
}

// 스냅 설정 인터페이스
export interface SnapSettings {
  enabled: boolean;
  threshold: number;
  showGuidelines: boolean;
}

// 뷰포트 상태 저장/로드 함수들
export function getViewportStateFromStorage(
  pageId: string
): ViewportState | null {
  try {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.VIEWPORT_STATE);
    if (!stored) return null;

    const data: ViewportState = JSON.parse(stored);

    // 해당 페이지의 뷰포트 상태인지 확인
    if (data.pageId === pageId) {
      return data;
    }

    return null;
  } catch (error) {
    console.warn('Failed to get viewport state from storage:', error);
    return null;
  }
}

export function setViewportStateToStorage(viewportState: ViewportState): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      CANVAS_STORAGE_KEYS.VIEWPORT_STATE,
      JSON.stringify(viewportState)
    );
  } catch (error) {
    console.warn('Failed to save viewport state to storage:', error);
  }
}

// 선택된 블럭 저장/로드 함수들
export function getSelectedBlocksFromStorage(): string[] {
  try {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.SELECTED_BLOCKS);
    if (!stored) return [];

    const data: string[] = JSON.parse(stored);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn('Failed to get selected blocks from storage:', error);
    return [];
  }
}

export function setSelectedBlocksToStorage(blockIds: string[]): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      CANVAS_STORAGE_KEYS.SELECTED_BLOCKS,
      JSON.stringify(blockIds)
    );
  } catch (error) {
    console.warn('Failed to save selected blocks to storage:', error);
  }
}

// 스냅 설정 저장/로드 함수들
export function getSnapSettingsFromStorage(): SnapSettings {
  try {
    if (typeof window === 'undefined') {
      return {
        enabled: true,
        threshold: 5,
        showGuidelines: true,
      };
    }

    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.SNAP_SETTINGS);
    if (!stored) {
      return {
        enabled: true,
        threshold: 5,
        showGuidelines: true,
      };
    }

    const data: SnapSettings = JSON.parse(stored);
    return {
      enabled: data.enabled ?? true,
      threshold: data.threshold ?? 5,
      showGuidelines: data.showGuidelines ?? true,
    };
  } catch (error) {
    console.warn('Failed to get snap settings from storage:', error);
    return {
      enabled: true,
      threshold: 5,
      showGuidelines: true,
    };
  }
}

export function setSnapSettingsToStorage(settings: SnapSettings): void {
  try {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      CANVAS_STORAGE_KEYS.SNAP_SETTINGS,
      JSON.stringify(settings)
    );
  } catch (error) {
    console.warn('Failed to save snap settings to storage:', error);
  }
}

// 로컬 스토리지 정리 함수 (특정 페이지 데이터 삭제)
export function clearCanvasStorageForPage(pageId: string): void {
  try {
    if (typeof window === 'undefined') return;

    // 뷰포트 상태에서 해당 페이지 데이터만 삭제
    const viewportState = getViewportStateFromStorage(pageId);
    if (viewportState) {
      localStorage.removeItem(CANVAS_STORAGE_KEYS.VIEWPORT_STATE);
    }

    // 선택된 블럭은 페이지별로 저장하지 않으므로 유지
  } catch (error) {
    console.warn('Failed to clear canvas storage for page:', error);
  }
}
