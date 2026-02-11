/**
 * Source raw_content 업데이트 서비스
 * Load aggregate → UpdateRawContent command → persist → handle events
 */
import { Result } from '@/utils/result';

import { SourceAggregate } from '../../../../shared/aggregates/source.aggregate';
import type { UpdateSourceRawContentRequest } from '../../../../shared/dtos/requests/source.requests';
import { SourceManagementError } from '../../../../shared/errors/source-management.error';
import { SourceId } from '../../../../shared/value-objects/source-id.vo';
import type { ISourceRepository } from '../../../repositories/interfaces/source.repository.interface';

export async function updateSourceRawContent(
  safeDto: UpdateSourceRawContentRequest,
  sourceRepository: ISourceRepository
): Promise<Result<SourceAggregate, Error>> {
  try {
    const sourceId = new SourceId(safeDto.sourceId);
    const source = await sourceRepository.findById(sourceId);
    if (!source) {
      return Result.error(
        new SourceManagementError('SOURCE_NOT_FOUND', 'Source not found')
      );
    }

    const aggregate = SourceAggregate.reconstitute(source);
    aggregate.updateRawContent({
      rawContent: safeDto.rawContent,
      extractedAt: safeDto.extractedAt,
    });

    await sourceRepository.update(aggregate.getSource());

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
        'SOURCE_UPDATE_FAILED',
        error instanceof Error ? error.message : 'Failed to update source raw content'
      )
    );
  }
}
