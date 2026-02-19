/**
 * Link Block - Screenshot Capture Action
 *
 * URL 페이지 스크린샷 캡처 (현재 스텁)
 */

'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import type { LinkBlockActionContext } from '../secure-action';
import { withLinkBlockSecureAction } from '../secure-action';
import type { LinkActionPropertiesResult } from '../../shared/types/link-action-result.types';

const CaptureScreenshotRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: z.string().regex(/^[0-9a-f]{8,10}$/i),
  url: z.url(),
  fullPage: z.boolean().optional().default(false),
});

type CaptureScreenshotRequest = z.output<typeof CaptureScreenshotRequestSchema>;

export const captureScreenshotAction = withLinkBlockSecureAction(
  CaptureScreenshotRequestSchema,
  'captureScreenshotAction',
  captureScreenshotInternal
);

async function captureScreenshotInternal(
  req: CaptureScreenshotRequest,
  _context: LinkBlockActionContext
): Promise<ActionResult<LinkActionPropertiesResult>> {
  const props = _context.block.properties.toJSON() as Record<string, unknown>;
  const item = {
    url: 'https://placehold.co/800x600/eee/999?text=Screenshot+Stub',
    fullPage: req.fullPage ?? false,
    capturedAt: new Date().toISOString(),
  };
  const existing = (props.screenshot ?? []) as Array<Record<string, unknown>>;
  return ok({
    mode: 'replace',
    properties: { screenshot: [...existing, item] },
  });
}
