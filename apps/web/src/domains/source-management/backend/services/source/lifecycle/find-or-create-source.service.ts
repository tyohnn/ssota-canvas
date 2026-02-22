/**
 * Find or create Source by URL.
 * SafeDTO → findByUrl → if not found create and persist.
 */
import { Result } from '@/utils/result';

import { SourceAggregate } from '../../../../shared/aggregates/source.aggregate';
import type { FindOrCreateSourceRequest } from '../../../../shared/dtos/requests/source.requests';
import { SourceManagementError } from '../../../../shared/errors/source-management.error';
import type { SourceTypeValue } from '../../../../shared/value-objects/source-type.vo';
import { SourceUrl } from '../../../../shared/value-objects/source-url.vo';
import type { ISourceRepository } from '../../../repositories/interfaces/source.repository.interface';

import { createSource } from './create-source.service';

export async function findOrCreateSource(
  safeDto: FindOrCreateSourceRequest,
  sourceRepository: ISourceRepository
): Promise<Result<SourceAggregate, Error>> {
  try {
    const url = new SourceUrl(safeDto.url);
    const existing = await sourceRepository.findNonExpiredByUrl(
      url.value,
      safeDto.sourceType as SourceTypeValue
    );
    if (existing) {
      return Result.success(SourceAggregate.reconstitute(existing));
    }

    return createSource(safeDto, sourceRepository);
  } catch (error) {
    if (error instanceof SourceManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new SourceManagementError(
        'SOURCE_CREATION_FAILED',
        error instanceof Error ? error.message : 'Find or create source failed'
      )
    );
  }
}
