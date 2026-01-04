// apps/web/src/domains/share/backend/repositories/implementations/supabase-published-page.repository.ts

import { PublishedPageRepository } from '../published-page.repository';
import { PublishedPage } from '../../../shared/entities/published-page.entity';
import { PageId } from '../../../shared/types';
import { PublishToken } from '../../../shared/value-objects/publish-token.vo';

type SupabaseClientLike = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: Error | null }>;
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        limit: (count: number) => {
          maybeSingle: () => Promise<{
            data: Record<string, unknown> | null;
            error: Error | null;
          }>;
        };
      };
    };
  };
};

export class SupabasePublishedPageRepository implements PublishedPageRepository {
  constructor(private readonly supabase: SupabaseClientLike) {}

  async save(publishedPage: PublishedPage): Promise<void> {
    const { error } = await this.supabase.from('published_pages').insert({
      page_id: publishedPage.pageId,
      owner_id: publishedPage.ownerId,
      publish_token: publishedPage.publishToken.toString(),
      status: publishedPage.status,
      published_at: publishedPage.publishedAt.toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  async findByPageId(pageId: PageId): Promise<PublishedPage | null> {
    const { data, error } = await this.supabase
      .from('published_pages')
      .select('*')
      .eq('page_id', pageId)
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;

    return new PublishedPage(
      data.page_id as string,
      data.owner_id as string,
      data.status as 'published',
      new PublishToken(data.publish_token as string),
      new Date(data.published_at as string)
    );
  }

  async findByToken(publishToken: PublishToken): Promise<PublishedPage | null> {
    const { data, error } = await this.supabase
      .from('published_pages')
      .select('*')
      .eq('publish_token', publishToken.toString())
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) return null;

    return new PublishedPage(
      data.page_id as string,
      data.owner_id as string,
      data.status as 'published',
      new PublishToken(data.publish_token as string),
      new Date(data.published_at as string)
    );
  }
}
