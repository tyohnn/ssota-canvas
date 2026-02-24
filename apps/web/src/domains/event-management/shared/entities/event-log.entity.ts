import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { EventId } from '../value-objects/event-id.vo';
import { EventType } from '../value-objects/event-type.vo';
import { UtteranceContent } from '../value-objects/utterance-content.vo';
import { AIResponse } from '../value-objects/ai-response.vo';
import { ToolCallResult } from '../value-objects/tool-call-result.vo';

export type EventLogContent =
  | UtteranceContent
  | AIResponse
  | ToolCallResult;

export class EventLog {
  constructor(
    public readonly id: EventId,
    public readonly eventType: EventType,
    public readonly pageId: PageId,
    public readonly userId: UserId,
    public readonly timestamp: Date,
    public readonly content: EventLogContent,
    public readonly metadata?: Record<string, unknown>,
    public readonly agentExecutionId?: string,
    public readonly createdAt: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.timestamp > this.createdAt) {
      throw new Error(
        'Event timestamp cannot be later than log creation time'
      );
    }
  }

  getContentAsString(): string {
    return this.content.toString();
  }

  isOlderThan(days: number): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.timestamp < cutoffDate;
  }

  isNaturalLanguageEvent(): boolean {
    return this.eventType.isUserUtterance() || this.eventType.isAIResponse();
  }

  isStructuredEvent(): boolean {
    return this.eventType.isToolCall() || this.eventType.isBlockChange();
  }

  extractSearchableText(): string | null {
    if (!this.isNaturalLanguageEvent()) {
      return null;
    }
    return this.getContentAsString();
  }
}
