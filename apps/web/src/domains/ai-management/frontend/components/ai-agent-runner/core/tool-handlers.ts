/**
 * Tool Handlers
 *
 * AI Agent의 클라이언트 사이드 툴 실행 로직
 * 각 툴의 비즈니스 로직을 캡슐화하여 재사용성과 테스트 가능성 향상
 */

import { BlockType } from '@/domains/block-management/shared/types/block-types';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { convertMarkdownToTiptapJSON } from '@/domains/ai-management/frontend/utils/markdown-to-tiptap';
import type { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import type { useCanvasEdgeManagement } from '@/domains/canvas-management/frontend/hooks/use-canvas-edge-management';
import type { useBlockPropertyUpdate } from '@/domains/block-management/frontend/hooks/use-block-property-update';
import type { useBlockTitleUpdate } from '@/domains/block-management/frontend/hooks/use-block-title-update';
import type { useBlockContentUpdate } from '@/domains/block-management/frontend/hooks/use-block-content-update';
import type { useBlockActionExecutor } from '@/domains/ai-management/frontend/hooks/use-block-action-executor';
import type { useAutoPositionCalculator } from '@/domains/canvas-management/frontend/hooks/use-auto-position-calculator';
import type { useReactFlow } from '@xyflow/react';
import type { CustomNodeType } from '@/domains/canvas-management/frontend/acl/react-flow.acl';

/**
 * Tool Handler Result Types
 */
export interface AddBlocksResult {
  success: boolean;
  message: string;
  data: Array<{
    blockId: string;
    blockMountId: string;
    blockType: string;
    title: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    properties: any;
    content?: unknown;
  }>;
}

export interface UpdatePropertiesResult {
  success: boolean;
  message: string;
  updatedCount: number;
}

export interface BaseToolResult {
  success: boolean;
  message: string;
}

export interface SearchBlocksResult extends BaseToolResult {
  blocks: Array<{
    id: string;
    type: string;
    title: string;
  }>;
}

/**
 * Tool Result Type Map
 * 각 tool name에 대응하는 반환 타입
 */
export interface ExecuteBlockActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>[];
}

export type ToolResultTypeMap = {
  addBlocks: AddBlocksResult;
  updateTitle: BaseToolResult;
  updateContent: BaseToolResult;
  updateProperties: UpdatePropertiesResult;
  connectBlocks: BaseToolResult;
  executeBlockAction: ExecuteBlockActionResult;
  searchByKeywordInPage: SearchBlocksResult;
};

/**
 * Tool Handler Context
 * 툴 실행에 필요한 모든 의존성
 */
export interface ToolHandlerContext {
  blockLifecycle: ReturnType<typeof useCanvasBlockLifecycle>;
  edgeManagement: ReturnType<typeof useCanvasEdgeManagement>;
  blockPropertyUpdate: ReturnType<typeof useBlockPropertyUpdate>;
  blockTitleUpdate: ReturnType<typeof useBlockTitleUpdate>;
  blockContentUpdate: ReturnType<typeof useBlockContentUpdate>;
  blockActionExecutor: ReturnType<typeof useBlockActionExecutor>;
  positionCalculator: ReturnType<typeof useAutoPositionCalculator>;
  getNode: ReturnType<typeof useReactFlow>['getNode'];
  getNodes: ReturnType<typeof useReactFlow>['getNodes'];
  organizationId: string;
  workspaceId: string;
}

/**
 * Tool Handlers
 * 각 툴의 실행 로직을 캡슐화
 */
export const ToolHandlers = {
  /**
   * addBlocks: 하나 이상의 블럭 생성 (단수/복수 모두 처리)
   */
  async addBlocks(
    args: any,
    context: ToolHandlerContext
  ): Promise<AddBlocksResult> {
    if (
      !args.blocks ||
      !Array.isArray(args.blocks) ||
      args.blocks.length === 0
    ) {
      throw new Error('blocks array is required and cannot be empty');
    }

    const createdBlocks = [];

    for (const blockArgs of args.blocks) {
      if (!blockArgs.blockType) {
        throw new Error('blockType is required for all blocks');
      }
      if (!blockArgs.title) {
        throw new Error('title is required for all blocks');
      }

      // Position은 클라이언트에서 자동 계산
      const position = context.positionCalculator.calculatePosition(
        blockArgs.blockType,
        undefined
      );

      if (
        !position ||
        typeof position.x !== 'number' ||
        typeof position.y !== 'number'
      ) {
        throw new Error(
          `Failed to calculate valid position for block: ${blockArgs.title}`
        );
      }

      // Content 변환
      let finalContent = undefined;
      if (blockArgs.content) {
        finalContent = convertMarkdownToTiptapJSON(blockArgs.content);
      }

      // Properties 준비
      const initialProperties = blockArgs.properties || undefined;

      // 블록 생성 및 마운트
      const createdBlock = await context.blockLifecycle.createAndMountBlock(
        blockArgs.blockType as BlockType,
        position,
        initialProperties,
        finalContent,
        blockArgs.title
      );

      if (!createdBlock) {
        throw new Error(`Failed to create block: ${blockArgs.title}`);
      }

      createdBlocks.push({
        blockId: createdBlock.blockId,
        blockMountId: createdBlock.blockMountId,
        blockType: createdBlock.blockType,
        title: createdBlock.title,
        position: createdBlock.position,
        size: createdBlock.size,
        properties: createdBlock.properties,
        content: createdBlock.content,
      });
    }

    return {
      success: true,
      message: `Created ${createdBlocks.length} blocks`,
      data: createdBlocks.map(block => ({
        blockId: block.blockId,
        blockMountId: block.blockMountId,
        blockType: block.blockType,
        title: block.title,
        position: block.position,
        size: block.size,
        properties: block.properties,
      })),
    };
  },

  /**
   * updateTitle: 블럭 제목 업데이트
   */
  async updateTitle(
    args: any,
    context: ToolHandlerContext
  ): Promise<BaseToolResult> {
    // blockMountId로 React Flow node 조회
    const node = context.getNode(args.blockMountId);
    if (!node) {
      throw new Error(`Block not found: ${args.blockMountId}`);
    }

    const blockData = node.data as BlockNodeData;

    // Optimistic Update를 포함한 훅 사용
    await context.blockTitleUpdate.updateTitle(
      args.blockMountId, // nodeId (blockMountId)
      args.title,
      blockData
    );

    return {
      success: true,
      message: 'Block title updated.',
    };
  },

  /**
   * updateContent: 블럭 내용 업데이트
   */
  async updateContent(
    args: any,
    context: ToolHandlerContext
  ): Promise<BaseToolResult> {
    // blockMountId로 React Flow node 조회
    const node = context.getNode(args.blockMountId);
    if (!node) {
      throw new Error(`Block not found: ${args.blockMountId}`);
    }

    const blockData = node.data as BlockNodeData;
    const finalContent = convertMarkdownToTiptapJSON(args.content);

    // Optimistic Update를 포함한 훅 사용
    await context.blockContentUpdate.updateContent(
      args.blockMountId, // nodeId (blockMountId)
      finalContent,
      blockData,
      args.content // contentRaw (markdown text)
    );

    return {
      success: true,
      message: 'Block content updated.',
    };
  },

  /**
   * updateProperties: 하나 이상의 블럭의 properties 업데이트 (단수/복수 모두 처리)
   */
  async updateProperties(
    args: any,
    context: ToolHandlerContext
  ): Promise<UpdatePropertiesResult> {
    if (
      !args.updates ||
      !Array.isArray(args.updates) ||
      args.updates.length === 0
    ) {
      throw new Error('updates array is required and cannot be empty');
    }

    let updatedCount = 0;

    for (const update of args.updates) {
      if (!update.blockMountId) {
        throw new Error('blockMountId is required for all updates');
      }
      if (!update.properties || typeof update.properties !== 'object') {
        throw new Error('properties object is required for all updates');
      }

      // blockMountId로 React Flow node 조회
      const node = context.getNode(update.blockMountId);
      if (!node) {
        throw new Error(`Block not found: ${update.blockMountId}`);
      }

      const blockData = node.data as BlockNodeData;

      // Properties 업데이트
      await context.blockPropertyUpdate.updateProperties(
        update.blockMountId,
        update.properties,
        blockData
      );

      updatedCount++;
    }

    return {
      success: true,
      message: `Updated properties for ${updatedCount} blocks.`,
      updatedCount,
    };
  },

  /**
   * connectBlocks: 하나 이상의 블럭 간 연결 (단수/복수 모두 처리)
   */
  async connectBlocks(
    args: any,
    context: ToolHandlerContext
  ): Promise<BaseToolResult> {
    if (
      !args.connections ||
      !Array.isArray(args.connections) ||
      args.connections.length === 0
    ) {
      throw new Error('connections array is required and cannot be empty');
    }

    let connectedCount = 0;

    for (const connection of args.connections) {
      if (!connection.sourceBlockMountId || !connection.targetBlockMountId) {
        throw new Error(
          'sourceBlockMountId and targetBlockMountId are required for all connections'
        );
      }

      await context.edgeManagement.createEdge(
        connection.sourceBlockMountId, // blockMountId (React Flow node ID)
        connection.targetBlockMountId, // blockMountId (React Flow node ID)
        connection.edgeType || 'default',
        connection.sourceHandle, // 'top' | 'bottom' | 'left' | 'right' | undefined
        connection.targetHandle // 'top' | 'bottom' | 'left' | 'right' | undefined
      );

      connectedCount++;
    }

    return {
      success: true,
      message: `Created ${connectedCount} connection${connectedCount > 1 ? 's' : ''}.`,
    };
  },

  /**
   * executeBlockAction: 블럭 액션 실행
   */
  async executeBlockAction(
    args: any,
    context: ToolHandlerContext
  ): Promise<ExecuteBlockActionResult> {
    const { blockMountId, action, blockType, params: actionParams } = args;

    if (!blockMountId) {
      throw new Error('blockMountId is required');
    }
    if (!action) {
      throw new Error('action is required');
    }
    if (!blockType) {
      throw new Error('blockType is required');
    }

    // 🎯 Layer 1 (AI Agent): Tool 실행만 담당
    // Properties 업데이트 등 실제 동작은 Layer 2 (Executor)에서 처리
    const result = await context.blockActionExecutor.executeAction({
      blockId: blockMountId,
      action,
      blockType,
      params: actionParams ?? {},
    });

    // result.data에서 이미지 리스트 등 액션 결과 데이터 추출
    const actionData = result.data as any;
    const dataArray: Record<string, any>[] = [];

    // imageSearch의 경우: images 배열을 data로 변환
    if (action === 'imageSearch' && actionData?.images) {
      dataArray.push(...actionData.images);
    }
    // 다른 액션의 경우: data가 배열이면 그대로 사용
    else if (Array.isArray(actionData)) {
      dataArray.push(...actionData);
    }
    // data가 객체인 경우: 배열로 변환
    else if (actionData && typeof actionData === 'object') {
      dataArray.push(actionData);
    }

    return {
      success: result.success,
      message: result.message || 'Action executed successfully',
      data: dataArray.length > 0 ? dataArray : undefined,
    };
  },

  /**
   * searchByKeywordInPage: 키워드로 블럭 검색 (현재 페이지 내)
   */
  async searchByKeywordInPage(
    args: any,
    context: ToolHandlerContext
  ): Promise<SearchBlocksResult> {
    const keyword = args.keyword.toLowerCase();
    const allNodes = context.getNodes();
    const blockTypes = args.blockTypes as string[] | undefined;

    const matchedBlocks = allNodes.filter(node => {
      const blockData = node.data as BlockNodeData;

      if (blockTypes && blockTypes.length > 0) {
        if (!blockTypes.includes(blockData.blockType)) {
          return false;
        }
      }

      const searchText = [
        blockData.title,
        JSON.stringify(blockData.properties),
        JSON.stringify(blockData.content),
      ]
        .join(' ')
        .toLowerCase();

      return searchText.includes(keyword);
    });

    return {
      success: true,
      message: `Found ${matchedBlocks.length} blocks matching "${keyword}".`,
      blocks: matchedBlocks.map(node => ({
        id: node.id,
        type: (node.data as BlockNodeData).blockType,
        title: (node.data as BlockNodeData).title,
      })),
    };
  },
};
