// apps/web/src/domains/share/backend/repositories/interfaces/published-page.repository.interface.ts

import { PublishedPage } from '../../../shared/entities/published-page.entity';
import { PageId } from '../../../shared/types';
import { PublishToken } from '../../../shared/value-objects/publish-token.vo';

export interface PublishedPageRepository {
  save(publishedPage: PublishedPage): Promise<void>;
  findByPageId(pageId: PageId): Promise<PublishedPage | null>;
  findByToken(publishToken: PublishToken): Promise<PublishedPage | null>;
}
