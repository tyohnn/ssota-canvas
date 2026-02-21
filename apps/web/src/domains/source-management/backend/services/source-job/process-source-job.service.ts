/**
 * Process Source Job Service
 *
 * Route에서 호출: source job 한 건 처리.
 * 순서 (step 업데이트로 Realtime UI 전파):
 * 1) startExtracting → repo.update
 * 2) raw_content 없으면 스크립트 추출 + source_action_transaction + block.sourceContentAccessGranted
 * 3) startSummarizing → repo.update
 * 4) ensureSourceSummary + source_action_transaction(extract_summary) + block.sourceSummaryAccessLanguages
 * 5) complete → repo.update, 메시지 archive
 */
import type { IBlockRepository } from '@/domains/block-management/backend/repositories/interfaces/block.repository.interface';
import { updateBlockProperties } from '@/domains/block-management/backend/services/block';
import { BlockAggregate } from '@/domains/block-management/shared/aggregates/block.aggregate';
import { BlockId } from '@/domains/block-management/shared/value-objects/block-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import type { ISourceRepository } from '@/domains/source-management/backend/repositories/interfaces/source.repository.interface';
import type { ISourceSummaryRepository } from '@/domains/source-management/backend/repositories/interfaces/source-summary.repository.interface';
import type { ISourceActionTransactionRepository } from '@/domains/source-management/backend/repositories/interfaces/source-action-transaction.repository.interface';
import type { IExtractAdapter } from '@/domains/source-management/backend/services/extract/adapters/types';
import { LinkExtractAdapter } from '@/domains/source-management/backend/services/extract/adapters/link-extract.adapter';
import { YoutubeExtractAdapter } from '@/domains/source-management/backend/services/extract/adapters/youtube-extract.adapter';
import { extractSourceContent } from '@/domains/source-management/backend/services/extract';
import { runSourceContentExtractedPolicy } from '@/domains/source-management/backend/services/source-content-extracted/source-content-extracted-policy.runner';
import { createSourceActionTransaction } from '@/domains/source-management/backend/services/source-action-transaction';
import { ensureSourceSummary } from '@/domains/source-management/backend/services/source-summary';
import type { SourceTypeValue } from '@/domains/source-management/shared/types/source.types';
import { SourceId } from '@/domains/source-management/shared/value-objects/source-id.vo';
import { SourceJobId } from '@/domains/source-management/shared/value-objects/source-job-id.vo';
import type { ISourceJobRepository } from '../../repositories/interfaces/source-job.repository.interface';

/** Route(내부 호출)에서 블록 속성 업데이트 시 사용하는 시스템 사용자 ID */
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export interface ProcessSourceJobInput {
  jobId: string;
  blockId: string; // UUID (source_jobs.block_id)
  sourceId: string;
  orgId: string;
  language: string;
  msgId?: number;
}

export interface ProcessSourceJobDeps {
  sourceJobRepository: ISourceJobRepository;
  blockRepository: IBlockRepository;
  sourceRepository: ISourceRepository;
  sourceSummaryRepository: ISourceSummaryRepository;
  sourceActionTransactionRepository: ISourceActionTransactionRepository;
  archiveQueueMessage: (msgId: number) => Promise<void>;
  deleteQueueMessage: (msgId: number) => Promise<void>;
}

export type ProcessSourceJobResult =
  | { ok: true }
  | { notFound: true }
  | { err: string };

export async function processSourceJobService(
  input: ProcessSourceJobInput,
  deps: ProcessSourceJobDeps
): Promise<ProcessSourceJobResult> {
  const { jobId, blockId, sourceId, orgId, language, msgId } = input;
  const {
    sourceJobRepository,
    blockRepository,
    sourceRepository,
    sourceSummaryRepository,
    sourceActionTransactionRepository,
    archiveQueueMessage,
    deleteQueueMessage,
  } = deps;

  const jobAggregate = await sourceJobRepository.findById(jobId);
  if (!jobAggregate) {
    if (msgId != null) await deleteQueueMessage(msgId);
    return { notFound: true };
  }

  try {
    const sourceIdVo = new SourceId(sourceId);
    const source = await sourceRepository.findById(sourceIdVo);
    if (!source) {
      throw new Error('Source not found');
    }

    const block = await blockRepository.findById(new BlockId(blockId));
    const supportedBlockTypes = ['youtube', 'link'];
    if (
      !block ||
      !supportedBlockTypes.includes(block.blockType.value)
    ) {
      throw new Error(
        'Block not found or unsupported block type for source job'
      );
    }

    // 1) startExtracting → repo.update (Realtime: "추출 중...")
    jobAggregate.startExtracting();
    await sourceJobRepository.update(jobAggregate);

    // 2) raw_content 없으면 스크립트 추출 + transaction + block.sourceContentAccessGranted
    if (!source.hasRawContent()) {
      const adapters: Record<SourceTypeValue, IExtractAdapter> = {
        youtube: new YoutubeExtractAdapter(),
        link: new LinkExtractAdapter(),
      } as Record<SourceTypeValue, IExtractAdapter>;

      const extractResult = await extractSourceContent(
        {
          sourceId,
          url: source.url.value,
          sourceType: source.sourceType.value as SourceTypeValue,
          metadata: source.metadata ?? {},
        },
        sourceRepository,
        adapters,
        runSourceContentExtractedPolicy
      );
      if (extractResult.isError()) {
        throw new Error(extractResult.error.message);
      }

      try {
        const txResult = await createSourceActionTransaction(
          {
            orgId,
            sourceId,
            actionType: 'extract_content',
            language: null,
          },
          sourceActionTransactionRepository
        );
        if (txResult.isError()) {
          throw new Error(txResult.error.message);
        }
      } catch (e) {
        // unique constraint violation (job 재시도 등) 시 무시하고 진행
        const msg = e instanceof Error ? e.message : String(e);
        const isUniqueConflict =
          msg.includes('unique') ||
          msg.includes('duplicate') ||
          msg.includes('23505');
        if (!isUniqueConflict) throw e;
      }

      const blockAggregate = BlockAggregate.reconstitute(block);
      const updateBlockResult = await updateBlockProperties({
        safeBlockAggregate: blockAggregate,
        properties: { sourceRawContentAccessGranted: true },
        safeUserId: new UserId(SYSTEM_USER_ID),
        blockRepository,
      });
      if (updateBlockResult.isError()) {
        throw new Error(updateBlockResult.error.message);
      }
    }

    // 3) startSummarizing → repo.update (Realtime: "요약 중...")
    jobAggregate.startSummarizing();
    await sourceJobRepository.update(jobAggregate);

    // 4) ensureSourceSummary
    await ensureSourceSummary(
      { sourceId, orgId, language },
      sourceRepository,
      sourceSummaryRepository
    );

    // 5) source_action_transaction(extract_summary) + block.sourceSummaryAccessLanguages
    try {
      const txSummaryResult = await createSourceActionTransaction(
        {
          orgId,
          sourceId,
          actionType: 'extract_summary',
          language,
        },
        sourceActionTransactionRepository
      );
      if (txSummaryResult.isError()) {
        // unique conflict 등은 무시하고 block 업데이트 진행
      }
    } catch {
      // 이미 존재하는 transaction 등 - 무시
    }

    const currentLanguages =
      (block.properties as { sourceSummaryAccessLanguages?: string[] })
        ?.sourceSummaryAccessLanguages ?? [];
    if (!currentLanguages.includes(language)) {
      const blockAggregate = BlockAggregate.reconstitute(block);
      const updateBlockResult = await updateBlockProperties({
        safeBlockAggregate: blockAggregate,
        properties: {
          sourceSummaryAccessLanguages: [...currentLanguages, language],
        },
        safeUserId: new UserId(SYSTEM_USER_ID),
        blockRepository,
      });
      if (updateBlockResult.isError()) {
        throw new Error(updateBlockResult.error.message);
      }
    }

    // 6) complete → repo.update (Realtime: "완료 ✓")
    jobAggregate.complete({ jobId: new SourceJobId(jobId) });
    await sourceJobRepository.update(jobAggregate);

    const completeEvents = jobAggregate.getUncommittedEvents();
    await Promise.allSettled(completeEvents.map(e => e.handle()));
    jobAggregate.markEventsAsCommitted();

    if (msgId != null) {
      await archiveQueueMessage(msgId);
    }

    return { ok: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    try {
      const failedAggregate = await sourceJobRepository.findById(jobId);
      if (failedAggregate) {
        failedAggregate.fail({ jobId: new SourceJobId(jobId), errorMessage });
        await sourceJobRepository.update(failedAggregate);

        const failEvents = failedAggregate.getUncommittedEvents();
        await Promise.allSettled(failEvents.map(e => e.handle()));
        failedAggregate.markEventsAsCommitted();
      }
    } catch (updateError) {
      console.error(
        '[processSourceJobService] Failed to update job status:',
        updateError
      );
    }

    return { err: errorMessage };
  }
}
