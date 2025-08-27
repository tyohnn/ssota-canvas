"use client";

import { useCallback } from "react";
import type { Block } from "@/db/schema";
import { generateUUID } from "@/utils/uuid";
import { getDefaultBlockTemplate } from "@/domains/canvas/policy/block-addition-policy";
import { createBlock as createBlockAction } from "@/domains/canvas/actions/block.action";
import { deleteBlock as deleteBlockAction } from "@/domains/canvas/actions/block.action";
import { restoreBlock as restoreBlockAction } from "@/domains/canvas/actions/block.action";
import { createBlockPosition as createBlockPositionAction } from "@/domains/canvas/actions/block-position.action";
import { deleteBlockPosition as deleteBlockPositionAction } from "@/domains/canvas/actions/block-position.action";
import { restoreBlockPosition as restoreBlockPositionAction } from "@/domains/canvas/actions/block-position.action";
import { batchUpdateBlockPositions } from "@/domains/canvas/actions/block-position.action";
import { isFailure } from "@/lib/action-result";
import { updateBlock as updateBlockAction } from "@/domains/canvas/actions/block.action";
import { useCanvasSelection } from "@/domains/canvas/contexts/CanvasSelectionContext";
import {
  generateComponentDefinitionTemplate,
  generateComponentInstanceTemplate,
  canPromoteBlockToComponent,
  canLinkBlocksToComponent,
  canCreateComponentInstance,
  allowsStyleOverrides,
  validateComponentStyleOverride,
  generateComponentInstanceData,
} from "@/domains/canvas/policy/component-policy";
import {
  isComponentInstance,
  isComponentDefinition,
  type ComponentDefinition,
  type ComponentInstance,
  type NodeUI,
} from "@/domains/canvas/types/component";

export type CreateStatus = { ok: boolean; error?: string };

export function useCanvasCommands({
  workspaceId,
  blocksById,
  upsertBlock,
  updateBlock,
  removeBlock,
  rekeyBlock,
  setPagePositions,
  selectPage,
  updateContextPositions,
  replaceBlockIdInContext,
  setNodeSelection,
  positionsByPage,
  removePositionForBlockInContext,
}: {
  workspaceId: string;
  blocksById: Record<string, Block>;
  upsertBlock: (block: Block) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  rekeyBlock: (fromId: string, toId: string, updates?: Partial<Block>) => void;
  setPagePositions: (pageId: string, positions: any[]) => void;
  selectPage: (id: string | null) => void;
  updateContextPositions: (
    contextId: string,
    updates: { id: string; x: number; y: number }[]
  ) => void;
  replaceBlockIdInContext: (
    contextId: string,
    fromId: string,
    toId: string
  ) => void;
  setNodeSelection: (ids: string[]) => void;
  positionsByPage: Record<string, any>;
  removePositionForBlockInContext: (contextId: string, blockId: string) => void;
}) {
  const sel = useCanvasSelection();
  // positionsByPage와 removePositionForBlockInContext는 매개변수로 받도록 수정

  // Create new page (optimistic → reconcile)
  const createNewPage = useCallback(async (): Promise<CreateStatus> => {
    const optimisticId = generateUUID();
    const now = new Date();
    const newPage: Block = {
      id: optimisticId,
      block_type: "basic_text" as any,
      slug: `new-page-${Date.now()}`,
      name: "새 페이지",
      metadata: {},
      object: "page" as any,
      icon_name: "file",
      order: 1000,
      parent_block_id: null,
      workspace_id: workspaceId as any,
      created_at: now as any,
      updated_at: now as any,
      deleted_at: null,
    };
    upsertBlock(newPage);
    selectPage(optimisticId);

    const res = await createBlockAction({
      blockType: newPage.block_type as any,
      slug: newPage.slug,
      name: newPage.name,
      metadata: newPage.metadata as any,
      object: newPage.object as any,
      parentBlockId: newPage.parent_block_id ?? undefined,
      workspaceId,
    });

    if (isFailure(res)) {
      return { ok: false, error: String(res.error) };
    }

    const dbBlock = res.data;
    // 블록 ID 재조정 (키와 값 모두 교체)
    rekeyBlock(
      optimisticId,
      dbBlock.id as string,
      {
        created_at: new Date(dbBlock.created_at),
        updated_at: new Date(dbBlock.updated_at),
        slug: dbBlock.slug,
        name: dbBlock.name,
        metadata: dbBlock.metadata,
        order: dbBlock.order,
        parent_block_id: dbBlock.parent_block_id,
      } as Partial<Block>
    );
    selectPage(dbBlock.id as string);
    return { ok: true };
  }, [workspaceId, upsertBlock, selectPage, rekeyBlock]);

  // Create block within a page at position
  const createBlockInPage = useCallback(
    async (
      pageId: string,
      kind: string,
      at?: { x: number; y: number }
    ): Promise<CreateStatus> => {
      const tmpl = getDefaultBlockTemplate(kind as any);
      const optimisticId = generateUUID();
      const blk: Block = {
        id: optimisticId,
        block_type: tmpl.block_type as any,
        slug: `${tmpl.name.toLowerCase().replace(/\s+/g, "-")}-${optimisticId.substring(0, 8)}`,
        name: tmpl.name,
        metadata: tmpl.metadata as any,
        object: "block" as any,
        parent_block_id: pageId as any,
        icon_name: "file",
        order: 1000,
        workspace_id: workspaceId as any,
        created_at: new Date() as any,
        updated_at: new Date() as any,
        deleted_at: null,
      };
      upsertBlock(blk);

      // 캐시가 비어있는 페이지에 최초 위치 업데이트가 먹히도록 시드
      if (!positionsByPage[pageId]) {
        setPagePositions(pageId, []);
      }

      updateContextPositions(pageId, [
        {
          id: optimisticId,
          x: Math.round(at?.x ?? 100),
          y: Math.round(at?.y ?? 100),
        },
      ]);
      setNodeSelection([optimisticId]);

      const created = await createBlockAction({
        blockType: blk.block_type as any,
        slug: blk.slug,
        name: blk.name,
        metadata: blk.metadata as any,
        object: blk.object as any,
        parentBlockId: pageId,
        workspaceId,
      });
      if (isFailure(created)) {
        return { ok: false, error: String(created.error) };
      }
      const dbBlock = created.data;

      // 3단계: 재조정 (DB ID로 업데이트)
      // 블록 ID 재조정 (키와 값 모두 교체)
      rekeyBlock(
        optimisticId,
        dbBlock.id as string,
        {
          created_at: new Date(dbBlock.created_at),
          updated_at: new Date(dbBlock.updated_at),
          slug: dbBlock.slug || blk.slug,
          name: dbBlock.name || blk.name,
          metadata: dbBlock.metadata || blk.metadata,
          order: dbBlock.order ?? blk.order,
          parent_block_id: dbBlock.parent_block_id ?? blk.parent_block_id,
        } as Partial<Block>
      );

      // 위치 캐시에서 블록 ID 교체
      replaceBlockIdInContext(pageId, optimisticId, dbBlock.id as string);

      // persist position with actual id
      await createBlockPositionAction({
        blockId: dbBlock.id as string,
        contextBlockId: pageId,
        x: Math.round(at?.x ?? 100),
        y: Math.round(at?.y ?? 100),
      });
      setNodeSelection([dbBlock.id as string]);
      return { ok: true };
    },
    [
      workspaceId,
      upsertBlock,
      updateContextPositions,
      setNodeSelection,
      updateBlock,
      rekeyBlock,
      replaceBlockIdInContext,
      setPagePositions,
      positionsByPage,
    ]
  );

  // Create component from block
  const createComponentFromBlock = useCallback(
    async (sourceBlock: Block): Promise<CreateStatus> => {
      const optimisticId = generateUUID();
      const name = sourceBlock.name || "Component";
      const slugBase = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");
      const slug = `${slugBase}-component-${optimisticId.substring(0, 8)}`;
      const md: any = JSON.parse(JSON.stringify(sourceBlock.metadata || {}));
      md.role = md.role || "definition";
      const component: Block = {
        id: optimisticId,
        block_type: sourceBlock.block_type,
        slug,
        name,
        metadata: md,
        object: "component" as any,
        parent_block_id: null,
        icon_name: sourceBlock.icon_name || "file",
        order: 1000,
        workspace_id: workspaceId as any,
        created_at: new Date() as any,
        updated_at: new Date() as any,
      } as Block;
      upsertBlock(component);

      const res = await createBlockAction({
        blockType: component.block_type as any,
        slug: component.slug,
        name: component.name,
        metadata: component.metadata as any,
        object: component.object as any,
        parentBlockId: null,
        workspaceId,
      });
      if (isFailure(res)) {
        return { ok: false, error: String(res.error) };
      }
      const dbBlock = res.data;
      // 블록 ID 재조정 (키와 값 모두 교체)
      rekeyBlock(
        optimisticId,
        dbBlock.id as string,
        {
          created_at: new Date(dbBlock.created_at),
          updated_at: new Date(dbBlock.updated_at),
          slug: dbBlock.slug || component.slug,
          name: dbBlock.name || component.name,
          metadata: dbBlock.metadata || component.metadata,
          parent_block_id: dbBlock.parent_block_id ?? null,
          order: dbBlock.order ?? component.order,
        } as Partial<Block>
      );
      // 컴포넌트 컨텍스트(자기 자신)에 기본 위치 생성 (SSOT + DB 동기화)
      try {
        const componentId = dbBlock.id as string;
        // seed empty context to allow updates
        setPagePositions(componentId, []);
        // optimistic position at default location
        updateContextPositions(componentId, [
          { id: componentId, x: 100, y: 100 },
        ]);
        // persist position with self as context
        await createBlockPositionAction({
          blockId: componentId,
          contextBlockId: componentId,
          x: 100,
          y: 100,
        });
      } catch (e) {
        console.error("Failed to create component self-position:", e);
        // continue; non-fatal for component creation
      }
      // 컴포넌트 모드로 전환 및 선택 업데이트
      try {
        sel.selectComponent(dbBlock.id as string);
      } catch {}
      setNodeSelection([dbBlock.id as string]);
      return { ok: true };
    },
    [
      workspaceId,
      upsertBlock,
      updateBlock,
      setNodeSelection,
      rekeyBlock,
      setPagePositions,
      updateContextPositions,
      sel.selectComponent,
    ]
  );

  // Update block (optimistic → reconcile)
  const updateBlockCommand = useCallback(
    async (blockId: string, updates: Partial<Block>): Promise<CreateStatus> => {
      const block = Object.values(blocksById).find((b) => b.id === blockId);
      if (!block) {
        return { ok: false, error: "Block not found" };
      }

      // 롤백을 위한 원본 상태 저장
      // const originalBlock = { ...block };

      // // 1단계: Optimistic Update (즉시 UI 반영) - 테스트를 위해 주석 처리
      // updateBlock(blockId, {
      //   ...updates,
      //   updated_at: new Date(),
      // });

      // 2단계: DB 동기화 (백그라운드)
      try {
        // Filter updates to only include valid fields for the server action
        const serverUpdates: any = {};
        if (updates.name !== undefined) serverUpdates.name = updates.name;
        if (updates.slug !== undefined) serverUpdates.slug = updates.slug;
        if (updates.metadata !== undefined)
          serverUpdates.metadata = updates.metadata;
        if (updates.object !== undefined) serverUpdates.object = updates.object;
        if (updates.parent_block_id !== undefined)
          serverUpdates.parentBlockId = updates.parent_block_id;
        if (updates.order !== undefined) serverUpdates.order = updates.order;

        const result = await updateBlockAction({
          id: blockId,
          ...serverUpdates,
        });

        if (isFailure(result)) {
          console.error("Failed to update block:", result.error);
          // 실패 시 Optimistic Update 롤백 - 테스트를 위해 주석 처리
          // updateBlock(blockId, originalBlock);
          return { ok: false, error: String(result.error) };
        }
        return { ok: true };
      } catch (error) {
        console.error("Failed to update block in DB:", error);
        // 에러 시 Optimistic Update 롤백 - 테스트를 위해 주석 처리
        // updateBlock(blockId, originalBlock);
        return { ok: false, error: String(error) };
      }
    },
    [blocksById, updateBlock]
  );

  // Update node position (optimistic → reconcile)
  const updateNodePosition = useCallback(
    async (
      nodeId: string,
      position: { x: number; y: number }
    ): Promise<CreateStatus> => {
      const contextId = sel.pageId;
      if (!contextId) {
        return { ok: false, error: "No page selected" };
      }

      // 좌표 검증 및 정규화
      const normalizedX = Math.round(position.x);
      const normalizedY = Math.round(position.y);

      // 유효하지 않은 좌표 필터링
      if (!Number.isFinite(normalizedX) || !Number.isFinite(normalizedY)) {
        console.warn("Invalid position coordinates:", position);
        return { ok: false, error: "Invalid position coordinates" };
      }

      // 너무 큰 값 제한 (예: 10000px 이상)
      const clampedX = Math.max(-10000, Math.min(10000, normalizedX));
      const clampedY = Math.max(-10000, Math.min(10000, normalizedY));

      // 1단계: Optimistic Update (즉시 UI 반영) - 테스트를 위해 주석 처리
      // updateContextPositions(contextId, [
      //   { id: nodeId, x: clampedX, y: clampedY },
      // ]);

      // 2단계: DB 동기화 (백그라운드)
      try {
        const result = await batchUpdateBlockPositions({
          contextBlockId: contextId,
          positions: [{ blockId: nodeId, x: clampedX, y: clampedY }],
        });

        if (isFailure(result)) {
          console.error("Failed to update node position:", result.error);
          // 실패 시 Optimistic Update 롤백 (위치를 이전 상태로 되돌리기 어려우므로 로그만 남김)
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to update node position in DB:", error);
        return { ok: false, error: String(error) };
      }
    },
    [sel.pageId, updateContextPositions]
  );

  // Batch update node positions (for multiple nodes)
  const updateNodePositions = useCallback(
    async (
      positions: { id: string; x: number; y: number }[]
    ): Promise<CreateStatus> => {
      const contextId = sel.pageId;
      if (!contextId) {
        return { ok: false, error: "No page selected" };
      }

      if (positions.length === 0) {
        return { ok: true };
      }

      // 좌표 검증 및 정규화
      const validPositions = positions
        .map((pos) => ({
          id: pos.id,
          x: Math.round(pos.x),
          y: Math.round(pos.y),
        }))
        .filter(
          (pos) =>
            Number.isFinite(pos.x) &&
            Number.isFinite(pos.y) &&
            pos.x >= -10000 &&
            pos.x <= 10000 &&
            pos.y >= -10000 &&
            pos.y <= 10000
        );

      if (validPositions.length === 0) {
        console.warn("No valid positions to update");
        return { ok: false, error: "No valid positions to update" };
      }

      // 1단계: Optimistic Update (즉시 UI 반영)
      updateContextPositions(contextId, validPositions);

      // 2단계: DB 동기화 (백그라운드)
      try {
        const result = await batchUpdateBlockPositions({
          contextBlockId: contextId,
          positions: validPositions.map((pos) => ({
            blockId: pos.id,
            x: pos.x,
            y: pos.y,
          })),
        });

        if (isFailure(result)) {
          console.error("Failed to update node positions:", result.error);
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to update node positions in DB:", error);
        return { ok: false, error: String(error) };
      }
    },
    [sel.pageId, updateContextPositions]
  );

  // Duplicate block (optimistic → reconcile)
  const duplicateBlock = useCallback(
    async (
      blockId: string,
      offset: { x: number; y: number } = { x: 100, y: 100 }
    ): Promise<CreateStatus> => {
      const contextId = sel.pageId;
      if (!contextId) {
        return { ok: false, error: "No page selected" };
      }

      const sourceBlock = blocksById[blockId];
      if (!sourceBlock) {
        return { ok: false, error: "Source block not found" };
      }

      const optimisticId = generateUUID();
      const now = new Date();

      // 1단계: Optimistic Update (즉시 UI 반영)
      const duplicatedBlock: Block = {
        ...sourceBlock,
        id: optimisticId,
        name: `${sourceBlock.name} Copy`,
        slug: `${sourceBlock.slug}-copy-${Date.now()}`,
        created_at: now as any,
        updated_at: now as any,
      };

      upsertBlock(duplicatedBlock);

      // 위치 정보도 복제 (오프셋 적용)
      const sourcePositions = positionsByPage[contextId]?.positions || [];
      const sourcePosition = sourcePositions.find(
        (p: any) => (p.block_id as string) === blockId
      );

      // 기본 위치 설정 (원본 위치가 없거나 오프셋 적용)
      const baseX = sourcePosition
        ? (sourcePosition.x_position as number)
        : 100;
      const baseY = sourcePosition
        ? (sourcePosition.y_position as number)
        : 100;
      const newPosition = {
        id: optimisticId,
        x: baseX + offset.x,
        y: baseY + offset.y,
      };
      updateContextPositions(contextId, [newPosition]);

      // 2단계: DB 동기화 (백그라운드)
      try {
        // 블록 생성
        const blockResult = await createBlockAction({
          blockType: duplicatedBlock.block_type as any,
          slug: duplicatedBlock.slug,
          name: duplicatedBlock.name,
          metadata: duplicatedBlock.metadata as any,
          object: duplicatedBlock.object as any,
          parentBlockId: duplicatedBlock.parent_block_id ?? undefined,
          workspaceId,
        });

        if (isFailure(blockResult)) {
          console.error(
            "Failed to create duplicated block:",
            blockResult.error
          );
          return { ok: false, error: String(blockResult.error) };
        }

        const dbBlock = blockResult.data;

        // 위치 정보 생성 (항상 생성)
        const positionResult = await createBlockPositionAction({
          blockId: dbBlock.id as string,
          contextBlockId: contextId,
          x: newPosition.x,
          y: newPosition.y,
        });

        if (isFailure(positionResult)) {
          console.error(
            "Failed to create duplicated block position:",
            positionResult.error
          );
          // 블록은 생성되었지만 위치 생성 실패 - 블록은 유지하고 위치만 롤백
          return { ok: false, error: String(positionResult.error) };
        }

        // 3단계: 재조정 (DB ID로 업데이트)
        // 블록 ID 재조정 (키와 값 모두 교체)
        rekeyBlock(
          optimisticId,
          dbBlock.id as string,
          {
            created_at: new Date(dbBlock.created_at),
            updated_at: new Date(dbBlock.updated_at),
            slug: dbBlock.slug,
            name: dbBlock.name,
            metadata: dbBlock.metadata,
            order: dbBlock.order,
            parent_block_id: dbBlock.parent_block_id,
          } as Partial<Block>
        );

        // 위치 캐시에서 블록 ID 교체
        replaceBlockIdInContext(contextId, optimisticId, dbBlock.id as string);

        // 선택 상태 업데이트
        setNodeSelection([dbBlock.id as string]);

        return { ok: true };
      } catch (error) {
        console.error("Failed to duplicate block in DB:", error);
        return { ok: false, error: String(error) };
      }
    },
    [
      sel.pageId,
      blocksById,
      upsertBlock,
      updateContextPositions,
      rekeyBlock,
      replaceBlockIdInContext,
      setNodeSelection,
      positionsByPage,
    ]
  );

  // Delete block (optimistic → reconcile)
  const deleteBlock = useCallback(
    async (blockId: string): Promise<CreateStatus> => {
      const contextId = sel.pageId;
      if (!contextId) {
        return { ok: false, error: "No page selected" };
      }

      const block = blocksById[blockId];
      if (!block) {
        return { ok: false, error: "Block not found" };
      }

      // 1단계: Optimistic Update (즉시 UI 반영)
      removeBlock(blockId);

      // 위치 정보도 제거
      removePositionForBlockInContext(contextId, blockId);

      // 2단계: DB 동기화 (백그라운드)
      try {
        const result = await deleteBlockAction({ id: blockId });
        if (isFailure(result)) {
          console.error("Failed to delete block:", result.error);
          // 롤백 로직 필요
          return { ok: false, error: String(result.error) };
        }

        // 위치 정보 제거
        const positionResult = await deleteBlockPositionAction(
          blockId,
          contextId
        );

        if (isFailure(positionResult)) {
          console.error(
            "Failed to delete block position:",
            positionResult.error
          );
          // 블록은 삭제되었지만 위치 삭제 실패 - 블록은 유지하고 위치만 롤백
          return { ok: false, error: String(positionResult.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to delete block in DB:", error);
        return { ok: false, error: String(error) };
      }
    },
    [
      sel.pageId,
      blocksById,
      removeBlock,
      positionsByPage,
      removePositionForBlockInContext,
    ]
  );

  // Restore block (optimistic → reconcile)
  const restoreBlock = useCallback(
    async (blockId: string): Promise<CreateStatus> => {
      const contextId = sel.pageId;
      if (!contextId) {
        return { ok: false, error: "No page selected" };
      }

      const block = blocksById[blockId];
      if (!block) {
        return { ok: false, error: "Block not found" };
      }

      // 1단계: Optimistic Update (즉시 UI 반영)
      updateBlock(blockId, {
        deleted_at: null,
        updated_at: new Date(),
      });

      // 2단계: DB 동기화 (백그라운드)
      try {
        const result = await restoreBlockAction({ id: blockId });
        if (isFailure(result)) {
          console.error("Failed to restore block:", result.error);
          return { ok: false, error: String(result.error) };
        }

        // 위치 정보도 복구
        const positionResult = await restoreBlockPositionAction(
          blockId,
          contextId
        );
        if (isFailure(positionResult)) {
          console.error(
            "Failed to restore block position:",
            positionResult.error
          );
          // 블록은 복구되었지만 위치 복구 실패 - 블록은 유지
          return { ok: false, error: String(positionResult.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to restore block in DB:", error);
        return { ok: false, error: String(error) };
      }
    },
    [sel.pageId, blocksById, updateBlock]
  );

  // Delete component (optimistic → reconcile)
  const deleteComponent = useCallback(
    async (componentId: string): Promise<CreateStatus> => {
      const component = blocksById[componentId];
      if (!component) {
        return { ok: false, error: "Component not found" };
      }

      // 1단계: Optimistic Update (즉시 UI 반영)
      // SSOT에서 블록 완전히 제거
      removeBlock(componentId);

      // 컴포넌트의 자기 참조 위치도 제거
      removePositionForBlockInContext(componentId, componentId);

      // 2단계: DB 동기화 (백그라운드)
      try {
        const result = await deleteBlockAction({ id: componentId });
        if (isFailure(result)) {
          console.error("Failed to delete component:", result.error);
          // 롤백 로직: 블록 복구
          upsertBlock(component);
          return { ok: false, error: String(result.error) };
        }

        // 위치 정보도 제거
        const positionResult = await deleteBlockPositionAction(
          componentId,
          componentId
        );
        if (isFailure(positionResult)) {
          console.error(
            "Failed to delete component position:",
            positionResult.error
          );
          // 컴포넌트는 삭제되었지만 위치 삭제 실패 - 컴포넌트는 유지
          return { ok: false, error: String(positionResult.error) };
        }

        // 3단계: 페이지 모드로 복귀
        sel.selectComponent(null);

        return { ok: true };
      } catch (error) {
        console.error("Failed to delete component in DB:", error);
        // 롤백 로직: 블록 복구
        upsertBlock(component);
        return { ok: false, error: String(error) };
      }
    },
    [
      blocksById,
      removeBlock,
      upsertBlock,
      removePositionForBlockInContext,
      sel.selectComponent,
    ]
  );

  // Promote block to component definition
  const promoteBlockToComponentDefinition = useCallback(
    async (
      blockId: string,
      componentKey?: string,
      componentName?: string
    ): Promise<CreateStatus> => {
      const sourceBlock = blocksById[blockId];
      if (!sourceBlock) {
        return { ok: false, error: "Source block not found" };
      }

      if (!canPromoteBlockToComponent(sourceBlock)) {
        return { ok: false, error: "Block cannot be promoted to component" };
      }

      try {
        // 1. Generate component definition template
        const definitionTemplate = generateComponentDefinitionTemplate(
          sourceBlock,
          componentKey,
          componentName
        );

        const optimisticDefinitionId = generateUUID();
        // Clean slug generation - remove special characters and normalize
        const baseSlug = definitionTemplate.name
          .toLowerCase()
          .replace(/[^\w가-힣-]/g, "-") // 특수문자를 하이픈으로 변경
          .replace(/-+/g, "-") // 연속된 하이픈을 하나로
          .replace(/^-|-$/g, "") // 앞뒤 하이픈 제거
          .replace(/\s+/g, "-"); // 공백을 하이픈으로

        // Add unique identifier to prevent slug conflicts
        const uniqueId = optimisticDefinitionId.substring(0, 8);
        const cleanSlug = `${baseSlug}-${uniqueId}`;

        const newDefinition: Block = {
          id: optimisticDefinitionId,
          workspace_id: workspaceId,
          object: "component",
          block_type: definitionTemplate.block_type,
          name: definitionTemplate.name,
          slug: cleanSlug,
          icon_name: sourceBlock.icon_name || "component",
          metadata: definitionTemplate.metadata,
          order: 0,
          parent_block_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as Block;

        // 2. Convert original block to instance
        const instanceTemplate = generateComponentInstanceTemplate(
          newDefinition as ComponentDefinition,
          sourceBlock.name
        );

        // 인스턴스는 레이아웃 속성만 보존하고 나머지는 정의의 스타일을 상속하도록 함
        const { node_ui, ...sourceMetadataWithoutNodeUI } =
          sourceBlock.metadata as any;

        // 레이아웃 관련 속성만 추출 (size, fontSize)
        const preservedLayout: any = {};
        if (node_ui) {
          // size 객체 보존
          if (node_ui.size) {
            preservedLayout.size = node_ui.size;
          }
          // fontSize 보존
          if (node_ui.fontSize !== undefined) {
            preservedLayout.fontSize = node_ui.fontSize;
          }
        }

        // 레이아웃 속성이 있으면 node_ui에 포함, 없으면 undefined
        const instanceNodeUI =
          Object.keys(preservedLayout).length > 0 ? preservedLayout : undefined;

        const updatedInstance: Partial<Block> = {
          object: "block", // 일반 블록으로 유지
          metadata: {
            ...sourceMetadataWithoutNodeUI,
            ...instanceTemplate.metadata,
            node_ui: instanceNodeUI,
          },
          updated_at: new Date(),
        };

        // 3. Optimistic updates
        upsertBlock(newDefinition);
        // SSOT에서도 레이아웃 속성만 보존
        updateBlock(blockId, {
          ...updatedInstance,
          metadata: {
            ...sourceMetadataWithoutNodeUI,
            ...instanceTemplate.metadata,
            node_ui: instanceNodeUI,
          },
        });

        // 4. Server synchronization
        const defResult = await createBlockAction({
          workspaceId: workspaceId,
          blockType: definitionTemplate.block_type,
          name: definitionTemplate.name,
          slug: cleanSlug,
          metadata: definitionTemplate.metadata,
          object: "component", // 컴포넌트 정의는 object: "component"
        });

        if (isFailure(defResult)) {
          return { ok: false, error: String(defResult.error) };
        }

        const dbDefinition = defResult.data;

        // Update instance to reference the real definition ID
        const finalInstanceMetadata = {
          ...instanceTemplate.metadata,
          component_id: dbDefinition.id,
        };

        const instanceResult = await updateBlockAction({
          id: blockId,
          object: "block", // 일반 블록으로 유지
          metadata: {
            ...sourceMetadataWithoutNodeUI,
            ...finalInstanceMetadata,
            node_ui: instanceNodeUI,
          },
        });

        if (isFailure(instanceResult)) {
          return { ok: false, error: String(instanceResult.error) };
        }

        // 5. Reconcile optimistic updates
        rekeyBlock(
          optimisticDefinitionId,
          dbDefinition.id as string,
          dbDefinition
        );

        updateBlock(blockId, {
          metadata: {
            ...sourceMetadataWithoutNodeUI,
            ...finalInstanceMetadata,
            node_ui: instanceNodeUI,
          },
        });

        // 6. 컴포넌트 컨텍스트(자기 자신)에 기본 위치 생성 (SSOT + DB 동기화)
        try {
          const componentId = dbDefinition.id as string;
          // seed empty context to allow updates
          setPagePositions(componentId, []);
          // optimistic position at default location
          updateContextPositions(componentId, [
            { id: componentId, x: 100, y: 100 },
          ]);

          // persist position with self as context
          await createBlockPositionAction({
            blockId: componentId,
            contextBlockId: componentId,
            x: 100,
            y: 100,
          });
        } catch (e) {
          console.error("Failed to create component self-position:", e);
          // continue; non-fatal for component creation
        }

        // 7. 컴포넌트 모드로 전환 및 선택 업데이트
        try {
          sel.selectComponent(dbDefinition.id as string);
        } catch {}
        setNodeSelection([dbDefinition.id as string]);

        return { ok: true };
      } catch (error) {
        console.error("Failed to promote block to component:", error);
        return { ok: false, error: String(error) };
      }
    },
    [
      workspaceId,
      blocksById,
      upsertBlock,
      updateBlock,
      rekeyBlock,
      setPagePositions,
      updateContextPositions,
      sel.selectComponent,
      setNodeSelection,
    ]
  );

  // Link blocks to existing component definition
  const linkBlocksToComponentDefinition = useCallback(
    async (blockIds: string[], definitionId: string): Promise<CreateStatus> => {
      const definition = blocksById[definitionId] as ComponentDefinition;
      if (!definition || !isComponentDefinition(definition)) {
        return { ok: false, error: "Component definition not found" };
      }

      const blocks = blockIds
        .map((id) => blocksById[id])
        .filter(Boolean) as Block[];
      if (blocks.length !== blockIds.length) {
        return { ok: false, error: "Some blocks not found" };
      }

      if (!canLinkBlocksToComponent(blocks, definition)) {
        return {
          ok: false,
          error: "Blocks cannot be linked to this component",
        };
      }

      try {
        // Generate instance templates for each block
        const updates: Array<{ id: string; updates: Partial<Block> }> =
          blocks.map((block: Block) => {
            const instanceTemplate = generateComponentInstanceTemplate(
              definition,
              block.name
            );
            // 인스턴스는 node_ui를 유지 (override 가능하도록)
            return {
              id: block.id as string,
              updates: {
                object: "block", // 일반 블록으로 유지
                metadata: {
                  ...(block.metadata as any),
                  ...instanceTemplate.metadata,
                },
                updated_at: new Date(),
              },
            };
          });

        // Optimistic updates
        updates.forEach(({ id, updates: blockUpdates }) => {
          updateBlock(id, blockUpdates);
        });

        // Server synchronization
        for (const { id, updates: blockUpdates } of updates) {
          const result = await updateBlockAction({
            id,
            object: "block", // 일반 블록으로 유지
            metadata: blockUpdates.metadata as any,
          });

          if (isFailure(result)) {
            return { ok: false, error: String(result.error) };
          }
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to link blocks to component:", error);
        return { ok: false, error: String(error) };
      }
    },
    [blocksById, updateBlock]
  );

  // Create component instance in page
  const createInstanceInPage = useCallback(
    async (
      pageId: string,
      definitionId: string,
      at?: { x: number; y: number },
      instanceName?: string
    ): Promise<CreateStatus> => {
      const pageBlock = blocksById[pageId] || null;
      const definition = blocksById[definitionId] as ComponentDefinition;

      if (!definition || !isComponentDefinition(definition)) {
        return { ok: false, error: "Component definition not found" };
      }

      if (!canCreateComponentInstance(definition, pageBlock)) {
        return { ok: false, error: "Cannot create instance in this page" };
      }

      try {
        // Generate instance template
        const instanceTemplate = generateComponentInstanceTemplate(
          definition,
          instanceName
        );

        const optimisticId = generateUUID();
        const newInstance: Block = {
          id: optimisticId,
          workspace_id: workspaceId,
          object: "block", // 일반 블록으로 유지
          block_type: instanceTemplate.block_type,
          name: instanceTemplate.name,
          slug: instanceTemplate.name.toLowerCase().replace(/\s+/g, "-"),
          icon_name: definition.icon_name || "component",
          metadata: instanceTemplate.metadata,
          order: 0,
          parent_block_id: null,
          created_at: new Date(),
          updated_at: new Date(),
        } as Block;

        // Optimistic updates
        upsertBlock(newInstance);
        updateContextPositions(pageId, [
          {
            id: optimisticId,
            x: at?.x ?? 100,
            y: at?.y ?? 100,
          },
        ]);

        // Server synchronization
        const blockResult = await createBlockAction({
          workspaceId: workspaceId,
          blockType: instanceTemplate.block_type,
          name: instanceTemplate.name,
          slug: instanceTemplate.name.toLowerCase().replace(/\s+/g, "-"),
          metadata: instanceTemplate.metadata,
        });

        if (isFailure(blockResult)) {
          return { ok: false, error: String(blockResult.error) };
        }

        const dbBlock = blockResult.data;

        // Create position
        const positionResult = await createBlockPositionAction({
          blockId: dbBlock.id as string,
          contextBlockId: pageId,
          x: at?.x ?? 100,
          y: at?.y ?? 100,
        });

        if (isFailure(positionResult)) {
          return { ok: false, error: String(positionResult.error) };
        }

        // Reconcile optimistic updates
        rekeyBlock(optimisticId, dbBlock.id as string, dbBlock);
        replaceBlockIdInContext(pageId, optimisticId, dbBlock.id as string);

        return { ok: true };
      } catch (error) {
        console.error("Failed to create component instance:", error);
        return { ok: false, error: String(error) };
      }
    },
    [
      workspaceId,
      blocksById,
      upsertBlock,
      updateContextPositions,
      rekeyBlock,
      replaceBlockIdInContext,
    ]
  );

  // Reset instance style (remove overrides)
  const resetInstanceStyle = useCallback(
    async (instanceId: string): Promise<CreateStatus> => {
      const instance = blocksById[instanceId];
      if (!instance || !isComponentInstance(instance)) {
        return { ok: false, error: "Component instance not found" };
      }

      try {
        const updatedMetadata = { ...instance.metadata };
        delete updatedMetadata.node_ui;

        const updates = {
          metadata: updatedMetadata,
          updated_at: new Date(),
        };

        // Optimistic update
        updateBlock(instanceId, updates);

        // Server synchronization
        const result = await updateBlockAction({
          id: instanceId,
          object: "block", // 일반 블록으로 유지
          ...updates,
        });

        if (isFailure(result)) {
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to reset instance style:", error);
        return { ok: false, error: String(error) };
      }
    },
    [blocksById, updateBlock]
  );

  // Reset specific field in component instance
  const resetInstanceField = useCallback(
    async (instanceId: string, fieldPath: string[]): Promise<CreateStatus> => {
      const instance = blocksById[instanceId];
      if (!instance || !isComponentInstance(instance)) {
        return { ok: false, error: "Component instance not found" };
      }

      try {
        // Get component definition
        const definition = blocksById[
          instance.metadata.component_id as string
        ] as ComponentDefinition;

        if (!definition) {
          return { ok: false, error: "Component definition not found" };
        }

        // Remove the specific field from instance's node_ui
        const updatedMetadata = { ...instance.metadata };
        if (updatedMetadata.node_ui) {
          const newNodeUI = { ...updatedMetadata.node_ui };

          // Extract the actual field path (remove 'node_ui' prefix if present)
          const actualFieldPath =
            fieldPath[0] === "node_ui" ? fieldPath.slice(1) : fieldPath;

          // Remove the field at the specified path
          if (actualFieldPath.length === 1 && actualFieldPath[0]) {
            delete (newNodeUI as any)[actualFieldPath[0]];
          } else if (
            actualFieldPath.length === 2 &&
            actualFieldPath[0] &&
            actualFieldPath[1]
          ) {
            if (
              (newNodeUI as any)[actualFieldPath[0]] &&
              typeof (newNodeUI as any)[actualFieldPath[0]] === "object"
            ) {
              delete ((newNodeUI as any)[actualFieldPath[0]] as any)[
                actualFieldPath[1]
              ];
            }
          }

          // If node_ui is empty, remove it entirely
          if (Object.keys(newNodeUI).length === 0) {
            delete updatedMetadata.node_ui;
          } else {
            updatedMetadata.node_ui = newNodeUI;
          }
        }

        const updates = {
          metadata: updatedMetadata,
          updated_at: new Date(),
        };

        // Optimistic update
        updateBlock(instanceId, updates);

        // Server synchronization
        const result = await updateBlockAction({
          id: instanceId,
          object: "block",
          ...updates,
        });

        if (isFailure(result)) {
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to reset instance field:", error);
        return { ok: false, error: String(error) };
      }
    },
    [blocksById, updateBlock]
  );

  // ✅ 시각적 상태 보존 헬퍼 함수
  const preserveCurrentVisualState = useCallback(
    (instance: ComponentInstance, definition: ComponentDefinition): any => {
      const preservedNodeUI: any = {};

      // ✅ 정의의 완전한 node_ui를 기본으로 사용
      const definitionNodeUI = definition.metadata.node_ui as any;
      if (definitionNodeUI) {
        Object.assign(preservedNodeUI, definitionNodeUI);
      }

      // ✅ 인스턴스의 node_ui 값으로 덮어쓰기
      const instanceNodeUI = instance.metadata.node_ui as any;
      if (instanceNodeUI) {
        Object.assign(preservedNodeUI, instanceNodeUI);
      }

      return preservedNodeUI;
    },
    []
  );

  // Detach component instance (convert to regular block)
  const detachComponentInstance = useCallback(
    async (instanceId: string): Promise<CreateStatus> => {
      const instance = blocksById[instanceId];
      if (!instance || !isComponentInstance(instance)) {
        return { ok: false, error: "Component instance not found" };
      }

      try {
        // ✅ 정의에서 스키마 가져오기
        const definition = blocksById[
          instance.metadata.component_id as string
        ] as ComponentDefinition;

        if (!definition) {
          return { ok: false, error: "Component definition not found" };
        }

        // ✅ 컴포넌트 관련 메타데이터 제거
        const { role, component_id, ...baseMetadata } =
          instance.metadata as any;

        // ✅ 현재 시각적 상태 보존
        const preservedNodeUI = preserveCurrentVisualState(
          instance,
          definition
        );

        // ✅ 정의의 스키마를 복사
        const definitionSchema = definition.metadata.schema;

        const updatedMetadata = {
          ...baseMetadata,
          // ✅ 정의의 스키마 복사
          schema: definitionSchema,
          // ✅ 현재 시각적 상태 보존
          node_ui:
            Object.keys(preservedNodeUI).length > 0
              ? preservedNodeUI
              : undefined,
          // ✅ 인스턴스의 데이터 보존
          data: instance.metadata.data || {},
          updated_at: new Date(),
        };

        const updates = {
          metadata: updatedMetadata,
          updated_at: new Date(),
        };

        // Optimistic update
        updateBlock(instanceId, updates);

        // Server synchronization
        const result = await updateBlockAction({
          id: instanceId,
          object: "block",
          ...updates,
        });

        if (isFailure(result)) {
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to detach component instance:", error);
        return { ok: false, error: String(error) };
      }
    },
    [blocksById, updateBlock, preserveCurrentVisualState]
  );

  // ✅ 기존 인스턴스에서 스키마 제거하는 마이그레이션 함수
  const migrateExistingInstances =
    useCallback(async (): Promise<CreateStatus> => {
      try {
        const instances = Object.values(blocksById).filter(isComponentInstance);

        for (const instance of instances) {
          if (instance.metadata.schema) {
            const { schema, ...cleanMetadata } = instance.metadata as any;
            const updates = {
              metadata: cleanMetadata,
              updated_at: new Date(),
            };

            // Optimistic update
            updateBlock(instance.id, updates);

            // Server synchronization
            const result = await updateBlockAction({
              id: instance.id,
              object: "block",
              ...updates,
            });

            if (isFailure(result)) {
              console.error(
                `Failed to migrate instance ${instance.id}:`,
                result.error
              );
            }
          }
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to migrate existing instances:", error);
        return { ok: false, error: String(error) };
      }
    }, [blocksById, updateBlock]);

  // Update instance style overrides
  const updateInstanceStyle = useCallback(
    async (
      instanceId: string,
      styleOverrides: Partial<NodeUI>
    ): Promise<CreateStatus> => {
      const instance = blocksById[instanceId];
      if (!instance || !isComponentInstance(instance)) {
        return { ok: false, error: "Component instance not found" };
      }

      const definition = blocksById[
        instance.metadata.component_id as string
      ] as ComponentDefinition;
      if (!definition) {
        return { ok: false, error: "Component definition not found" };
      }

      if (!allowsStyleOverrides(definition)) {
        return {
          ok: false,
          error: "Style overrides not allowed for this component",
        };
      }

      const validation = validateComponentStyleOverride(
        definition,
        styleOverrides
      );
      if (!validation.valid) {
        return { ok: false, error: validation.errors.join(", ") };
      }

      try {
        const currentOverrides =
          (instance.metadata.node_ui as Partial<NodeUI>) || {};
        const mergedOverrides = { ...currentOverrides, ...styleOverrides };

        const updates = {
          metadata: {
            ...instance.metadata,
            node_ui: mergedOverrides,
          },
          updated_at: new Date(),
        };

        // Optimistic update
        updateBlock(instanceId, updates);

        // Server synchronization
        const result = await updateBlockAction({
          id: instanceId,
          object: "block", // 일반 블록으로 유지
          ...updates,
        });

        if (isFailure(result)) {
          return { ok: false, error: String(result.error) };
        }

        return { ok: true };
      } catch (error) {
        console.error("Failed to update instance style:", error);
        return { ok: false, error: String(error) };
      }
    },
    [blocksById, updateBlock]
  );

  // Open component definition editor from instance
  const openComponentDefinitionEditor = useCallback(
    (instanceId: string): CreateStatus => {
      const instance = blocksById[instanceId];
      if (!instance || !isComponentInstance(instance)) {
        return { ok: false, error: "Component instance not found" };
      }

      const definitionId = instance.metadata.component_id as string;
      const definition = blocksById[definitionId];
      if (!definition) {
        return { ok: false, error: "Component definition not found" };
      }

      // Navigate to definition for editing
      sel.selectComponent(definitionId);
      setNodeSelection([definitionId]);

      return { ok: true };
    },
    [blocksById, sel.selectComponent, setNodeSelection]
  );

  return {
    createNewPage,
    createBlockInPage,
    createComponentFromBlock,
    updateBlock: updateBlockCommand,
    updateNodePosition,
    updateNodePositions,
    duplicateBlock,
    deleteBlock,
    restoreBlock,
    deleteComponent,

    // Component commands
    promoteBlockToComponentDefinition,
    linkBlocksToComponentDefinition,
    createInstanceInPage,
    resetInstanceStyle,
    resetInstanceField,
    detachComponentInstance,
    updateInstanceStyle,
    openComponentDefinitionEditor,
    migrateExistingInstances,
  } as const;
}
