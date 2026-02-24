import { LanguageCode } from '../value-objects/language-code.vo';
import { SourceId } from '../value-objects/source-id.vo';
import { SourceSummaryId } from '../value-objects/source-summary-id.vo';

export interface CreateSourceSummaryCommand {
  summaryId: SourceSummaryId;
  sourceId: SourceId;
  language: LanguageCode;
  summary: string;
  keywords: string[];
}
