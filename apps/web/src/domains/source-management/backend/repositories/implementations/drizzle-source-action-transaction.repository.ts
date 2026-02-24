import { and, eq, isNull } from 'drizzle-orm';
import { adminDb } from '@/db';
import {
  sourceActionTransactions as sourceActionTransactionsTable,
} from '@/db/schema';

import { SourceActionTransaction } from '../../../shared/entities/source-action-transaction.entity';
import { SourceManagementError } from '../../../shared/errors/source-management.error';
import { OrgId } from '../../../shared/value-objects/org-id.vo';
import { SourceActionTransactionId } from '../../../shared/value-objects/source-action-tx-id.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceActionTransactionRepository } from '../interfaces/source-action-transaction.repository.interface';

type Row = (typeof sourceActionTransactionsTable.$inferSelect);

export class DrizzleSourceActionTransactionRepository
  implements ISourceActionTransactionRepository
{
  async create(tx: SourceActionTransaction): Promise<void> {
    try {
      await adminDb.insert(sourceActionTransactionsTable).values({
        id: tx.id.value,
        org_id: tx.orgId.value,
        source_id: tx.sourceId.value,
        action_type: tx.actionType,
        language: tx.language,
        created_at: tx.createdAt,
        completed_at: tx.completedAt,
      });
    } catch (error) {
      throw new SourceManagementError(
        'SOURCE_ACTION_TRANSACTION_CREATION_FAILED',
        `Failed to create source action transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(tx: SourceActionTransaction): Promise<void> {
    try {
      await adminDb
        .update(sourceActionTransactionsTable)
        .set({
          completed_at: tx.completedAt,
        })
        .where(eq(sourceActionTransactionsTable.id, tx.id.value));
    } catch (error) {
      throw new SourceManagementError(
        'SOURCE_UPDATE_FAILED',
        `Failed to update source action transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findByOrgAndSource(
    orgId: string,
    sourceId: SourceId,
    actionType: string,
    language?: string | null
  ): Promise<SourceActionTransaction | null> {
    const conditions = [
      eq(sourceActionTransactionsTable.org_id, orgId),
      eq(sourceActionTransactionsTable.source_id, sourceId.value),
      eq(sourceActionTransactionsTable.action_type, actionType),
    ];
    if (language !== undefined && language !== null) {
      conditions.push(eq(sourceActionTransactionsTable.language, language));
    } else {
      conditions.push(isNull(sourceActionTransactionsTable.language));
    }
    const rows = await adminDb
      .select()
      .from(sourceActionTransactionsTable)
      .where(and(...conditions))
      .limit(1);
    if (rows.length === 0) return null;
    return this.mapToTransaction(rows[0]!);
  }

  async findAllByOrgAndSource(
    orgId: string,
    sourceId: SourceId
  ): Promise<SourceActionTransaction[]> {
    const rows = await adminDb
      .select()
      .from(sourceActionTransactionsTable)
      .where(
        and(
          eq(sourceActionTransactionsTable.org_id, orgId),
          eq(sourceActionTransactionsTable.source_id, sourceId.value)
        )
      );
    return rows.map(row => this.mapToTransaction(row));
  }

  private mapToTransaction(row: Row): SourceActionTransaction {
    const id = new SourceActionTransactionId(row.id);
    const orgId = new OrgId(row.org_id);
    const sourceId = new SourceId(row.source_id);
    return SourceActionTransaction.reconstitute(
      id,
      orgId,
      sourceId,
      row.action_type,
      row.language,
      row.created_at,
      row.completed_at
    );
  }
}
