/**
 * Get languages for which extract_summary action transaction exists (org + source)
 */
import { Result } from '@/utils/result';

import { SourceId } from '../../../shared/value-objects/source-id.vo';
import type { ISourceActionTransactionRepository } from '../../repositories/interfaces/source-action-transaction.repository.interface';

const EXTRACT_SUMMARY_ACTION = 'extract_summary';

export async function getSummaryActionTransactionLanguages(
  orgId: string,
  sourceIdValue: string,
  transactionRepository: ISourceActionTransactionRepository
): Promise<Result<string[], Error>> {
  try {
    const sourceId = new SourceId(sourceIdValue);
    const all = await transactionRepository.findAllByOrgAndSource(
      orgId,
      sourceId
    );
    const summaryTx = all.filter(t => t.actionType === EXTRACT_SUMMARY_ACTION);
    const languages = [
      ...new Set(
        summaryTx
          .map(t => t.language)
          .filter((l): l is string => l != null && l !== '')
      ),
    ];
    return Result.success(languages);
  } catch (error) {
    return Result.error(
      error instanceof Error ? error : new Error('Get summary languages failed')
    );
  }
}
