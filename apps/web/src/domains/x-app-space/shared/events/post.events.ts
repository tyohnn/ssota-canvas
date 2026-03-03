/**
 * Post Domain Events
 */
import type { DomainEvent } from './domain-event';

export interface PostCreatedEventPayload {
  postId: string;
  postSlug: string;
  text: string;
}

export class PostCreatedEvent implements DomainEvent {
  readonly type = 'PostCreated';

  constructor(
    public readonly aggregateId: string,
    public readonly payload: PostCreatedEventPayload,
    public readonly occurredAt: Date
  ) {}

  async handle(): Promise<void> {
    // No-op for now; policies can subscribe if needed
  }
}
