import { and, eq, gt, isNull, or, sql } from 'drizzle-orm';
import { adminDb } from '@/db';
import { sources as sourcesTable } from '@/db/schema';

import { Source } from '../../../shared/entities/source.entity';
import { SourceManagementError } from '../../../shared/errors/source-management.error';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import {
  SourceType,
  type SourceTypeValue,
} from '../../../shared/value-objects/source-type.vo';
import { SourceUrl } from '../../../shared/value-objects/source-url.vo';
import type { SourceMetadata } from '../../../shared/types/source-metadata.types';
import type { ISourceRepository } from '../interfaces/source.repository.interface';

type Row = (typeof sourcesTable.$inferSelect);

export class DrizzleSourceRepository implements ISourceRepository {
  async create(source: Source): Promise<void> {
    try {
      await adminDb.insert(sourcesTable).values({
        id: source.id.value,
        url: source.url.value,
        url_hash: source.url.urlHash,
        source_type: source.sourceType.value,
        raw_content: source.rawContent,
        metadata: (source.metadata || {}) as Record<string, unknown>,
        content_language: source.contentLanguage ?? null,
        extracted_at: source.extractedAt,
        expires_at: source.expiresAt,
        created_at: source.createdAt,
        updated_at: source.updatedAt,
      });
    } catch (error) {
      throw new SourceManagementError(
        'SOURCE_CREATION_FAILED',
        `Failed to create source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(source: Source): Promise<void> {
    try {
      await adminDb
        .update(sourcesTable)
        .set({
          raw_content: source.rawContent,
          metadata: (source.metadata || {}) as Record<string, unknown>,
          content_language: source.contentLanguage ?? null,
          extracted_at: source.extractedAt,
          expires_at: source.expiresAt,
          updated_at: source.updatedAt,
        })
        .where(eq(sourcesTable.id, source.id.value));
    } catch (error) {
      throw new SourceManagementError(
        'SOURCE_UPDATE_FAILED',
        `Failed to update source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findById(id: SourceId): Promise<Source | null> {
    const rows = await adminDb
      .select()
      .from(sourcesTable)
      .where(eq(sourcesTable.id, id.value))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapToSource(rows[0]!);
  }

  async findByUrl(url: string): Promise<Source | null> {
    const rows = await adminDb
      .select()
      .from(sourcesTable)
      .where(eq(sourcesTable.url, url))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapToSource(rows[0]!);
  }

  async findByUrlHash(urlHash: string): Promise<Source | null> {
    const rows = await adminDb
      .select()
      .from(sourcesTable)
      .where(eq(sourcesTable.url_hash, urlHash))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapToSource(rows[0]!);
  }

  async findNonExpiredByUrl(
    url: string,
    sourceType?: SourceTypeValue
  ): Promise<Source | null> {
    const conditions = [
      eq(sourcesTable.url, url),
      or(
        isNull(sourcesTable.expires_at),
        gt(sourcesTable.expires_at, sql`now()`)
      ),
    ];
    if (sourceType) {
      conditions.push(eq(sourcesTable.source_type, sourceType));
    }
    const rows = await adminDb
      .select()
      .from(sourcesTable)
      .where(and(...conditions))
      .orderBy(sql`${sourcesTable.extracted_at} DESC NULLS LAST`)
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapToSource(rows[0]!);
  }

  private mapToSource(row: Row): Source {
    const id = new SourceId(row.id);
    const url = new SourceUrl(row.url);
    const sourceType = new SourceType(row.source_type);
    return Source.reconstitute(
      id,
      url,
      sourceType,
      row.raw_content,
      (row.metadata as SourceMetadata) || {},
      row.content_language,
      row.extracted_at,
      row.expires_at,
      row.created_at,
      row.updated_at,
      row.url_hash
    );
  }
}
