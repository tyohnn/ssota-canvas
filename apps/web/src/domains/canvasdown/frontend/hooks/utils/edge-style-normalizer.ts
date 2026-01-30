/**
 * Edge Style Normalizer
 *
 * Canvasdown/LLM에서 오는 엣지 스타일을 도메인이 기대하는 형식으로 맞춤.
 * stroke가 색상 토큰 이름(red, green, ...)이면 hex로 변환; 이미 hex면 그대로 반환.
 */

import {
  ColorToken,
  getHexColor,
} from '@/domains/block-management/shared/types/style-tokens.types';

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const COLOR_TOKEN_NAMES = new Set(
  Object.values(ColorToken) as string[]
);

export interface EdgeStyleInput {
  stroke?: string;
  strokeWidth?: number;
}

/**
 * stroke가 ColorToken 이름이면 hex로 변환, 이미 hex면 그대로 반환.
 */
export function normalizeEdgeStyle(
  style: EdgeStyleInput | undefined
): EdgeStyleInput | undefined {
  if (!style || (style.stroke === undefined && style.strokeWidth === undefined)) {
    return style;
  }

  const result: EdgeStyleInput = {};

  if (style.stroke !== undefined && style.stroke.trim() !== '') {
    const stroke = style.stroke.trim().toLowerCase();
    if (HEX_COLOR_REGEX.test(style.stroke)) {
      result.stroke = style.stroke;
    } else if (COLOR_TOKEN_NAMES.has(stroke)) {
      result.stroke = getHexColor(stroke as ColorToken);
    } else {
      result.stroke = style.stroke;
    }
  }

  if (style.strokeWidth !== undefined) {
    result.strokeWidth = style.strokeWidth;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
