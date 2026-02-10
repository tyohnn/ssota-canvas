import { ActionResult, ok, err } from '@/lib';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { BlockMountId } from '../../../shared/value-objects/block-mount-id.vo';
import { EdgeHandle } from '../../../shared/value-objects/edge-handle.vo';
import { EdgeId } from '../../../shared/value-objects/edge-id.vo';
import { EdgeRepository } from '../../repositories/interfaces/edge.repository.interface';
import { UpdateEdgeConnectionRequest } from '../../../shared/dtos/requests/edge.requests';
import { EdgeView } from '../../../shared/dtos/views/edge.views';
import { UpdateEdgeConnectionCommand } from '../../../shared/commands/edge.commands';

export class UpdateEdgeConnectionService {
  constructor(private readonly edgeRepository: EdgeRepository) {}

  async execute(
    request: UpdateEdgeConnectionRequest
  ): Promise<ActionResult<EdgeView>> {
    try {
      const edgeId = new EdgeId(request.edgeId);
      const edgeAggregate = await this.edgeRepository.findById(edgeId);

      if (!edgeAggregate) {
        return err('Edge not found');
      }

      const command: UpdateEdgeConnectionCommand = {
        edgeId,
        newSourceBlockMountId: new BlockMountId(request.newSourceBlockMountId),
        newTargetBlockMountId: new BlockMountId(request.newTargetBlockMountId),
        newSourceHandle: request.newSourceHandle 
          ? EdgeHandle.fromString(request.newSourceHandle) 
          : edgeAggregate.edge.sourceHandle,
        newTargetHandle: request.newTargetHandle 
          ? EdgeHandle.fromString(request.newTargetHandle) 
          : edgeAggregate.edge.targetHandle,
        userId: new UserId('system'), // 클래스 방식의 원본 로직 유지
      };

      edgeAggregate.updateEdgeConnection(command);

      await this.edgeRepository.update(edgeAggregate);
      edgeAggregate.markEventsAsCommitted();

      return ok(edgeAggregate.toView());
    } catch (error) {
      console.error('[UpdateEdgeConnectionService] Error:', error);
      return err(
        error instanceof Error ? error.message : 'Failed to update edge connection'
      );
    }
  }
}
