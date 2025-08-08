import { devLog } from "@/utils/dev-logger";
import {
  StaticBlockDefinition,
  DynamicGroup,
  WORKFLOW_BASIC_BLOCKS,
  DYNAMIC_GROUPS,
  type DbBlock,
} from "./block-definition-policy";
import { BlockType } from "@workspace/domain-contracts";

/**
 * 🎯 BLOCK ADDITION POLICY
 * ============================
 *
 * 📋 파일 역할:
 * - 각 페이지 타입별로 추가 가능한 블록들을 결정하는 정책
 * - 동적 그룹과 정적 블록 정의를 통합 관리
 * - Lucide 아이콘과 일관된 색상 시스템 적용
 *
 * 🔧 주요 기능:
 * - 페이지별 블록 추가 정책 정의
 * - 동적 그룹 데이터 관리
 * - Policy Pattern을 사용한 확장 가능한 시스템
 *
 * 📦 Export:
 * - BlockAdditionPolicy 인터페이스
 * - 7개 페이지 정책 클래스들
 * - BlockAdditionPolicyFactory
 */

/**
 * 각 페이지 타입별로 추가 가능한 블록들을 결정하는 정책 인터페이스
 */
export interface BlockAdditionPolicy {
  /**
   * 주어진 페이지 타입에서 추가 가능한 블록들과 그룹의 실제 아이템들을 반환
   */
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  };

  /**
   * 정책에 대한 설명 정보를 반환
   */
  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  };
}

/**
 * 1. 워크플로우 페이지: 워크플로우 기본 노드 + Task, Agent 그룹
 */
export class WorkflowBlockAdditionPolicy implements BlockAdditionPolicy {
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `WorkflowBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // Task와 Agent 블록들 필터링
    const taskBlocks = dbBlocks.filter((block) => block.block_type === "task");
    const agentBlocks = dbBlocks.filter(
      (block) => block.block_type === "agent"
    );

    // 정적 블록들 (워크플로우 기본 노드)
    const staticBlocks = [...WORKFLOW_BASIC_BLOCKS];

    // 동적 그룹들 (실제 블록이 있을 때만)
    const dynamicGroups: DynamicGroup[] = [];

    // Task 그룹
    if (taskBlocks.length > 0) {
      const taskGroup = DYNAMIC_GROUPS.find((g) => g.id === "task-group")!;
      const taskItems = taskBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...taskGroup, items: taskItems });
    }

    // Agent 그룹
    if (agentBlocks.length > 0) {
      const agentGroup = DYNAMIC_GROUPS.find((g) => g.id === "agent-group")!;
      const agentItems = agentBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...agentGroup, items: agentItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Workflow Block Policy",
      description:
        "Add workflow basic nodes (Start, End, Decision) and existing Task/Agent blocks to create workflow connections.",
      items: [
        "Static blocks: Start, End, Decision nodes",
        "Dynamic groups: Task blocks, Agent blocks",
      ],
    };
  }
}

/**
 * 2. 에이전트 페이지: Task, Data, Checklist, Template, Artifact Class 그룹
 */
export class AgentBlockAdditionPolicy implements BlockAdditionPolicy {
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `AgentBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // 각 타입별로 실제 블록들이 존재하는지 확인
    const taskBlocks = dbBlocks.filter((block) => block.block_type === "task");
    const dataBlocks = dbBlocks.filter((block) => block.block_type === "data");
    const checklistBlocks = dbBlocks.filter(
      (block) => block.block_type === "checklist"
    );
    const templateBlocks = dbBlocks.filter(
      (block) => block.block_type === "artifact_template"
    );
    const artifactClassBlocks = dbBlocks.filter(
      (block) => block.block_type === "artifact_class"
    );

    const staticBlocks: StaticBlockDefinition[] = [];
    const dynamicGroups: DynamicGroup[] = [];

    // 각 그룹은 해당 타입의 블록이 있을 때만 표시
    if (taskBlocks.length > 0) {
      const taskGroup = DYNAMIC_GROUPS.find((g) => g.id === "task-group")!;
      const taskItems = taskBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...taskGroup, items: taskItems });
    }

    if (dataBlocks.length > 0) {
      const dataGroup = DYNAMIC_GROUPS.find((g) => g.id === "data-group")!;
      const dataItems = dataBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...dataGroup, items: dataItems });
    }

    if (checklistBlocks.length > 0) {
      const checklistGroup = DYNAMIC_GROUPS.find(
        (g) => g.id === "checklist-group"
      )!;
      const checklistItems = checklistBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...checklistGroup, items: checklistItems });
    }

    if (templateBlocks.length > 0) {
      const templateGroup = DYNAMIC_GROUPS.find(
        (g) => g.id === "template-group"
      )!;
      const templateItems = templateBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...templateGroup, items: templateItems });
    }

    if (artifactClassBlocks.length > 0) {
      const artifactClassGroup = DYNAMIC_GROUPS.find(
        (g) => g.id === "artifact-class-group"
      )!;
      const artifactClassItems = artifactClassBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...artifactClassGroup, items: artifactClassItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Agent Block Policy",
      description:
        "Add existing blocks that agents can reference and use in their operations.",
      items: [
        "Task blocks",
        "Data blocks",
        "Checklist blocks",
        "Template blocks",
        "Artifact Class blocks",
      ],
    };
  }
}

/**
 * 3. 태스크 페이지: Data, Checklist, Template, Artifact Class 그룹
 */
export class TaskBlockAdditionPolicy implements BlockAdditionPolicy {
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `TaskBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // 각 타입별로 실제 블록들이 존재하는지 확인
    const dataBlocks = dbBlocks.filter((block) => block.block_type === "data");
    const checklistBlocks = dbBlocks.filter(
      (block) => block.block_type === "checklist"
    );
    const templateBlocks = dbBlocks.filter(
      (block) => block.block_type === "artifact_template"
    );
    const artifactClassBlocks = dbBlocks.filter(
      (block) => block.block_type === "artifact_class"
    );

    const staticBlocks: StaticBlockDefinition[] = [];
    const dynamicGroups: DynamicGroup[] = [];

    // 각 그룹은 해당 타입의 블록이 있을 때만 표시
    if (dataBlocks.length > 0) {
      const dataGroup = DYNAMIC_GROUPS.find((g) => g.id === "data-group")!;
      const dataItems = dataBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...dataGroup, items: dataItems });
    }

    if (checklistBlocks.length > 0) {
      const checklistGroup = DYNAMIC_GROUPS.find(
        (g) => g.id === "checklist-group"
      )!;
      const checklistItems = checklistBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...checklistGroup, items: checklistItems });
    }

    if (templateBlocks.length > 0) {
      const templateGroup = DYNAMIC_GROUPS.find(
        (g) => g.id === "template-group"
      )!;
      const templateItems = templateBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...templateGroup, items: templateItems });
    }

    if (artifactClassBlocks.length > 0) {
      const artifactClassGroup = DYNAMIC_GROUPS.find(
        (g) => g.id === "artifact-class-group"
      )!;
      const artifactClassItems = artifactClassBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...artifactClassGroup, items: artifactClassItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Task Block Policy",
      description:
        "Add existing blocks that tasks can reference and use in their operations.",
      items: [
        "Data blocks",
        "Checklist blocks",
        "Template blocks",
        "Artifact Class blocks",
      ],
    };
  }
}

/**
 * 4. 아티팩트 템플릿 페이지: Agent, Task 그룹
 */
export class ArtifactTemplateBlockAdditionPolicy
  implements BlockAdditionPolicy
{
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `ArtifactTemplateBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // 각 타입별로 실제 블록들이 존재하는지 확인
    const agentBlocks = dbBlocks.filter(
      (block) => block.block_type === "agent"
    );
    const taskBlocks = dbBlocks.filter((block) => block.block_type === "task");

    const staticBlocks: StaticBlockDefinition[] = [];
    const dynamicGroups: DynamicGroup[] = [];

    // 각 그룹은 해당 타입의 블록이 있을 때만 표시
    if (agentBlocks.length > 0) {
      const agentGroup = DYNAMIC_GROUPS.find((g) => g.id === "agent-group")!;
      const agentItems = agentBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...agentGroup, items: agentItems });
    }

    if (taskBlocks.length > 0) {
      const taskGroup = DYNAMIC_GROUPS.find((g) => g.id === "task-group")!;
      const taskItems = taskBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...taskGroup, items: taskItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Artifact Template Block Policy",
      description:
        "Add existing blocks that artifact templates can reference and use.",
      items: ["Agent blocks", "Task blocks"],
    };
  }
}

/**
 * 5. 아티팩트 클래스 페이지: Agent, Task 그룹
 */
export class ArtifactClassBlockAdditionPolicy implements BlockAdditionPolicy {
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `ArtifactClassBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // 각 타입별로 실제 블록들이 존재하는지 확인
    const agentBlocks = dbBlocks.filter(
      (block) => block.block_type === "agent"
    );
    const taskBlocks = dbBlocks.filter((block) => block.block_type === "task");

    const staticBlocks: StaticBlockDefinition[] = [];
    const dynamicGroups: DynamicGroup[] = [];

    // 각 그룹은 해당 타입의 블록이 있을 때만 표시
    if (agentBlocks.length > 0) {
      const agentGroup = DYNAMIC_GROUPS.find((g) => g.id === "agent-group")!;
      const agentItems = agentBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...agentGroup, items: agentItems });
    }

    if (taskBlocks.length > 0) {
      const taskGroup = DYNAMIC_GROUPS.find((g) => g.id === "task-group")!;
      const taskItems = taskBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...taskGroup, items: taskItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Artifact Class Block Policy",
      description:
        "Add existing blocks that artifact classes can reference and use.",
      items: ["Agent blocks", "Task blocks"],
    };
  }
}

/**
 * 6. 데이터 페이지: Agent, Task 그룹
 */
export class DataBlockAdditionPolicy implements BlockAdditionPolicy {
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `DataBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // 각 타입별로 실제 블록들이 존재하는지 확인
    const agentBlocks = dbBlocks.filter(
      (block) => block.block_type === "agent"
    );
    const taskBlocks = dbBlocks.filter((block) => block.block_type === "task");

    const staticBlocks: StaticBlockDefinition[] = [];
    const dynamicGroups: DynamicGroup[] = [];

    // 각 그룹은 해당 타입의 블록이 있을 때만 표시
    if (agentBlocks.length > 0) {
      const agentGroup = DYNAMIC_GROUPS.find((g) => g.id === "agent-group")!;
      const agentItems = agentBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...agentGroup, items: agentItems });
    }

    if (taskBlocks.length > 0) {
      const taskGroup = DYNAMIC_GROUPS.find((g) => g.id === "task-group")!;
      const taskItems = taskBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...taskGroup, items: taskItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Data Block Policy",
      description: "Add existing blocks that data can reference and use.",
      items: ["Agent blocks", "Task blocks"],
    };
  }
}

/**
 * 7. 체크리스트 페이지: Agent, Task 그룹
 */
export class ChecklistBlockAdditionPolicy implements BlockAdditionPolicy {
  getGroupsWithItems(
    pageBlockType: BlockType,
    dbBlocks: DbBlock[]
  ): {
    staticBlocks: StaticBlockDefinition[];
    dynamicGroups: DynamicGroup[];
  } {
    devLog(
      `ChecklistBlockAdditionPolicy: Getting groups with items for ${pageBlockType}`
    );

    // 각 타입별로 실제 블록들이 존재하는지 확인
    const agentBlocks = dbBlocks.filter(
      (block) => block.block_type === "agent"
    );
    const taskBlocks = dbBlocks.filter((block) => block.block_type === "task");

    const staticBlocks: StaticBlockDefinition[] = [];
    const dynamicGroups: DynamicGroup[] = [];

    // 각 그룹은 해당 타입의 블록이 있을 때만 표시
    if (agentBlocks.length > 0) {
      const agentGroup = DYNAMIC_GROUPS.find((g) => g.id === "agent-group")!;
      const agentItems = agentBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...agentGroup, items: agentItems });
    }

    if (taskBlocks.length > 0) {
      const taskGroup = DYNAMIC_GROUPS.find((g) => g.id === "task-group")!;
      const taskItems = taskBlocks.map((block) => ({
        id: block.id,
        name: block.name || block.id,
        description: ((block.metadata as any)?.description as string) || "",
      }));
      dynamicGroups.push({ ...taskGroup, items: taskItems });
    }

    return { staticBlocks, dynamicGroups };
  }

  getPolicyDescription(): {
    title: string;
    description: string;
    items: string[];
  } {
    return {
      title: "Checklist Block Policy",
      description: "Add existing blocks that checklists can reference and use.",
      items: ["Agent blocks", "Task blocks"],
    };
  }
}

/**
 * 팩토리 클래스: 페이지 타입에 따라 적절한 정책을 반환
 */
export class BlockAdditionPolicyFactory {
  static getPolicy(pageBlockType: BlockType): BlockAdditionPolicy {
    // 기본 노드 타입들은 워크플로우 정책을 사용
    if (
      pageBlockType === BlockType.START ||
      pageBlockType === BlockType.END ||
      pageBlockType === BlockType.CONDITION
    ) {
      return new WorkflowBlockAdditionPolicy();
    }

    switch (pageBlockType) {
      case BlockType.WORKFLOW:
        return new WorkflowBlockAdditionPolicy();
      case BlockType.AGENT:
        return new AgentBlockAdditionPolicy();
      case BlockType.TASK:
        return new TaskBlockAdditionPolicy();
      case BlockType.ARTIFACT_TEMPLATE:
        return new ArtifactTemplateBlockAdditionPolicy();
      case BlockType.ARTIFACT_CLASS:
        return new ArtifactClassBlockAdditionPolicy();
      case BlockType.DATA:
        return new DataBlockAdditionPolicy();
      case BlockType.CHECKLIST:
        return new ChecklistBlockAdditionPolicy();
      default:
        throw new Error(`Unknown page block type: ${pageBlockType}`);
    }
  }
}
