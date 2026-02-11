/**
 * Application Event 발행: SourceContentExtractedEvent 생성 및 handle() 실행
 */
import type { SourceContentExtractedEventPayload } from '../../../shared/events/source-content-extracted.application-event';
import { SourceContentExtractedEvent } from '../../../shared/events/source-content-extracted.application-event';

export async function publishSourceContentExtracted(
  payload: SourceContentExtractedEventPayload,
  policyRunner?: (event: SourceContentExtractedEvent) => Promise<void>
): Promise<void> {
  const event = new SourceContentExtractedEvent(payload, policyRunner);
  await event.handle();
}
