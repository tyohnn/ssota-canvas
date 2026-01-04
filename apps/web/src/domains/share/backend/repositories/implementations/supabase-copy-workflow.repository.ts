// apps/web/src/domains/share/backend/repositories/implementations/supabase-copy-workflow.repository.ts

import { CopyWorkflowRepository } from '../copy-workflow.repository';
import { CopyWorkflow } from '../../../shared/entities/copy-workflow.entity';
import { CopyWorkflowId } from '../../../shared/types';
import { PublishToken } from '../../../shared/value-objects/publish-token.vo';

type SupabaseClientLike = {
  from: (table: string) => {
    upsert: (
      values: Record<string, unknown>,
      options?: { onConflict?: string }
    ) => Promise<{ error: Error | null }>;
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        limit: (count: number) => {
          maybeSingle: () => Promise<{
            data: Record<string, unknown> | null;
            error: Error | null;
          }>;
        };
      };
    };
  };
};

export class SupabaseCopyWorkflowRepository implements CopyWorkflowRepository {
  constructor(private readonly supabase: SupabaseClientLike) {}

  async save(workflow: CopyWorkflow): Promise<void> {
    const completedAt =
      workflow.status === 'completed' || workflow.status === 'failed'
        ? new Date().toISOString()
        : null;

    const { error } = await this.supabase
      .from('copy_workflows')
      .upsert(
        {
          id: workflow.id,
          publish_token: workflow.publishToken.toString(),
          requester_id: workflow.requesterId ?? null,
          status: workflow.status,
          target_workspace_id: workflow.targetWorkspaceId ?? null,
          failure_reason: workflow.failureReason ?? null,
          completed_at: completedAt,
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw error;
    }
  }

  async findById(id: CopyWorkflowId): Promise<CopyWorkflow | null> {
    const { data, error } = await this.supabase
      .from('copy_workflows')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;

    return new CopyWorkflow(
      data.id as string,
      new PublishToken(data.publish_token as string),
      data.status as CopyWorkflow['status'],
      (data.requester_id as string | null) ?? undefined,
      (data.target_workspace_id as string | null) ?? undefined,
      (data.failure_reason as string | null) ?? undefined
    );
  }

  async findByToken(publishToken: PublishToken): Promise<CopyWorkflow | null> {
    const { data, error } = await this.supabase
      .from('copy_workflows')
      .select('*')
      .eq('publish_token', publishToken.toString())
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;

    return new CopyWorkflow(
      data.id as string,
      new PublishToken(data.publish_token as string),
      data.status as CopyWorkflow['status'],
      (data.requester_id as string | null) ?? undefined,
      (data.target_workspace_id as string | null) ?? undefined,
      (data.failure_reason as string | null) ?? undefined
    );
  }
}
