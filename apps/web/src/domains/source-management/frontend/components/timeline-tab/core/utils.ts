/**
 * Timeline Tab Utils
 */

export interface TimelineTranscriptSegment {
  start: number;
  text: string;
}

export interface TOCItem {
  minute: number;
  startTime: number;
  firstSegmentIndex: number;
  previewText?: string;
  intervalType: '5min' | '10min';
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateMinuteTOC(
  transcript: TimelineTranscriptSegment[] | undefined
): TOCItem[] {
  if (!transcript || transcript.length === 0) {
    return [];
  }

  const tocItems: TOCItem[] = [];
  const processedIntervals = new Set<string>();

  transcript.forEach((segment, index) => {
    const minute = Math.floor(segment.start / 60);

    if (minute % 5 === 0 && minute % 10 !== 0) {
      const key = `5min:${minute}`;
      if (!processedIntervals.has(key)) {
        processedIntervals.add(key);
        tocItems.push({
          minute,
          startTime: segment.start,
          firstSegmentIndex: index,
          previewText: segment.text.substring(0, 50),
          intervalType: '5min',
        });
      }
    }

    if (minute % 10 === 0) {
      const key = `10min:${minute}`;
      if (!processedIntervals.has(key)) {
        processedIntervals.add(key);
        tocItems.push({
          minute,
          startTime: segment.start,
          firstSegmentIndex: index,
          previewText: segment.text.substring(0, 50),
          intervalType: '10min',
        });
      }
    }
  });

  return tocItems.sort((a, b) => a.startTime - b.startTime);
}
