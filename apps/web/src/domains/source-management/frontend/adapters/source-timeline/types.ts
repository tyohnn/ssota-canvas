/**
 * Timeline Tab Types
 *
 * sources.raw_content 파싱 결과를 탭 UI에서 표시하기 위한 타입
 */
import type { TimelineScript } from '@/domains/source-management/shared/types/timeline-script.types';

export interface TimelineTabViewProps {
  sourceTitle: string | undefined;
  script: TimelineScript | undefined;
  extractedAt?: Date | string | null;
  isLoading: boolean;
  error: string | null;
  onExtractScript: () => Promise<void>;
  isExtracting: boolean;
  blockMountId?: string;
  blockData?: unknown;
  switchToTab?: (tabId: string) => void;
}

export interface UseSourceTimelineTabParams {
  blockSlug: string;
  sourceId: string | undefined;
  /** 블록에서 전달하는 제목 (표시용) */
  sourceTitle?: string;
  /** 에디터 패널에서 인용 시 노트 탭 전환용 (optional) */
  blockMountId?: string;
  blockData?: unknown;
  switchToTab?: (tabId: string) => void;
}

export interface UseSourceTimelineTabResult {
  sourceTitle: string | undefined;
  script: TimelineScript | undefined;
  extractedAt: Date | string | undefined;
  isLoading: boolean;
  error: string | null;
  handleExtractScript: () => Promise<void>;
  isExtracting: boolean;
}
