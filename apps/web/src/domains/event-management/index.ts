/**
 * Event Management Domain – barrel exports
 */

export * from './shared/entities/event-log.entity';
export * from './shared/aggregates/event-log.aggregate';
export * from './shared/value-objects/event-id.vo';
export * from './shared/value-objects/event-type.vo';
export * from './shared/value-objects/utterance-content.vo';
export * from './shared/value-objects/ai-response.vo';
export * from './shared/value-objects/tool-call-result.vo';
export * from './shared/value-objects/agent-execution-id.vo';
export * from './shared/commands';
export * from './shared/events';
export * from './shared/dtos';
export * from './shared/errors/event-management.error';
export * from './shared/types';

export type { EventLogRepository } from './backend/repositories/interfaces/event-log.repository.interface';
export { DrizzleEventLogRepository } from './backend/repositories/implementations/drizzle-event-log.repository';
export { EventSearchService } from './backend/services/event-search.service';
export { EventContextService } from './backend/services/event-context.service';
export { EventLogService } from './backend/services/event-log.service';
export type { EventLogPolicyContext } from './backend/services/event-log-policy.context';
