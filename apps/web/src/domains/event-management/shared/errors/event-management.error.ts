/**
 * Event Management Domain Errors
 */
export class EventManagementError extends Error {
  readonly code: EventManagementErrorCode;
  readonly details?: unknown;

  constructor(
    code: EventManagementErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'EventManagementError';
    this.code = code;
    this.details = details;
  }
}

export enum EventManagementErrorCode {
  INVALID_EVENT_ID = 'INVALID_EVENT_ID',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
  INVALID_UTTERANCE_CONTENT = 'INVALID_UTTERANCE_CONTENT',
  INVALID_AI_RESPONSE = 'INVALID_AI_RESPONSE',
  INVALID_TOOL_CALL_RESULT = 'INVALID_TOOL_CALL_RESULT',
  EVENT_NOT_FOUND = 'EVENT_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_TOOL_NAME = 'INVALID_TOOL_NAME',
}
