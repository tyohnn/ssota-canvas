"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";
import { useNodeOperations } from "@/domains/workflow-canvas/hooks/useNodeOperations";
import {
  EditorRenderingStrategyFactory,
  EditorConfig,
  EditorBlockType,
} from "@/domains/workflow-canvas/policy/editor-rendering-policy";
import {
  getTypedMetadata,
  getBlockName,
  getBlockSlug,
  getBlockDescription,
  BlockMetadata,
  DbBlock,
} from "@/domains/workflow-canvas/policy/block-definition-policy";
import { devLog } from "@/utils/dev-logger";
import { Edge as DbEdge } from "@/db/schema";
import slugify from "cjk-slug";

export type EditorTab = "configuration" | "design" | "metadata" | "relation";

export interface EditorPanelState {
  activeTab: EditorTab;
  isEditing: boolean;
  hasChanges: boolean;
  selectedBlock: DbBlock | null;
  selectedEdge: DbEdge | null;
  selectedItem: DbBlock | DbEdge | null;
  isNode: boolean;
  editorConfig: EditorConfig | null;
  formMethods: UseFormReturn<any>; // react-hook-form methods
}

export interface EditorPanelHandlers {
  setActiveTab: (tab: EditorTab) => void;
  setIsEditing: (editing: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleCopy: () => void;
  resetState: () => void;
  onSubmit: (data: any) => Promise<void>; // react-hook-form onSubmit
  generateSlug: (name: string) => string;
}

export function useEditorPanelHandler() {
  const {
    showEditorPanel,
    selectedBlocks,
    selectedEdges,
    dbBlocks,
    dbEdges,
    handleBlockUpdate,
    handleEdgeUpdate,
    handleBlockDelete,
    handleEdgeDelete,
    handleClearSelection,
    closeEditorPanel,
    setViewportAction,
  } = useCanvas();

  const [activeTab, setActiveTab] = useState<EditorTab>("configuration");

  const handleSetActiveTab = useCallback((tab: EditorTab) => {
    setActiveTab(tab);
  }, []);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editorConfig, setEditorConfig] = useState<EditorConfig | null>(null);

  // Generate slug from name (defined early for use in effects)
  const generateSlug = useCallback((name: string): string => {
    if (!name || name.trim() === "") return "block";

    const slug = slugify(name);

    return slug || "block"; // 빈 문자열이면 기본값 반환
  }, []);

  // React Hook Form setup - initialized without resolver first
  const formMethods = useForm({
    defaultValues: {},
    mode: "onChange", // Real-time validation
  });

  const {
    updateNodeWithValidation,
    deleteNodeWithRelationships,
    validateNodeData,
  } = useNodeOperations();

  // Get selected items from context
  const selectedBlock = useMemo(() => {
    if (selectedBlocks.length !== 1) return undefined;
    return dbBlocks.find((block: DbBlock) => block.id === selectedBlocks[0]);
  }, [selectedBlocks, dbBlocks]);

  const selectedEdge = useMemo(() => {
    if (selectedEdges.length !== 1) return null;
    const edge = dbEdges.find((edge: DbEdge) => edge.id === selectedEdges[0]);
    return edge || null;
  }, [selectedEdges, dbEdges]);

  const selectedItem = selectedBlock || selectedEdge;
  const isNode = !!selectedBlock;

  // Load editor configuration and initialize form when selection changes
  useEffect(() => {
    if (selectedBlock) {
      try {
        // Get block type from node
        const blockType = selectedBlock.block_type as EditorBlockType;

        // Get editor configuration from policy
        const strategy = EditorRenderingStrategyFactory.getStrategy(blockType);
        const config = strategy.getEditorConfig();
        setEditorConfig(config);

        // Initialize form data with node data or defaults
        const defaultData = strategy.getDefaultMetadata();

        // 하이브리드 방식: 타입 안전한 메타데이터 접근
        const typedMetadata = getTypedMetadata(selectedBlock);
        const blockMetaData = typedMetadata || {};

        // label/name 통일: label이 있으면 name으로 사용, name이 있으면 그대로 사용
        const normalizedNodeData = {
          ...blockMetaData,
          name: getBlockName(selectedBlock),
          slug: getBlockSlug(selectedBlock),
          description: getBlockDescription(selectedBlock),
        };

        const initialFormData = { ...defaultData, ...normalizedNodeData };

        // Reset form with new data
        formMethods.reset(initialFormData);
      } catch (error) {
        console.warn(
          "Failed to load editor config for node:",
          selectedBlock,
          error
        );
        setEditorConfig(null);
        formMethods.reset({});
      }
    } else {
      setEditorConfig(null);
      formMethods.reset({});
    }

    // Reset other states
    setIsEditing(false);
    setHasChanges(false);
    setActiveTab("configuration");
  }, [selectedBlock?.id, selectedEdge?.id, formMethods]);

  // React Hook Form onSubmit handler
  const onSubmit = useCallback(
    async (data: any) => {
      if (!selectedBlock) return;

      try {
        setIsEditing(false);

        // 하이브리드 방식: 타입 안전한 메타데이터 업데이트
        const typedMetadata = getTypedMetadata(selectedBlock);
        const currentMetadata = typedMetadata || {};

        const updatedMetadata: BlockMetadata = {
          ...currentMetadata,
          ...data,
        };

        devLog("Saving node with form data:", updatedMetadata);

        // handleBlockUpdate에 올바른 데이터 구조 전달
        const updateData = {
          name: data.name,
          slug:
            data.slug ||
            generateSlug(data.name || selectedBlock.name || "block"),
          metadata: updatedMetadata, // 전체 메타데이터를 metadata 필드에 저장
        };

        const result = await handleBlockUpdate(selectedBlock.id, updateData);

        // 성공했을 때만 hasChanges를 false로 설정
        if (result.success) {
          setHasChanges(false);
        }
      } catch (error) {
        console.error("Error saving node:", error);
        setIsEditing(true); // Re-enable editing on error
      }
    },
    [selectedBlock, handleBlockUpdate]
  );

  // Legacy handleSave (can trigger form submission)
  const handleSave = useCallback(async () => {
    formMethods.handleSubmit(onSubmit)();
  }, [formMethods, onSubmit]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!selectedBlock && !selectedEdge) return;

    try {
      if (selectedBlock) {
        await deleteNodeWithRelationships(selectedBlock.id);
        await handleBlockDelete(selectedBlock.id);
      } else if (selectedEdge) {
        await handleEdgeDelete(selectedEdge.id);
      }
      closeEditorPanel();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  }, [
    selectedBlock,
    selectedEdge,
    deleteNodeWithRelationships,
    handleBlockDelete,
    handleEdgeDelete,
    closeEditorPanel,
  ]);

  // Handle copy
  const handleCopy = useCallback(() => {
    if (selectedBlock) {
      navigator.clipboard.writeText(JSON.stringify(selectedBlock, null, 2));
    } else if (selectedEdge) {
      navigator.clipboard.writeText(JSON.stringify(selectedEdge, null, 2));
    }
  }, [selectedBlock, selectedEdge]);

  // Watch form changes to detect hasChanges and auto-generate slug
  useEffect(() => {
    const subscription = formMethods.watch((value, info) => {
      if (info?.type === "change" && selectedBlock) {
        setHasChanges(true);

        // Auto-generate slug when name changes
        if (
          info.name === "name" &&
          value &&
          typeof value === "object" &&
          "name" in value
        ) {
          const nameValue = (value as any).name;
          if (nameValue) {
            try {
              (formMethods.setValue as any)("slug", generateSlug(nameValue));
            } catch (error) {
              console.warn("Failed to set slug value:", error);
            }
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [formMethods, generateSlug, selectedBlock]);

  // Reset state
  const resetState = useCallback(() => {
    setIsEditing(false);
    setHasChanges(false);
    setActiveTab("configuration");
    formMethods.reset();
  }, [formMethods]);

  // Handle close editor with selection clear only (no viewport change)
  const handleCloseEditorWithCentering = useCallback(() => {
    // 1. 패널들 닫기
    closeEditorPanel();

    // 2. 선택 해제 (에디터 패널 전용)
    handleClearSelection();

    setViewportAction("center");
  }, [closeEditorPanel, handleClearSelection, setViewportAction]);

  const state: EditorPanelState = {
    activeTab,
    isEditing,
    hasChanges,
    selectedBlock: selectedBlock || null,
    selectedEdge,
    selectedItem,
    isNode,
    editorConfig,
    formMethods,
  };

  const handlers: EditorPanelHandlers = {
    setActiveTab: handleSetActiveTab,
    setIsEditing,
    setHasChanges,
    handleSave,
    handleDelete,
    handleCopy,
    resetState,
    onSubmit,
    generateSlug,
  };

  return {
    state,
    handlers,
    showEditorPanel,
    handleBlockUpdate,
    handleEdgeUpdate,
    closeEditorPanel,
    handleCloseEditorWithCentering, // 새로운 전용 close 함수
  };
}
