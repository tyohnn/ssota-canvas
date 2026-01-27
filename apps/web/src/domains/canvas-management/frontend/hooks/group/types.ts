import type { Node } from '@xyflow/react';

/**
 * React Flow 의존성 주입을 위한 기본 인터페이스
 */
export interface ReactFlowBaseDependencies {
  getNode?: (id: string) => Node | undefined;
  setNodes?: (payload: Node[] | ((nodes: Node[]) => Node[])) => void;
  getNodes?: () => Node[];
}

/**
 * React Flow 의존성 주입을 위한 공통 인터페이스
 * (노드 추가/제거 훅용)
 */
export interface ReactFlowDependencies {
  getNode: (id: string) => Node | undefined;
  setNodes: (payload: Node[] | ((nodes: Node[]) => Node[])) => void;
  updateNode?: (id: string, update: Partial<Node> | ((node: Node) => Partial<Node>)) => void;
}

/**
 * React Flow 의존성 주입을 위한 인터페이스
 * (충돌 감지 훅용)
 */
export interface ReactFlowReadonlyDependencies {
  getNodes: () => Node[];
  setNodes: (payload: Node[] | ((nodes: Node[]) => Node[])) => void;
}

/**
 * 그룹 충돌 감지를 위한 액션 의존성
 */
export interface GroupCollisionDependencies {
  addNodeToGroup: (params: {
    childBlockMountId: string;
    parentBlockMountId: string;
    childAbsolutePosition: { x: number; y: number };
    parentPosition: { x: number; y: number };
  }) => Promise<void>;
  removeNodeFromGroup: (params: {
    childBlockMountId: string;
    parentPosition: { x: number; y: number };
    childRelativePosition: { x: number; y: number };
  }) => Promise<void>;
}
