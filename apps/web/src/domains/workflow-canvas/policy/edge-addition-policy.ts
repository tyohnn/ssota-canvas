import { Edge, NewEdge } from "@/db/schema";
import { devLog } from "@/utils/dev-logger";
import { PageBlockType } from "./block-definition-policy";

/**
 * 🎯 EDGE ADDITION POLICY
 * ============================
 *
 * 📋 파일 역할:
 * - 각 페이지 타입별로 블록 클릭 시 생성될 엣지들을 결정하는 정책
 * - 양방향 관계, 단방향 관계 처리
 * - Policy Pattern을 사용한 확장 가능한 엣지 생성 시스템
 *
 * 🔧 주요 기능:
 * - 페이지별 엣지 생성 정책 정의
 * - 단방향/양방향 엣지 생성 로직
 * - 엣지 타입과 메타데이터 관리
 *
 * 📦 Export:
 * - EdgeAdditionPolicy 인터페이스
 * - 7개 페이지 정책 클래스들
 * - EdgeAdditionPolicyFactory
 */

/**
 * 각 페이지 타입별로 블록 클릭 시 생성할 엣지들을 결정하는 정책 인터페이스
 */
export interface EdgeAdditionPolicy {
  /**
   * 현재 페이지 블록과 클릭한 대상 블록 간의 엣지 정의들을 반환
   */
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[];

  /**
   * 정책에 대한 설명 정보를 반환
   */
  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  };
}

/**
 * 1. 워크플로우 페이지: 포함 관계 생성
 */
export class WorkflowEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    const edges: NewEdge[] = [];

    // 워크플로우 -> 에이전트/태스크/기본노드 (contains 관계)
    if (
      targetBlockType === "agent" ||
      targetBlockType === "task" ||
      ["start", "end", "condition"].includes(targetBlockType)
    ) {
      edges.push({
        source_block_id: currentPageBlockId,
        target_block_id: targetBlockId,
        edge_type: "contains",
        workspace_id: workspaceId,
        metadata: {
          relationship_type: `workflow_${targetBlockType}`,
        },
      });
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Workflow Edge Policy",
      description:
        "Creates containment relationships between workflow and its components.",
      supportedConnections: [
        "Workflow -> Agent (contains)",
        "Workflow -> Task (contains)",
        "Workflow -> Basic Nodes (contains)",
      ],
    };
  }
}

/**
 * 2. 에이전트 페이지: 포함, 접근, 사용 관계 생성
 */
export class AgentEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    const edges: NewEdge[] = [];

    switch (targetBlockType) {
      case "task":
        // Agent -> Task (contains)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "contains",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_task",
          },
        });
        break;

      case "data":
        // Agent -> Data (accesses)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_only",
          },
        });
        // Data -> Agent (used_by_agent)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "data_used_by_agent",
          },
        });
        break;

      case "checklist":
        // Agent -> Checklist (accesses)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_write",
          },
        });
        // Checklist -> Agent (used_by_agent)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "checklist_used_by_agent",
            usage_context: "quality_assurance",
          },
        });
        break;

      case "artifact_template":
        // Agent -> Template (accesses)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_write",
          },
        });
        // Template -> Agent (used_by_agent)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "template_used_by_agent",
            usage_context: "report_creation",
          },
        });
        break;

      case "artifact_class":
        // Agent -> Artifact Class (accesses)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_write",
          },
        });
        // Artifact Class -> Agent (used_by_agent)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "artifact_class_used_by_agent",
            usage_context: "classification",
          },
        });
        break;
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Agent Edge Policy",
      description:
        "Creates containment, access, and usage relationships for agents.",
      supportedConnections: [
        "Agent -> Task (contains)",
        "Agent -> Data (accesses + used_by reverse)",
        "Agent -> Checklist (accesses + used_by)",
        "Agent -> Template (accesses + used_by)",
        "Agent -> Artifact Class (accesses + used_by)",
      ],
    };
  }
}

/**
 * 3. 태스크 페이지: 포함, 입력, 출력, 사용 관계 생성
 */
export class TaskEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    devLog(
      `TaskEdgeAdditionPolicy: Creating edges from ${currentPageBlockType}:${currentPageBlockId} to ${targetBlockType}:${targetBlockId}`
    );

    const edges: NewEdge[] = [];

    switch (targetBlockType) {
      case "agent":
        // Agent -> Task (contains)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "contains",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_task",
          },
        });
        break;

      case "workflow":
        // Workflow -> Task (contains)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "contains",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "workflow_task",
          },
        });
        break;

      case "data":
        // Data -> Task (input)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "input",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "data_input_task",
            validation_required: true,
          },
        });
        // Data -> Task (used_by) - 피드백 반영
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "data_used_by_task",
          },
        });
        break;

      case "checklist":
        // Checklist -> Task (input)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "input",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "checklist_input_task",
            validation_required: true,
          },
        });
        // Checklist -> Task (used_by_task)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "checklist_used_by_task",
            usage_context: "data_validation",
          },
        });
        break;

      case "artifact_template":
        // Template -> Task (input)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "input",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "template_input_task",
            validation_required: true,
          },
        });
        // Template -> Task (used_by_task)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "template_used_by_task",
            usage_context: "report_creation",
          },
        });
        break;

      case "artifact_class":
        // Task -> Artifact Class (output)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "output",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "task_output_artifact_class",
            data_format: "json",
            include_metadata: true,
          },
        });
        // Artifact Class -> Task (used_by)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "task_uses_artifact_class",
            usage_context: "output_structure",
          },
        });
        break;
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Task Edge Policy",
      description:
        "Creates containment, input, output, and usage relationships for tasks.",
      supportedConnections: [
        "Agent -> Task (contains reverse)",
        "Workflow -> Task (contains reverse)",
        "Data -> Task (input + used_by reverse)",
        "Checklist -> Task (input) + Task -> Checklist (used_by)",
        "Template -> Task (input) + Task -> Template (used_by)",
        "Task -> Artifact Class (output + used_by)",
      ],
    };
  }
}

/**
 * 4. 아티팩트 템플릿 페이지: 접근, 사용 관계 생성
 */
export class ArtifactTemplateEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    devLog(
      `ArtifactTemplateEdgeAdditionPolicy: Creating edges from ${currentPageBlockType}:${currentPageBlockId} to ${targetBlockType}:${targetBlockId}`
    );

    const edges: NewEdge[] = [];

    switch (targetBlockType) {
      case "agent":
        // Template -> Agent (used_by_agent)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "template_used_by_agent",
            usage_context: "report_creation",
          },
        });
        // Agent -> Template (accesses)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_write",
          },
        });
        break;

      case "task":
        // Template -> Task (used_by_task)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "template_used_by_task",
            usage_context: "report_creation",
          },
        });
        // Task -> Template (accesses)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "input",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "template_input_task",
            validation_required: true,
          },
        });
        break;
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Artifact Template Edge Policy",
      description:
        "Creates access and usage relationships for artifact templates.",
      supportedConnections: [
        "Agent -> Template (accesses + used_by reverse)",
        "Template -> Task (input) + Task -> Template (used_by reverse)",
      ],
    };
  }
}

/**
 * 5. 아티팩트 클래스 페이지: 접근, 사용, 출력 관계 생성
 */
export class ArtifactClassEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    devLog(
      `ArtifactClassEdgeAdditionPolicy: Creating edges from ${currentPageBlockType}:${currentPageBlockId} to ${targetBlockType}:${targetBlockId}`
    );

    const edges: NewEdge[] = [];

    switch (targetBlockType) {
      case "agent":
        // Agent -> Artifact Class (accesses)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_write",
          },
        });
        // Artifact Class  ->  Agent (used_by)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_uses_artifact_class",
            usage_context: "output_definition",
          },
        });
        break;

      case "task":
        // Task -> Artifact Class (output)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "output",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "task_output_artifact_class",
            data_format: "json",
            include_metadata: true,
          },
        });
        // Artifact Class -> Task (used_by)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "task_uses_artifact_class",
            usage_context: "output_structure",
          },
        });
        break;
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Artifact Class Edge Policy",
      description:
        "Creates access, usage, and output relationships for artifact classes.",
      supportedConnections: [
        "Agent -> Artifact Class (accesses + used_by reverse)",
        "Task -> Artifact Class (output + used_by reverse)",
      ],
    };
  }
}

/**
 * 6. 데이터 페이지: 접근, 입력 관계 생성
 */
export class DataEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    devLog(
      `DataEdgeAdditionPolicy: Creating edges from ${currentPageBlockType}:${currentPageBlockId} to ${targetBlockType}:${targetBlockId}`
    );

    const edges: NewEdge[] = [];

    switch (targetBlockType) {
      case "agent":
        // Agent -> Data (accesses)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_only",
          },
        });
        // Data -> Agent (used_by) - 반대방향 추가
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "data_used_by_agent",
          },
        });
        break;

      case "task":
        // Data -> Task (input)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "input",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "data_input_task",
            validation_required: true,
          },
        });
        // Data -> Task (used_by) - 반대방향 추가
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "data_used_by_task",
          },
        });
        break;
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Data Edge Policy",
      description: "Creates access and input relationships for data resources.",
      supportedConnections: [
        "Agent -> Data (accesses reverse)",
        "Data -> Task (input)",
      ],
    };
  }
}

/**
 * 7. 체크리스트 페이지: 접근, 사용, 입력 관계 생성
 */
export class ChecklistEdgeAdditionPolicy implements EdgeAdditionPolicy {
  getEdgesToCreate(
    currentPageBlockId: string,
    currentPageBlockType: PageBlockType,
    targetBlockId: string,
    targetBlockType: PageBlockType,
    workspaceId: string
  ): NewEdge[] {
    devLog(
      `ChecklistEdgeAdditionPolicy: Creating edges from ${currentPageBlockType}:${currentPageBlockId} to ${targetBlockType}:${targetBlockId}`
    );

    const edges: NewEdge[] = [];

    switch (targetBlockType) {
      case "agent":
        // Agent -> Checklist (accesses)
        edges.push({
          source_block_id: targetBlockId,
          target_block_id: currentPageBlockId,
          edge_type: "accesses",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_resource",
            access_level: "read_write",
          },
        });
        // Checklist  -> Agent (used_by)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "agent_uses_checklist",
            usage_context: "quality_assurance",
          },
        });
        break;

      case "task":
        // Checklist -> Task (input)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "input",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "checklist_input_task",
            validation_required: true,
          },
        });
        // Checklist -> Task (used_by)
        edges.push({
          source_block_id: currentPageBlockId,
          target_block_id: targetBlockId,
          edge_type: "used_by",
          workspace_id: workspaceId,
          metadata: {
            relationship_type: "task_uses_checklist",
            usage_context: "data_validation",
          },
        });
        break;
    }

    return edges;
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    supportedConnections: string[];
  } {
    return {
      title: "Checklist Edge Policy",
      description:
        "Creates access, usage, and input relationships for checklists.",
      supportedConnections: [
        "Agent -> Checklist (accesses + used_by reverse)",
        "Checklist -> Task (input) + Task -> Checklist (used_by reverse)",
      ],
    };
  }
}

/**
 * 팩토리 클래스: 페이지 타입에 따라 적절한 엣지 정책을 반환
 */
export class EdgeAdditionPolicyFactory {
  static getPolicy(pageBlockType: PageBlockType): EdgeAdditionPolicy {
    switch (pageBlockType) {
      case "workflow":
        return new WorkflowEdgeAdditionPolicy();
      case "agent":
        return new AgentEdgeAdditionPolicy();
      case "task":
        return new TaskEdgeAdditionPolicy();
      case "artifact_template":
        return new ArtifactTemplateEdgeAdditionPolicy();
      case "artifact_class":
        return new ArtifactClassEdgeAdditionPolicy();
      case "data":
        return new DataEdgeAdditionPolicy();
      case "checklist":
        return new ChecklistEdgeAdditionPolicy();
      default:
        throw new Error(`Unknown page block type: ${pageBlockType}`);
    }
  }
}
