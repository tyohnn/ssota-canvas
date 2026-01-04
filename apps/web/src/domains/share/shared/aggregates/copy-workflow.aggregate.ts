// apps/web/src/domains/share/shared/aggregates/copy-workflow.aggregate.ts

import {
  AttemptCopyPageCommand,
  ExecuteCopyPageCommand,
} from '../commands';
import { CopyWorkflow } from '../entities/copy-workflow.entity';
import {
  PageCopyAttemptedEvent,
  PageCopyFailedEvent,
  PageCopiedEvent,
  WorkspaceSelectedEvent,
} from '../events';
import { PublishToken } from '../value-objects/publish-token.vo';
import { CopyWorkflowId } from '../types';

export class CopyWorkflowAggregate {
  private readonly events: Array<
    | PageCopyAttemptedEvent
    | WorkspaceSelectedEvent
    | PageCopiedEvent
    | PageCopyFailedEvent
  > = [];

  attemptCopy(command: AttemptCopyPageCommand): CopyWorkflow {
    const workflow = new CopyWorkflow(
      this.generateWorkflowId(),
      new PublishToken(command.publishToken),
      'pending',
      command.requesterId
    );

    this.events.push(
      new PageCopyAttemptedEvent(command.publishToken, command.requesterId)
    );

    return workflow;
  }

  markCompleted(command: ExecuteCopyPageCommand): void {
    this.events.push(
      new WorkspaceSelectedEvent(command.targetWorkspaceId, command.requesterId)
    );
    this.events.push(
      new PageCopiedEvent(
        command.publishToken,
        command.targetWorkspaceId,
        command.requesterId
      )
    );
  }

  markFailed(publishToken: string, reason: string): void {
    this.events.push(new PageCopyFailedEvent(publishToken, reason));
  }

  getUncommittedEvents(): Array<
    | PageCopyAttemptedEvent
    | WorkspaceSelectedEvent
    | PageCopiedEvent
    | PageCopyFailedEvent
  > {
    return [...this.events];
  }

  private generateWorkflowId(): CopyWorkflowId {
    return crypto.randomUUID();
  }
}
