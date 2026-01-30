/**
 * Visual Summary 타입 정의
 */

export interface GenerateVisualSummaryRequest {
  summary: string;
  templateId: string;
  templateSpec: string;
  pageId: string;
  sourceBlockId: string;
  sourceBlockPosition: { x: number; y: number };
  sourceBlockSize: { width: number; height: number };
  /** Source content title (e.g. video title). Used in user prompt and zone label. */
  sourceTitle?: string;
  /** Source channel or author name. Included in user prompt. */
  sourceChannelName?: string;
}

export interface VisualSummaryStreamChunk {
  type: 'skeleton' | 'content' | 'complete' | 'error';
  canvasdown?: string;
  error?: string;
}
