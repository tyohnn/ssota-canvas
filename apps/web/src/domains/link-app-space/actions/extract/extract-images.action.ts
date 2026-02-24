/**
 * Link Block - Extract Images Action
 *
 * URL 페이지에서 이미지 추출 (현재 스텁)
 */

'use server';

import { ActionResult, ok } from '@/lib';
import { z } from 'zod';

import type { LinkBlockActionContext } from '../secure-action';
import { withLinkBlockSecureAction } from '../secure-action';
import type { LinkActionPropertiesResult } from '../../shared/types/link-action-result.types';

const ExtractImagesRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: z.string().regex(/^[0-9a-f]{8,10}$/i),
  url: z.url(),
});

type ExtractImagesRequest = z.output<typeof ExtractImagesRequestSchema>;

export const extractImagesAction = withLinkBlockSecureAction(
  ExtractImagesRequestSchema,
  'extractImagesAction',
  extractImagesInternal
);

async function extractImagesInternal(
  _req: ExtractImagesRequest,
  _context: LinkBlockActionContext
): Promise<ActionResult<LinkActionPropertiesResult>> {
  const images = [
    { url: 'https://placehold.co/400x300/eee/999?text=Image+1', alt: 'Stub' },
  ];
  return ok({ mode: 'replace', properties: { images } });
}
