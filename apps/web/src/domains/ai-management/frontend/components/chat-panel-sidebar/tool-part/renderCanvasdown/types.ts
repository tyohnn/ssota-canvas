/**
 * renderCanvasdown tool part types and helpers.
 *
 * Data flow:
 * 1. Server: renderCanvasdown has no execute (client-side tool); tool call is sent to client.
 * 2. Client: use-chat-v2 onToolCall → handleRenderCanvasdown → addToolOutput with output.
 * 3. Part shape: part.output matches RenderCanvasdownToolOutput on success.
 */

export interface RenderCanvasdownToolOutput {
  success: boolean;
  message?: string;
  blockIdMap?: Record<string, string>;
}

/** Minimal part shape for isRenderCanvasdownToolPart. */
interface PartWithToolIdentity {
  type?: string;
  toolName?: string;
}

export function isRenderCanvasdownToolPart(part: PartWithToolIdentity): boolean {
  return part.toolName === 'renderCanvasdown' || part.type === 'tool-renderCanvasdown';
}
