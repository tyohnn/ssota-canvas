/**
 * App Space script 저장: 외부에서 구조화 스크립트를 받아 Video에 반영
 * Source-management Policy 등에서 호출 (SourceContentExtractedEvent → YouTube script 저장)
 */
import type { YoutubeScript } from '../../../shared/types/transcript.types';
import type { IVideoRepository } from '../../repositories/interfaces/video.repository.interface';

export interface UpdateVideoScriptParams {
  videoId: string; // Video aggregate ID (UUID)
  script: YoutubeScript;
  scriptLanguage?: string;
}

/**
 * Video에 스크립트 적용 (이미 있으면 스킵)
 */
export async function updateVideoScript(
  params: UpdateVideoScriptParams,
  videoRepository: IVideoRepository
): Promise<{ updated: boolean }> {
  const aggregate = await videoRepository.findById(params.videoId);
  if (!aggregate) return { updated: false };

  const scriptLanguage =
    params.scriptLanguage ??
    params.script.metadata?.language ??
    'auto';

  aggregate.updateScript({
    videoId: aggregate.getVideo().id.value,
    script: params.script,
    scriptLanguage,
  });

  await videoRepository.update(aggregate);
  return { updated: true };
}
