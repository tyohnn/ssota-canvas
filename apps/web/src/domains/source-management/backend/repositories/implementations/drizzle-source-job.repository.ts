/**
 * Drizzle Source Job Repository
 *
 * Uses adminDb; call only after application-level permission checks.
 */
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';

import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';

import { adminDb } from '@/db';
import type { SourceJob } from '@/db/schema';
import { blockMounts, sourceJobs } from '@/db/schema';

import { SourceJobAggregate } from '../../../shared/aggregates/source-job.aggregate';
import { SourceJobEntity } from '../../../shared/entities/source-job.entity';
import type {
  SourceJobCurrentStep,
  SourceJobStatus,
} from '../../../shared/entities/source-job.entity';
import { OrgId } from '../../../shared/value-objects/org-id.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import { SourceJobId } from '../../../shared/value-objects/source-job-id.vo';
import type { ISourceJobRepository } from '../interfaces/source-job.repository.interface';

function toStatus(s: string): SourceJobStatus {
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

function toCurrentStep(s: string | null): SourceJobCurrentStep {
  if (s === 'extracting' || s === 'summarizing') return s;
  return null;
}

export class DrizzleSourceJobRepository implements ISourceJobRepository {
  /**
   * 새 Source Job 생성 (INSERT only).
   * PK(id) 충돌 시 새 ID로 재시도 (block mount 패턴)
   */
  async create(aggregate: SourceJobAggregate): Promise<{ id: string }> {
    const job = aggregate.getJob();
    const lang = job.language || 'en';
    let currentId = job.id.value;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const [row] = await adminDb
          .insert(sourceJobs)
          .values({
            id: currentId,
            source_id: job.sourceId.value,
            block_id: job.blockId.value,
            org_id: job.orgId.value,
            language: lang,
            status: job.status,
            current_step: job.currentStep ?? null,
            completed_at: job.completedAt ?? null,
          })
          .returning({ id: sourceJobs.id });

        if (!row) {
          throw new Error('Source job create returned no row');
        }
        return { id: row.id };
      } catch (error) {
        const err = error as { code?: string; constraint?: string };
        if (err.code === '23505' && err.constraint === 'source_jobs_pkey') {
          attempts++;
          if (attempts < maxAttempts) {
            currentId = SourceJobId.generate().value;
            console.warn(
              `[DrizzleSourceJobRepository] ID collision (attempt ${attempts}), retrying with new ID`
            );
          } else {
            throw new Error(
              'Failed to generate unique SourceJob id after multiple attempts'
            );
          }
        } else if (
          err.code === '23505' &&
          err.constraint === 'source_jobs_block_id_language_unique'
        ) {
          throw new Error(
            'Source job already exists for this block and language; use findByBlockIdAndLanguage then update'
          );
        } else {
          throw error;
        }
      }
    }

    throw new Error('Source job create failed');
  }

  async findByBlockIdAndLanguage(
    blockId: string,
    language: string
  ): Promise<SourceJobAggregate | null> {
    const [row] = await adminDb
      .select()
      .from(sourceJobs)
      .where(
        and(
          eq(sourceJobs.block_id, blockId),
          eq(sourceJobs.language, language)
        )
      )
      .limit(1);
    if (!row) return null;
    return this.toDomain(row);
  }

  async updatePgmqMsgId(jobId: string, pgmqMsgId: number): Promise<void> {
    await adminDb
      .update(sourceJobs)
      .set({ pgmq_msg_id: pgmqMsgId })
      .where(eq(sourceJobs.id, jobId));
  }

  async findById(id: string): Promise<SourceJobAggregate | null> {
    const [row] = await adminDb
      .select()
      .from(sourceJobs)
      .where(eq(sourceJobs.id, id))
      .limit(1);
    if (!row) return null;
    return this.toDomain(row);
  }

  async update(aggregate: SourceJobAggregate): Promise<void> {
    const job = aggregate.getJob();
    await adminDb
      .update(sourceJobs)
      .set({
        source_id: job.sourceId.value,
        org_id: job.orgId.value,
        status: job.status,
        current_step: job.currentStep ?? null,
        completed_at: job.completedAt ?? null,
        error_message: job.errorMessage ?? null,
        pgmq_msg_id: job.pgmqMsgId ?? null,
      })
      .where(eq(sourceJobs.id, job.id.value));
  }

  async findInProgressByBlockId(
    blockId: string
  ): Promise<SourceJobAggregate | null> {
    const [row] = await adminDb
      .select()
      .from(sourceJobs)
      .where(
        and(
          eq(sourceJobs.block_id, blockId),
          inArray(sourceJobs.status, ['pending', 'processing'])
        )
      )
      .limit(1);
    if (!row) return null;
    return this.toDomain(row);
  }

  async findLatestByBlockId(
    blockId: string
  ): Promise<SourceJobAggregate | null> {
    const [row] = await adminDb
      .select()
      .from(sourceJobs)
      .where(eq(sourceJobs.block_id, blockId))
      .orderBy(desc(sourceJobs.created_at))
      .limit(1);
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAllInProgressJobsByPageId(
    pageId: string
  ): Promise<
    Array<{
      id: string;
      block_id: string;
      language: string;
      status: string;
      current_step: string | null;
      error_message: string | null;
      created_at: Date;
      started_at: Date | null;
      completed_at: Date | null;
    }>
  > {
    const rows = await adminDb
      .select({
        id: sourceJobs.id,
        block_id: sourceJobs.block_id,
        language: sourceJobs.language,
        status: sourceJobs.status,
        current_step: sourceJobs.current_step,
        error_message: sourceJobs.error_message,
        created_at: sourceJobs.created_at,
        started_at: sourceJobs.started_at,
        completed_at: sourceJobs.completed_at,
      })
      .from(sourceJobs)
      .innerJoin(blockMounts, eq(sourceJobs.block_id, blockMounts.block_id))
      .where(
        and(
          eq(blockMounts.page_id, pageId),
          isNull(blockMounts.deleted_at),
          inArray(sourceJobs.status, ['pending', 'processing'])
        )
      )
      .orderBy(desc(sourceJobs.created_at));
    return rows.map(row => ({
      id: row.id,
      block_id: row.block_id,
      language: row.language,
      status: row.status,
      current_step: row.current_step,
      error_message: row.error_message,
      created_at: row.created_at,
      started_at: row.started_at,
      completed_at: row.completed_at,
    }));
  }

  private toDomain(row: SourceJob): SourceJobAggregate {
    const entity = SourceJobEntity.reconstitute({
      id: new SourceJobId(row.id),
      sourceId: new SourceId(row.source_id),
      blockId: new BlockId(row.block_id),
      orgId: new OrgId(row.org_id),
      language: row.language,
      pgmqMsgId: row.pgmq_msg_id ?? undefined,
      status: toStatus(row.status),
      currentStep: toCurrentStep(row.current_step),
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      errorMessage: row.error_message ?? undefined,
    });
    return SourceJobAggregate.reconstitute(entity);
  }
}
