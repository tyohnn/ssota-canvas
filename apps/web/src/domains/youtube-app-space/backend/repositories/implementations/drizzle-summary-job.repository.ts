/**
 * Drizzle Summary Job Repository
 *
 * Uses adminDb; call only after application-level permission checks.
 */
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { adminDb } from '@/db';
import { blockMounts } from '@/db/schema';
import {
  type SummaryJob as SummaryJobRow,
  summaryJobs,
} from '@/db/schemas/youtube-app-space-schema';

import { SummaryJobAggregate } from '../../../shared/aggregates/summary-job.aggregate';
import { SummaryJobEntity } from '../../../shared/entities/summary-job.entity';
import type { SummaryJobStatus } from '../../../shared/entities/summary-job.entity';
import { SummaryJobId } from '../../../shared/value-objects/summary-job-id.vo';
import type { ISummaryJobRepository } from '../interfaces/summary-job.repository.interface';

function toStatus(s: string): SummaryJobStatus {
  if (
    s === 'pending' ||
    s === 'processing' ||
    s === 'completed' ||
    s === 'failed'
  ) {
    return s;
  }
  return 'pending';
}

export class DrizzleSummaryJobRepository implements ISummaryJobRepository {
  async save(aggregate: SummaryJobAggregate): Promise<{ id: string }> {
    const job = aggregate.getJob();
    const lang = job.language || 'en';
    const [row] = await adminDb
      .insert(summaryJobs)
      .values({
        id: job.id.value,
        block_id: job.blockId,
        org_id: job.orgId,
        youtube_id: job.youtubeId,
        language: lang,
        status: job.status,
        completed_at: job.completedAt ?? null,
      })
      .onConflictDoUpdate({
        target: [summaryJobs.block_id, summaryJobs.language],
        set: {
          org_id: job.orgId,
          youtube_id: job.youtubeId,
          status: job.status,
          completed_at: job.completedAt ?? null,
        },
      })
      .returning({ id: summaryJobs.id });

    if (!row) {
      throw new Error('Summary job save returned no row');
    }
    return { id: row.id };
  }

  async updatePgmqMsgId(jobId: string, pgmqMsgId: number): Promise<void> {
    await adminDb
      .update(summaryJobs)
      .set({ pgmq_msg_id: pgmqMsgId })
      .where(eq(summaryJobs.id, jobId));
  }

  async findById(id: string): Promise<SummaryJobAggregate | null> {
    const [row] = await adminDb
      .select()
      .from(summaryJobs)
      .where(eq(summaryJobs.id, id))
      .limit(1);
    if (!row) return null;
    return this.toDomain(row);
  }

  async update(aggregate: SummaryJobAggregate): Promise<void> {
    const job = aggregate.getJob();
    await adminDb
      .update(summaryJobs)
      .set({
        status: job.status,
        completed_at: job.completedAt ?? null,
        error_message: job.errorMessage ?? null,
        pgmq_msg_id: job.pgmqMsgId ?? null,
      })
      .where(eq(summaryJobs.id, job.id.value));
  }

  async findAllInProgressJobsByPageId(pageId: string) {
    const rows = await adminDb
      .select({
        id: summaryJobs.id,
        block_id: summaryJobs.block_id,
        status: summaryJobs.status,
        error_message: summaryJobs.error_message,
        created_at: summaryJobs.created_at,
        started_at: summaryJobs.started_at,
        completed_at: summaryJobs.completed_at,
      })
      .from(summaryJobs)
      .innerJoin(blockMounts, eq(summaryJobs.block_id, blockMounts.block_id))
      .where(
        and(
          eq(blockMounts.page_id, pageId),
          isNull(blockMounts.deleted_at),
          inArray(summaryJobs.status, ['pending', 'processing'])
        )
      )
      .orderBy(desc(summaryJobs.created_at));
    return rows.map(row => ({
      id: row.id,
      block_id: row.block_id,
      status: row.status,
      error_message: row.error_message,
      created_at: row.created_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
    }));
  }

  private toDomain(row: SummaryJobRow): SummaryJobAggregate {
    const entity = SummaryJobEntity.reconstitute({
      id: new SummaryJobId(row.id),
      blockId: row.block_id,
      orgId: row.org_id,
      youtubeId: row.youtube_id,
      language: row.language,
      pgmqMsgId: row.pgmq_msg_id ?? undefined,
      status: toStatus(row.status),
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      errorMessage: row.error_message ?? undefined,
    });
    return SummaryJobAggregate.reconstitute(entity);
  }
}
