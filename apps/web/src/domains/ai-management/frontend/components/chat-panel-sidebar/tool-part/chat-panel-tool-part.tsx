'use client';

import type { ToolCallPart } from '../types';
import { getToolPartLabel } from '../types';
import { isReadToolPart, ReadTriggerItem } from './read';
import { isRenderCanvasdownToolPart, RenderCanvasdownItem } from './renderCanvasdown';
import { isWebSearchToolPart, WebSearchAccordion } from './webSearch';

export interface ChatPanelToolPartProps {
  /** Single tool part (for non-search or when not grouping). */
  part?: ToolCallPart;
  /** Multiple webSearch parts to render as one group (each as WebSearchAccordion). */
  parts?: ToolCallPart[];
  partKey: string;
}

/**
 * Renders tool parts by type: webSearch → WebSearchAccordion; read → ReadTriggerItem; renderCanvasdown → RenderCanvasdownItem; others → minimal label fallback.
 */
export function ChatPanelToolPart({ part: singlePart, parts: groupedParts, partKey }: ChatPanelToolPartProps) {
  const part = singlePart ?? (groupedParts && groupedParts[0]);
  const parts = groupedParts?.length ? groupedParts : part ? [part] : [];

  const isSearch = parts.length > 0 && parts.every(isWebSearchToolPart);
  const isRead = part && isReadToolPart(part);
  const isRenderCanvasdown = part && isRenderCanvasdownToolPart(part);

  if (isSearch) {
    return (
      <>
        {parts.map((p, idx) => (
          <WebSearchAccordion
            key={(p as { toolCallId?: string }).toolCallId ?? `${partKey}-${idx}`}
            part={p}
            partKey={(p as { toolCallId?: string }).toolCallId ?? `${partKey}-${idx}`}
          />
        ))}
      </>
    );
  }

  if (isRead) {
    return <ReadTriggerItem part={part} partKey={partKey} />;
  }

  if (isRenderCanvasdown) {
    return <RenderCanvasdownItem part={part} partKey={partKey} />;
  }

  if (part) {
    const label = getToolPartLabel(part);
    const stateLabel =
      part.state === 'output-error'
        ? 'failed'
        : part.state === 'output-available'
          ? 'done'
          : part.state === 'input-streaming'
            ? 'preparing…'
            : 'running…';
    return (
      <div className="text-muted-foreground text-sm border-muted border-l-2 pl-4">
        {label} {stateLabel}
      </div>
    );
  }

  return null;
}
