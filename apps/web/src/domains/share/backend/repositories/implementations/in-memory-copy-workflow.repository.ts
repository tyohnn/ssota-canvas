// apps/web/src/domains/share/backend/repositories/implementations/in-memory-copy-workflow.repository.ts

import { CopyWorkflowRepository } from '../copy-workflow.repository';
import { CopyWorkflow } from '../../../shared/entities/copy-workflow.entity';
import { CopyWorkflowId } from '../../../shared/types';
import { PublishToken } from '../../../shared/value-objects/publish-token.vo';

export class InMemoryCopyWorkflowRepository implements CopyWorkflowRepository {
  private static byId = new Map<string, CopyWorkflow>();
  private static byToken = new Map<string, CopyWorkflow>();

  async save(workflow: CopyWorkflow): Promise<void> {
    InMemoryCopyWorkflowRepository.byId.set(workflow.id, workflow);
    InMemoryCopyWorkflowRepository.byToken.set(
      workflow.publishToken.toString(),
      workflow
    );
  }

  async findById(id: CopyWorkflowId): Promise<CopyWorkflow | null> {
    return InMemoryCopyWorkflowRepository.byId.get(id) ?? null;
  }

  async findByToken(publishToken: PublishToken): Promise<CopyWorkflow | null> {
    return (
      InMemoryCopyWorkflowRepository.byToken.get(publishToken.toString()) ?? null
    );
  }
}
