"use server";

import { createBlock } from "@/domains/workflow-canvas/actions/block.action";
import { createEdge } from "@/domains/workflow-canvas/actions/edge.action";
import { type CreateBlockInput } from "@/domains/workflow-canvas/actions/block.action";
import { Edge as EdgeType } from "@/db/schema";

export type TemplateType = "blank" | "agent" | "task" | "workflow";

interface TemplateBlock {
  blockType: CreateBlockInput["blockType"];
  name: string;
  slug: string;
  metadata: Record<string, any>;
  position: { x: number; y: number };
}

interface TemplateEdge {
  sourceBlockId: string;
  targetBlockId: string;
  edgeType: string;
  metadata?: Record<string, any>;
}

interface Template {
  blocks: TemplateBlock[];
  edges: TemplateEdge[];
}

const templates: Record<TemplateType, Template> = {
  blank: {
    blocks: [],
    edges: [],
  },
  agent: {
    blocks: [
      {
        blockType: "agent",
        name: "AI 에이전트",
        slug: "ai-agent",
        metadata: {
          persona: "전문적인 AI 어시스턴트",
          capabilities: ["자연어 처리", "데이터 분석", "작업 자동화"],
          tools: ["웹 검색", "파일 처리", "API 호출"],
        },
        position: { x: 400, y: 300 },
      },
      {
        blockType: "data",
        name: "데이터 소스",
        slug: "data-source",
        metadata: {
          dataType: "structured",
          format: "json",
          description: "에이전트가 처리할 데이터",
        },
        position: { x: 200, y: 200 },
      },
      {
        blockType: "task",
        name: "에이전트 작업",
        slug: "agent-task",
        metadata: {
          taskType: "analysis",
          priority: "high",
          description: "에이전트가 수행할 주요 작업",
        },
        position: { x: 600, y: 200 },
      },
    ],
    edges: [
      {
        sourceBlockId: "ai-agent",
        targetBlockId: "data-source",
        edgeType: "accesses",
        metadata: { accessType: "read" },
      },
      {
        sourceBlockId: "ai-agent",
        targetBlockId: "agent-task",
        edgeType: "used_by",
        metadata: { executionType: "automated" },
      },
    ],
  },
  task: {
    blocks: [
      {
        blockType: "task",
        name: "메인 태스크",
        slug: "main-task",
        metadata: {
          taskType: "project",
          priority: "high",
          status: "pending",
          assignee: "team",
        },
        position: { x: 400, y: 300 },
      },
      {
        blockType: "checklist",
        name: "작업 체크리스트",
        slug: "task-checklist",
        metadata: {
          items: ["요구사항 분석", "설계", "구현", "테스트"],
          progress: 0,
        },
        position: { x: 200, y: 200 },
      },
      {
        blockType: "workflow",
        name: "작업 워크플로우",
        slug: "task-workflow",
        metadata: {
          workflowType: "sequential",
          steps: ["시작", "진행", "검토", "완료"],
        },
        position: { x: 600, y: 200 },
      },
    ],
    edges: [
      {
        sourceBlockId: "main-task",
        targetBlockId: "task-checklist",
        edgeType: "contains",
        metadata: { relationship: "dependency" },
      },
      {
        sourceBlockId: "main-task",
        targetBlockId: "task-workflow",
        edgeType: "next",
        metadata: { executionOrder: "sequential" },
      },
    ],
  },
  workflow: {
    blocks: [
      {
        blockType: "workflow",
        name: "메인 워크플로우",
        slug: "main-workflow",
        metadata: {
          workflowType: "complex",
          status: "active",
          version: "1.0",
        },
        position: { x: 400, y: 300 },
      },
      {
        blockType: "task",
        name: "시작 태스크",
        slug: "start-task",
        metadata: {
          taskType: "trigger",
          status: "ready",
        },
        position: { x: 200, y: 200 },
      },
      {
        blockType: "task",
        name: "처리 태스크",
        slug: "process-task",
        metadata: {
          taskType: "processing",
          status: "pending",
        },
        position: { x: 400, y: 200 },
      },
      {
        blockType: "task",
        name: "완료 태스크",
        slug: "end-task",
        metadata: {
          taskType: "completion",
          status: "pending",
        },
        position: { x: 600, y: 200 },
      },
    ],
    edges: [
      {
        sourceBlockId: "main-workflow",
        targetBlockId: "start-task",
        edgeType: "contains",
        metadata: { order: 1 },
      },
      {
        sourceBlockId: "start-task",
        targetBlockId: "process-task",
        edgeType: "next",
        metadata: { order: 2 },
      },
      {
        sourceBlockId: "process-task",
        targetBlockId: "end-task",
        edgeType: "next",
        metadata: { order: 3 },
      },
    ],
  },
};

/**
 * 템플릿을 기반으로 워크스페이스에 초기 블록들을 생성합니다
 */
export async function createTemplateBlocks(
  workspaceId: string,
  templateType: TemplateType
): Promise<{ success: boolean; error?: string }> {
  try {
    const template = templates[templateType];

    if (!template) {
      return { success: false, error: "유효하지 않은 템플릿입니다" };
    }

    // 블록들을 생성하고 ID 매핑을 저장
    const blockIdMap = new Map<string, string>();

    for (const templateBlock of template.blocks) {
      const result = await createBlock({
        ...templateBlock,
        workspaceId,
      });

      if (!result.success) {
        return { success: false, error: `블록 생성 실패: ${result.error}` };
      }

      // 템플릿의 slug를 실제 생성된 블록 ID로 매핑
      blockIdMap.set(templateBlock.slug, result.data.id);
    }

    // 엣지들을 생성
    for (const templateEdge of template.edges) {
      const sourceId = blockIdMap.get(templateEdge.sourceBlockId);
      const targetId = blockIdMap.get(templateEdge.targetBlockId);

      if (!sourceId || !targetId) {
        return {
          success: false,
          error: "엣지 생성 중 블록 ID를 찾을 수 없습니다",
        };
      }

      const result = await createEdge({
        sourceBlockId: sourceId,
        targetBlockId: targetId,
        edgeType: templateEdge.edgeType as EdgeType["edge_type"],
        metadata: templateEdge.metadata || {},
      });

      if (!result.success) {
        return { success: false, error: `엣지 생성 실패: ${result.error}` };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Template blocks creation error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "템플릿 블록 생성에 실패했습니다",
    };
  }
}
