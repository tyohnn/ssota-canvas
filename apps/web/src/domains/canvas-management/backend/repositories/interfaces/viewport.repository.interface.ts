import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

import { ViewportAggregate } from '../../../shared/aggregates/viewport.aggregate';
import { ViewportId } from '../../../shared/value-objects/viewport-id.vo';

export interface ViewportRepository {
  save(viewport: ViewportAggregate): Promise<void>;
  findById(viewportId: ViewportId): Promise<ViewportAggregate | null>;
  findByPageId(pageId: PageId): Promise<ViewportAggregate | null>;
  delete(viewportId: ViewportId): Promise<void>;
}
