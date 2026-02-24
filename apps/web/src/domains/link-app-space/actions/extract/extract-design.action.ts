/**
 * Link Block - Extract Design Action
 *
 * URL 페이지에서 디자인 메타데이터(색상, 폰트 등) 추출 (현재 스텁)
 */

'use server';

import { ActionResult, ok } from '@/lib';
import { z } from 'zod';

import type { LinkBlockActionContext } from '../secure-action';
import { withLinkBlockSecureAction } from '../secure-action';
import type { LinkActionPropertiesResult } from '../../shared/types/link-action-result.types';

const ExtractDesignRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: z.string().regex(/^[0-9a-f]{8,10}$/i),
  url: z.url(),
});

type ExtractDesignRequest = z.output<typeof ExtractDesignRequestSchema>;

export const extractDesignAction = withLinkBlockSecureAction(
  ExtractDesignRequestSchema,
  'extractDesignAction',
  extractDesignInternal
);

async function extractDesignInternal(
  _req: ExtractDesignRequest,
  _context: LinkBlockActionContext
): Promise<ActionResult<LinkActionPropertiesResult>> {
  const design = {
    colors: ['#ffffff', '#000000', '#666666'],
    fonts: ['Inter', 'system-ui'],
    metadata: { stub: true },
  };
  return ok({ mode: 'replace', properties: { design } });
}
