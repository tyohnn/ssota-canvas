// apps/web/src/domains/share/backend/repositories/implementations/drizzle-published-page.repository.ts

import { eq, and } from 'drizzle-orm';
import { adminDb } from '@/db';
import { publishedPages } from '@/db/schema';
import { PublishedPageRepository } from '../interfaces/published-page.repository.interface';
import { PublishedPage } from '../../../shared/entities/published-page.entity';
import { PageId } from '../../../shared/types';
import { PublishToken } from '../../../shared/value-objects/publish-token.vo';

export class DrizzlePublishedPageRepository implements PublishedPageRepository {
  async save(publishedPage: PublishedPage): Promise<void> {
    const existing = await adminDb
      .select()
      .from(publishedPages)
      .where(eq(publishedPages.page_id, publishedPage.pageId))
      .limit(1);

    if (existing.length > 0) {
      await adminDb
        .update(publishedPages)
        .set({
          publish_token: publishedPage.publishToken.toString(),
          status: publishedPage.status,
          snapshot_version: publishedPage.snapshotVersion,
          updated_at: new Date(),
        })
        .where(eq(publishedPages.page_id, publishedPage.pageId));
    } else {
      await adminDb.insert(publishedPages).values({
        page_id: publishedPage.pageId,
        owner_id: publishedPage.ownerId,
        publish_token: publishedPage.publishToken.toString(),
        status: publishedPage.status,
        snapshot_version: publishedPage.snapshotVersion,
        published_at: publishedPage.publishedAt,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  }

  async findByPageId(pageId: PageId): Promise<PublishedPage | null> {
    const result = await adminDb
      .select()
      .from(publishedPages)
      .where(eq(publishedPages.page_id, pageId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]!);
  }

  async findByToken(publishToken: PublishToken): Promise<PublishedPage | null> {
    const result = await adminDb
      .select()
      .from(publishedPages)
      .where(eq(publishedPages.publish_token, publishToken.toString()))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]!);
  }

  private toDomain(row: any): PublishedPage {
    return new PublishedPage(
      row.page_id,
      row.owner_id,
      row.status as any,
      new PublishToken(row.publish_token),
      row.published_at,
      row.snapshot_version
    );
  }
}
