/**
 * Source summary 생성: Command → Aggregate → persist → handle events
 */
import { Result } from '@/utils/result';

import { SourceSummaryAggregate } from '../../../shared/aggregates/source-summary.aggregate';
import type { CreateSourceSummaryRequest } from '../../../shared/dtos/requests/source-summary.requests';
import { SourceManagementError } from '../../../shared/errors/source-management.error';
import { LanguageCode } from '../../../shared/value-objects/language-code.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import { SourceSummaryId } from '../../../shared/value-objects/source-summary-id.vo';
import type { ISourceSummaryRepository } from '../../repositories/interfaces/source-summary.repository.interface';

export async function createSourceSummary(
  safeDto: CreateSourceSummaryRequest,
  sourceSummaryRepository: ISourceSummaryRepository
): Promise<Result<SourceSummaryAggregate, Error>> {
  try {
    const summaryId = SourceSummaryId.generate();
    const sourceId = new SourceId(safeDto.sourceId);
    const language = new LanguageCode(safeDto.language);

    const command = {
      summaryId,
      sourceId,
      language,
      summary: safeDto.summary,
      keywords: safeDto.keywords ?? [],
    };

    const aggregate = SourceSummaryAggregate.create(command);
    await sourceSummaryRepository.create(aggregate.getSourceSummary());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof SourceManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new SourceManagementError(
        'SOURCE_SUMMARY_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create source summary'
      )
    );
  }
}
