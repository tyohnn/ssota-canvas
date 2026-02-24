import type { EventLogSummaryDTO } from '@/domains/event-management';

/**
 * AI Management Domain DTOs
 *
 * 특징:
 * - Plain Objects (직렬화 가능)
 * - Next.js Server Actions 호환
 * - Vercel AI SDK 호환
 */

export type { EventLogSummaryDTO } from '@/domains/event-management';

/**
 * Client Context DTO
 * 클라이언트에서 서버로 전달하는 컨텍스트 정보
 *
 * 사용:
 * - sendMessage의 metadata 필드로 전달
 * - 프론트엔드에서 이미 계산된 블럭 ID만 전달
 */
export interface ClientContextDTO {
  pageId: string; // 페이지 ID (UUID)
  workspaceId: string; // 워크스페이스 ID (UUID)
  organizationId: string; // 조직 ID (UUID)
  selectedBlockIds: string[]; // 선택된 블럭 ID 배열
  visibleBlockIds: string[]; // 화면에 보이는 블럭 ID 배열
  recentlyModifiedBlockIds?: string[]; // 최근 수정한 블럭 ID 배열
}

/**
 * Server Context DTO
 * 서버에서 조립한 컨텍스트
 */
export interface ServerContextDTO {
  shortTermMemory: EventLogSummaryDTO[]; // 최근 20개 이벤트
  longTermMemory: EventLogSummaryDTO[]; // 시맨틱 검색 결과
  selectedBlocks: BlockInfoDTO[]; // 선택된 블럭 전체 정보
  nearbyBlocks: BlockInfoDTO[]; // 주변 블럭 정보
  semanticBlocks: BlockInfoDTO[]; // 의미적 블럭 정보
}

/**
 * Block Info DTO
 * 블럭 기본 정보
 */
export interface BlockInfoDTO {
  blockId: string; // 실제 블록 ID
  blockMountId: string; // 블록 마운트 ID (React Flow node ID)
  type: string;
  title: string;
  properties: Record<string, unknown>;
  content?: unknown;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}
