/**
 * Policy: 자동 요약 보장. (sourceId, language)에 대해 요약이 없으면 생성.
 */
import type { EnsureSourceSummaryRequest } from '../../../shared/dtos/requests/source-summary.requests';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceRepository } from '../../repositories/interfaces/source.repository.interface';
import type { ISourceSummaryRepository } from '../../repositories/interfaces/source-summary.repository.interface';

import { createSourceSummary } from './create-source-summary.service';
import { generateSourceSummary } from './generate-source-summary.service';

export async function ensureSourceSummary(
  safeDto: EnsureSourceSummaryRequest,
  sourceRepository: ISourceRepository,
  sourceSummaryRepository: ISourceSummaryRepository
): Promise<void> {
  const sourceId = new SourceId(safeDto.sourceId);
  const existing = await sourceSummaryRepository.findBySourceIdAndLanguage(
    sourceId,
    safeDto.language
  );
  if (existing) return;

  const source = await sourceRepository.findById(sourceId);
  if (!source || !source.hasRawContent()) return;

  const genResult = await generateSourceSummary({
    rawContent: source.rawContent!,
    language: safeDto.language,
  });
  if (genResult.isError()) return;

  await createSourceSummary(
    {
      sourceId: safeDto.sourceId,
      language: safeDto.language,
      summary: genResult.value.summary,
      keywords: genResult.value.keywords,
    },
    sourceSummaryRepository
  );
}
