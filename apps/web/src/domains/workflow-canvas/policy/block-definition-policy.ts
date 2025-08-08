import { ComponentType } from "react";
import {
  Bot,
  CheckSquare,
  GitBranch,
  FileText,
  Database,
  Layers,
  LucideIcon,
  Cog,
  Play,
  Square,
  GitBranchIcon,
  Settings,
} from "lucide-react";
import { Block } from "@/db/schema";
import {
  BlockType,
  AgentMetadata,
  TaskMetadata,
  WorkflowMetadata,
  DataMetadata,
  ChecklistMetadata,
  ArtifactTemplateMetadata,
  ArtifactClassMetadata,
  BlockMetadata,
  StartMetadata,
  EndMetadata,
  ConditionMetadata,
  BlockDefinitionMetadata,
  EdgeDefinitionMetadata,
  ColumnDefinitionMetadata,
} from "@workspace/domain-contracts";
/**
 * 🎯 BLOCK DEFINITION POLICY
 * ============================
 *
 * 📋 파일 역할:
 * - 워크플로우 캔버스 도메인의 모든 상수 정의 중앙화
 * - 페이지 블록 타입, 아이콘, 색상 등 모든 정의
 * - 블록 스타일, 타입, 아이콘, 색상 정의
 * - 정적 블록과 동적 그룹의 기본 구조 정의
 * - 블록 카테고리 및 속성 정의
 *
 * 🔧 주요 기능:
 * - PageBlockType: 페이지 블록 타입 enum
 * - PAGE_BLOCK_ICONS: 페이지별 Lucide 아이콘 매핑
 * - PAGE_BLOCK_COLORS: 페이지별 Tailwind CSS 색상 토큰 매핑
 * - StaticBlockDefinition: 정적 블록 정의 인터페이스
 * - DynamicGroup: 동적 그룹 정의 인터페이스
 * - BlockCategory: 블록 카테고리 타입
 * - BlockType: 블록 타입 정의
 * - WORKFLOW_BASIC_BLOCKS: 워크플로우 기본 블록들
 * - DYNAMIC_GROUPS: 동적 그룹 정의들
 *
 * 📦 Export:
 * - 타입 정의들 (PageBlockType, BlockCategory, BlockType, StaticBlockDefinition, DynamicGroup, BlockData)
 * - 기본 블록 정의들 (WORKFLOW_BASIC_BLOCKS, DYNAMIC_GROUPS)
 * - 아이콘 및 색상 매핑 (PAGE_BLOCK_ICONS, PAGE_BLOCK_COLORS)
 *
 * 📝 참고:
 * - 페이지별 블록 추가 정책은 block-addition-policy.ts에서 관리
 * - 이 파일은 블록의 기본 구조와 정의만 담당
 */

// PageBlockType and BasicBlockType are re-exported from contracts

export const PAGE_BLOCK_ICONS = {
  [BlockType.AGENT]: Bot,
  [BlockType.TASK]: Cog,
  [BlockType.WORKFLOW]: GitBranch,
  [BlockType.ARTIFACT_TEMPLATE]: FileText,
  [BlockType.CHECKLIST]: CheckSquare,
  [BlockType.DATA]: Database,
  [BlockType.ARTIFACT_CLASS]: Layers,
  [BlockType.START]: Play,
  [BlockType.END]: Square,
  [BlockType.CONDITION]: Settings,
  [BlockType.BLOCK_DEFINITION]: FileText,
  [BlockType.EDGE_DEFINITION]: GitBranch,
  [BlockType.COLUMN_DEFINITION]: Layers,
};

// 색상 토큰만 추출한 매핑
export const PAGE_BLOCK_COLOR_TOKENS = {
  [BlockType.AGENT]: "purple",
  [BlockType.TASK]: "emerald",
  [BlockType.WORKFLOW]: "blue",
  [BlockType.ARTIFACT_TEMPLATE]: "amber",
  [BlockType.CHECKLIST]: "red",
  [BlockType.DATA]: "cyan",
  [BlockType.ARTIFACT_CLASS]: "lime",
  [BlockType.START]: "purple",
  [BlockType.END]: "purple",
  [BlockType.CONDITION]: "purple",
  [BlockType.BLOCK_DEFINITION]: "purple",
  [BlockType.EDGE_DEFINITION]: "purple",
  [BlockType.COLUMN_DEFINITION]: "purple",
};

// Tailwind CSS 색상 유틸리티 함수들 (Purging 방지)
export const getBlockColorClasses = (colorToken: string) => {
  switch (colorToken) {
    case "purple":
      return {
        bg500: "bg-purple-500",
        bg50: "bg-purple-50",
        bg100: "bg-purple-100",
        bg200: "bg-purple-200",
        text500: "text-purple-500",
        text600: "text-purple-600",
        text700: "text-purple-700",
        text900: "text-purple-900",
        border200: "border-purple-200",
        ring500: "ring-purple-500",
        gradientFrom50: "from-purple-50",
        gradientTo100: "to-purple-100",
      };
    case "emerald":
      return {
        bg500: "bg-emerald-500",
        bg50: "bg-emerald-50",
        bg100: "bg-emerald-100",
        bg200: "bg-emerald-200",
        text500: "text-emerald-500",
        text600: "text-emerald-600",
        text700: "text-emerald-700",
        text900: "text-emerald-900",
        border200: "border-emerald-200",
        ring500: "ring-emerald-500",
        gradientFrom50: "from-emerald-50",
        gradientTo100: "to-emerald-100",
      };
    case "blue":
      return {
        bg500: "bg-blue-500",
        bg50: "bg-blue-50",
        bg100: "bg-blue-100",
        bg200: "bg-blue-200",
        text500: "text-blue-500",
        text600: "text-blue-600",
        text700: "text-blue-700",
        text900: "text-blue-900",
        border200: "border-blue-200",
        ring500: "ring-blue-500",
        gradientFrom50: "from-blue-50",
        gradientTo100: "to-blue-100",
      };
    case "amber":
      return {
        bg500: "bg-amber-500",
        bg50: "bg-amber-50",
        bg100: "bg-amber-100",
        bg200: "bg-amber-200",
        text500: "text-amber-500",
        text600: "text-amber-600",
        text700: "text-amber-700",
        text900: "text-amber-900",
        border200: "border-amber-200",
        ring500: "ring-amber-500",
        gradientFrom50: "from-amber-50",
        gradientTo100: "to-amber-100",
      };
    case "red":
      return {
        bg500: "bg-red-500",
        bg50: "bg-red-50",
        bg100: "bg-red-100",
        bg200: "bg-red-200",
        text500: "text-red-500",
        text600: "text-red-600",
        text700: "text-red-700",
        text900: "text-red-900",
        border200: "border-red-200",
        ring500: "ring-red-500",
        gradientFrom50: "from-red-50",
        gradientTo100: "to-red-100",
      };
    case "cyan":
      return {
        bg500: "bg-cyan-500",
        bg50: "bg-cyan-50",
        bg100: "bg-cyan-100",
        bg200: "bg-cyan-200",
        text500: "text-cyan-500",
        text600: "text-cyan-600",
        text700: "text-cyan-700",
        text900: "text-cyan-900",
        border200: "border-cyan-200",
        ring500: "ring-cyan-500",
        gradientFrom50: "from-cyan-50",
        gradientTo100: "to-cyan-100",
      };
    case "lime":
      return {
        bg500: "bg-lime-500",
        bg50: "bg-lime-50",
        bg100: "bg-lime-100",
        bg200: "bg-lime-200",
        text500: "text-lime-500",
        text600: "text-lime-600",
        text700: "text-lime-700",
        text900: "text-lime-900",
        border200: "border-lime-200",
        ring500: "ring-lime-500",
        gradientFrom50: "from-lime-50",
        gradientTo100: "to-lime-100",
      };
    default:
      return {
        bg500: "bg-gray-500",
        bg50: "bg-gray-50",
        bg100: "bg-gray-100",
        bg200: "bg-gray-200",
        text500: "text-gray-500",
        text600: "text-gray-600",
        text700: "text-gray-700",
        text900: "text-gray-900",
        border200: "border-gray-200",
        ring500: "ring-gray-500",
        gradientFrom50: "from-gray-50",
        gradientTo100: "to-gray-100",
      };
  }
};

// Block interface for existing blocks
export interface BlockData {
  id: string;
  name?: string;
  description?: string;
  data?: {
    label?: string;
    description?: string;
  };
}

// Page block type interface
export interface PageBlockTypeData {
  id: BlockType;
  label: string;
  description: string;
  icon: ComponentType;
  color: string;
  pages: BlockData[];
}

// Page block type definitions with metadata
export const PAGE_BLOCK_TYPES: PageBlockTypeData[] = [
  {
    id: BlockType.WORKFLOW,
    label: "Workflow",
    description: "Business process workflows",
    icon: PAGE_BLOCK_ICONS[BlockType.WORKFLOW],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.WORKFLOW],
    pages: [],
  },
  {
    id: BlockType.AGENT,
    label: "Agent",
    description: "AI agents and automation",
    icon: PAGE_BLOCK_ICONS[BlockType.AGENT],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.AGENT],
    pages: [],
  },
  {
    id: BlockType.TASK,
    label: "Task",
    description: "Individual tasks and activities",
    icon: PAGE_BLOCK_ICONS[BlockType.TASK],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.TASK],
    pages: [],
  },
  {
    id: BlockType.ARTIFACT_TEMPLATE,
    label: "Artifact Template",
    description: "Document and output templates",
    icon: PAGE_BLOCK_ICONS[BlockType.ARTIFACT_TEMPLATE],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_TEMPLATE],
    pages: [],
  },
  {
    id: BlockType.DATA,
    label: "Data",
    description: "Data sources and databases",
    icon: PAGE_BLOCK_ICONS[BlockType.DATA],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.DATA],
    pages: [],
  },
  {
    id: BlockType.CHECKLIST,
    label: "Checklist",
    description: "Quality assurance checklists",
    icon: PAGE_BLOCK_ICONS[BlockType.CHECKLIST],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.CHECKLIST],
    pages: [],
  },
  {
    id: BlockType.ARTIFACT_CLASS,
    label: "Artifact Class",
    description: "Structured artifact definitions",
    icon: PAGE_BLOCK_ICONS[BlockType.ARTIFACT_CLASS],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_CLASS],
    pages: [],
  },
];

/**
 * 블록 카테고리 타입
 */
export enum BlockCategory {
  CONTROL = "control",
  TEMPLATE = "template",
  PAGE = "page",
}

/**
 * 정적 블록 정의 인터페이스 (워크플로우 기본 블럭)
 */
export interface StaticBlockDefinition {
  id: string;
  name: string;
  description: string;
  icon: ComponentType;
  color: string;
  category: BlockCategory;
  blockType: BlockType;
  properties: Record<string, unknown>;
}

/**
 * 블럭 추가 시 페이지 블럭의 그룹 정의 인터페이스
 */
export interface DynamicGroup {
  id: string;
  label: string;
  description: string;
  icon: ComponentType;
  color: string;
  blockType: BlockType;
  category: BlockCategory;
  isDynamic: boolean;
  items?: BlockData[]; // 그룹에 속한 다이나믹 블럭들
}

/**
 * Workflow page basic nodes
 */
export const WORKFLOW_BASIC_BLOCKS: StaticBlockDefinition[] = [
  {
    id: "start-node",
    name: "Start",
    description: "Starting point of the workflow",
    icon: Play,
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.WORKFLOW],
    category: BlockCategory.CONTROL,
    blockType: BlockType.START,
    properties: {
      label: "Start",
      position: "entry",
    },
  },
  {
    id: "end-node",
    name: "End",
    description: "Ending point of the workflow",
    icon: Square,
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.WORKFLOW],
    category: BlockCategory.CONTROL,
    blockType: BlockType.END,
    properties: {
      label: "End",
      position: "exit",
    },
  },

  {
    id: "condition-node",
    name: "Condition",
    description: "Condition setting for branching",
    icon: Settings,
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.WORKFLOW],
    category: BlockCategory.CONTROL,
    blockType: BlockType.CONDITION,
    properties: {
      label: "Condition",
      expression: "",
      operator: "equals",
    },
  },
];

/**
 * 페이지 블록 데이터 정의 (영어)
 */
export interface PageBlockData {
  id: BlockType;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const PAGE_BLOCK_DATA: PageBlockData[] = [
  {
    id: BlockType.WORKFLOW,
    title: "Workflow",
    description: "Coordinate tasks and agents to implement business processes.",
    icon: PAGE_BLOCK_ICONS[BlockType.WORKFLOW],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.WORKFLOW],
  },
  {
    id: BlockType.AGENT,
    title: "Agent",
    description:
      "AI agents that can perform tasks, make decisions, and interact with users.",
    icon: PAGE_BLOCK_ICONS[BlockType.AGENT],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.AGENT],
  },
  {
    id: BlockType.TASK,
    title: "Task",
    description: "Individual task items that agents or users can execute.",
    icon: PAGE_BLOCK_ICONS[BlockType.TASK],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.TASK],
  },
  {
    id: BlockType.ARTIFACT_TEMPLATE,
    title: "Artifact Template",
    description:
      "Templates that define the structure and format of generated outputs or documents.",
    icon: PAGE_BLOCK_ICONS[BlockType.ARTIFACT_TEMPLATE],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_TEMPLATE],
  },
  {
    id: BlockType.DATA,
    title: "Data",
    description:
      "Data sources, databases, and data processing components for storing, retrieving, and transforming information.",
    icon: PAGE_BLOCK_ICONS[BlockType.DATA],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.DATA],
  },
  {
    id: BlockType.CHECKLIST,
    title: "Checklist",
    description:
      "Interactive checklists for quality assurance, compliance verification, and step-by-step procedures.",
    icon: PAGE_BLOCK_ICONS[BlockType.CHECKLIST],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.CHECKLIST],
  },
  {
    id: BlockType.ARTIFACT_CLASS,
    title: "Artifact Class",
    description:
      "Class definitions for creating structured artifacts with specific properties, methods, and behaviors.",
    icon: PAGE_BLOCK_ICONS[BlockType.ARTIFACT_CLASS],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_CLASS],
  },
];

/**
 * Dynamic groups definition (using Lucide icons)
 */
export const DYNAMIC_GROUPS: DynamicGroup[] = [
  // Task Group
  {
    id: "task-group",
    label: "Task",
    description: "Select from existing tasks or create new ones",
    icon: PAGE_BLOCK_ICONS[BlockType.TASK],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.TASK],
    blockType: BlockType.TASK,
    category: BlockCategory.PAGE,
    isDynamic: true,
  },
  // Agent Group
  {
    id: "agent-group",
    label: "Agent",
    description: "Select from existing agents or create new ones",
    icon: PAGE_BLOCK_ICONS[BlockType.AGENT],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.AGENT],
    blockType: BlockType.AGENT,
    category: BlockCategory.PAGE,
    isDynamic: true,
  },
  // Data Group
  {
    id: "data-group",
    label: "Data",
    description: "Select from existing data sources or create new ones",
    icon: PAGE_BLOCK_ICONS[BlockType.DATA],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.DATA],
    blockType: BlockType.DATA,
    category: BlockCategory.PAGE,
    isDynamic: true,
  },
  // Checklist Group
  {
    id: "checklist-group",
    label: "Checklist",
    description: "Select from existing checklists or create new ones",
    icon: PAGE_BLOCK_ICONS[BlockType.CHECKLIST],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.CHECKLIST],
    blockType: BlockType.CHECKLIST,
    category: BlockCategory.PAGE,
    isDynamic: true,
  },
  // Template Group
  {
    id: "template-group",
    label: "Template",
    description: "Select from existing templates or create new ones",
    icon: PAGE_BLOCK_ICONS[BlockType.ARTIFACT_TEMPLATE],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_TEMPLATE],
    blockType: BlockType.ARTIFACT_TEMPLATE,
    category: BlockCategory.TEMPLATE,
    isDynamic: true,
  },
  // Artifact Class Group
  {
    id: "artifact-class-group",
    label: "Artifact Class",
    description: "Select from existing artifact classes or create new ones",
    icon: PAGE_BLOCK_ICONS[BlockType.ARTIFACT_CLASS],
    color: PAGE_BLOCK_COLOR_TOKENS[BlockType.ARTIFACT_CLASS],
    blockType: BlockType.ARTIFACT_CLASS,
    category: BlockCategory.TEMPLATE,
    isDynamic: true,
  },
];

/**
 * 블록 타입별 메타데이터 타입 매핑
 */
export type BlockMetadataMap = {
  [BlockType.AGENT]: AgentMetadata;
  [BlockType.TASK]: TaskMetadata;
  [BlockType.WORKFLOW]: WorkflowMetadata;
  [BlockType.DATA]: DataMetadata;
  [BlockType.CHECKLIST]: ChecklistMetadata;
  [BlockType.ARTIFACT_TEMPLATE]: ArtifactTemplateMetadata;
  [BlockType.ARTIFACT_CLASS]: ArtifactClassMetadata;
};

/**
 * 타입 가드 함수들
 */
export const isAgentMetadata = (
  metadata: BlockMetadata
): metadata is AgentMetadata => {
  return "role" in metadata && "name" in metadata && "slug" in metadata;
};

export const isTaskMetadata = (
  metadata: BlockMetadata
): metadata is TaskMetadata => {
  return "instructions" in metadata && "name" in metadata && "slug" in metadata;
};

export const isWorkflowMetadata = (
  metadata: BlockMetadata
): metadata is WorkflowMetadata => {
  return (
    "name" in metadata &&
    "slug" in metadata &&
    !("role" in metadata) &&
    !("instructions" in metadata)
  );
};

export const isDataMetadata = (
  metadata: BlockMetadata
): metadata is DataMetadata => {
  return "content" in metadata && "name" in metadata && "slug" in metadata;
};

export const isChecklistMetadata = (
  metadata: BlockMetadata
): metadata is ChecklistMetadata => {
  return "instructions" in metadata && "name" in metadata && "slug" in metadata;
};

export const isArtifactTemplateMetadata = (
  metadata: BlockMetadata
): metadata is ArtifactTemplateMetadata => {
  return (
    "identifier" in metadata &&
    "displayName" in metadata &&
    "outputFormat" in metadata
  );
};

export const isArtifactClassMetadata = (
  metadata: BlockMetadata
): metadata is ArtifactClassMetadata => {
  return (
    "identifier" in metadata &&
    "displayName" in metadata &&
    !("outputFormat" in metadata)
  );
};

export const isStartMetadata = (
  metadata: BlockMetadata
): metadata is StartMetadata => {
  return "position" in metadata && metadata.position === "entry";
};

export const isEndMetadata = (
  metadata: BlockMetadata
): metadata is EndMetadata => {
  return "position" in metadata && metadata.position === "exit";
};

export const isConditionMetadata = (
  metadata: BlockMetadata
): metadata is ConditionMetadata => {
  return "expression" in metadata && "operator" in metadata;
};

/**
 * 🎯 HYBRID BLOCK TYPE SYSTEM
 * ============================
 *
 * 하이브리드 방식: DB 필드 + 타입 가드 조합
 * - 블록 타입은 DB 필드 사용 (빠름)
 * - 메타데이터 접근 시 타입 가드 사용 (안전함)
 */

/**
 * 타입이 명시된 블록 타입
 */
export type TypedBlock<T extends BlockMetadata = BlockMetadata> = Block & {
  metadata: T;
};

/**
 * 메타데이터가 타입화된 블록 타입 (기본)
 */
export type DbBlock = Block & {
  metadata: BlockMetadata;
};

/**
 * 블록 타입별 특화된 DbBlock 타입들
 */
export type AgentDbBlock = Block & { metadata: AgentMetadata };
export type TaskDbBlock = Block & { metadata: TaskMetadata };
export type WorkflowDbBlock = Block & { metadata: WorkflowMetadata };
export type DataDbBlock = Block & { metadata: DataMetadata };
export type ChecklistDbBlock = Block & { metadata: ChecklistMetadata };
export type ArtifactTemplateDbBlock = Block & {
  metadata: ArtifactTemplateMetadata;
};
export type ArtifactClassDbBlock = Block & { metadata: ArtifactClassMetadata };
export type StartDbBlock = Block & { metadata: StartMetadata };
export type EndDbBlock = Block & { metadata: EndMetadata };
export type ConditionDbBlock = Block & { metadata: ConditionMetadata };
export type BlockDefinitionDbBlock = Block & {
  metadata: BlockDefinitionMetadata;
};
export type EdgeDefinitionDbBlock = Block & {
  metadata: EdgeDefinitionMetadata;
};
export type ColumnDefinitionDbBlock = Block & {
  metadata: ColumnDefinitionMetadata;
};

/**
 * 블록 타입별 DbBlock 매핑
 */
export type TypedDbBlockMap = {
  [BlockType.AGENT]: AgentDbBlock;
  [BlockType.TASK]: TaskDbBlock;
  [BlockType.WORKFLOW]: WorkflowDbBlock;
  [BlockType.DATA]: DataDbBlock;
  [BlockType.CHECKLIST]: ChecklistDbBlock;
  [BlockType.ARTIFACT_TEMPLATE]: ArtifactTemplateDbBlock;
  [BlockType.ARTIFACT_CLASS]: ArtifactClassDbBlock;
  [BlockType.BLOCK_DEFINITION]: BlockDefinitionDbBlock;
  [BlockType.EDGE_DEFINITION]: EdgeDefinitionDbBlock;
  [BlockType.COLUMN_DEFINITION]: ColumnDefinitionDbBlock;
  [BlockType.START]: StartDbBlock;
  [BlockType.END]: EndDbBlock;
  [BlockType.CONDITION]: ConditionDbBlock;
};

/**
 * 블록 타입별 메타데이터 접근 유틸리티
 */
export const getTypedMetadata = (block: DbBlock): BlockMetadata | null => {
  if (!block.metadata || typeof block.metadata !== "object") {
    return null;
  }

  const metadata = block.metadata as Record<string, any>;

  switch (block.block_type) {
    case "agent":
      return isAgentMetadata(metadata) ? metadata : null;
    case "task":
      return isTaskMetadata(metadata) ? metadata : null;
    case "workflow":
      return isWorkflowMetadata(metadata) ? metadata : null;
    case "data":
      return isDataMetadata(metadata) ? metadata : null;
    case "checklist":
      return isChecklistMetadata(metadata) ? metadata : null;
    case "artifact_template":
      return isArtifactTemplateMetadata(metadata) ? metadata : null;
    case "artifact_class":
      return isArtifactClassMetadata(metadata) ? metadata : null;
    case "start":
      return isStartMetadata(metadata) ? metadata : null;
    case "end":
      return isEndMetadata(metadata) ? metadata : null;
    case "condition":
      return isConditionMetadata(metadata) ? metadata : null;
    default:
      return null;
  }
};

/**
 * 블록 타입별 안전한 메타데이터 접근
 */
export const getAgentMetadata = (
  block: DbBlock | null | undefined
): AgentMetadata | null => {
  if (!block || !block.block_type) return null;
  return block.block_type === "agent" &&
    isAgentMetadata(block.metadata as Record<string, any>)
    ? (block.metadata as AgentMetadata)
    : null;
};

export const getTaskMetadata = (
  block: DbBlock | null | undefined
): TaskMetadata | null => {
  if (!block || !block.block_type) return null;
  return block.block_type === "task" &&
    isTaskMetadata(block.metadata as Record<string, any>)
    ? (block.metadata as TaskMetadata)
    : null;
};

export const getWorkflowMetadata = (
  block: DbBlock | null | undefined
): WorkflowMetadata | null => {
  if (!block || !block.block_type) return null;
  return block.block_type === "workflow" &&
    isWorkflowMetadata(block.metadata as Record<string, any>)
    ? (block.metadata as WorkflowMetadata)
    : null;
};

export const getDataMetadata = (
  block: DbBlock | null | undefined
): DataMetadata | null => {
  if (!block || !block.block_type) return null;
  return block.block_type === "data" &&
    isDataMetadata(block.metadata as Record<string, any>)
    ? (block.metadata as DataMetadata)
    : null;
};

export const getChecklistMetadata = (
  block: DbBlock | null | undefined
): ChecklistMetadata | null => {
  if (!block || !block.block_type) return null;
  return block.block_type === "checklist" &&
    isChecklistMetadata(block.metadata as Record<string, any>)
    ? (block.metadata as ChecklistMetadata)
    : null;
};

/**
 * 메타데이터에서 공통 필드 안전하게 추출
 */
export const getBlockName = (block: DbBlock | null | undefined): string => {
  if (!block) return "";
  const metadata = getTypedMetadata(block);
  if (!metadata) return block.name || "";

  // 모든 메타데이터 타입에 name 필드가 있음
  return "name" in metadata ? (metadata as any).name : block.name || "";
};

export const getBlockSlug = (block: DbBlock | null | undefined): string => {
  if (!block) return "";
  const metadata = getTypedMetadata(block);
  if (!metadata) return block.slug || "";

  // 모든 메타데이터 타입에 slug 필드가 있음
  return "slug" in metadata ? (metadata as any).slug : block.slug || "";
};

export const getBlockDescription = (
  block: DbBlock | null | undefined
): string => {
  if (!block) return "";
  const metadata = getTypedMetadata(block);
  if (!metadata) return "";

  // 모든 메타데이터 타입에 description 필드가 있음 (optional)
  return "description" in metadata ? (metadata as any).description || "" : "";
};
