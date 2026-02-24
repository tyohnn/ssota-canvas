/**
 * Source action transaction 생성 (extract_content | extract_summary)
 */
import { Result } from '@/utils/result';

import { SourceActionTransactionAggregate } from '../../../shared/aggregates/source-action-transaction.aggregate';
import type { CreateSourceActionTransactionRequest } from '../../../shared/dtos/requests/source-action-transaction.requests';
import { SourceManagementError } from '../../../shared/errors/source-management.error';
import { OrgId } from '../../../shared/value-objects/org-id.vo';
import { SourceActionTransactionId } from '../../../shared/value-objects/source-action-tx-id.vo';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceActionTransactionRepository } from '../../repositories/interfaces/source-action-transaction.repository.interface';

export async function createSourceActionTransaction(
  safeDto: CreateSourceActionTransactionRequest,
  transactionRepository: ISourceActionTransactionRepository
): Promise<Result<SourceActionTransactionAggregate, Error>> {
  try {
    const transactionId = SourceActionTransactionId.generate();
    const sourceId = new SourceId(safeDto.sourceId);

    const aggregate = SourceActionTransactionAggregate.create({
      transactionId,
      orgId: new OrgId(safeDto.orgId),
      sourceId,
      actionType: safeDto.actionType,
      language: safeDto.language ?? null,
    });

    await transactionRepository.create(aggregate.getTransaction());

    const events = aggregate.getUncommittedEvents();
    await Promise.allSettled(events.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof SourceManagementError) {
      return Result.error(error);
    }
    return Result.error(
      new SourceManagementError(
        'SOURCE_ACTION_TRANSACTION_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create transaction'
      )
    );
  }
}
