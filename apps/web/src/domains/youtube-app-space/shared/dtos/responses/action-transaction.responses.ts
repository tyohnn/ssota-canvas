/**
 * Action Transaction Response DTOs
 *
 * Action과 1:1 대응되는 Response DTO만 정의
 * ⚠️ DTO는 plain object여야 함 (클래스 불가, 직렬화 가능해야 함)
 */

/**
 * check-action-transaction.action.ts용 Response DTO
 */
export interface CheckActionTransactionDTO {
  exists: boolean;
}

/**
 * create-action-transaction.action.ts용 Response DTO
 */
export interface CreateActionTransactionDTO {
  transactionId: string;
}
