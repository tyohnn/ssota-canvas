import { and, eq } from 'drizzle-orm';
import { adminDb } from '@/db';
import { sourceSummaries as sourceSummariesTable } from '@/db/schema';

import { SourceSummary } from '../../../shared/entities/source-summary.entity';
import { SourceManagementError } from '../../../shared/errors/source-management.error';
import { LanguageCode } from '../../../shared/value-objects/language-code.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import { SourceSummaryId } from '../../../shared/value-objects/source-summary-id.vo';
import type { ISourceSummaryRepository } from '../interfaces/source-summary.repository.interface';

type Row = (typeof sourceSummariesTable.$inferSelect);

export class DrizzleSourceSummaryRepository implements ISourceSummaryRepository {
  async create(summary: SourceSummary): Promise<void> {
    try {
      await adminDb.insert(sourceSummariesTable).values({
        id: summary.id.value,
        source_id: summary.sourceId.value,
        language: summary.language.value,
        summary: summary.summary,
        keywords: summary.keywords,
        created_at: summary.createdAt,
        updated_at: summary.updatedAt,
      });
    } catch (error) {
      throw new SourceManagementError(
        'SOURCE_SUMMARY_CREATION_FAILED',
        `Failed to create source summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(summary: SourceSummary): Promise<void> {
    try {
      await adminDb
        .update(sourceSummariesTable)
        .set({
          summary: summary.summary,
          keywords: summary.keywords,
          updated_at: summary.updatedAt,
        })
        .where(eq(sourceSummariesTable.id, summary.id.value));
    } catch (error) {
      throw new SourceManagementError(
        'SOURCE_UPDATE_FAILED',
        `Failed to update source summary: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findBySourceIdAndLanguage(
    sourceId: SourceId,
    language: string
  ): Promise<SourceSummary | null> {
    const rows = await adminDb
      .select()
      .from(sourceSummariesTable)
      .where(
        and(
          eq(sourceSummariesTable.source_id, sourceId.value),
          eq(sourceSummariesTable.language, language)
        )
      )
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapToSourceSummary(rows[0]!);
  }

  async findAllBySourceId(sourceId: SourceId): Promise<SourceSummary[]> {
    const rows = await adminDb
      .select()
      .from(sourceSummariesTable)
      .where(eq(sourceSummariesTable.source_id, sourceId.value));
    return rows.map(row => this.mapToSourceSummary(row));
  }

  async getAvailableLanguages(sourceId: SourceId): Promise<string[]> {
    const rows = await adminDb
      .select({ language: sourceSummariesTable.language })
      .from(sourceSummariesTable)
      .where(eq(sourceSummariesTable.source_id, sourceId.value));
    return rows.map(r => r.language);
  }

  private mapToSourceSummary(row: Row): SourceSummary {
    const id = new SourceSummaryId(row.id);
    const sourceId = new SourceId(row.source_id);
    const language = new LanguageCode(row.language);
    return SourceSummary.reconstitute(
      id,
      sourceId,
      language,
      row.summary,
      row.keywords || [],
      row.created_at,
      row.updated_at
    );
  }
}
