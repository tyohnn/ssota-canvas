import { EventId } from '../value-objects/event-id.vo';
import { EventType } from '../value-objects/event-type.vo';
import { UtteranceContent } from '../value-objects/utterance-content.vo';
import { AIResponse } from '../value-objects/ai-response.vo';
import { ToolCallResult } from '../value-objects/tool-call-result.vo';

/**
 * EventLog 컨텐츠 타입 (Union Type)
 */
export type EventLogContent = UtteranceContent | AIResponse | ToolCallResult;

/**
 * EventLog Entity
 * 이벤트 로그 도메인 엔티티로 이벤트의 핵심 정보와 비즈니스 로직을 캡슐화
 *
 * 비즈니스 규칙:
 * - Append-Only: 이벤트는 생성 후 수정/삭제 불가 (Immutable Audit Log)
 * - 페이지 격리: Event Log는 반드시 하나의 Page에 속하며, 페이지 간 격리됨
 * - timestamp는 createdAt 이전이어야 함 (이벤트 발생 시점 ≤ 로그 생성 시점)
 */
export class EventLog {
  constructor(
    public readonly id: EventId,
    public readonly eventType: EventType,
    public readonly pageId: string, // PageId VO는 workspace-management에서 재사용
    public readonly userId: string, // UserId VO는 user-management에서 재사용
    public readonly timestamp: Date,
    public readonly content: EventLogContent,
    public readonly metadata?: Record<string, unknown>,
    public readonly agentExecutionId?: string,
    public readonly createdAt: Date = new Date()
  ) {
    this.validate();
  }

  /**
   * 유효성 검증
   */
  private validate(): void {
    // timestamp는 createdAt 이전이어야 함
    if (this.timestamp > this.createdAt) {
      throw new Error('Event timestamp cannot be later than log creation time');
    }
  }

  /**
   * 컨텐츠를 문자열로 반환
   */
  getContentAsString(): string {
    return this.content.toString();
  }

  /**
   * 지정된 시간(일)보다 오래된 이벤트인지 확인
   */
  isOlderThan(days: number): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.timestamp < cutoffDate;
  }

  /**
   * 자연어 이벤트인지 확인 (BM25 검색 대상)
   */
  isNaturalLanguageEvent(): boolean {
    return this.eventType.isUserUtterance() || this.eventType.isAIResponse();
  }

  /**
   * 정형 이벤트인지 확인 (메타데이터 필터링 대상)
   */
  isStructuredEvent(): boolean {
    return this.eventType.isToolCall() || this.eventType.isBlockChange();
  }

  /**
   * 검색 가능한 텍스트 추출 (BM25 검색용)
   */
  extractSearchableText(): string | null {
    if (!this.isNaturalLanguageEvent()) {
      return null;
    }
    return this.getContentAsString();
  }
}
