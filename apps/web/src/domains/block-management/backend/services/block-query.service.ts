import { IBlockRepository } from '../repositories/interfaces/block.repository.interface';
import { Block } from '../../shared/entities/block.entity';
import { BlockId } from '../../shared/value-objects/block-id.vo';

/**
 * Block Query Service
 * 다른 도메인에서 블럭 정보를 조회할 때 사용하는 서비스
 */
export class BlockQueryService {
  constructor(private blockRepository: IBlockRepository) {}

  /**
   * 여러 블럭 ID로 블럭 정보를 배치 조회
   * Canvas Management에서 호출하여 성능 최적화
   */
  async getBlocksByIds(blockIds: string[]): Promise<Block[]> {
    if (blockIds.length === 0) {
      return [];
    }

    // BlockId VO로 변환하여 배치 조회
    const blockIdVOs = blockIds.map(id => new BlockId(id));
    const blocks: Block[] = [];

    // 각 블럭 ID로 개별 조회 (향후 배치 조회로 최적화 가능)
    for (const blockIdVO of blockIdVOs) {
      try {
        const block = await this.blockRepository.findById(blockIdVO);
        if (block) {
          blocks.push(block);
        }
      } catch (error) {
        console.warn(`Failed to fetch block ${blockIdVO.value}:`, error);
        // 개별 블럭 조회 실패는 무시하고 계속 진행
      }
    }

    return blocks;
  }
}
