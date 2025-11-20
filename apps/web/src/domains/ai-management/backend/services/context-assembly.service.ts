import { EventLogRepository } from '../repositories/interfaces/event-log.repository.interface';
import { MemorySearchService } from './memory-search.service';
import {
  ContextAssemblyService as IContextAssemblyService,
  AssembledContext,
  CanvasContext,
  BlockInfo,
  AgentInputFormat,
  EventLogSummary,
} from './interfaces/context-assembly.service.interface';
import {
  AIManagementError,
  AIManagementErrorCode,
} from '../../shared/errors/ai-management.error';
import { adminDb } from '@/db';
import { blocks, blockMounts, edges } from '@/db/schema';
import { eq, inArray, and, isNull, or } from 'drizzle-orm';
import { SSOTA_SYSTEM_PROMPT } from './prompt/prompt';

/**
 * ContextAssemblyService 구현
 *
 * 3가지 컨텍스트(Short-Term, Long-Term, Canvas)를 병렬로 수집하고 조합
 *
 * 특징:
 * - Promise.all로 병렬 처리 (< 2초 목표)
 * - 권한 검증 및 필터링
 * - 삭제된 블럭 제외
 * - 부분 실패 허용 (최소한의 컨텍스트로 Agent 실행)
 */
export class ContextAssemblyService implements IContextAssemblyService {
  constructor(
    private readonly eventLogRepository: EventLogRepository,
    private readonly memorySearchService: MemorySearchService
    // TODO: CanvasManagementService 주입 (Canvas Context 조립용)
  ) {}

  /**
   * 전체 컨텍스트 조립
   * 3가지 컨텍스트를 병렬로 수집
   */
  async assembleContext(
    pageId: string,
    userId: string,
    utterance: string,
    selectedBlockIds?: string[],
    visibleBlockIds?: string[]
  ): Promise<AssembledContext> {
    try {
      // 1. 입력 검증
      this.validateInput(pageId, userId, utterance);

      // 2. 3가지 컨텍스트 병렬 조립 (Promise.all로 최적화)
      const [shortTermMemory, longTermMemory, canvasContext] =
        await Promise.all([
          this.assembleShortTermMemory(pageId, 20),
          this.assembleLongTermMemory(utterance, pageId, 10, 7),
          this.assembleCanvasContext(pageId, selectedBlockIds, visibleBlockIds),
        ]);

      return {
        shortTermMemory,
        longTermMemory,
        canvasContext,
      };
    } catch (error) {
      throw new AIManagementError(
        AIManagementErrorCode.CONTEXT_ASSEMBLY_FAILED,
        `Failed to assemble context: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Short-Term Memory 조립
   * 페이지별 최근 N개 이벤트 시간순 조회
   */
  async assembleShortTermMemory(
    pageId: string,
    limit: number = 20
  ): Promise<EventLogSummary[]> {
    try {
      const events = await this.eventLogRepository.findRecentByPageId(
        pageId,
        limit
      );

      // 메타데이터 필터링 (필요한 정보만 추출)
      return events.map(event => ({
        id: event.id.value,
        type: event.eventType.value,
        timestamp: event.timestamp.toISOString(),
        content: event.getContentAsString().slice(0, 200), // 최대 200자
        metadata: event.metadata,
      }));
    } catch (error) {
      console.error('Failed to assemble short-term memory:', error);
      return []; // 부분 실패 허용
    }
  }

  /**
   * Long-Term Memory 조립
   * BM25 검색으로 유사 이벤트 복원
   */
  async assembleLongTermMemory(
    queryText: string,
    pageId: string,
    topK: number = 10,
    timeWeightFactor: number = 7
  ): Promise<EventLogSummary[]> {
    try {
      const result = await this.memorySearchService.searchLongTermMemory(
        queryText,
        pageId,
        topK,
        timeWeightFactor,
        'hybrid'
      );

      // BM25 검색 결과를 컨텍스트 포맷으로 변환
      return result.events.map(event => ({
        id: event.id.value,
        type: event.eventType.value,
        timestamp: event.timestamp.toISOString(),
        content: event.getContentAsString().slice(0, 200), // 최대 200자
        timeAgo: this.formatTimeAgo(event.timestamp),
      }));
    } catch (error) {
      console.error('Failed to assemble long-term memory:', error);
      return []; // 부분 실패 허용
    }
  }

  /**
   * Canvas Context 조립
   * 선택/주변/연결/의미적 블럭 정보 수집
   */
  async assembleCanvasContext(
    pageId: string,
    selectedBlockIds?: string[],
    visibleBlockIds?: string[]
  ): Promise<CanvasContext> {
    try {
      // 1. 선택 블럭 조회
      const selectedBlocks = await this.getBlocksByIds(
        pageId,
        selectedBlockIds || []
      );

      // 2. 주변 블럭 조회 (visibleBlockIds에서 선택된 블럭 제외)
      const nearbyBlockIds = (visibleBlockIds || []).filter(
        id => !selectedBlockIds?.includes(id)
      );
      const nearbyBlocks = await this.getBlocksByIds(pageId, nearbyBlockIds);

      // 3. 연결된 블럭 조회 (1-hop via edges)
      const connectedBlocks = await this.getConnectedBlocks(
        pageId,
        selectedBlockIds || []
      );

      // 4. 의미적 블럭 조회 (MVP 스킵)
      const semanticBlocks: BlockInfo[] = [];

      return {
        selectedBlocks,
        nearbyBlocks,
        connectedBlocks,
        semanticBlocks,
      };
    } catch (error) {
      console.error('Failed to assemble canvas context:', error);
      return {
        selectedBlocks: [],
        nearbyBlocks: [],
        connectedBlocks: [],
        semanticBlocks: [],
      }; // 부분 실패 허용
    }
  }

  /**
   * 연결된 블럭 조회 (1-hop via edges)
   * 선택된 블럭과 edge로 연결된 블럭들을 반환
   */
  private async getConnectedBlocks(
    pageId: string,
    selectedBlockIds: string[]
  ): Promise<BlockInfo[]> {
    if (selectedBlockIds.length === 0) {
      return [];
    }

    try {
      // 1. 선택된 블럭과 연결된 edges 조회 (source 또는 target이 선택된 블럭인 경우)
      const connectedEdges = await adminDb
        .select({
          sourceBlockMountId: edges.source_block_mount_id,
          targetBlockMountId: edges.target_block_mount_id,
        })
        .from(edges)
        .where(
          and(
            eq(edges.page_id, pageId),
            or(
              inArray(edges.source_block_mount_id, selectedBlockIds),
              inArray(edges.target_block_mount_id, selectedBlockIds)
            ),
            isNull(edges.deleted_at)
          )
        );

      // 2. 연결된 블럭의 ID 수집 (선택된 블럭 제외)
      const connectedBlockIds = new Set<string>();
      for (const edge of connectedEdges) {
        // source가 선택된 블럭이면 target을 추가
        if (selectedBlockIds.includes(edge.sourceBlockMountId)) {
          connectedBlockIds.add(edge.targetBlockMountId);
        }
        // target이 선택된 블럭이면 source를 추가
        if (selectedBlockIds.includes(edge.targetBlockMountId)) {
          connectedBlockIds.add(edge.sourceBlockMountId);
        }
      }

      // 3. 선택된 블럭 자신은 제외
      const finalBlockIds = Array.from(connectedBlockIds).filter(
        id => !selectedBlockIds.includes(id)
      );

      // 4. 블럭 정보 조회
      return await this.getBlocksByIds(pageId, finalBlockIds);
    } catch (error) {
      console.error('Failed to get connected blocks:', error);
      return [];
    }
  }

  /**
   * 블럭 ID 목록으로 블럭 정보 조회
   *
   * @param pageId - 페이지 ID
   * @param blockMountIds - 블록 마운트 ID 목록 (React Flow node ID)
   */
  private async getBlocksByIds(
    pageId: string,
    blockMountIds: string[]
  ): Promise<BlockInfo[]> {
    if (blockMountIds.length === 0) {
      return [];
    }

    try {
      // adminDb로 블럭 + 마운트 정보 조회
      const results = await adminDb
        .select({
          blockMountId: blockMounts.id,
          blockId: blocks.id,
          blockType: blocks.block_type,
          title: blocks.title,
          properties: blocks.properties,
          customProperties: blocks.custom_properties,
          content: blocks.content,
          contentRaw: blocks.content_raw,
          positionX: blockMounts.position_x,
          positionY: blockMounts.position_y,
          sizeWidth: blockMounts.size_width,
          sizeHeight: blockMounts.size_height,
        })
        .from(blockMounts)
        .innerJoin(blocks, eq(blockMounts.block_id, blocks.id))
        .where(
          and(
            eq(blockMounts.page_id, pageId),
            inArray(blockMounts.id, blockMountIds),
            isNull(blockMounts.deleted_at),
            isNull(blocks.deleted_at)
          )
        );

      return results.map(row => ({
        blockId: row.blockId,
        blockMountId: row.blockMountId,
        type: row.blockType,
        title: row.title || 'Untitled',
        properties: (row.properties as Record<string, unknown>) || {},
        customProperties:
          (row.customProperties as Record<string, unknown>) || {},
        content: row.contentRaw || '', // Use content_raw instead of content
        position: {
          x: Number(row.positionX),
          y: Number(row.positionY),
        },
        size: {
          width: Number(row.sizeWidth),
          height: Number(row.sizeHeight),
        },
      }));
    } catch (error) {
      console.error('Failed to get blocks by ids:', error);
      return [];
    }
  }

  /**
   * Agent 입력 포맷으로 변환
   * AssembledContext를 Vercel AI SDK Agent 입력으로 변환
   */
  formatForAgent(context: AssembledContext): AgentInputFormat {
    // Short-Term Memory 포맷팅
    const shortTermMemoryText = context.shortTermMemory
      .map(event => `[${event.timestamp}] ${event.type}: ${event.content}`)
      .join('\n');

    // Long-Term Memory 포맷팅
    const longTermMemoryText = context.longTermMemory
      .map(event => `- ${event.content} (${event.timeAgo})`)
      .join('\n');

    // Selected Blocks 포맷팅 (JSON compact)
    const selectedBlocksText = context.canvasContext.selectedBlocks
      .map(block => {
        // JSON compact 형식으로 변환
        const blockData = {
          blockId: block.blockId,
          blockMountId: block.blockMountId,
          type: block.type,
          title: block.title,
          content: block.content,
          properties: block.properties,
          customProperties: block.customProperties,
        };
        return JSON.stringify(blockData);
      })
      .join('\n');

    // Nearby Blocks 포맷팅 (JSON compact, 간단하게)
    const nearbyBlocksText = context.canvasContext.nearbyBlocks
      .map(block => {
        const blockData = {
          blockId: block.blockId,
          blockMountId: block.blockMountId,
          type: block.type,
          title: block.title,
          content: block.content, // content_raw is used for context
          properties: block.properties,
          customProperties: block.customProperties,
        };
        return JSON.stringify(blockData);
      })
      .join('\n');

    // Connected Blocks 포맷팅 (JSON compact)
    const connectedBlocksText = context.canvasContext.connectedBlocks
      .map(block => {
        const blockData = {
          blockId: block.blockId,
          blockMountId: block.blockMountId,
          type: block.type,
          title: block.title,
          content: block.content,
          properties: block.properties,
          customProperties: block.customProperties,
        };
        return JSON.stringify(blockData);
      })
      .join('\n');

    // Semantic Blocks 포맷팅 (JSON compact)
    const semanticBlocksText = context.canvasContext.semanticBlocks
      .map(block => {
        const blockData = {
          blockId: block.blockId,
          blockMountId: block.blockMountId,
          type: block.type,
          title: block.title,
        };
        return JSON.stringify(blockData);
      })
      .join('\n');

    // Context Prompt 구성 (컨텍스트 정보만)
    const contextPrompt = `
## Current Context

### Recent Activity (Short-term Memory)
${shortTermMemoryText || 'None'}

### Similar Past Work (Long-term Memory)
${longTermMemoryText || 'None'}

### Selected Blocks (${context.canvasContext.selectedBlocks.length})
${selectedBlocksText || 'None'}

### Connected Blocks (${context.canvasContext.connectedBlocks.length})
${connectedBlocksText || 'None'}

### Nearby Blocks (${context.canvasContext.nearbyBlocks.length})
${nearbyBlocksText || 'None'}

### Semantic Blocks (${context.canvasContext.semanticBlocks.length})
${semanticBlocksText || 'None'}

Now, please help the user with their request.
    `.trim();

    return {
      contextPrompt,
      context: {
        shortTermMemory: shortTermMemoryText,
        longTermMemory: longTermMemoryText,
        selectedBlocks: selectedBlocksText,
        nearbyBlocks: nearbyBlocksText,
        semanticBlocks: semanticBlocksText,
      },
    };
  }

  /**
   * System Prompt 빌드
   * 전체 시스템 프롬프트 생성 (Base Prompt + Context Prompt)
   */
  buildSystemPrompt(context: AssembledContext): string {
    const { contextPrompt } = this.formatForAgent(context);

    return `
${SSOTA_SYSTEM_PROMPT}

${contextPrompt}
    `.trim();
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * 입력 검증
   */
  private validateInput(
    pageId: string,
    userId: string,
    utterance: string
  ): void {
    const UUID_REGEX =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!pageId || !UUID_REGEX.test(pageId)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'Page ID must be a valid UUID'
      );
    }

    if (!userId || !UUID_REGEX.test(userId)) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'User ID must be a valid UUID'
      );
    }

    if (!utterance || utterance.trim().length === 0) {
      throw new AIManagementError(
        AIManagementErrorCode.INVALID_INPUT,
        'Utterance cannot be empty'
      );
    }
  }

  /**
   * 시간 경과 포맷팅 (예: "2일 전", "1시간 전")
   */
  private formatTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}일 전`;
    if (diffHours > 0) return `${diffHours}시간 전`;
    if (diffMinutes > 0) return `${diffMinutes}분 전`;
    return `방금`;
  }
}
