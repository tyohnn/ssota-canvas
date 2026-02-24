/**
 * Source raw_content 업데이트 서비스
 * Load aggregate → UpdateRawContent command → persist → handle events
 * TTL: link=2일, youtube=3개월, 그 외=영구(null)
 */
import { Result } from '@/utils/result';

import { SourceAggregate } from '../../../../shared/aggregates/source.aggregate';
import type { UpdateSourceRawContentRequest } from '../../../../shared/dtos/requests/source.requests';
import { SourceManagementError } from '../../../../shared/errors/source-management.error';
import { SourceId } from '../../../../shared/value-objects/source-id.vo';
import type { ISourceRepository } from '../../../repositories/interfaces/source.repository.interface';

const TTL_LINK_DAYS = 2;
const TTL_YOUTUBE_MONTHS = 3;
const TTL_PDF_MONTHS = 6;
const TTL_AUDIO_MONTHS = 6;

export function computeExpiresAt(
  sourceType: string,
  extractedAt: Date
): Date | null {
  if (sourceType === 'link') {
    const expires = new Date(extractedAt);
    expires.setDate(expires.getDate() + TTL_LINK_DAYS);
    return expires;
  }
  if (sourceType === 'youtube') {
    const expires = new Date(extractedAt);
    expires.setMonth(expires.getMonth() + TTL_YOUTUBE_MONTHS);
    return expires;
  }
  if (sourceType === 'pdf') {
    const expires = new Date(extractedAt);
    expires.setMonth(expires.getMonth() + TTL_PDF_MONTHS);
    return expires;
  }
  if (sourceType === 'audio') {
    const expires = new Date(extractedAt);
    expires.setMonth(expires.getMonth() + TTL_AUDIO_MONTHS);
    return expires;
  }
  return null;
}

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

    const expiresAt = computeExpiresAt(
      source.sourceType.value,
      safeDto.extractedAt
    );

    // Merge pdfExtraction state into source metadata if present
    if (
      safeDto.structuredPayload &&
      typeof safeDto.structuredPayload === 'object' &&
      'pdfExtraction' in (safeDto.structuredPayload as object)
    ) {
      const payload = safeDto.structuredPayload as Record<string, unknown>;
      const existingMetadata =
        typeof source.metadata === 'object' && source.metadata !== null
          ? (source.metadata as Record<string, unknown>)
          : {};
      source.updateMetadata({
        ...existingMetadata,
        pdfExtraction: payload.pdfExtraction,
      });
      await sourceRepository.update(source);
    }

    // Merge script (TimelineScript format) into source metadata for audio
    if (
      source.sourceType.value === 'audio' &&
      safeDto.structuredPayload &&
      typeof safeDto.structuredPayload === 'object' &&
      Array.isArray((safeDto.structuredPayload as { transcript?: unknown[] }).transcript)
    ) {
      const existingMetadata =
        typeof source.metadata === 'object' && source.metadata !== null
          ? (source.metadata as Record<string, unknown>)
          : {};
      source.updateMetadata({
        ...existingMetadata,
        script: safeDto.structuredPayload,
      });
      await sourceRepository.update(source);
    }

    const aggregate = SourceAggregate.reconstitute(source);
    aggregate.updateRawContent({
      rawContent: safeDto.rawContent,
      extractedAt: safeDto.extractedAt,
      expiresAt,
      contentLanguage: safeDto.contentLanguage,
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
