"use client";

import React, { useCallback, useMemo } from "react";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import {
  PageBlockType,
  BlockAdditionPolicyFactory,
} from "@/domains/workflow-canvas/policy";
import { DbBlock } from "@/domains/workflow-canvas/policy/block-definition-policy";

export function useBlockInsertPanelHandler() {
  const {
    dbBlocks,
    dbEdges,
    selectedPageBlock,
    handlePageBlockCreate,
    showBlockInsertPanel,
    closeAllPanels,
    handleEdgeInsert,
  } = useCanvas();

  // Initialize policy
  const policy = useMemo(() => {
    if (!selectedPageBlock) return null;
    return BlockAdditionPolicyFactory.getPolicy(
      selectedPageBlock.block_type as PageBlockType
    );
  }, [selectedPageBlock]);

  // Get groups with items using the policy
  const groupsWithItems = useMemo(() => {
    if (!policy || !selectedPageBlock) {
      return { staticBlocks: [], dynamicGroups: [] };
    }
    return policy.getGroupsWithItems(
      selectedPageBlock.block_type as PageBlockType,
      dbBlocks
    );
  }, [policy, selectedPageBlock, dbBlocks]);

  // Check if a block is already connected to the current page
  const isBlockConnected = useCallback(
    (blockId: string) => {
      if (!selectedPageBlock) return false;

      // Check if there's already an edge between current page and this block
      return dbEdges.some(
        (edge) =>
          (edge.source_block_id === selectedPageBlock.id &&
            edge.target_block_id === blockId) ||
          (edge.source_block_id === blockId &&
            edge.target_block_id === selectedPageBlock.id)
      );
    },
    [selectedPageBlock, dbEdges]
  );

  // Extract static blocks and dynamic groups with items
  const { staticBlocks, dynamicGroups } = groupsWithItems;

  // Get policy description for hover card
  const policyDescription = useMemo(() => {
    if (!policy) {
      return {
        title: "Block Policy",
        description: "Add blocks based on the current page type.",
        items: [],
      };
    }
    return policy.getPolicyDescription();
  }, [policy]);

  const handleBlockSelect = useCallback(
    async (blockId: string) => {
      try {
        // Handle static blocks (like workflow basic nodes)
        const staticBlock = staticBlocks.find((block) => block.id === blockId);
        if (staticBlock) {
          // Create static block
          await handlePageBlockCreate(staticBlock.blockType as PageBlockType);
          closeAllPanels();
          return;
        }

        // Handle dynamic groups
        const dynamicGroup = dynamicGroups.find(
          (group) => group.id === blockId
        );
        if (dynamicGroup) {
          return;
        }

        // Handle regular page block types
        const pageBlockType = blockId as PageBlockType;
        if (Object.values(PageBlockType).includes(pageBlockType)) {
          await handlePageBlockCreate(pageBlockType);
          closeAllPanels();
          return;
        }

        // Handle unknown block types
        console.error(`Unknown block type: ${blockId}`);
      } catch (error) {
        console.error("Failed to create page block:", error);
      }
    },
    [handlePageBlockCreate, closeAllPanels, staticBlocks, dynamicGroups]
  );

  const handleCreateNewBlock = useCallback(
    (groupType: string) => {
      // Handle dynamic groups
      const dynamicGroup = dynamicGroups.find(
        (group) => group.id === groupType
      );
      if (dynamicGroup) {
        // This should trigger dynamic selection UI
        console.log(`Create new block for dynamic group: ${groupType}`);
        // TODO: Trigger dynamic selection UI for creating new blocks
        return;
      }

      // Handle regular block creation
      handleBlockSelect(groupType);
    },
    [handleBlockSelect, dynamicGroups]
  );

  const onClickExistingBlockCard = useCallback(
    (blockId: string) => {
      if (!selectedPageBlock) {
        console.error("No active page block type");
        return;
      }

      // Find the actual block type from allWorkspaceBlocks
      const targetBlock = dbBlocks.find((block) => block.id === blockId);
      if (!targetBlock) {
        console.error("Target block not found:", blockId);
        return;
      }

      const targetBlockType = targetBlock.block_type as PageBlockType;
      handleEdgeInsert(blockId, targetBlockType);
    },
    [handleEdgeInsert, selectedPageBlock, dbBlocks]
  );

  return {
    // State
    selectedPageBlock,
    staticBlocks,
    dynamicGroups,

    // Policy description
    policyDescription,

    // Handlers
    handleBlockSelect,
    handleCreateNewBlock,
    onClickExistingBlockCard,

    // Utilities
    isBlockConnected,

    // UI state
    isOpen: showBlockInsertPanel,
    onClose: closeAllPanels,
  };
}
