import { Edge, BlockPosition } from "@/db/schema";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";
import { Node as ReactFlowBlock, Edge as ReactFlowEdge } from "@xyflow/react";
import { BlockType } from "@workspace/domain-contracts";

/**
 * 🎯 PAGE RENDERING STRATEGY
 * ============================
 *
 * 📋 파일 역할:
 * - 7개 페이지별 렌더링 전략 구현
 * - 각 페이지 타입에 따른 노드/엣지 필터링 및 레이아웃
 * - Strategy Pattern을 사용한 확장 가능한 렌더링 시스템
 *
 * 🔧 주요 기능:
 * - 페이지별 렌더링 전략 (WorkflowPageStrategy, AgentPageStrategy 등)
 * - 노드와 엣지 필터링 로직
 * - 레이아웃 적용 및 위치 계산
 * - Strategy Factory Pattern
 *
 * 📦 Export:
 * - PageRenderingStrategy 인터페이스
 * - 7개 페이지 전략 클래스들
 * - PageRenderingStrategyFactory
 */

export interface ConnectedBlocksResult {
  blocks: ReactFlowBlock[];
  edges: ReactFlowEdge[];
}

/**
 * 각 페이지 타입별로 렌더링해야 할 블록과 엣지를 결정하는 전략 인터페이스
 */
export interface PageRenderingPolicy {
  /**
   * 주어진 블록을 기준으로 해당 페이지 타입에서 렌더링할 블록과 엣지를 반환
   * @param selectedPageBlockId 선택된 페이지 블록의 ID
   * @param blocks 전체 워크스페이스 블록들
   * @param edges 전체 워크스페이스 엣지들
   * @param blockPositions 전체 블록 위치 정보
   */
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult;
}

/**
 * 1. 워크플로우 페이지: 워크플로우 블록은 렌더링하지 않음.
 *    태스크 블록과 워크플로우 전용 블록(시작, 끝, 분기)들만 출력
 */
export class WorkflowPageRenderingPolicy implements PageRenderingPolicy {
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    console.log(
      "🔍 [POLICY DEBUG] WorkflowPageRenderingPolicy.getBlocksAndEdges 호출:",
      {
        selectedPageBlockId,
        blocksCount: blocks.length,
        edgesCount: edges.length,
        blockPositionsCount: blockPositions.length,
        blockPositions: blockPositions,
      }
    );

    // 워크플로우 전용 블록 타입들
    const workflowSpecificTypes = ["start", "end", "condition"];

    // 워크플로우 내부의 태스크 블록들 찾기 (해당 워크플로우를 context로 가지는 블록들만)
    const taskBlocks = blocks.filter(
      (block) =>
        (block.block_type === "task" ||
          workflowSpecificTypes.includes(block.block_type || "")) &&
        blockPositions.some(
          (pos) =>
            pos.block_id === block.id &&
            pos.context_block_id === selectedPageBlockId
        )
    );

    console.log("🔍 [POLICY DEBUG] 필터링된 taskBlocks:", {
      taskBlocksCount: taskBlocks.length,
      taskBlocks: taskBlocks.map((block) => ({
        id: block.id,
        type: block.block_type,
        name: block.name,
      })),
    });

    // 태스크 블록들 간의 엣지 찾기 (next, workflow control 등)
    const workflowEdges = edges.filter((edge) => {
      const sourceIsTask = taskBlocks.some(
        (block) => block.id === edge.source_block_id
      );
      const targetIsTask = taskBlocks.some(
        (block) => block.id === edge.target_block_id
      );
      return (
        sourceIsTask &&
        targetIsTask &&
        (edge.edge_type === "next" || edge.edge_type === "contains")
      );
    });

    // Block → ReactFlowBlock 변환
    const getBlockPosition = (blockId: string, contextBlockId: string) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === blockId && pos.context_block_id === contextBlockId
      );
      console.log("🔍 [POLICY DEBUG] getBlockPosition:", {
        blockId,
        contextBlockId,
        foundPosition: pos,
        allPositionsForBlock: blockPositions.filter(
          (p) => p.block_id === blockId
        ),
      });
      return pos;
    };

    const layoutedBlocks = taskBlocks.map((block) => {
      const pos = getBlockPosition(block.id, selectedPageBlockId);
      const position = pos
        ? { x: pos.x_position, y: pos.y_position }
        : { x: 0, y: 0 };

      console.log("🔍 [POLICY DEBUG] 블록 위치 계산:", {
        blockId: block.id,
        blockName: block.name,
        foundPosition: pos,
        finalPosition: position,
      });

      return {
        id: block.id,
        type: block.block_type,
        position: position,
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    console.log("🔍 [POLICY DEBUG] 최종 layoutedBlocks:", {
      layoutedBlocksCount: layoutedBlocks.length,
      layoutedBlocks: layoutedBlocks.map((block) => ({
        id: block.id,
        position: block.position,
        type: block.type,
      })),
    });

    // Edge → ReactFlowEdge 변환
    const reactFlowEdges = workflowEdges.map(
      (edge) =>
        ({
          id: edge.id,
          source: edge.source_block_id,
          target: edge.target_block_id,
          type: edge.edge_type,
          data: {
            metadata: edge.metadata,
            relationship_type: edge.edge_type,
          },
        }) as ReactFlowEdge
    );

    return { blocks: layoutedBlocks, edges: reactFlowEdges };
  }
}

/**
 * 2. 에이전트 페이지: 에이전트 블록이 보유한 태스크들과 직접 연결된 인풋 블록들 보여주기.
 *    워크플로우 관계는 제외하고, 인풋은 직접 연결로 가져옴
 */
export class AgentPageRenderingPolicy implements PageRenderingPolicy {
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    const selectedAgent = blocks.find(
      (block) => block.id === selectedPageBlockId
    );
    if (!selectedAgent) {
      console.warn(
        `AgentCanvasStrategy: Agent ${selectedPageBlockId} not found`
      );
      return { blocks: [], edges: [] };
    }

    const connectedBlockIds = new Set<string>([selectedAgent.id]);
    const connectedEdges: ReactFlowEdge[] = [];

    // 1. Agent가 포함하는 Task들 찾기 (contains 관계)
    const agentTasks = edges
      .filter(
        (edge) =>
          edge.source_block_id === selectedPageBlockId &&
          edge.edge_type === "contains"
      )
      .map((edge) => edge.target_block_id);

    // Task 블록들 추가
    agentTasks.forEach((taskId) => {
      connectedBlockIds.add(taskId);
      edges
        .filter(
          (edge) =>
            edge.source_block_id === selectedPageBlockId &&
            edge.target_block_id === taskId &&
            edge.edge_type === "contains"
        )
        .forEach((edge) =>
          connectedEdges.push({
            id: edge.id,
            source: edge.source_block_id,
            target: edge.target_block_id,
            type: edge.edge_type,
            data: {
              relationship_type: edge.edge_type,
            },
          } as ReactFlowEdge)
        );
    });

    // 2. Agent와 직접 연결된 리소스 블록들 찾기 (accesses 관계)
    // Data, Checklist, Artifact Template, Artifact Class
    const agentResources = edges.filter(
      (edge) =>
        (edge.source_block_id === selectedPageBlockId &&
          edge.edge_type === "accesses") ||
        (edge.target_block_id === selectedPageBlockId &&
          edge.edge_type === "accesses")
    );

    agentResources.forEach((edge) => {
      const resourceId =
        edge.source_block_id === selectedPageBlockId
          ? edge.target_block_id
          : edge.source_block_id;
      connectedBlockIds.add(resourceId);
      connectedEdges.push({
        id: edge.id,
        source: edge.source_block_id,
        target: edge.target_block_id,
        type: edge.edge_type,
        sourceHandle: "right",
        targetHandle: "left",
        data: {
          metadata: edge.metadata,
          relationship_type: edge.edge_type,
        },
      } as ReactFlowEdge);
    });

    const connectedBlocks = blocks.filter((block) =>
      connectedBlockIds.has(block.id)
    );

    // 컨텍스트별 위치 적용
    const layoutedBlocks = connectedBlocks.map((block) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === block.id &&
          pos.context_block_id === selectedPageBlockId
      );
      return {
        id: block.id,
        type: block.block_type,
        position: pos
          ? { x: pos.x_position, y: pos.y_position }
          : { x: 0, y: 0 },
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    return { blocks: layoutedBlocks, edges: connectedEdges };
  }
}

/**
 * 3. 태스크 페이지: 태스크 블록과 연결된 인풋 블록과 아웃풋 블록 모두
 *    워크플로우는 위쪽, 인풋은 좌측, 아웃풋은 우측에 연결
 */
export class TaskPageRenderingPolicy implements PageRenderingPolicy {
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    const selectedTask = blocks.find(
      (block) => block.id === selectedPageBlockId
    );
    if (!selectedTask) {
      console.warn(`TaskCanvasStrategy: Task ${selectedPageBlockId} not found`);
      return { blocks: [], edges: [] };
    }

    const connectedBlockIds = new Set<string>([selectedTask.id]);
    const connectedEdges: ReactFlowEdge[] = [];

    // 1. 워크플로우 관계 (contains) - 위쪽 연결
    const workflowEdges = edges.filter(
      (edge) =>
        (edge.source_block_id === selectedPageBlockId &&
          edge.edge_type === "contains") ||
        (edge.target_block_id === selectedPageBlockId &&
          edge.edge_type === "contains")
    );

    workflowEdges.forEach((edge) => {
      const connectedBlockId =
        edge.source_block_id === selectedPageBlockId
          ? edge.target_block_id
          : edge.source_block_id;
      connectedBlockIds.add(connectedBlockId);

      // Task가 source인 경우 위쪽 핸들에서 시작, Task가 target인 경우 위쪽 핸들로 끝남
      const isTaskSource = edge.source_block_id === selectedPageBlockId;

      connectedEdges.push({
        id: edge.id,
        source: edge.source_block_id,
        target: edge.target_block_id,
        sourceHandle: isTaskSource ? "top" : undefined,
        targetHandle: !isTaskSource ? "top" : undefined,
        type: edge.edge_type,
        data: {
          metadata: edge.metadata,
          handlePosition: "top", // 워크플로우는 위쪽 핸들
        },
      } as ReactFlowEdge);
    });

    const inputEdges = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "input"
    );

    inputEdges.forEach((edge) => {
      connectedBlockIds.add(edge.source_block_id);

      connectedEdges.push({
        id: edge.id,
        source: edge.source_block_id,
        target: edge.target_block_id,
        type: edge.edge_type,
        sourceHandle: "right",
        targetHandle: "left",
        data: {
          metadata: edge.metadata,
        },
      } as ReactFlowEdge);
    });

    // 3. 아웃풋 관계 (output) - 우측 연결
    const outputEdges = edges.filter(
      (edge) =>
        edge.source_block_id === selectedPageBlockId &&
        edge.edge_type === "output"
    );

    outputEdges.forEach((edge) => {
      connectedBlockIds.add(edge.target_block_id);

      connectedEdges.push({
        id: edge.id,
        source: edge.source_block_id,
        target: edge.target_block_id,
        type: edge.edge_type,
        sourceHandle: "right",
        targetHandle: "left",
        data: {
          metadata: edge.metadata,
        },
      } as ReactFlowEdge);
    });

    // 연결된 블록들 찾기
    const connectedBlocks = blocks.filter((block) =>
      connectedBlockIds.has(block.id)
    );

    // 컨텍스트별 위치 적용
    const layoutedBlocks = connectedBlocks.map((block) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === block.id &&
          pos.context_block_id === selectedPageBlockId
      );
      return {
        id: block.id,
        type: block.block_type,
        position: pos
          ? { x: pos.x_position, y: pos.y_position }
          : { x: 0, y: 0 },
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    return { blocks: layoutedBlocks, edges: connectedEdges };
  }
}

/**
 * 4. 아티팩트 템플릿 페이지: 아티팩트 템플릿 블록과 직접 연결된 에이전트와 관련 테스크만 렌더링
 */
export class ArtifactTemplatePageRenderingPolicy
  implements PageRenderingPolicy
{
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    const selectedTemplate = blocks.find(
      (block) => block.id === selectedPageBlockId
    );
    if (!selectedTemplate) {
      console.warn(
        `ArtifactTemplateCanvasStrategy: Template ${selectedPageBlockId} not found`
      );
      return { blocks: [], edges: [] };
    }

    const connectedBlockIds = new Set<string>([selectedTemplate.id]);
    const connectedEdges: ReactFlowEdge[] = [];

    // 1. Template이 사용되는 Task들 찾기 (used_by 관계)
    const templateUsedByTasks = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.source_block_id)?.block_type === "task"
    );

    templateUsedByTasks.forEach((edge) => {
      const taskId = edge.source_block_id;
      connectedBlockIds.add(taskId);

      connectedEdges.push({
        id: edge.id,
        source: edge.target_block_id, // Template
        target: edge.source_block_id, // Task
        sourceHandle: "right", // Template의 우측 핸들에서 시작
        targetHandle: "left", // Task의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "template_used_by_task",
        },
      } as ReactFlowEdge);
    });

    // 2. Template이 사용되는 Agent들 찾기 (used_by 관계)
    const templateUsedByAgents = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.source_block_id)?.block_type ===
          "agent"
    );

    templateUsedByAgents.forEach((edge) => {
      const agentId = edge.source_block_id;
      connectedBlockIds.add(agentId);

      connectedEdges.push({
        id: edge.id,
        source: edge.target_block_id, // Template
        target: edge.source_block_id, // Agent
        sourceHandle: "right", // Template의 우측 핸들에서 시작
        targetHandle: "left", // Agent의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "template_used_by_agent",
        },
      } as ReactFlowEdge);
    });

    const connectedBlocks = blocks.filter((block) =>
      connectedBlockIds.has(block.id)
    );

    // 컨텍스트별 위치 적용
    const layoutedBlocks = connectedBlocks.map((block) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === block.id &&
          pos.context_block_id === selectedPageBlockId
      );
      return {
        id: block.id,
        type: block.block_type,
        position: pos
          ? { x: pos.x_position, y: pos.y_position }
          : { x: 0, y: 0 },
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    return { blocks: layoutedBlocks, edges: connectedEdges };
  }
}

/**
 * 5. 아티팩트 클래스 페이지: 아티팩트 클래스 블록과 직접 연결된 에이전트와 관련 테스크만 렌더링
 */
export class ArtifactClassPageRenderingPolicy implements PageRenderingPolicy {
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    const selectedArtifactClass = blocks.find(
      (block) => block.id === selectedPageBlockId
    );
    if (!selectedArtifactClass) {
      console.warn(
        `ArtifactClassCanvasStrategy: Artifact Class ${selectedPageBlockId} not found`
      );
      return { blocks: [], edges: [] };
    }

    const connectedBlockIds = new Set<string>([selectedArtifactClass.id]);
    const connectedEdges: ReactFlowEdge[] = [];

    // 1. Artifact Class가 사용되는 Task들 찾기 (used_by 관계)
    const artifactClassUsedByTasks = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.source_block_id)?.block_type === "task"
    );

    artifactClassUsedByTasks.forEach((edge) => {
      const taskId = edge.source_block_id;
      connectedBlockIds.add(taskId);

      connectedEdges.push({
        id: edge.id,
        source: edge.target_block_id, // Task
        target: edge.source_block_id, // Artifact Class
        sourceHandle: "right", // Artifact Class의 우측 핸들에서 시작
        targetHandle: "left", // Task의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "artifact_class_used_by_task",
        },
      } as ReactFlowEdge);
    });

    // 2. Artifact Class가 사용되는 Agent들 찾기 (used_by 관계)
    const artifactClassUsedByAgents = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.source_block_id)?.block_type ===
          "agent"
    );

    artifactClassUsedByAgents.forEach((edge) => {
      const agentId = edge.source_block_id;
      connectedBlockIds.add(agentId);

      connectedEdges.push({
        id: edge.id,
        source: edge.target_block_id, // Artifact Class
        target: edge.source_block_id, // Agent
        sourceHandle: "right", // Agent의 좌측 출력 핸들에서 시작
        targetHandle: "left", // Artifact Class의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "agent_uses_artifact_class",
        },
      } as ReactFlowEdge);
    });

    const connectedBlocks = blocks.filter((block) =>
      connectedBlockIds.has(block.id)
    );

    // 컨텍스트별 위치 적용
    const layoutedBlocks = connectedBlocks.map((block) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === block.id &&
          pos.context_block_id === selectedPageBlockId
      );
      return {
        id: block.id,
        type: block.block_type,
        position: pos
          ? { x: pos.x_position, y: pos.y_position }
          : { x: 0, y: 0 },
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    return { blocks: layoutedBlocks, edges: connectedEdges };
  }
}

/**
 * 6. 데이터 페이지: 데이터 블록과 직접 연결된 에이전트와 관련 테스크만 렌더링
 */
export class DataPageRenderingPolicy implements PageRenderingPolicy {
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    const selectedData = blocks.find(
      (block) => block.id === selectedPageBlockId
    );
    if (!selectedData) {
      console.warn(`DataCanvasStrategy: Data ${selectedPageBlockId} not found`);
      return { blocks: [], edges: [] };
    }

    const connectedBlockIds = new Set<string>([selectedData.id]);
    const connectedEdges: ReactFlowEdge[] = [];

    // 1. Data가 사용되는 Task들 찾기 (used_by 관계)

    const dataUsedByTasks = edges.filter(
      (edge) =>
        edge.source_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.target_block_id)?.block_type === "task"
    );

    dataUsedByTasks.forEach((edge) => {
      const taskId = edge.target_block_id;
      connectedBlockIds.add(taskId);

      connectedEdges.push({
        id: edge.id,
        source: edge.source_block_id, // Data
        target: edge.target_block_id, // Task
        sourceHandle: "right", // Data의 우측 핸들에서 시작
        targetHandle: "left", // Task의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "data_used_by_task",
        },
      } as ReactFlowEdge);
    });

    // 2. Data가 사용되는 Agent들 찾기 (used_by 관계)

    const dataUsedByAgents = edges.filter(
      (edge) =>
        edge.source_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.target_block_id)?.block_type ===
          "agent"
    );

    dataUsedByAgents.forEach((edge) => {
      const agentId = edge.target_block_id;
      connectedBlockIds.add(agentId);

      connectedEdges.push({
        id: edge.id,
        source: edge.source_block_id, // Data
        target: edge.target_block_id, // Agent
        sourceHandle: "right", // Data의 우측 핸들에서 시작
        targetHandle: "left", // Agent의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "data_used_by_agent",
        },
      } as ReactFlowEdge);
    });

    const connectedBlocks = blocks.filter((block) =>
      connectedBlockIds.has(block.id)
    );

    // 컨텍스트별 위치 적용
    const layoutedBlocks = connectedBlocks.map((block) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === block.id &&
          pos.context_block_id === selectedPageBlockId
      );
      return {
        id: block.id,
        type: block.block_type,
        position: pos
          ? { x: pos.x_position, y: pos.y_position }
          : { x: 0, y: 0 },
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    return { blocks: layoutedBlocks, edges: connectedEdges };
  }
}

/**
 * 7. 체크리스트 페이지: 체크리스트 블록과 직접 연결된 에이전트와 관련 테스크만 렌더링
 */
export class ChecklistPageRenderingPolicy implements PageRenderingPolicy {
  getBlocksAndEdges(
    selectedPageBlockId: string,
    blocks: DbBlock[],
    edges: Edge[],
    blockPositions: BlockPosition[]
  ): ConnectedBlocksResult {
    const selectedChecklist = blocks.find(
      (block) => block.id === selectedPageBlockId
    );
    if (!selectedChecklist) {
      console.warn(
        `ChecklistCanvasStrategy: Checklist ${selectedPageBlockId} not found`
      );
      return { blocks: [], edges: [] };
    }

    const connectedBlockIds = new Set<string>([selectedChecklist.id]);
    const connectedEdges: ReactFlowEdge[] = [];

    // 1. Checklist가 사용되는 Task들 찾기 (used_by 관계)
    const checklistUsedByTasks = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.source_block_id)?.block_type === "task"
    );

    checklistUsedByTasks.forEach((edge) => {
      const taskId = edge.source_block_id;
      connectedBlockIds.add(taskId);

      connectedEdges.push({
        id: edge.id,
        source: edge.target_block_id, // Checklist
        target: edge.source_block_id, // Task
        sourceHandle: "right", // Task의 좌측 출력 핸들에서 시작
        targetHandle: "left", // Checklist의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "task_uses_checklist",
        },
      } as ReactFlowEdge);
    });

    // 2. Checklist가 사용되는 Agent들 찾기 (used_by 관계)
    const checklistUsedByAgents = edges.filter(
      (edge) =>
        edge.target_block_id === selectedPageBlockId &&
        edge.edge_type === "used_by" &&
        blocks.find((b) => b.id === edge.source_block_id)?.block_type ===
          "agent"
    );

    checklistUsedByAgents.forEach((edge) => {
      const agentId = edge.source_block_id;
      connectedBlockIds.add(agentId);

      connectedEdges.push({
        id: edge.id,
        source: edge.target_block_id, // Checklist
        target: edge.source_block_id, // Agent
        sourceHandle: "right", // Agent의 좌측 출력 핸들에서 시작
        targetHandle: "left", // Checklist의 좌측 핸들로 연결
        type: "used_by",
        data: {
          metadata: edge.metadata,
          relationship_type: "agent_uses_checklist",
        },
      } as ReactFlowEdge);
    });

    const connectedBlocks = blocks.filter((block) =>
      connectedBlockIds.has(block.id)
    );

    // 컨텍스트별 위치 적용
    const layoutedBlocks = connectedBlocks.map((block) => {
      const pos = blockPositions.find(
        (pos) =>
          pos.block_id === block.id &&
          pos.context_block_id === selectedPageBlockId
      );
      return {
        id: block.id,
        type: block.block_type,
        position: pos
          ? { x: pos.x_position, y: pos.y_position }
          : { x: 0, y: 0 },
        data: {
          label: block.name,
          metadata: block.metadata,
        },
      } as ReactFlowBlock;
    });

    return { blocks: layoutedBlocks, edges: connectedEdges };
  }
}

/**
 * 팩토리 클래스: 페이지 타입에 따라 적절한 전략을 반환
 */
export class PageRenderingPolicyFactory {
  static getPolicy(pageBlockType: BlockType): PageRenderingPolicy {
    // 기본 노드 타입들은 워크플로우 정책을 사용
    if (
      pageBlockType === BlockType.START ||
      pageBlockType === BlockType.END ||
      pageBlockType === BlockType.CONDITION
    ) {
      return new WorkflowPageRenderingPolicy();
    }

    switch (pageBlockType) {
      case BlockType.WORKFLOW:
        return new WorkflowPageRenderingPolicy();
      case BlockType.AGENT:
        return new AgentPageRenderingPolicy();
      case BlockType.TASK:
        return new TaskPageRenderingPolicy();
      case BlockType.ARTIFACT_TEMPLATE:
        return new ArtifactTemplatePageRenderingPolicy();
      case BlockType.ARTIFACT_CLASS:
        return new ArtifactClassPageRenderingPolicy();
      case BlockType.DATA:
        return new DataPageRenderingPolicy();
      case BlockType.CHECKLIST:
        return new ChecklistPageRenderingPolicy();
      default:
        throw new Error(`Unknown page block type: ${pageBlockType}`);
    }
  }
}
