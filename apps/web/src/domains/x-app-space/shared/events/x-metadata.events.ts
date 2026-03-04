/**
 * X Metadata Events (Application Event)
 */
import type { ApplicationEvent } from './application-event';

export interface XMetadataFetchedEventData {
  workspaceId: string;
  blockId: string;
  orgId: string;
  xPostId: string;
  language: string;
}

export class XMetadataFetchedEvent implements ApplicationEvent {
  readonly type = 'XMetadataFetched';

  constructor(
    public readonly aggregateId: string,
    public readonly data: XMetadataFetchedEventData,
    public readonly occurredAt: Date,
    private readonly runPolicy?: () => Promise<void>
  ) {}

  async handle(): Promise<void> {
    if (this.runPolicy) {
      await Promise.allSettled([this.runPolicy()]);
    }
  }
}
