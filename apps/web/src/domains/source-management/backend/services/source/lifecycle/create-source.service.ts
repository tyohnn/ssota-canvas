/**
 * Source 생성 서비스
 * SafeDTO → Command → Aggregate → Repository, 도메인 이벤트 처리
 */
import { Result } from '@/utils/result';

import { SourceAggregate } from '../../../../shared/aggregates/source.aggregate';
import type { CreateSourceRequest } from '../../../../shared/dtos/requests/source.requests';
import type { SourceMetadata } from '../../../../shared/types/source-metadata.types';
import { SourceManagementError } from '../../../../shared/errors/source-management.error';
import { LanguageCode } from '../../../../shared/value-objects/language-code.vo';
import { SourceId } from '../../../../shared/value-objects/source-id.vo';
import { SourceType } from '../../../../shared/value-objects/source-type.vo';
import { SourceUrl } from '../../../../shared/value-objects/source-url.vo';
import type { ISourceRepository } from '../../../repositories/interfaces/source.repository.interface';

export async function createSource(
  safeDto: CreateSourceRequest,
  sourceRepository: ISourceRepository
): Promise<Result<SourceAggregate, Error>> {
  try {
    const sourceId = SourceId.generate();
    const url = new SourceUrl(safeDto.url);
    const sourceType = new SourceType(safeDto.sourceType);

    const command = {
      sourceId,
      url,
      sourceType,
      metadata: (safeDto.metadata ?? {}) as SourceMetadata,
      contentLanguage: LanguageCode.optional(safeDto.contentLanguage ?? null),
    };

    const aggregate = SourceAggregate.create(command);
    await sourceRepository.create(aggregate.getSource());

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
        'SOURCE_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create source'
      )
    );
  }
}
