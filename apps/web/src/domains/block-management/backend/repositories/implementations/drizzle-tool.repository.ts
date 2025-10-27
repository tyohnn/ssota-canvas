import { eq, and, isNull } from 'drizzle-orm';
import { adminDb } from '@/db';
import { blocks } from '@/db/schema-dev';
import { BlockId } from '../../../shared/value-objects/block-id.vo';
import { BlockManagementError } from '../../../shared/errors/block-management.error';
import type {
  ToolRepository,
  ExecuteBlockToolRequest,
} from '../interfaces/tool.repository.interface';

/**
 * DrizzleToolRepository
 *
 * Drizzle ORM을 사용한 Block Tool 실행 구현
 */
export class DrizzleToolRepository implements ToolRepository {
  /**
   * 블록 툴 실행
   */
  async executeBlockTool(data: ExecuteBlockToolRequest): Promise<{
    workspaceId: string;
    canvasId: string;
    newBlocks?: any[];
    result?: any;
  }> {
    try {
      // Get the block to execute tool on
      const [block] = await adminDb
        .select()
        .from(blocks)
        .where(and(eq(blocks.id, data.blockId), isNull(blocks.deleted_at)))
        .limit(1);

      if (!block) {
        throw new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found');
      }

      // Simulate tool execution based on tool name
      let result: any = {};
      let newBlocks: any[] = [];

      switch (data.toolName) {
        case 'extract_text':
          result = {
            extractedText: 'Sample extracted text from block',
            confidence: 0.95,
          };
          break;
        case 'generate_summary':
          result = {
            summary: 'Generated summary of the block content',
            wordCount: 150,
          };
          break;
        case 'translate':
          result = {
            translatedText: 'Translated text content',
            sourceLanguage: 'en',
            targetLanguage: 'ko',
          };
          break;
        case 'analyze_sentiment':
          result = {
            sentiment: 'positive',
            score: 0.8,
            magnitude: 0.6,
          };
          break;
        case 'create_related_blocks':
          // Create new blocks as a result of tool execution
          newBlocks = [
            {
              id: crypto.randomUUID(),
              type: 'text',
              data: {
                properties: {
                  title: 'Related Block 1',
                  content: 'Generated related content',
                },
              },
              position: { x: 100, y: 100 },
            },
            {
              id: crypto.randomUUID(),
              type: 'text',
              data: {
                properties: {
                  title: 'Related Block 2',
                  content: 'Another related content',
                },
              },
              position: { x: 200, y: 200 },
            },
          ];
          result = {
            blocksCreated: newBlocks.length,
            message: 'Successfully created related blocks',
          };
          break;
        default:
          result = {
            message: `Tool ${data.toolName} executed successfully`,
            parameters: data.parameters,
          };
      }

      // Update block metadata with tool execution result
      const currentMetadata = (block.metadata as any) || {};
      const toolHistory = currentMetadata.toolHistory || [];

      const toolExecution = {
        id: crypto.randomUUID(),
        toolName: data.toolName,
        parameters: data.parameters,
        result,
        executedAt: new Date(),
      };

      const updatedMetadata = {
        ...currentMetadata,
        toolHistory: [...toolHistory, toolExecution],
        lastToolExecution: toolExecution,
      };

      await adminDb
        .update(blocks)
        .set({
          metadata: updatedMetadata,
          updated_at: new Date(),
        })
        .where(eq(blocks.id, data.blockId));

      return {
        workspaceId: block.workspace_id,
        canvasId: 'canvas-id', // TODO: Get from metadata or separate table
        newBlocks,
        result,
      };
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'TOOL_EXECUTION_FAILED',
        `Failed to execute tool: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 블록의 툴 실행 히스토리 조회
   */
  async getToolExecutionHistory(blockId: string): Promise<any[]> {
    try {
      const [block] = await adminDb
        .select()
        .from(blocks)
        .where(and(eq(blocks.id, blockId), isNull(blocks.deleted_at)))
        .limit(1);

      if (!block) {
        throw new BlockManagementError('BLOCK_NOT_FOUND', 'Block not found');
      }

      const metadata = (block.metadata as any) || {};
      return metadata.toolHistory || [];
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'TOOL_HISTORY_FETCH_FAILED',
        `Failed to fetch tool history: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 특정 툴의 마지막 실행 결과 조회
   */
  async getLastToolExecution(
    blockId: string,
    toolName: string
  ): Promise<any | null> {
    try {
      const history = await this.getToolExecutionHistory(blockId);

      // Find the last execution of the specific tool
      const lastExecution = history
        .filter((execution: any) => execution.toolName === toolName)
        .sort(
          (a: any, b: any) =>
            new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
        )[0];

      return lastExecution || null;
    } catch (error) {
      if (error instanceof BlockManagementError) {
        throw error;
      }
      throw new BlockManagementError(
        'TOOL_EXECUTION_FETCH_FAILED',
        `Failed to fetch last tool execution: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
