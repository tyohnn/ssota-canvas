/**
 * Link Block Actions (Non-Hook Version)
 *
 * - summarize: Source 도메인 (ExtractSummaryLinkAction에서 processSourceSummaryAction 호출)
 * - screenshot, extractImages, extractDesign: link-app-space 액션
 */
import { captureScreenshotAction } from '@/domains/link-app-space/actions/screenshot/capture-screenshot.action';
import { extractDesignAction } from '@/domains/link-app-space/actions/extract/extract-design.action';
import { extractImagesAction } from '@/domains/link-app-space/actions/extract/extract-images.action';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

const ON_DEMAND_ACTIONS = ['screenshot', 'extractImages', 'extractDesign'] as const;

export async function executeAction(
  blockData: BlockNodeData,
  action: string,
  params: Record<string, any>,
  _callbacks?: any
): Promise<ActionResult> {
  const props = blockData.properties as LinkBlockProperties;
  const url = props?.url;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      success: false,
      error: 'URL is required. Enter a URL in the link block first.',
    };
  }

  const workspaceId = params?.workspaceId as string | undefined;
  const blockSlug = blockData.blockId ?? '';

  if (action === 'summarize') {
    return {
      success: false,
      error:
        'Summarize is handled by Source domain. Use the Summary tab or processSourceSummaryAction.',
    };
  }

  if (ON_DEMAND_ACTIONS.includes(action as (typeof ON_DEMAND_ACTIONS)[number])) {
    if (!workspaceId || !blockSlug) {
      return {
        success: false,
        error: 'workspaceId and blockId are required. Call from editor with canvas context.',
      };
    }
    const baseReq = { workspaceId, blockId: blockSlug, url };
    let result;
    switch (action) {
      case 'screenshot':
        result = await captureScreenshotAction({
          ...baseReq,
          fullPage: params?.fullPage ?? false,
        });
        break;
      case 'extractImages':
        result = await extractImagesAction(baseReq);
        break;
      case 'extractDesign':
        result = await extractDesignAction(baseReq);
        break;
      default:
        return { success: false, error: `Unknown action for link block: ${action}` };
    }
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: `Unknown action for link block: ${action}`,
  };
}
