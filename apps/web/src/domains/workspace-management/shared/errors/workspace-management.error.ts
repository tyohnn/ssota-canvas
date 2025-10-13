/**
 * Workspace Management Domain Error
 *
 * 도메인별 에러를 체계적으로 관리하는 기본 에러 클래스
 */

export type WorkspaceManagementErrorCode =
  // Workspace 관련 에러
  | 'WORKSPACE_NOT_FOUND'
  | 'INVALID_WORKSPACE_ID'
  | 'INVALID_WORKSPACE_NAME'
  | 'DEFAULT_WORKSPACE_NOT_DELETABLE'
  | 'WORKSPACE_ALREADY_EXISTS'

  // Page 관련 에러
  | 'PAGE_NOT_FOUND'
  | 'INVALID_PAGE_ID'
  | 'INVALID_PAGE_TITLE'
  | 'CIRCULAR_REFERENCE_DETECTED'
  | 'INVALID_PAGE_DEPTH'
  | 'INVALID_PARENT_PAGE'

  // Invitation 관련 에러 (Scenario 3)
  | 'INVITATION_NOT_FOUND'
  | 'INVALID_WORKSPACE_INVITATION_ID'
  | 'ALREADY_WORKSPACE_MEMBER'
  | 'INVITATION_ALREADY_PROCESSED'
  | 'NOT_INVITATION_TARGET'
  | 'NOT_ORG_MEMBER_FOR_INVITATION'

  // 권한 관련 에러
  | 'NOT_ORG_MEMBER'
  | 'NOT_WORKSPACE_MEMBER'
  | 'NOT_ORG_ADMIN'
  | 'NOT_ORG_OWNER'
  | 'UNAUTHORIZED_ACCESS'
  | 'INSUFFICIENT_PERMISSIONS'

  // 시스템 관련 에러
  | 'DATABASE_CONNECTION_FAILED'
  | 'EXTERNAL_SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'NOTIFICATION_SERVICE_UNAVAILABLE'

  // 입력 검증 에러
  | 'INVALID_INPUT'
  | 'MISSING_REQUIRED_FIELD';

export class WorkspaceManagementError extends Error {
  readonly code: WorkspaceManagementErrorCode;
  readonly details?: unknown;

  constructor(
    code: WorkspaceManagementErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'WorkspaceManagementError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WorkspaceManagementError);
    }
  }
}

// 에러 메시지 매핑
export const ERROR_MESSAGES: Record<WorkspaceManagementErrorCode, string> = {
  // Workspace
  WORKSPACE_NOT_FOUND: 'Workspace를 찾을 수 없습니다',
  INVALID_WORKSPACE_ID: '유효하지 않은 Workspace ID 형식입니다',
  INVALID_WORKSPACE_NAME: 'Workspace 이름이 유효하지 않습니다',
  DEFAULT_WORKSPACE_NOT_DELETABLE: '기본 워크스페이스는 삭제할 수 없습니다',
  WORKSPACE_ALREADY_EXISTS: '이미 존재하는 Workspace입니다',

  // Page
  PAGE_NOT_FOUND: '페이지를 찾을 수 없습니다',
  INVALID_PAGE_ID: '유효하지 않은 Page ID 형식입니다',
  INVALID_PAGE_TITLE: '페이지 제목이 유효하지 않습니다',
  CIRCULAR_REFERENCE_DETECTED: '순환 참조가 발생합니다',
  INVALID_PAGE_DEPTH: '유효하지 않은 페이지 깊이입니다',
  INVALID_PARENT_PAGE: '부모 페이지가 같은 Workspace에 속하지 않습니다',

  // Invitation (Scenario 3)
  INVITATION_NOT_FOUND: '초대를 찾을 수 없습니다',
  INVALID_WORKSPACE_INVITATION_ID: '유효하지 않은 초대 ID 형식입니다',
  ALREADY_WORKSPACE_MEMBER: '이미 Workspace 멤버입니다',
  INVITATION_ALREADY_PROCESSED: '이미 처리된 초대입니다',
  NOT_INVITATION_TARGET: '본인의 초대만 처리할 수 있습니다',
  NOT_ORG_MEMBER_FOR_INVITATION: '조직 멤버만 초대할 수 있습니다',

  // 권한
  NOT_ORG_MEMBER: '조직 멤버가 아닙니다',
  NOT_WORKSPACE_MEMBER: 'Workspace에 초대되지 않았습니다',
  NOT_ORG_ADMIN: '조직 관리자 권한이 필요합니다',
  NOT_ORG_OWNER: '조직 소유자 권한이 필요합니다',
  UNAUTHORIZED_ACCESS: '접근 권한이 없습니다',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다',

  // 시스템
  DATABASE_CONNECTION_FAILED: '데이터베이스 연결에 실패했습니다',
  EXTERNAL_SERVICE_UNAVAILABLE: '외부 서비스를 사용할 수 없습니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  NOTIFICATION_SERVICE_UNAVAILABLE: '알림 서비스를 사용할 수 없습니다',

  // 입력 검증
  INVALID_INPUT: '입력값이 유효하지 않습니다',
  MISSING_REQUIRED_FIELD: '필수 필드가 누락되었습니다',
};

// 에러 생성 헬퍼
export function createWorkspaceManagementError(
  code: WorkspaceManagementErrorCode,
  details?: unknown
): WorkspaceManagementError {
  const message = ERROR_MESSAGES[code];
  return new WorkspaceManagementError(code, message, details);
}

// 에러 타입 가드
export function isWorkspaceManagementError(
  error: unknown
): error is WorkspaceManagementError {
  return error instanceof WorkspaceManagementError;
}
