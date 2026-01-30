/**
 * Visual Summary Template 타입 정의
 */

/**
 * Visual Template Interface
 * 
 * LLM이 Visual Summary를 생성할 때 사용할 템플릿 정의
 */
export interface VisualTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  
  // LLM에게 전달할 자연어 규칙
  promptSpec: string;
  
  // 제한값
  limits: {
    maxConcepts: number;
    maxEdges: number;
    maxMarkdownChars: number;
  };
}

/**
 * 템플릿 ID 상수
 */
export const TEMPLATE_IDS = {
  LECTURE_MAP: 'lecture-map',
  ARGUMENT_MAP: 'argument-map',
  FRAMEWORK_CANVAS: 'framework-canvas',
  CONCEPT_GRAPH: 'concept-graph',
  SYNTHESIS_BOARD: 'synthesis-board',
} as const;

export type TemplateId = (typeof TEMPLATE_IDS)[keyof typeof TEMPLATE_IDS];
