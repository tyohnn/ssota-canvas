// 로컬 스토리지 키 상수
export const CANVAS_STORAGE_KEYS = {
  VIEWPORT_STATE: 'canvas-viewport-state',
  SELECTED_BLOCKS: 'canvas-selected-blocks',
  SNAP_SETTINGS: 'canvas-snap-settings',
} as const;

// 뷰포트 상태 인터페이스 (단일 페이지용)
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
  lastUpdated: string;
}

// 여러 페이지의 뷰포트 상태를 저장하는 Map 구조
export interface ViewportStateMap {
  [pageId: string]: ViewportState;
}

// 스냅 설정 인터페이스
export interface SnapSettings {
  enabled: boolean;
  threshold: number;
  showGuidelines: boolean;
}

/**
 * 기존 단일 페이지 구조를 새로운 Map 구조로 마이그레이션
 */
function migrateOldViewportData(): void {
  try {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.VIEWPORT_STATE);
    if (!stored) return;

    const data = JSON.parse(stored);

    // 이미 새로운 구조인 경우 (pageId 키가 없고 객체의 값이 ViewportState)
    if (typeof data === 'object' && !data.pageId) {
      return;
    }

    // 기존 구조인 경우 ({ pageId, zoomLevel, center, ... })
    if (data.pageId && data.zoomLevel !== undefined && data.center) {
      const oldPageId = data.pageId;
      const migratedData: ViewportStateMap = {
        [oldPageId]: {
          x: -(data.center.x * data.zoomLevel),
          y: -(data.center.y * data.zoomLevel),
          zoom: data.zoomLevel,
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        },
      };
      localStorage.setItem(
        CANVAS_STORAGE_KEYS.VIEWPORT_STATE,
        JSON.stringify(migratedData)
      );
    }
  } catch (error) {
    console.warn('Failed to migrate old viewport data:', error);
  }
}

// 뷰포트 상태 저장/로드 함수들
export function getViewportStateFromStorage(
  pageId: string
): ViewportState | null {
  try {
    if (typeof window === 'undefined') return null;

    // 마이그레이션 시도
    migrateOldViewportData();

    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.VIEWPORT_STATE);
    if (!stored) return null;

    const data: ViewportStateMap = JSON.parse(stored);

    // 해당 페이지의 뷰포트 상태 반환
    if (data[pageId]) {
      return data[pageId];
    }

    return null;
  } catch (error) {
    console.warn('Failed to get viewport state from storage:', error);
    return null;
  }
}

export function setViewportStateToStorage(
  pageId: string,
  viewportState: Omit<ViewportState, 'lastUpdated'>
): void {
  try {
    if (typeof window === 'undefined') return;

    // 기존 데이터 로드
    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.VIEWPORT_STATE);
    let data: ViewportStateMap = {};

    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {
        data = {};
      }
    }

    // 해당 페이지의 뷰포트 상태 업데이트
    data[pageId] = {
      ...viewportState,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(
      CANVAS_STORAGE_KEYS.VIEWPORT_STATE,
      JSON.stringify(data)
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

    const stored = localStorage.getItem(CANVAS_STORAGE_KEYS.VIEWPORT_STATE);
    if (!stored) return;

    const data: ViewportStateMap = JSON.parse(stored);

    // 해당 페이지의 뷰포트 상태만 삭제
    if (data[pageId]) {
      delete data[pageId];
      localStorage.setItem(
        CANVAS_STORAGE_KEYS.VIEWPORT_STATE,
        JSON.stringify(data)
      );
    }

    // 선택된 블럭은 페이지별로 저장하지 않으므로 유지
  } catch (error) {
    console.warn('Failed to clear canvas storage for page:', error);
  }
}
