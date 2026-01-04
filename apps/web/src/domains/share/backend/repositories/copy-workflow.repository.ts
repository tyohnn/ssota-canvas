// apps/web/src/domains/share/infrastructure/repositories/copy-workflow.repository.ts

import { CopyWorkflow } from '../../shared/entities/copy-workflow.entity';
import { CopyWorkflowId } from '../../shared/types';
import { PublishToken } from '../../shared/value-objects/publish-token.vo';

export interface CopyWorkflowRepository {
  save(workflow: CopyWorkflow): Promise<void>;
  findById(id: CopyWorkflowId): Promise<CopyWorkflow | null>;
  findByToken(publishToken: PublishToken): Promise<CopyWorkflow | null>;
}
