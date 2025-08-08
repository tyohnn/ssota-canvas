import { Node as ReactFlowBlock } from "@xyflow/react";
import { BlockPosition as DbBlockPosition } from "@/db/schema";
import { PageBlockType } from "./block-definition-policy";

/**
 * 🎯 BLOCK POSITION POLICY
 * ========================
 *
 * 📋 파일 역할:
 * - 새로운 블록이 추가될 때 최적의 위치를 결정하는 정책
 * - 현재 페이지 컨텍스트와 추가되는 블록 타입에 따른 위치 계산
 * - 기존 블록들의 위치를 고려한 스마트 배치
 *
 * 🔧 주요 기능:
 * - 페이지별 블록 위치 정책 (Workflow, Agent, Task, Resource)
 * - 현재 블록 위치 기반 최적 배치 계산
 * - 중앙 정렬 및 간격 조정 로직
 *
 * 📦 Export:
 * - BlockPositionPolicy 인터페이스
 * - 각 페이지별 정책 구현 클래스들
 * - BlockPositionPolicyFactory
 */

// 위치 정보 타입
export interface Position {
  x: number;
  y: number;
}

// 영향받는 블록 위치 정보
export interface AffectedBlockPosition {
  blockId: string;
  position: Position;
}

// 위치 계산 결과
export interface PositionCalculationResult {
  newBlockPosition: Position;
  affectedBlockPositions: AffectedBlockPosition[];
}

// 새 블록 위치 계산 컨텍스트
export interface PositionCalculationContext {
  newBlockType: PageBlockType;
  pageBlockType: PageBlockType;
  pageBlockId: string;
  displayBlocks: ReactFlowBlock[];
  currentBlockPositions: DbBlockPosition[];
}

/**
 * 블록 위치 정책 인터페이스
 * 새로운 블록이 추가될 때 최적의 위치와 영향받는 기존 블록들의 위치를 계산합니다.
 */
export interface BlockPositionPolicy {
  /**
   * 새로운 블록의 위치와 영향받는 기존 블록들의 위치를 계산합니다.
   * @param context 위치 계산에 필요한 컨텍스트 정보
   * @returns 새 블록의 위치와 영향받는 기존 블록들의 새 위치
   */
  calculatePosition(
    context: PositionCalculationContext
  ): PositionCalculationResult;
}

// ===== HELPER FUNCTIONS =====

/**
 * 현재 페이지 컨텍스트에 해당하는 블록 위치들을 필터링합니다.
 */
function getContextPositions(
  contextBlockId: string,
  allPositions: DbBlockPosition[]
): Map<string, Position> {
  const contextPositions = new Map<string, Position>();

  allPositions.forEach((pos) => {
    if (pos.context_block_id === contextBlockId) {
      contextPositions.set(pos.block_id, {
        x: pos.x_position,
        y: pos.y_position,
      });
    }
  });

  return contextPositions;
}

/**
 * displayBlocks에서 실제 위치 정보를 가진 블록들을 반환합니다.
 */
function getDisplayBlocksWithPositions(
  displayBlocks: ReactFlowBlock[],
  contextPositions: Map<string, Position>
): Array<{ id: string; type: string; position: Position }> {
  return displayBlocks
    .map((block) => {
      const position = contextPositions.get(block.id);
      if (position) {
        return {
          id: block.id,
          type: block.type || "unknown",
          position: position,
        };
      }
      return null;
    })
    .filter((block): block is NonNullable<typeof block> => block !== null);
}

/**
 * Y축 기준으로 정렬된 블록들을 반환합니다.
 */
function sortBlocksByY(
  blocks: Array<{ id: string; type: string; position: Position }>
): Array<{ id: string; type: string; position: Position }> {
  return [...blocks].sort((a, b) => a.position.y - b.position.y);
}

/**
 * 특정 타입들을 제외한 블록들을 필터링합니다.
 */
function filterBlocksByType(
  blocks: Array<{ id: string; type: string; position: Position }>,
  excludeTypes: PageBlockType[]
): Array<{ id: string; type: string; position: Position }> {
  return blocks.filter(
    (block) => !excludeTypes.includes(block.type as PageBlockType)
  );
}

/**
 * 특정 타입들만 포함한 블록들을 필터링합니다.
 */
function includeBlocksByType(
  blocks: Array<{ id: string; type: string; position: Position }>,
  includeTypes: PageBlockType[]
): Array<{ id: string; type: string; position: Position }> {
  return blocks.filter((block) =>
    includeTypes.includes(block.type as PageBlockType)
  );
}

/**
 * 특정 타입의 블록을 찾습니다 (첫 번째 블록 반환).
 */
function findBlockByType(
  blocks: Array<{ id: string; type: string; position: Position }>,
  blockType: PageBlockType
): { id: string; type: string; position: Position } | null {
  return blocks.find((block) => block.type === blockType) || null;
}

/**
 * 블록들을 고정 간격으로 배치한 후, 전체 그룹을 중앙 정렬하여 평행이동시킵니다.
 * @param targetBlocks 정렬할 블록들
 * @param referenceY 기준이 되는 Y 좌표 (에이전트나 테스크의 Y)
 * @param spacing 블록 간 간격 (기본 50px)
 * @param blockHeight 블록 높이 (기본 100px)
 * @returns 중앙 정렬된 새로운 Y 위치들
 */
function calculateCenterAlignedPositions(
  targetBlocks: Array<{ id: string; type: string; position: Position }>,
  referenceY: number,
  spacing: number = 50,
  blockHeight: number = 100
): Position[] {
  if (targetBlocks.length === 0) return [];

  console.log("🔍 [CENTER ALIGN DEBUG] 입력:", {
    targetBlocks: targetBlocks.map((block) => ({
      id: block.id,
      type: block.type,
      position: block.position,
    })),
    referenceY,
    spacing,
    blockHeight,
  });

  // 1. 고정 간격으로 블록들을 배치
  const positions = calculateFixedSpacingPositions(
    targetBlocks,
    spacing,
    blockHeight
  );

  console.log("🔍 [CENTER ALIGN DEBUG] 고정 간격 배치 결과:", {
    positions: positions.map((pos, index) => ({
      index,
      position: pos,
      blockId: targetBlocks[index]?.id,
    })),
  });

  // 2. 전체 그룹을 기준점에 맞춰 평행이동
  const adjustedPositions = adjustPositionsToCenter(
    positions,
    referenceY,
    blockHeight
  );

  console.log("🔍 [CENTER ALIGN DEBUG] 평행이동 결과:", {
    referenceY,
    adjustedPositions: adjustedPositions.map((pos, index) => ({
      index,
      position: pos,
      blockId: targetBlocks[index]?.id,
    })),
  });

  return adjustedPositions;
}

/**
 * 블록들을 고정 간격으로 배치합니다.
 * @param targetBlocks 정렬할 블록들
 * @param spacing 블록 간 간격
 * @param blockHeight 블록 높이
 * @returns 고정 간격으로 배치된 위치들
 */
function calculateFixedSpacingPositions(
  targetBlocks: Array<{ id: string; type: string; position: Position }>,
  spacing: number,
  blockHeight: number
): Position[] {
  const baseX = targetBlocks[0]?.position.x || 200;
  const startY = 0; // 임시 시작점

  return targetBlocks.map((_, index) => ({
    x: baseX,
    y: startY + index * (blockHeight + spacing), // 블록 높이 + 간격
  }));
}

/**
 * 블록 그룹의 경계 범위 중앙점이 기준점과 일치하도록 평행이동시킵니다.
 * @param positions 기존 위치들
 * @param referenceY 기준이 되는 Y 좌표
 * @param blockHeight 블록 높이
 * @returns 평행이동된 위치들
 */
function adjustPositionsToCenter(
  positions: Position[],
  referenceY: number,
  blockHeight: number
): Position[] {
  if (positions.length === 0) return [];

  // 현재 그룹의 경계 계산
  const topY = positions[0]!.y; // 가장 위 블록의 중앙
  const bottomY = positions[positions.length - 1]!.y; // 가장 아래 블록의 중앙

  // 그룹의 실제 경계 (블록 높이 고려)
  const groupTopBoundary = topY - blockHeight / 2;
  const groupBottomBoundary = bottomY + blockHeight / 2;

  // 그룹 경계의 중앙점
  const groupCenterY = (groupTopBoundary + groupBottomBoundary) / 2;

  // 기준점과의 차이 계산
  const offsetY = referenceY - groupCenterY;

  console.log("🔍 [ADJUST POSITIONS DEBUG] 평행이동 계산:", {
    topY,
    bottomY,
    blockHeight,
    groupTopBoundary,
    groupBottomBoundary,
    groupCenterY,
    referenceY,
    offsetY,
    originalPositions: positions,
  });

  // 모든 블록을 평행이동
  const adjustedPositions = positions.map((pos) => ({
    x: pos.x,
    y: pos.y + offsetY,
  }));

  console.log("🔍 [ADJUST POSITIONS DEBUG] 평행이동 결과:", {
    adjustedPositions,
  });

  return adjustedPositions;
}

// ===== POLICY IMPLEMENTATIONS =====

/**
 * 워크스페이스 페이지 블럭 정책
 * 가장 마지막 블럭의 y값보다 50 추가하여 배치합니다.
 * 워크스페이스는 단순 나열이므로 기존 블록들의 위치는 변경하지 않습니다.
 */
export class WorkspacePageBlockPositionPolicy implements BlockPositionPolicy {
  calculatePosition(
    context: PositionCalculationContext
  ): PositionCalculationResult {
    const { pageBlockId, displayBlocks, currentBlockPositions } = context;

    // 현재 페이지 컨텍스트의 위치 정보 가져오기
    const contextPositions = getContextPositions(
      pageBlockId,
      currentBlockPositions
    );

    // 실제 위치를 가진 displayBlocks 가져오기
    const blocksWithPositions = getDisplayBlocksWithPositions(
      displayBlocks,
      contextPositions
    );

    // 블록이 없는 경우 기본 위치
    if (blocksWithPositions.length === 0) {
      return {
        newBlockPosition: { x: 200, y: 100 },
        affectedBlockPositions: [],
      };
    }

    // Y축 기준으로 정렬하여 가장 마지막(아래쪽) 블록 찾기
    const sortedBlocks = sortBlocksByY(blocksWithPositions);
    const lastBlock = sortedBlocks[sortedBlocks.length - 1];

    if (!lastBlock) {
      return {
        newBlockPosition: { x: 200, y: 100 },
        affectedBlockPositions: [],
      };
    }

    // 가장 마지막 블록의 Y값 + 150 (블록 높이 100px + 간격 50px)
    return {
      newBlockPosition: {
        x: lastBlock.position.x, // 같은 X 축선상에 배치
        y: lastBlock.position.y + 150, // 블록 높이 + 간격
      },
      affectedBlockPositions: [], // 워크스페이스는 기존 블록 위치 변경 없음
    };
  }
}

/**
 * 에이전트 페이지 블럭 정책
 * 에이전트를 제외한 블록들을 중앙 정렬하여 배치합니다.
 * 새 블록 추가 시 기존 블록들도 중앙 정렬에 맞춰 재배치됩니다.
 */
export class AgentPageBlockPositionPolicy implements BlockPositionPolicy {
  calculatePosition(
    context: PositionCalculationContext
  ): PositionCalculationResult {
    const { pageBlockId, displayBlocks, currentBlockPositions } = context;

    // 현재 페이지 컨텍스트의 위치 정보 가져오기
    const contextPositions = getContextPositions(
      pageBlockId,
      currentBlockPositions
    );

    // 실제 위치를 가진 displayBlocks 가져오기
    const blocksWithPositions = getDisplayBlocksWithPositions(
      displayBlocks,
      contextPositions
    );

    // 에이전트 블록 찾기
    const agentBlock = findBlockByType(
      blocksWithPositions,
      PageBlockType.AGENT
    );

    // 에이전트 제외한 다른 블록들
    const nonAgentBlocks = filterBlocksByType(blocksWithPositions, [
      PageBlockType.AGENT,
    ]);

    // 에이전트가 없는 경우
    if (!agentBlock) {
      return {
        newBlockPosition: { x: 200, y: 100 },
        affectedBlockPositions: [],
      };
    }

    if (nonAgentBlocks.length === 0) {
      // 다른 블록이 없으면 에이전트 우측에 배치
      return {
        newBlockPosition: {
          x: agentBlock.position.x + 400, // 에이전트 X + 400
          y: agentBlock.position.y, // 같은 Y 라인
        },
        affectedBlockPositions: [],
      };
    }

    // 에이전트가 아닌 블록들을 Y축 기준으로 정렬
    const sortedNonAgentBlocks = sortBlocksByY(nonAgentBlocks);

    // 가장 마지막 블록의 Y + 150에 새 블록 추가 (블록 높이 100px + 간격 50px)
    const lastBlock = sortedNonAgentBlocks[sortedNonAgentBlocks.length - 1];
    if (!lastBlock) {
      return {
        newBlockPosition: {
          x: agentBlock.position.x + 400,
          y: agentBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }
    const newBlockY = lastBlock.position.y + 150; // 블록 높이 + 간격

    // 새 블록이 추가된 상태의 모든 비에이전트 블록들 (가상으로 새 블록 포함)
    const allNonAgentBlocksWithNew = [
      ...sortedNonAgentBlocks,
      {
        id: "new-block",
        type: "new",
        position: { x: lastBlock.position.x, y: newBlockY },
      },
    ];

    // 에이전트 Y를 기준으로 중앙 정렬된 위치들 계산 (50px 간격, 100px 블록 높이)
    const agentBlockHeight = 100; // Agent 블록 높이
    const agentCenterY = agentBlock.position.y + agentBlockHeight / 2; // 좌측상단 → 중앙점

    console.log("🔍 [AGENT POSITION DEBUG] 계산 시작:", {
      agentBlock: {
        id: agentBlock.id,
        type: agentBlock.type,
        position: agentBlock.position,
        centerY: agentCenterY,
      },
      nonAgentBlocks: sortedNonAgentBlocks.map((block) => ({
        id: block.id,
        type: block.type,
        position: block.position,
      })),
      newBlockY,
      allNonAgentBlocksWithNew: allNonAgentBlocksWithNew.map((block) => ({
        id: block.id,
        type: block.type,
        position: block.position,
      })),
    });

    const centeredPositions = calculateCenterAlignedPositions(
      allNonAgentBlocksWithNew,
      agentCenterY, // 중앙점을 기준으로 계산
      50, // 블록 간 간격
      100 // 블록 높이
    );

    console.log("🔍 [AGENT POSITION DEBUG] 중앙 정렬 결과:", {
      agentTopY: agentBlock.position.y,
      agentCenterY: agentCenterY,
      centeredPositions: centeredPositions.map((pos, index) => ({
        index,
        position: pos,
        centerY: pos.y + 50, // 블록의 중앙점
        blockId: allNonAgentBlocksWithNew[index]?.id,
        blockType: allNonAgentBlocksWithNew[index]?.type,
      })),
    });

    if (centeredPositions.length === 0) {
      return {
        newBlockPosition: {
          x: agentBlock.position.x + 400,
          y: agentBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 새로 추가될 블록의 위치 (마지막 위치)
    const newBlockPosition = centeredPositions[centeredPositions.length - 1];

    if (!newBlockPosition) {
      return {
        newBlockPosition: {
          x: agentBlock.position.x + 400,
          y: agentBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 기존 블록들의 새로운 위치 계산 (새 블록 제외)
    const affectedBlockPositions: AffectedBlockPosition[] = [];
    for (let i = 0; i < sortedNonAgentBlocks.length; i++) {
      const existingBlock = sortedNonAgentBlocks[i];
      const newPosition = centeredPositions[i];

      if (existingBlock && newPosition) {
        affectedBlockPositions.push({
          blockId: existingBlock.id,
          position: {
            x: newPosition.x,
            y: newPosition.y,
          },
        });
      }
    }

    return {
      newBlockPosition: {
        x: newBlockPosition.x,
        y: newBlockPosition.y,
      },
      affectedBlockPositions,
    };
  }
}

/**
 * 테스크 페이지 블럭 정책
 * Input 블록들(템플릿, 데이터, 체크리스트)은 좌측에, Output 블록들(템플릿 클래스)은 우측에 중앙 정렬하여 배치합니다.
 */
export class TaskPageBlockPositionPolicy implements BlockPositionPolicy {
  calculatePosition(
    context: PositionCalculationContext
  ): PositionCalculationResult {
    const { newBlockType, pageBlockId, displayBlocks, currentBlockPositions } =
      context;

    // 현재 페이지 컨텍스트의 위치 정보 가져오기
    const contextPositions = getContextPositions(
      pageBlockId,
      currentBlockPositions
    );

    // 실제 위치를 가진 displayBlocks 가져오기
    const blocksWithPositions = getDisplayBlocksWithPositions(
      displayBlocks,
      contextPositions
    );

    // 테스크 블록 찾기
    const taskBlock = findBlockByType(blocksWithPositions, PageBlockType.TASK);

    if (!taskBlock) {
      return {
        newBlockPosition: { x: 200, y: 100 },
        affectedBlockPositions: [],
      };
    }

    // Input/Output 타입 구분
    const inputTypes: PageBlockType[] = [
      PageBlockType.ARTIFACT_TEMPLATE,
      PageBlockType.DATA,
      PageBlockType.CHECKLIST,
    ];
    const outputTypes: PageBlockType[] = [PageBlockType.ARTIFACT_CLASS];

    if (inputTypes.includes(newBlockType)) {
      // Input 블록들 처리 (좌측)
      return this.calculateInputBlockPosition(
        blocksWithPositions,
        taskBlock,
        newBlockType
      );
    } else if (outputTypes.includes(newBlockType)) {
      // Output 블록들 처리 (우측)
      return this.calculateOutputBlockPosition(
        blocksWithPositions,
        taskBlock,
        newBlockType
      );
    } else {
      // 기타 블록들은 기본 위치
      return {
        newBlockPosition: {
          x: taskBlock.position.x,
          y: taskBlock.position.y + 150,
        },
        affectedBlockPositions: [],
      };
    }
  }

  private calculateInputBlockPosition(
    blocksWithPositions: Array<{
      id: string;
      type: string;
      position: Position;
    }>,
    taskBlock: { id: string; type: string; position: Position },
    newBlockType: PageBlockType
  ): PositionCalculationResult {
    const inputTypes: PageBlockType[] = [
      PageBlockType.ARTIFACT_TEMPLATE,
      PageBlockType.DATA,
      PageBlockType.CHECKLIST,
    ];

    // 현재 input 블록들 찾기
    const currentInputBlocks = includeBlocksByType(
      blocksWithPositions,
      inputTypes
    );

    if (currentInputBlocks.length === 0) {
      // 첫 번째 input 블록이면 테스크 좌측에 배치
      return {
        newBlockPosition: {
          x: taskBlock.position.x - 400, // 테스크 좌측 400px
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 기존 input 블록들을 Y축 기준으로 정렬
    const sortedInputBlocks = sortBlocksByY(currentInputBlocks);

    // 가장 마지막 input 블록의 Y + 150에 새 블록 추가 (블록 높이 100px + 간격 50px)
    const lastInputBlock = sortedInputBlocks[sortedInputBlocks.length - 1];
    if (!lastInputBlock) {
      return {
        newBlockPosition: {
          x: taskBlock.position.x - 400,
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }
    const newBlockY = lastInputBlock.position.y + 150; // 블록 높이 + 간격

    // 새 블록이 추가된 상태의 모든 input 블록들 (가상으로 새 블록 포함)
    const allInputBlocksWithNew = [
      ...sortedInputBlocks,
      {
        id: "new-input-block",
        type: newBlockType,
        position: { x: lastInputBlock.position.x, y: newBlockY },
      },
    ];

    // 테스크 Y를 기준으로 중앙 정렬된 위치들 계산 (50px 간격, 100px 블록 높이)
    const centeredPositions = calculateCenterAlignedPositions(
      allInputBlocksWithNew,
      taskBlock.position.y,
      50, // 블록 간 간격
      100 // 블록 높이
    );

    if (centeredPositions.length === 0) {
      return {
        newBlockPosition: {
          x: taskBlock.position.x - 400,
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 새로 추가될 블록의 위치 (마지막 위치)
    const newBlockPosition = centeredPositions[centeredPositions.length - 1];

    if (!newBlockPosition) {
      return {
        newBlockPosition: {
          x: taskBlock.position.x - 400,
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 기존 input 블록들의 새로운 위치 계산 (새 블록 제외)
    const affectedBlockPositions: AffectedBlockPosition[] = [];
    for (let i = 0; i < sortedInputBlocks.length; i++) {
      const existingBlock = sortedInputBlocks[i];
      const newPosition = centeredPositions[i];

      if (existingBlock && newPosition) {
        affectedBlockPositions.push({
          blockId: existingBlock.id,
          position: {
            x: newPosition.x,
            y: newPosition.y,
          },
        });
      }
    }

    return {
      newBlockPosition: {
        x: newBlockPosition.x,
        y: newBlockPosition.y,
      },
      affectedBlockPositions,
    };
  }

  private calculateOutputBlockPosition(
    blocksWithPositions: Array<{
      id: string;
      type: string;
      position: Position;
    }>,
    taskBlock: { id: string; type: string; position: Position },
    newBlockType: PageBlockType
  ): PositionCalculationResult {
    const outputTypes: PageBlockType[] = [PageBlockType.ARTIFACT_CLASS];

    // 현재 output 블록들 찾기
    const currentOutputBlocks = includeBlocksByType(
      blocksWithPositions,
      outputTypes
    );

    if (currentOutputBlocks.length === 0) {
      // 첫 번째 output 블록이면 테스크 우측에 배치
      return {
        newBlockPosition: {
          x: taskBlock.position.x + 400, // 테스크 우측 400px
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 기존 output 블록들을 Y축 기준으로 정렬
    const sortedOutputBlocks = sortBlocksByY(currentOutputBlocks);

    // 가장 마지막 output 블록의 Y + 150에 새 블록 추가 (블록 높이 100px + 간격 50px)
    const lastOutputBlock = sortedOutputBlocks[sortedOutputBlocks.length - 1];
    if (!lastOutputBlock) {
      return {
        newBlockPosition: {
          x: taskBlock.position.x + 400,
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }
    const newBlockY = lastOutputBlock.position.y + 150; // 블록 높이 + 간격

    // 새 블록이 추가된 상태의 모든 output 블록들 (가상으로 새 블록 포함)
    const allOutputBlocksWithNew = [
      ...sortedOutputBlocks,
      {
        id: "new-output-block",
        type: newBlockType,
        position: { x: lastOutputBlock.position.x, y: newBlockY },
      },
    ];

    // 테스크 Y를 기준으로 중앙 정렬된 위치들 계산 (50px 간격, 100px 블록 높이)
    const centeredPositions = calculateCenterAlignedPositions(
      allOutputBlocksWithNew,
      taskBlock.position.y,
      50, // 블록 간 간격
      100 // 블록 높이
    );

    if (centeredPositions.length === 0) {
      return {
        newBlockPosition: {
          x: taskBlock.position.x + 400,
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 새로 추가될 블록의 위치 (마지막 위치)
    const newBlockPosition = centeredPositions[centeredPositions.length - 1];

    if (!newBlockPosition) {
      return {
        newBlockPosition: {
          x: taskBlock.position.x + 400,
          y: taskBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 기존 output 블록들의 새로운 위치 계산 (새 블록 제외)
    const affectedBlockPositions: AffectedBlockPosition[] = [];
    for (let i = 0; i < sortedOutputBlocks.length; i++) {
      const existingBlock = sortedOutputBlocks[i];
      const newPosition = centeredPositions[i];

      if (existingBlock && newPosition) {
        affectedBlockPositions.push({
          blockId: existingBlock.id,
          position: {
            x: newPosition.x,
            y: newPosition.y,
          },
        });
      }
    }

    return {
      newBlockPosition: {
        x: newBlockPosition.x,
        y: newBlockPosition.y,
      },
      affectedBlockPositions,
    };
  }
}

/**
 * 리소스 블럭 정책 (템플릿, 템플릿 클래스, 데이터, 체크리스트)
 * 에이전트나 테스크를 기준으로 중앙 정렬하여 배치합니다.
 */
export class ResourceBlockPositionPolicy implements BlockPositionPolicy {
  calculatePosition(
    context: PositionCalculationContext
  ): PositionCalculationResult {
    const { pageBlockId, displayBlocks, currentBlockPositions } = context;

    // 현재 페이지 컨텍스트의 위치 정보 가져오기
    const contextPositions = getContextPositions(
      pageBlockId,
      currentBlockPositions
    );

    // 실제 위치를 가진 displayBlocks 가져오기
    const blocksWithPositions = getDisplayBlocksWithPositions(
      displayBlocks,
      contextPositions
    );

    // 메인 블럭 (에이전트 또는 테스크) 찾기
    const mainBlock = this.findMainBlock(blocksWithPositions);

    if (!mainBlock) {
      return {
        newBlockPosition: { x: 200, y: 100 },
        affectedBlockPositions: [],
      };
    }

    // 에이전트와 테스크 블럭들 찾기
    const mainBlocks = includeBlocksByType(blocksWithPositions, [
      PageBlockType.AGENT,
      PageBlockType.TASK,
    ]);

    if (mainBlocks.length === 0) {
      // 에이전트나 테스크가 없으면 메인 블럭 좌측에 배치
      return {
        newBlockPosition: {
          x: mainBlock.position.x - 400, // 메인 블럭 좌측 400px
          y: mainBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 에이전트/테스크 블럭들을 Y축 기준으로 정렬
    const sortedMainBlocks = sortBlocksByY(mainBlocks);

    // 가장 마지막 블록의 Y + 150에 새 블록 추가 (블록 높이 100px + 간격 50px)
    const lastMainBlock = sortedMainBlocks[sortedMainBlocks.length - 1];
    if (!lastMainBlock) {
      return {
        newBlockPosition: {
          x: mainBlock.position.x - 400,
          y: mainBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }
    const newBlockY = lastMainBlock.position.y + 150; // 블록 높이 + 간격

    // 새 블록이 추가된 상태의 모든 메인 블록들 (가상으로 새 블록 포함)
    const allMainBlocksWithNew = [
      ...sortedMainBlocks,
      {
        id: "new-resource-block",
        type: "resource",
        position: { x: mainBlock.position.x - 400, y: newBlockY }, // 좌측에 배치
      },
    ];

    // 메인 블럭 Y를 기준으로 중앙 정렬된 위치들 계산 (50px 간격, 100px 블록 높이)
    const centeredPositions = calculateCenterAlignedPositions(
      allMainBlocksWithNew,
      mainBlock.position.y,
      50, // 블록 간 간격
      100 // 블록 높이
    );

    if (centeredPositions.length === 0) {
      return {
        newBlockPosition: {
          x: mainBlock.position.x - 400,
          y: mainBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 새로 추가될 블록의 위치 (마지막 위치)
    const newBlockPosition = centeredPositions[centeredPositions.length - 1];

    if (!newBlockPosition) {
      return {
        newBlockPosition: {
          x: mainBlock.position.x - 400,
          y: mainBlock.position.y,
        },
        affectedBlockPositions: [],
      };
    }

    // 기존 에이전트/테스크 블록들의 새로운 위치 계산 (새 블록 제외)
    const affectedBlockPositions: AffectedBlockPosition[] = [];
    for (let i = 0; i < sortedMainBlocks.length; i++) {
      const existingBlock = sortedMainBlocks[i];
      const newPosition = centeredPositions[i];

      if (existingBlock && newPosition) {
        affectedBlockPositions.push({
          blockId: existingBlock.id,
          position: {
            x: newPosition.x,
            y: newPosition.y,
          },
        });
      }
    }

    return {
      newBlockPosition: {
        x: newBlockPosition.x,
        y: newBlockPosition.y,
      },
      affectedBlockPositions,
    };
  }

  private findMainBlock(
    blocksWithPositions: Array<{ id: string; type: string; position: Position }>
  ): { id: string; type: string; position: Position } | null {
    // 에이전트를 우선적으로 찾기
    const agentBlock = findBlockByType(
      blocksWithPositions,
      PageBlockType.AGENT
    );
    if (agentBlock) return agentBlock;

    // 에이전트가 없으면 테스크 찾기
    const taskBlock = findBlockByType(blocksWithPositions, PageBlockType.TASK);
    if (taskBlock) return taskBlock;

    // 둘 다 없으면 null
    return null;
  }
}

// ===== POLICY FACTORY =====

/**
 * 블록 위치 정책 팩토리
 * 페이지 타입과 새로 추가될 블록 타입에 따라 적절한 정책을 반환합니다.
 */
export class BlockPositionPolicyFactory {
  /**
   * 페이지 타입과 새 블록 타입에 따라 적절한 정책을 반환합니다.
   * @param pageBlockType 현재 페이지의 블록 타입
   * @param newBlockType 새로 추가될 블록 타입
   * @returns 해당하는 블록 위치 정책
   */
  static getPolicy(pageBlockType: PageBlockType): BlockPositionPolicy {
    // 페이지 타입에 따른 정책 선택
    switch (pageBlockType) {
      case PageBlockType.WORKFLOW:
        return new WorkspacePageBlockPositionPolicy();

      case PageBlockType.AGENT:
        return new AgentPageBlockPositionPolicy();

      case PageBlockType.TASK:
        return new TaskPageBlockPositionPolicy();

      case PageBlockType.ARTIFACT_TEMPLATE:
      case PageBlockType.ARTIFACT_CLASS:
      case PageBlockType.DATA:
      case PageBlockType.CHECKLIST:
        return new ResourceBlockPositionPolicy();

      default:
        // 기본적으로 워크스페이스 정책 사용
        return new WorkspacePageBlockPositionPolicy();
    }
  }

  /**
   * 사용 가능한 모든 정책 타입을 반환합니다.
   */
  static getAvailablePolicyTypes(): PageBlockType[] {
    return [
      PageBlockType.WORKFLOW,
      PageBlockType.AGENT,
      PageBlockType.TASK,
      PageBlockType.ARTIFACT_TEMPLATE,
      PageBlockType.ARTIFACT_CLASS,
      PageBlockType.DATA,
      PageBlockType.CHECKLIST,
    ];
  }

  /**
   * 특정 페이지 타입에서 지원하는 블록 타입들을 반환합니다.
   */
  static getSupportedBlockTypes(pageBlockType: PageBlockType): PageBlockType[] {
    switch (pageBlockType) {
      case PageBlockType.WORKFLOW:
        // 워크플로우 페이지에서는 모든 타입의 블록을 추가할 수 있음
        return [
          PageBlockType.AGENT,
          PageBlockType.TASK,
          PageBlockType.ARTIFACT_TEMPLATE,
          PageBlockType.ARTIFACT_CLASS,
          PageBlockType.DATA,
          PageBlockType.CHECKLIST,
        ];

      case PageBlockType.AGENT:
        // 에이전트 페이지에서는 태스크와 리소스들을 추가할 수 있음
        return [
          PageBlockType.TASK,
          PageBlockType.ARTIFACT_TEMPLATE,
          PageBlockType.ARTIFACT_CLASS,
          PageBlockType.DATA,
          PageBlockType.CHECKLIST,
        ];

      case PageBlockType.TASK:
        // 테스크 페이지에서는 리소스들을 추가할 수 있음
        return [
          PageBlockType.ARTIFACT_TEMPLATE,
          PageBlockType.ARTIFACT_CLASS,
          PageBlockType.DATA,
          PageBlockType.CHECKLIST,
        ];

      case PageBlockType.ARTIFACT_TEMPLATE:
      case PageBlockType.ARTIFACT_CLASS:
      case PageBlockType.DATA:
      case PageBlockType.CHECKLIST:
        // 리소스 페이지에서는 에이전트나 테스크를 추가할 수 있음
        return [PageBlockType.AGENT, PageBlockType.TASK];

      default:
        return [];
    }
  }
}
