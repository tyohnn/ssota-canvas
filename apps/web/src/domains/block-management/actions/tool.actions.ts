'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { DrizzleToolRepository } from '../backend/repositories/implementations/drizzle-tool.repository';
import type { ExecuteBlockToolRequest } from '../backend/repositories/interfaces/tool.repository.interface';

const ExecuteBlockToolSchema = z.object({
  blockId: z.uuid(),
  toolName: z.string().min(1),
  parameters: z.record(z.string(), z.any()).optional(),
});

export async function executeBlockToolAction(
  data: ExecuteBlockToolRequest
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedData = ExecuteBlockToolSchema.parse(data);
    const repository = new DrizzleToolRepository();
    const result = await repository.executeBlockTool(validatedData);

    revalidatePath(
      `/workspace/${result.workspaceId}/canvas/${result.canvasId}`
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Failed to execute block tool:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to execute block tool',
    };
  }
}
