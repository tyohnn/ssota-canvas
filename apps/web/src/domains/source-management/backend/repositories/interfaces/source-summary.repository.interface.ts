import { SourceSummary } from '../../../shared/entities/source-summary.entity';
import { SourceId } from '../../../shared/value-objects/source-id.vo';

export interface ISourceSummaryRepository {
  create(summary: SourceSummary): Promise<void>;
  update(summary: SourceSummary): Promise<void>;
  findBySourceIdAndLanguage(
    sourceId: SourceId,
    language: string
  ): Promise<SourceSummary | null>;
  findAllBySourceId(sourceId: SourceId): Promise<SourceSummary[]>;
  getAvailableLanguages(sourceId: SourceId): Promise<string[]>;
}
