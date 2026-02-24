/**
 * Check if a source action transaction exists for (orgId, sourceId, actionType, language)
 */
import { Result } from '@/utils/result';

import type { CheckSourceActionTransactionRequest } from '../../../shared/dtos/requests/source-action-transaction.requests';
import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceActionTransactionRepository } from '../../repositories/interfaces/source-action-transaction.repository.interface';

export interface CheckSourceActionTransactionResult {
  exists: boolean;
  completed: boolean;
}

export async function checkSourceActionTransaction(
  safeDto: CheckSourceActionTransactionRequest,
  transactionRepository: ISourceActionTransactionRepository
): Promise<Result<CheckSourceActionTransactionResult, Error>> {
  try {
    const sourceId = new SourceId(safeDto.sourceId);
    const tx = await transactionRepository.findByOrgAndSource(
      safeDto.orgId,
      sourceId,
      safeDto.actionType,
      safeDto.language ?? null
    );
    if (!tx) {
      return Result.success({ exists: false, completed: false });
    }
    return Result.success({
      exists: true,
      completed: tx.completedAt != null,
    });
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Check transaction failed')
    );
  }
}
