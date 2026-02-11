import { SourceActionTransaction } from '../../../shared/entities/source-action-transaction.entity';
import { SourceId } from '../../../shared/value-objects/source-id.vo';

export interface ISourceActionTransactionRepository {
  create(tx: SourceActionTransaction): Promise<void>;
  findByOrgAndSource(
    orgId: string,
    sourceId: SourceId,
    actionType: string,
    language?: string | null
  ): Promise<SourceActionTransaction | null>;
  findAllByOrgAndSource(
    orgId: string,
    sourceId: SourceId
  ): Promise<SourceActionTransaction[]>;
  update(tx: SourceActionTransaction): Promise<void>;
}
