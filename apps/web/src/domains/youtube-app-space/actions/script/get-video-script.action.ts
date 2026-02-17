'use server';

import { ActionResult, err, ok } from '@/lib';
import { z } from 'zod';

import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';

import { DrizzleVideoRepository } from '../../backend/repositories/implementations/drizzle-video.repository';
import type { YoutubeScript } from '../../shared/types/transcript.types';
import type { YoutubeBlockActionContext } from '../secure-action';
import { withYoutubeBlockSecureAction } from '../secure-action';

const GetVideoScriptRequestSchema = z.object({
  workspaceId: z.uuid(),
  blockId: BlockSlugSchema,
});
type GetVideoScriptRequest = z.infer<typeof GetVideoScriptRequestSchema>;

/**
 * YouTube 블록의 스크립트(구조화 transcript) 조회
 * youtube_app_space.videos.script 사용 (타임스탬프, TOC, 인용 등 UI 기능용)
 */
export const getVideoScriptAction = withYoutubeBlockSecureAction(
  GetVideoScriptRequestSchema,
  'getVideoScriptAction',
  getVideoScriptInternal
);

async function getVideoScriptInternal(
  _req: GetVideoScriptRequest,
  ctx: YoutubeBlockActionContext
): Promise<ActionResult<{ script: YoutubeScript | null }>> {
  const youtubeId = ctx.youtubeProperties.youtubeId;
  if (!youtubeId) {
    return ok({ script: null });
  }

  const videoRepo = new DrizzleVideoRepository();
  const aggregate = await videoRepo.findById(youtubeId);
  if (!aggregate) {
    return ok({ script: null });
  }

  const video = aggregate.getVideo();
  const script = video.script ?? null;
  return ok({ script });
}
