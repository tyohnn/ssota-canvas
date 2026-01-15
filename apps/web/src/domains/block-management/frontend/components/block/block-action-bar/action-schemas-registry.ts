/**
 * Block Action Schemas Registry
 *
 * 모든 블록 타입의 액션 스키마를 통합 관리
 *
 * 역할:
 * - 런타임 파라미터 검증 (Zod)
 * - use-block-action-executor에서 사용
 * - AI Definition과 분리 (관심사 분리)
 *
 * 구조:
 * - 각 블록의 {blockType}-action-schemas.ts에서 import
 * - 통합 registry로 export
 * - blockType.action 형태로 접근
 */
import { z } from 'zod';

import { AudioBlockActionSchemas } from '../block-type/audio/config/audio-block-action-schemas';
import { ImageBlockActionSchemas } from '../block-type/image/config/image-block-action-schemas';
import { LinkBlockActionSchemas } from '../block-type/link/config/link-block-action-schemas';
import { MarkdownBlockActionSchemas } from '../block-type/markdown/config/markdown-block-action-schemas';
import { PdfBlockActionSchemas } from '../block-type/pdf/config/pdf-block-action-schemas';
import { PythonBlockActionSchemas } from '../block-type/python/config/python-block-action-schemas';
import { TextBlockActionSchemas } from '../block-type/text/config/text-block-action-schemas';
import { YoutubeBlockActionSchemas } from '../block-type/youtube/config/youtube-block-action-schemas';

/**
 * 블록 타입별 액션 스키마 매핑
 *
 * 사용 예:
 * ```typescript
 * const schema = BLOCK_ACTION_SCHEMAS['image']['imageSearch'];
 * const result = schema.safeParse(params);
 * ```
 */
export const BLOCK_ACTION_SCHEMAS: Record<
  string,
  Record<string, z.ZodType<any>>
> = {
  image: ImageBlockActionSchemas,
  markdown: MarkdownBlockActionSchemas,
  youtube: YoutubeBlockActionSchemas,
  pdf: PdfBlockActionSchemas,
  link: LinkBlockActionSchemas,
  audio: AudioBlockActionSchemas,
  text: TextBlockActionSchemas,
  python: PythonBlockActionSchemas,
  // shape는 액션 스키마가 없음 (액션 없음)
  shape: {},
};

/**
 * 특정 블록 타입과 액션의 스키마 가져오기
 *
 * @param blockType - 블록 타입 (e.g., 'image')
 * @param action - 액션 이름 (e.g., 'imageSearch')
 * @returns Zod schema or undefined
 */
export function getActionSchema(
  blockType: string,
  action: string
): z.ZodType<any> | undefined {
  const blockSchemas = BLOCK_ACTION_SCHEMAS[blockType];
  if (!blockSchemas) {
    return undefined;
  }
  return blockSchemas[action];
}

/**
 * 액션 파라미터 검증
 *
 * @param blockType - 블록 타입
 * @param action - 액션 이름
 * @param params - 검증할 파라미터
 * @returns 검증 결과
 */
export function validateActionParams(
  blockType: string,
  action: string,
  params: any
): { success: true; data: any } | { success: false; error: string } {
  const schema = getActionSchema(blockType, action);

  // 스키마가 없으면 검증 통과
  if (!schema) {
    return { success: true, data: params };
  }

  const result = schema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const errorMessage = result.error.issues
      .map(e => `- ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    return {
      success: false,
      error: `Invalid parameters for ${blockType}.${action}:\n${errorMessage}`,
    };
  }
}
