// 🎯 AI Management Domain Error = 비즈니스 규칙 위반 + 사용자 친화적 메시지
export class AIManagementError extends Error {
  readonly code: AIManagementErrorCode;
  readonly details?: unknown;

  constructor(code: AIManagementErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'AIManagementError';
    this.code = code;
    this.details = details;
  }
}

// 🎯 에러 코드 열거형
export enum AIManagementErrorCode {
  // Event 관련 에러
  INVALID_EVENT_ID = 'INVALID_EVENT_ID',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
  INVALID_UTTERANCE_CONTENT = 'INVALID_UTTERANCE_CONTENT',
  INVALID_AI_RESPONSE = 'INVALID_AI_RESPONSE',
  INVALID_TOOL_CALL_RESULT = 'INVALID_TOOL_CALL_RESULT',
  EVENT_NOT_FOUND = 'EVENT_NOT_FOUND',

  // Memory Search 관련 에러
  MEMORY_SEARCH_FAILED = 'MEMORY_SEARCH_FAILED',
  INVALID_SEARCH_QUERY = 'INVALID_SEARCH_QUERY',

  // Context Assembly 관련 에러
  CONTEXT_ASSEMBLY_FAILED = 'CONTEXT_ASSEMBLY_FAILED',
  INVALID_CONTEXT = 'INVALID_CONTEXT',

  // Tool Execution 관련 에러
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  INVALID_TOOL_NAME = 'INVALID_TOOL_NAME',
  INVALID_TOOL_PARAMETERS = 'INVALID_TOOL_PARAMETERS',

  // 권한 관련 에러
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 시스템 관련 에러
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // 입력 검증 에러
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
}

// 🎯 에러 메시지 매핑
export const ERROR_MESSAGES: Record<AIManagementErrorCode, string> = {
  [AIManagementErrorCode.INVALID_EVENT_ID]: '유효하지 않은 이벤트 ID입니다.',
  [AIManagementErrorCode.INVALID_EVENT_TYPE]:
    '유효하지 않은 이벤트 타입입니다.',
  [AIManagementErrorCode.INVALID_UTTERANCE_CONTENT]:
    '유효하지 않은 발화 내용입니다.',
  [AIManagementErrorCode.INVALID_AI_RESPONSE]: '유효하지 않은 AI 응답입니다.',
  [AIManagementErrorCode.INVALID_TOOL_CALL_RESULT]:
    '유효하지 않은 툴 호출 결과입니다.',
  [AIManagementErrorCode.EVENT_NOT_FOUND]: '이벤트를 찾을 수 없습니다.',
  [AIManagementErrorCode.MEMORY_SEARCH_FAILED]: '메모리 검색에 실패했습니다.',
  [AIManagementErrorCode.INVALID_SEARCH_QUERY]:
    '유효하지 않은 검색 쿼리입니다.',
  [AIManagementErrorCode.CONTEXT_ASSEMBLY_FAILED]:
    '컨텍스트 조립에 실패했습니다.',
  [AIManagementErrorCode.INVALID_CONTEXT]: '유효하지 않은 컨텍스트입니다.',
  [AIManagementErrorCode.TOOL_EXECUTION_FAILED]: '툴 실행에 실패했습니다.',
  [AIManagementErrorCode.INVALID_TOOL_NAME]: '유효하지 않은 툴 이름입니다.',
  [AIManagementErrorCode.INVALID_TOOL_PARAMETERS]:
    '유효하지 않은 툴 파라미터입니다.',
  [AIManagementErrorCode.UNAUTHORIZED_ACCESS]: '접근 권한이 없습니다.',
  [AIManagementErrorCode.INSUFFICIENT_PERMISSIONS]: '권한이 부족합니다.',
  [AIManagementErrorCode.DATABASE_CONNECTION_FAILED]:
    '데이터베이스 연결에 실패했습니다.',
  [AIManagementErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]:
    '외부 서비스를 사용할 수 없습니다.',
  [AIManagementErrorCode.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [AIManagementErrorCode.INVALID_INPUT]: '입력값이 유효하지 않습니다.',
  [AIManagementErrorCode.MISSING_REQUIRED_FIELD]: '필수 필드가 누락되었습니다.',
};

// 🎯 에러 처리 유틸리티
export function createAIManagementError(
  code: AIManagementErrorCode,
  details?: unknown
): AIManagementError {
  const message = ERROR_MESSAGES[code];
  return new AIManagementError(code, message, details);
}

export function isAIManagementError(
  error: unknown
): error is AIManagementError {
  return error instanceof AIManagementError;
}

// 🎯 에러 분류
export function classifyError(error: unknown): {
  type: 'business' | 'system' | 'validation' | 'unknown';
  code: string;
  message: string;
  userMessage: string;
} {
  if (isAIManagementError(error)) {
    const type = getErrorType(error.code);
    return {
      type,
      code: error.code,
      message: error.message,
      userMessage: ERROR_MESSAGES[error.code],
    };
  }

  return {
    type: 'unknown',
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    userMessage: '예상치 못한 오류가 발생했습니다.',
  };
}

function getErrorType(
  code: AIManagementErrorCode
): 'business' | 'system' | 'validation' {
  if (code.includes('NOT_FOUND') || code.includes('FAILED')) {
    return 'business';
  }
  if (
    code.includes('DATABASE') ||
    code.includes('NETWORK') ||
    code.includes('SERVICE')
  ) {
    return 'system';
  }
  return 'validation';
}
