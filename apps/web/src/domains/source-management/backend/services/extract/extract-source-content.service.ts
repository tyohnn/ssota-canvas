/**
 * Extract source content: source_type별 어댑터 호출 → raw_content 저장 → Application Event 발행
 */
import { Result } from '@/utils/result';

import { SourceAggregate } from '../../../shared/aggregates/source.aggregate';
import type { ExtractSourceContentRequest } from '../../../shared/dtos/requests/source.requests';
import type { SourceContentExtractedEvent } from '../../../shared/events/source-content-extracted.application-event';
import { SourceManagementError } from '../../../shared/errors/source-management.error';
import type { SourceTypeValue } from '../../../shared/types/source.types';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceRepository } from '../../repositories/interfaces/source.repository.interface';
import { publishSourceContentExtracted } from '../source-content-extracted/publish-source-content-extracted.service';
import { updateSourceRawContent } from '../source/content/update-source-raw-content.service';
import type { IExtractAdapter } from './adapters/types';

export async function extractSourceContent(
  safeDto: ExtractSourceContentRequest,
  sourceRepository: ISourceRepository,
  adapters: Record<SourceTypeValue, IExtractAdapter>,
  policyRunner?: (event: SourceContentExtractedEvent) => Promise<void>
): Promise<Result<SourceAggregate, Error>> {
  try {
    const sourceId = new SourceId(safeDto.sourceId);
    const source = await sourceRepository.findById(sourceId);
    if (!source) {
      return Result.error(
        new SourceManagementError('SOURCE_NOT_FOUND', 'Source not found')
      );
    }

    const adapter = adapters[safeDto.sourceType as SourceTypeValue];
    if (!adapter) {
      return Result.error(
        new SourceManagementError(
          'INVALID_SOURCE_TYPE',
          `No extract adapter for source type: ${safeDto.sourceType}`
        )
      );
    }

    const extracted = await adapter.extract(safeDto.url, safeDto.metadata);

    const updateResult = await updateSourceRawContent(
      {
        sourceId: safeDto.sourceId,
        rawContent: extracted.rawContent,
        extractedAt: new Date(),
        structuredPayload: extracted.structuredPayload,
        contentLanguage: extracted.contentLanguage ?? undefined,
      },
      sourceRepository
    );
    if (updateResult.isError()) {
      return Result.error(updateResult.error);
    }

    const aggregate = updateResult.value;
    await publishSourceContentExtracted(
      {
        sourceId: safeDto.sourceId,
        sourceType: safeDto.sourceType,
        rawContent: extracted.rawContent,
        appSpaceId: safeDto.metadata?.appSpaceId as string | undefined,
        structuredPayload: extracted.structuredPayload,
        contentLanguage: extracted.contentLanguage ?? undefined,
        occurredAt: new Date(),
      },
      policyRunner
    );

    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof SourceManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new SourceManagementError(
        'SOURCE_UPDATE_FAILED',
        error instanceof Error ? error.message : 'Extract source content failed'
      )
    );
  }
}
