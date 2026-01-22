/**
 * Action Transaction Commands
 *
 * 비즈니스 의도를 명확히 표현하는 Command 패턴
 */
import type { ActionType } from '../entities/action-transaction.entity';

/**
 * Action Transaction 생성 Command
 *
 * 유료 액션 실행을 추적하기 위한 Transaction 생성
 * org_id 기반으로 org 단위 권한 관리
 */
export interface CreateActionTransactionCommand {
  orgId: string; // Organization ID (org 단위 권한 관리)
  videoId: string;
  actionType: ActionType;
  language?: string; // Language code for multi-language actions (e.g., 'ko' for extract_summary)
}

/**
 * Action Transaction 완료 Command
 *
 * 유료 액션 실행 완료 처리
 */
export interface CompleteActionTransactionCommand {
  transactionId: string;
}
