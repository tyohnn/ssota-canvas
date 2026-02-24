/**
 * ConnectionSearchRepository Implementation
 *
 * EdgeRepository + BlockMountRepository를 래핑해
 * hopSearch / searchGroup 도구에서 사용하는 조회만 노출.
 */

import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import type { EdgeRepository } from '@/domains/canvas-management/backend/repositories/interfaces/edge.repository.interface';
import type { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import type { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { ConnectionSearchRepository } from '../interfaces/connection-search.repository.interface';

export class DrizzleConnectionSearchRepository implements ConnectionSearchRepository {
  constructor(
    private readonly edgeRepository: EdgeRepository,
    private readonly blockMountRepository: BlockMountRepository
  ) {}

  findEdgesByConnectedBlockMountId(blockMountId: BlockMountId) {
    return this.edgeRepository.findByConnectedBlockMountId(blockMountId);
  }

  findEdgesByConnectedBlockMountIdAndPageId(
    blockMountId: BlockMountId,
    pageId: PageId
  ) {
    return this.edgeRepository.findByConnectedBlockMountIdAndPageId(
      blockMountId,
      pageId
    );
  }

  findBlockMountsWithBlocksByPageId(pageId: PageId) {
    return this.blockMountRepository.findByPageIdWithBlocks(pageId);
  }
}
