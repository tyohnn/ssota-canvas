import { OrgId } from '../value-objects/org-id.vo';
import { SourceActionTransactionId } from '../value-objects/source-action-tx-id.vo';
import { SourceId } from '../value-objects/source-id.vo';

export class SourceActionTransaction {
  private constructor(
    public readonly id: SourceActionTransactionId,
    public readonly orgId: OrgId,
    public readonly sourceId: SourceId,
    public readonly actionType: string,
    public readonly language: string | null,
    public readonly createdAt: Date,
    public completedAt: Date | null
  ) {}

  static create(
    id: SourceActionTransactionId,
    orgId: OrgId,
    sourceId: SourceId,
    actionType: string,
    language: string | null = null
  ): SourceActionTransaction {
    const now = new Date();
    return new SourceActionTransaction(
      id,
      orgId,
      sourceId,
      actionType,
      language,
      now,
      null
    );
  }

  static reconstitute(
    id: SourceActionTransactionId,
    orgId: OrgId,
    sourceId: SourceId,
    actionType: string,
    language: string | null,
    createdAt: Date,
    completedAt: Date | null
  ): SourceActionTransaction {
    return new SourceActionTransaction(
      id,
      orgId,
      sourceId,
      actionType,
      language,
      createdAt,
      completedAt
    );
  }

  markCompleted(): void {
    this.completedAt = new Date();
  }
}
