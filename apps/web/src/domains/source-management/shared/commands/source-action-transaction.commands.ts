import { OrgId } from '../value-objects/org-id.vo';
import { SourceActionTransactionId } from '../value-objects/source-action-tx-id.vo';
import { SourceId } from '../value-objects/source-id.vo';

export interface CreateSourceActionTransactionCommand {
  transactionId: SourceActionTransactionId;
  orgId: OrgId;
  sourceId: SourceId;
  actionType: string;
  language?: string | null;
}
