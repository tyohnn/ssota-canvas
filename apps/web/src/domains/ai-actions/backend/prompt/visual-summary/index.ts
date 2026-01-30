/**
 * Visual Summary Templates
 *
 * 모든 템플릿을 export하고 관리하는 중앙 파일
 */

import { lectureMapTemplate } from './lecture-map.template';
import { argumentMapTemplate } from './argument-map.template';
import { frameworkCanvasTemplate } from './framework-canvas.template';
import { conceptGraphTemplate } from './concept-graph.template';
import { synthesisBoardTemplate } from './synthesis-board.template';
import type { VisualTemplate } from '@/domains/ai-actions/shared/types/template.types';

/**
 * 모든 템플릿 목록
 */
export const allTemplates: VisualTemplate[] = [
  lectureMapTemplate,
  argumentMapTemplate,
  frameworkCanvasTemplate,
  conceptGraphTemplate,
  synthesisBoardTemplate,
];

/**
 * 템플릿 ID로 템플릿 찾기
 */
export function getTemplateById(id: string): VisualTemplate | undefined {
  return allTemplates.find(template => template.id === id);
}

/**
 * 모든 템플릿 가져오기
 */
export function getAllTemplates(): VisualTemplate[] {
  return allTemplates;
}

/**
 * 기본 템플릿 (Lecture Map)
 */
export function getDefaultTemplate(): VisualTemplate {
  return lectureMapTemplate;
}
