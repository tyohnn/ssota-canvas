import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useCanvasState,
  useReactFlowCanvasState,
  useCanvasUIState,
} from "@/domains/workflow-canvas/hooks";
import {
  EdgeAdditionPolicyFactory,
  PageBlockType,
} from "@/domains/workflow-canvas/policy";
import { PageRenderingPolicyFactory } from "@/domains/workflow-canvas/policy";
import {
  BlockPositionPolicyFactory,
  PositionCalculationContext,
} from "@/domains/workflow-canvas/policy/block-layout-policy";
import { toast } from "@workspace/ui/components/sonner";
import {
  Block,
  Edge as DbEdge,
  BlockPosition as DbBlockPosition,
  NewEdge,
  NewBlockPosition,
} from "@/db/schema";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";
import { updateBlock } from "@/domains/workflow-canvas/actions/block.action";
import {
  createPageBlock,
  batchUpdateBlockPositions,
  updateContextBlockPosition,
} from "@/domains/workflow-canvas/actions/block.action";
import {
  batchCreateEdges,
  createEdge,
} from "@/domains/workflow-canvas/actions/edge.action";
import {
  Node as ReactFlowNode,
  Edge as ReactFlowEdge,
  Connection,
} from "@xyflow/react";
import { devLog } from "@/utils/dev-logger";

/**
 * Canvas Event Handler Hook
 * Centralized event handling for all canvas interactions
 */
export function useCanvasEventHandler(
  workspaceId: string,
  initialDbBlocks?: DbBlock[],
  initialDbEdges?: DbEdge[],
  initialDbBlockPositions?: DbBlockPosition[]
) {
  // 새로운 Canvas 상태 훅 (Pure State Management)
  const canvasState = useCanvasState(
    initialDbBlocks,
    initialDbEdges,
    initialDbBlockPositions
  );

  const reactFlowCanvasState = useReactFlowCanvasState();
  const uiState = useCanvasUIState();

  // [USER FLOW] PAGE BLOCK SELECT AT PAGE BLOCK EXPLORER
  // ===== 1. PAGE BLOCK SELECTION =====
  const handlePageBlockSelect = useCallback(
    (pageId: string) => {
      try {
        const selectedPageBlock = canvasState.dbBlocks.find(
          (block: DbBlock) => block.id === pageId
        );

        if (!selectedPageBlock) {
          throw new Error(`Block with id ${pageId} not found`);
        }

        canvasState.setSelectedPageBlock(selectedPageBlock);

        uiState.setActiveLeftTab("layers"); // 레이어 탭 변경
        reactFlowCanvasState.clearSelection();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to select page block";
        reactFlowCanvasState.setError(errorMessage);
        console.error("Page block selection failed:", errorMessage);
      }
    },
    [canvasState, uiState, reactFlowCanvasState]
  );

  // ===== 2. DISPLAY BLOCKS UPDATE =====
  // displayBlocks, displayEdges 업데이트 함수
  const updateDisplayBlocksForPage = useCallback(() => {
    const allBlocks = canvasState.dbBlocks;
    const allEdges = canvasState.dbEdges;
    const allBlockPositions = canvasState.dbBlockPositions;

    const pageId = canvasState.selectedPageBlock?.id;
    const pageType = canvasState.selectedPageBlock?.block_type;

    devLog("🔍 [DISPLAY DEBUG] updateDisplayBlocksForPage 호출:", {
      pageId,
      pageType,
      allBlockPositionsCount: allBlockPositions.length,
      allBlockPositions: allBlockPositions,
    });

    if (!pageId || !pageType) {
      devLog("⚠️ [UPDATE] 페이지 상태가 없어서 업데이트 건너뜁니다.");
      return;
    }

    try {
      const policy = PageRenderingPolicyFactory.getPolicy(
        pageType as PageBlockType
      );

      console.log("🔍 [DISPLAY DEBUG] getBlocksAndEdges 호출 전:", {
        pageId,
        allBlocksCount: allBlocks.length,
        allEdgesCount: allEdges.length,
        allBlockPositionsCount: allBlockPositions.length,
      });

      const { blocks: displayBlocks, edges: displayEdges } =
        policy.getBlocksAndEdges(
          pageId,
          allBlocks,
          allEdges,
          allBlockPositions
        );

      console.log("🔍 [DISPLAY DEBUG] getBlocksAndEdges 결과:", {
        displayBlocksCount: displayBlocks.length,
        displayBlocks: displayBlocks.map((block) => ({
          id: block.id,
          position: block.position,
          type: block.type,
        })),
      });

      // ViewportController.useEffect[displayBlocks]에서 트리거됨
      reactFlowCanvasState.setDisplayBlocks(displayBlocks);
      reactFlowCanvasState.setDisplayEdges(displayEdges);
      if (uiState.showEditorPanel) {
        uiState.setViewportAction("select");
      } else {
        uiState.setViewportAction("center");
      }
    } catch (error) {
      devLog("❌ [ERROR] Failed to update display blocks:", { error });
      reactFlowCanvasState.setError("Failed to update display blocks");
    }
  }, [
    canvasState.dbBlocks,
    canvasState.dbEdges,
    canvasState.dbBlockPositions,
    canvasState.selectedPageBlock,
  ]);

  // Auto-update display blocks when active page changes
  useEffect(() => {
    if (canvasState.selectedPageBlock) {
      updateDisplayBlocksForPage();
    } else {
      devLog("⚠️ [UPDATE] 페이지 상태가 없어서 업데이트 건너뜁니다.");
    }
  }, [canvasState.selectedPageBlock, updateDisplayBlocksForPage]);

  // ======================================= //

  // [USER FLOW] PAGE BLOCK SELECT AT PAGE BLOCK INSERT PANEL
  // ===== 1. PAGE BLOCK CREATE =====
  const handlePageBlockCreate = useCallback(
    async (pageType: PageBlockType) => {
      // 🚀 OPTIMISTIC UPDATE: 즉시 UI 상태 업데이트
      const optimisticBlockId = `temp-${Date.now()}`;

      try {
        devLog("🔵 [DB] 페이지 블럭 생성 시작:", {
          pageType,
          workspaceId,
        });

        const optimisticBlock: DbBlock = {
          id: optimisticBlockId, // 저장된 ID 사용
          block_type: pageType,
          slug: `${pageType}-${Date.now()}`,
          name: `New ${pageType.replace("_", " ")}`,
          metadata: {}, // 기본 메타데이터는 서버에서 생성됨
          workspace_id: workspaceId,
          parent_block_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // 즉시 상태 업데이트 (Optimistic)
        canvasState.addBlock(optimisticBlock);
        canvasState.setSelectedPageBlock(optimisticBlock);
        uiState.setActiveLeftTab("layers");
        reactFlowCanvasState.selectBlock(optimisticBlock.id);

        console.log(
          "⚡ [OPTIMISTIC] 즉시 페이지 블록 추가 완료:",
          optimisticBlock
        );

        // 🔄 DB 업데이트 시도
        const result = await createPageBlock({
          blockType: pageType,
          workspaceId: workspaceId,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        const savedNode = result.data;
        devLog("✅ [DB] 페이지 블럭 DB 저장 완료:", savedNode);

        // 성공 시 임시 블록을 실제 블록으로 교체
        canvasState.updateBlock(optimisticBlockId, {
          ...savedNode,
          id: savedNode.id, // 실제 ID로 교체
        });

        // 선택된 블록도 실제 블록으로 업데이트
        canvasState.setSelectedPageBlock(savedNode);
        reactFlowCanvasState.selectBlock(savedNode.id);

        // 🚀 새로 생성된 블록의 기본 위치 정보 생성
        const defaultPosition: DbBlockPosition = {
          id: `temp-position-${Date.now()}`, // 임시 ID
          block_id: savedNode.id,
          context_block_id: savedNode.id, // 페이지 블록은 자신을 context로 가짐
          x_position: 0,
          y_position: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };

        // Optimistic 위치 정보 추가
        canvasState.addPosition(defaultPosition);

        console.log(
          "🔍 [CREATE DEBUG] 새 블록 위치 정보 생성:",
          defaultPosition
        );

        // 🚀 DB에도 위치 정보 저장
        const positionResult = await updateContextBlockPosition(
          savedNode.id,
          savedNode.id,
          0,
          0
        );

        if (!positionResult.success) {
          console.error(
            "❌ [DB] 페이지 블록 위치 저장 실패:",
            positionResult.error
          );
        } else {
          console.log(
            "✅ [DB] 페이지 블록 위치 저장 완료:",
            positionResult.data
          );

          // DB에서 저장된 실제 위치 정보로 상태 업데이트
          canvasState.updatePosition(savedNode.id, savedNode.id, {
            x: positionResult.data.x_position,
            y: positionResult.data.y_position,
          });
        }

        toast.success(
          `${pageType.charAt(0).toUpperCase() + pageType.slice(1)} page created successfully!`
        );

        devLog("✅ [DB] 페이지 블럭 생성 완료:", {
          nodeId: savedNode.id,
          pageType,
          workspaceId,
        });

        return { success: true, pageId: savedNode.id };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to create page";
        console.error("❌ [DB] 페이지 블럭 생성 실패:", error);

        // 🔄 ROLLBACK: 실패 시 임시 블록 제거
        canvasState.deleteBlock(optimisticBlockId);
        canvasState.setSelectedPageBlock(null);
        reactFlowCanvasState.clearSelection();

        reactFlowCanvasState.setError(errorMessage);
        toast.error(`Failed to create page: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    },
    [canvasState, reactFlowCanvasState, uiState, workspaceId]
  );

  // ===== 2. BLOCK SELECTION AT REACT FLOW =====
  useEffect(() => {
    if (reactFlowCanvasState.selectedBlocks.length > 0) {
      const selectedBlockId = reactFlowCanvasState.selectedBlocks[0];
      if (selectedBlockId) {
        // Check if the selected block exists in displayBlocks
        const blockExists = reactFlowCanvasState.displayBlocks.some(
          (block) => block.id === selectedBlockId
        );

        if (blockExists) {
          uiState.setViewportAction("select"); // 뷰포트 액션 설정 -> ViewportController.useEffect[displayBlocks, viewportAction] 트리거 -> viewport 업데이트 -> 선택된 블록 좌측 배치
          uiState.setShowEditorPanelState(true);
        }
      }
    }
  }, [reactFlowCanvasState.selectedBlocks]);

  // ======================================= //

  // [USER FLOW] BLOCK SELECT AT BLOCK INSERT PANEL
  // ===== HELPER: CALCULATE NEW BLOCK POSITIONS =====
  const calculateNewBlockPositions = useCallback(
    async (
      activePageId: string,
      activePageBlockType: PageBlockType,
      targetBlockId: string,
      targetBlockType: PageBlockType,
      edgesToCreate: NewEdge[]
    ): Promise<NewBlockPosition[]> => {
      const newPositions: NewBlockPosition[] = [];

      try {
        devLog("🔄 [POSITION] 블록 위치 계산 시작:", {
          activePageId,
          activePageBlockType,
          targetBlockId,
          targetBlockType,
          edgeCount: edgesToCreate.length,
        });

        // 각 엣지에 대해 위치 계산
        for (const edge of edgesToCreate) {
          // Source 블록 정보 가져오기
          const sourceBlock = canvasState.dbBlocks.find(
            (b) => b.id === edge.source_block_id
          );
          if (!sourceBlock) continue;

          // Target 블록 정보 가져오기
          const targetBlock = canvasState.dbBlocks.find(
            (b) => b.id === edge.target_block_id
          );
          if (!targetBlock) continue;

          // Source 페이지에서 Target 블록의 위치 계산
          const sourcePagePositions = calculatePositionForBlockOnPage(
            edge.source_block_id, // 페이지 ID
            sourceBlock.block_type as PageBlockType, // 페이지 타입
            edge.target_block_id, // 배치할 블록 ID
            targetBlock.block_type as PageBlockType // 배치할 블록 타입
          );
          newPositions.push(...sourcePagePositions);

          // Target 페이지에서 Source 블록의 위치 계산 (양방향인 경우)
          const targetPagePositions = calculatePositionForBlockOnPage(
            edge.target_block_id, // 페이지 ID
            targetBlock.block_type as PageBlockType, // 페이지 타입
            edge.source_block_id, // 배치할 블록 ID
            sourceBlock.block_type as PageBlockType // 배치할 블록 타입
          );
          newPositions.push(...targetPagePositions);
        }

        // 중복 제거 (같은 block_id + context_block_id 조합)
        const uniquePositions = newPositions.filter((pos, index, arr) => {
          return (
            arr.findIndex(
              (p) =>
                p.block_id === pos.block_id &&
                p.context_block_id === pos.context_block_id
            ) === index
          );
        });

        devLog("🔄 [POSITION] 블록 위치 계산 완료:", {
          totalPositions: uniquePositions.length,
          removedDuplicates: newPositions.length - uniquePositions.length,
          positionsByPage: uniquePositions.reduce(
            (acc, pos) => {
              acc[pos.context_block_id] = (acc[pos.context_block_id] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        });

        return uniquePositions;
      } catch (error) {
        console.error("❌ [POSITION] 위치 계산 실패:", error);
        return [];
      }
    },
    [
      canvasState.dbBlocks,
      canvasState.dbBlockPositions,
      reactFlowCanvasState.displayBlocks,
    ]
  );

  // ===== HELPER: 특정 페이지에서 특정 블록의 위치 계산 =====
  const calculatePositionForBlockOnPage = useCallback(
    (
      pageId: string,
      pageBlockType: PageBlockType,
      blockId: string,
      blockType: PageBlockType
    ): NewBlockPosition[] => {
      const positions: NewBlockPosition[] = [];

      // 이미 이 페이지 컨텍스트에 위치가 있는지 확인
      const existingPosition = canvasState.dbBlockPositions.find(
        (pos) => pos.block_id === blockId && pos.context_block_id === pageId
      );

      if (existingPosition) {
        // 이미 위치가 있으면 스킵
        return positions;
      }

      // 정책에 따라 위치 계산
      const pagePolicy = BlockPositionPolicyFactory.getPolicy(pageBlockType);
      const pageContext: PositionCalculationContext = {
        newBlockType: blockType,
        pageBlockType: pageBlockType,
        pageBlockId: pageId,
        displayBlocks: reactFlowCanvasState.displayBlocks,
        currentBlockPositions: canvasState.dbBlockPositions,
      };

      const positionResult = pagePolicy.calculatePosition(pageContext);

      // 새 블록 위치 추가
      positions.push({
        block_id: blockId,
        context_block_id: pageId,
        x_position: positionResult.newBlockPosition.x,
        y_position: positionResult.newBlockPosition.y,
      });

      // 영향받는 기존 블록들의 위치 업데이트
      positionResult.affectedBlockPositions.forEach((affectedPos) => {
        positions.push({
          block_id: affectedPos.blockId,
          context_block_id: pageId,
          x_position: affectedPos.position.x,
          y_position: affectedPos.position.y,
        });
      });

      devLog("🔄 [POSITION] 블록 위치 계산:", {
        pageId,
        pageBlockType,
        blockId,
        blockType,
        newBlockPosition: positionResult.newBlockPosition,
        affectedBlocksCount: positionResult.affectedBlockPositions.length,
      });

      return positions;
    },
    [canvasState.dbBlockPositions, reactFlowCanvasState.displayBlocks]
  );

  // ===== BLOCK INSERT HANDLER =====
  const handleEdgeInsert = useCallback(
    async (targetBlockId: string, targetBlockType: PageBlockType) => {
      let optimisticEdges: DbEdge[] = [];

      try {
        if (!canvasState.selectedPageBlock) {
          console.error("No active page block selected");
          return;
        }

        // Close panel after successful insertion
        uiState.closeAllPanels();

        // Get edge addition policy for current page type
        const edgePolicy = EdgeAdditionPolicyFactory.getPolicy(
          canvasState.selectedPageBlock.block_type as PageBlockType
        );

        // Get edges to create based on policy
        const edgesToCreate = edgePolicy.getEdgesToCreate(
          canvasState.selectedPageBlock.id,
          canvasState.selectedPageBlock.block_type as PageBlockType,
          targetBlockId,
          targetBlockType as PageBlockType,
          workspaceId
        );

        devLog("🔵 [DB] 엣지 및 위치 저장 시작:", {
          edgesCount: edgesToCreate.length,
          activePageId: canvasState.selectedPageBlock.id,
          targetBlockId,
        });

        // 🚀 OPTIMISTIC UPDATE: 즉시 UI 상태 업데이트
        optimisticEdges = edgesToCreate.map((edge, index) => ({
          id: `temp-edge-${Date.now()}-${index}`,
          source_block_id: edge.source_block_id,
          target_block_id: edge.target_block_id,
          edge_type: edge.edge_type,
          metadata: edge.metadata || {},
          workspace_id: edge.workspace_id,
          created_at: new Date(),
          updated_at: new Date(),
        }));

        // 즉시 엣지 추가 (Optimistic)
        canvasState.addEdges(optimisticEdges);
        console.log("⚡ [OPTIMISTIC] 즉시 엣지 추가 완료:", optimisticEdges);

        // 🔄 DB 업데이트 시도
        const createdEdges: DbEdge[] = await Promise.all(
          edgesToCreate.map(async (edge) => {
            const result = await createEdge({
              sourceBlockId: edge.source_block_id,
              targetBlockId: edge.target_block_id,
              edgeType: edge.edge_type,
              metadata: edge.metadata as Record<string, any> | undefined,
              workspaceId: edge.workspace_id,
            });

            if (!result.success) {
              throw new Error(result.error);
            }

            return result.data;
          })
        );

        // 성공 시 임시 엣지를 실제 엣지로 교체
        optimisticEdges.forEach((optimisticEdge, index) => {
          const realEdge = createdEdges[index];
          if (realEdge) {
            canvasState.updateEdge(optimisticEdge.id, {
              ...realEdge,
              id: realEdge.id, // 실제 ID로 교체
            });
          }
        });

        // ===== 블록 위치 계산 및 업데이트 =====
        const newPositions = await calculateNewBlockPositions(
          canvasState.selectedPageBlock.id,
          canvasState.selectedPageBlock.block_type as PageBlockType,
          targetBlockId,
          targetBlockType as PageBlockType,
          edgesToCreate
        );

        // DB에 위치 정보 저장
        if (newPositions.length > 0) {
          const positionResult = await batchUpdateBlockPositions({
            positions: newPositions.map((pos) => ({
              blockId: pos.block_id,
              contextBlockId: pos.context_block_id,
              x: pos.x_position,
              y: pos.y_position,
            })),
          });

          if (!positionResult.success) {
            console.error("❌ [DB] 위치 저장 실패:", positionResult.error);
          } else {
            devLog("✅ [DB] 위치 저장 완료:", {
              positionsCount: positionResult.data?.length || 0,
            });

            // 새로운 위치와 기존 위치를 구분하여 처리
            const existingPositions: Array<{
              blockId: string;
              contextId: string;
              position: { x: number; y: number };
            }> = [];

            const newPositions: DbBlockPosition[] = [];

            positionResult.data.forEach((pos) => {
              // 기존에 해당 위치가 있는지 확인
              const existingPosition = canvasState.dbBlockPositions.find(
                (existing) =>
                  existing.block_id === pos.block_id &&
                  existing.context_block_id === pos.context_block_id
              );

              if (existingPosition) {
                // 기존 위치 업데이트
                existingPositions.push({
                  blockId: pos.block_id,
                  contextId: pos.context_block_id,
                  position: { x: pos.x_position, y: pos.y_position },
                });
              } else {
                // 새로운 위치 추가
                newPositions.push({
                  id: `temp-position-${Date.now()}-${Math.random()}`, // 임시 ID
                  block_id: pos.block_id,
                  context_block_id: pos.context_block_id,
                  x_position: pos.x_position,
                  y_position: pos.y_position,
                  created_at: new Date(),
                  updated_at: new Date(),
                });
              }
            });

            // 새로운 위치들을 상태에 추가
            newPositions.forEach(canvasState.addPosition);

            // 기존 위치들을 업데이트
            if (existingPositions.length > 0) {
              canvasState.batchUpdatePositions(existingPositions);
            }

            console.log("🔍 [POSITION DEBUG] 위치 업데이트 완료:", {
              newPositionsCount: newPositions.length,
              existingPositionsCount: existingPositions.length,
            });
          }
        }
      } catch (error) {
        console.error("Failed to insert block:", error);

        // 🔄 ROLLBACK: 실패 시 임시 엣지들 제거
        optimisticEdges.forEach((edge: DbEdge) => {
          canvasState.deleteEdge(edge.id);
        });
      }
    },
    [
      canvasState.selectedPageBlock,
      uiState.closeAllPanels,
      calculateNewBlockPositions,
    ]
  );

  // ===== BLOCK EVENT HANDLERS =====

  const handleBlockUpdate = useCallback(
    async (blockId: string, updates: Partial<DbBlock>) => {
      try {
        // 1. 먼저 로컬 상태를 즉시 업데이트 (UI 반응성 향상)
        canvasState.updateBlock(blockId, updates);

        // 2. 서버 액션을 통해 DB 업데이트
        // updates 객체를 server action 스키마에 맞게 변환

        const updateInput = {
          id: blockId,
          ...updates,
        };

        const result = await updateBlock(updateInput);

        if (!result.success) {
          // DB 업데이트 실패 시 로컬 상태 롤백
          throw new Error(result.error || "Failed to update block in database");
        }

        return { success: true, data: result.data };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update block";
        canvasState.setError(errorMessage);
        console.error("Failed to update block:", errorMessage);

        // 에러 발생 시 사용자에게 알림 (추후 toast 등으로 대체 가능)
        alert(`Failed to save changes: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }
    },
    [canvasState]
  );

  const handleBlockDelete = useCallback(
    async (blockId: string) => {
      try {
        canvasState.deleteBlock(blockId);
        uiState.closeEditorPanel();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete block";
        canvasState.setError(errorMessage);
        console.error("Failed to delete block:", errorMessage);
      }
    },
    [canvasState, uiState]
  );

  // ===== EDGE EVENT HANDLERS =====

  const handleEdgeUpdate = useCallback(
    async (edgeId: string, updates: any) => {
      try {
        canvasState.updateEdge(edgeId, updates);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update edge";
        canvasState.setError(errorMessage);
        console.error("Failed to update edge:", errorMessage);
      }
    },
    [canvasState]
  );

  const handleEdgeDelete = useCallback(
    async (edgeId: string) => {
      try {
        canvasState.deleteEdge(edgeId);
        uiState.closeEditorPanel();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete edge";
        canvasState.setError(errorMessage);
        console.error("Failed to delete edge:", errorMessage);
      }
    },
    [canvasState, uiState]
  );

  // ===== SELECTION EVENT HANDLERS =====
  const handleBlockSelect = useCallback(
    (blockId: string) => {
      reactFlowCanvasState.selectBlock(blockId);
    },
    [reactFlowCanvasState, uiState]
  );

  const handleEdgeSelect = useCallback(
    (edgeId: string) => {
      reactFlowCanvasState.selectEdge(edgeId);
      uiState.setShowEditorPanelState(true);
    },
    [reactFlowCanvasState, uiState]
  );

  const handleClearSelection = useCallback(() => {
    reactFlowCanvasState.clearSelection();
    uiState.closeEditorPanel();
  }, [reactFlowCanvasState, uiState]);

  // ===== REACT FLOW EVENT HANDLERS =====

  const onBlockClick = useCallback(
    (event: React.MouseEvent, node: ReactFlowNode) => {
      handleBlockSelect(node.id);
    },
    [handleBlockSelect]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: ReactFlowEdge) => {
      console.log("Edge clicked:", edge);
      handleEdgeSelect(edge.id);
    },
    [handleEdgeSelect]
  );

  const onPaneClick = useCallback(() => {
    handleClearSelection();
    uiState.setViewportAction("center");
  }, [handleClearSelection]);

  const onConnect = useCallback((connection: Connection) => {
    console.log("Connection created:", connection);
    // TODO: Implement connection creation logic
  }, []);

  const onBlockDragStart = useCallback(() => {
    reactFlowCanvasState.setDragging(true);
  }, [reactFlowCanvasState]);

  const onBlockDragStop = useCallback(
    async (event: React.MouseEvent, node: ReactFlowNode) => {
      reactFlowCanvasState.setDragging(false);

      const currentPageId = canvasState.selectedPageBlock?.id;
      if (!currentPageId) {
        console.warn("⚠️ [DRAG] No active page, skipping position update");
        return;
      }

      console.log("🔍 [DRAG DEBUG] 드래그 시작:", {
        nodeId: node.id,
        nodePosition: node.position,
        currentPageId,
        currentDbBlockPositions: canvasState.dbBlockPositions,
      });

      // 🚀 OPTIMISTIC UPDATE: 즉시 상태 업데이트
      const originalPositions = canvasState.dbBlockPositions.map((pos) => ({
        ...pos,
      })); // 백업용

      const newPosition = {
        block_id: node.id,
        context_block_id: currentPageId,
        x_position: Math.round(node.position.x),
        y_position: Math.round(node.position.y),
      };

      console.log("🔍 [DRAG DEBUG] 새로운 위치:", newPosition);

      // 즉시 상태 업데이트 (Optimistic)
      const updatedPositions = canvasState.dbBlockPositions.map((pos) => {
        if (
          pos.block_id === node.id &&
          pos.context_block_id === currentPageId
        ) {
          return {
            ...pos,
            x_position: newPosition.x_position,
            y_position: newPosition.y_position,
          };
        }
        return pos;
      });

      canvasState.updatePosition(node.id, currentPageId, {
        x: newPosition.x_position,
        y: newPosition.y_position,
      });

      console.log("⚡ [OPTIMISTIC] 즉시 위치 업데이트 완료:", newPosition);
      console.log(
        "🔍 [DRAG DEBUG] 업데이트 후 dbBlockPositions:",
        canvasState.dbBlockPositions
      );

      try {
        // �� DB 업데이트 시도
        const result = await updateContextBlockPosition(
          node.id,
          currentPageId,
          node.position.x,
          node.position.y
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        console.log("✅ [DB] 드래그 위치 저장 완료:", result.data);

        // 성공 시 추가 정리 작업 (필요시)
        // 이미 Optimistic으로 업데이트했으므로 추가 작업 없음
      } catch (error) {
        console.error("❌ [DB] 드래그 위치 업데이트 실패:", error);

        // 🔄 ROLLBACK: 실패 시 원래 위치로 되돌림
        console.log("🔄 [ROLLBACK] 원래 위치로 되돌림");
        canvasState.updatePosition(node.id, currentPageId, {
          x: originalPositions[0]?.x_position ?? 0,
          y: originalPositions[0]?.y_position ?? 0,
        });

        // currentBlockPositions 업데이트
        canvasState.batchUpdatePositions(
          updatedPositions.map((pos) => ({
            blockId: pos.block_id,
            contextId: pos.context_block_id,
            position: { x: pos.x_position, y: pos.y_position },
          }))
        );
      }
    },
    [canvasState, reactFlowCanvasState]
  );

  const onBlockDoubleClick = useCallback(
    (event: React.MouseEvent, node: ReactFlowNode) => {
      console.log("Block double clicked:", node);
      handleBlockSelect(node.id);
    },
    [handleBlockSelect]
  );

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: ReactFlowEdge) => {
      console.log("Edit edge:", edge);
      handleEdgeSelect(edge.id);
    },
    [handleEdgeSelect]
  );

  const onBlocksDelete = useCallback(
    (deletedBlocks: ReactFlowNode[]) => {
      console.log("Blocks deleted:", deletedBlocks);
      deletedBlocks.forEach((block) => {
        canvasState.deleteBlock(block.id);
      });
      uiState.closeEditorPanel();
    },
    [canvasState, uiState]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: ReactFlowEdge[]) => {
      console.log("Edges deleted:", deletedEdges);
      deletedEdges.forEach((edge) => {
        canvasState.deleteEdge(edge.id);
      });
      uiState.closeEditorPanel();
    },
    [canvasState, uiState]
  );

  const onConnectStart = useCallback(() => {
    console.log("Connection start");
    reactFlowCanvasState.setConnecting(true);
  }, [reactFlowCanvasState]);

  const onConnectEnd = useCallback(() => {
    console.log("Connection end");
    reactFlowCanvasState.setConnecting(false);
  }, [reactFlowCanvasState]);

  // ===== CANVAS INTERACTION HANDLERS =====

  const handleZoomIn = useCallback(() => {
    reactFlowCanvasState.setZoom(Math.min(reactFlowCanvasState.zoom * 1.2, 2));
  }, [reactFlowCanvasState]);

  const handleZoomOut = useCallback(() => {
    reactFlowCanvasState.setZoom(
      Math.max(reactFlowCanvasState.zoom / 1.2, 0.1)
    );
  }, [reactFlowCanvasState]);

  const handleZoomReset = useCallback(() => {
    reactFlowCanvasState.setZoom(1);
    reactFlowCanvasState.setPan({ x: 0, y: 0 });
  }, [reactFlowCanvasState]);

  // ===== UTILITY EVENT HANDLERS =====

  const handleSave = useCallback(() => {
    console.log("Save canvas");
  }, []);

  const handleExport = useCallback(() => {
    console.log("Export canvas");
  }, []);

  const handleImport = useCallback(() => {
    console.log("Import canvas");
  }, []);

  const handleUndo = useCallback(() => {
    console.log("Undo");
  }, []);

  const handleRedo = useCallback(() => {
    console.log("Redo");
  }, []);

  // ===== UI EVENT HANDLERS =====

  const handleToggleGrid = useCallback(() => {
    uiState.setShowGridState(!uiState.showGrid);
  }, [uiState]);

  const handleToggleLayers = useCallback(() => {
    uiState.setShowLayersState(!uiState.showLayers);
  }, [uiState]);

  const handleToggleBlockExplorer = useCallback(() => {
    uiState.setShowBlockExplorerState(!uiState.showBlockExplorer);
  }, [uiState]);

  const handleToggleEditorPanel = useCallback(() => {
    uiState.setShowEditorPanelState(!uiState.showEditorPanel);
  }, [uiState]);

  return {
    canvasState,
    reactFlowCanvasState,
    uiState,
    eventHandlers: {
      // React Flow Event Handlers
      onBlockClick,
      onEdgeClick,
      onPaneClick,
      onConnect,
      onBlockDragStart,
      onBlockDragStop,
      onBlockDoubleClick,
      onEdgeDoubleClick,
      onBlocksDelete,
      onEdgesDelete,
      // onViewportChange,
      onConnectStart,
      onConnectEnd,

      // Block handlers
      handlePageBlockCreate,
      handleBlockUpdate,
      handleBlockDelete,

      // Edge handlers
      handleEdgeUpdate,
      handleEdgeDelete,

      // Selection handlers
      handlePageBlockSelect,
      handleBlockSelect,
      handleEdgeInsert,
      handleEdgeSelect,
      handleClearSelection,

      // Display handlers
      updateDisplayBlocksForPage,
      // fitViewToBlock,

      // Canvas interaction handlers
      handleZoomIn,
      handleZoomOut,
      handleZoomReset,

      // Utility handlers
      handleSave,
      handleExport,
      handleImport,
      handleUndo,
      handleRedo,

      // UI handlers
      handleToggleGrid,
      handleToggleLayers,
      handleToggleBlockExplorer,
      handleToggleEditorPanel,
    },
  };
}
