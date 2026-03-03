"use client";

import { cn } from "@workspace/ui/lib/utils";
import { EditorPanelView } from "@workspace/editor-panel";
import { getBlockEditorSchema } from "@/domains/block-management/frontend/registries/block-editor-schema-registry";
import { ShapeNoteTabsSection } from "./sections/ShapeNoteTabsSection";

const noop = () => {};
const noopAsync = async () => {};

interface StructureShapeEditorPanelProps {
  isOpen: boolean;
  step: number;
  shapeBlockData: {
    blockId: string;
    title: string;
    properties: {
      shapeType: string;
      color: string;
      borderStyle: string;
    };
  };
}

export function StructureShapeEditorPanel({ isOpen, step, shapeBlockData }: StructureShapeEditorPanelProps) {
  const isVisible = isOpen;
  const isHighlighted = step >= 6;
  const frameClassName = cn(
    "absolute z-50 bg-background backdrop-blur-md border-border shadow-2xl",
    "bottom-0 right-0 w-full md:w-[50%] h-full md:h-[90%] border-l border-t rounded-tl-lg",
    isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
    "z-50!",
    "pointer-events-none",
    isOpen && "pointer-events-auto",
    isHighlighted && "ring-2 ring-blue-400/60 ring-offset-2"
  );

  const entityData = {
    blockType: "shape",
    properties: shapeBlockData.properties,
  };

  return (
    <div
      className={frameClassName}
      style={{
        transition:
          "all 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out, opacity 0.3s ease-out",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-panel-title"
    >
      <EditorPanelView
        headerActions={{
          onClose: noop,
          isExpanded: false,
          onToggleExpand: noop,
        }}
        titleInput={{
          initialTitle: shapeBlockData.title,
          onTitleSave: noop,
          readOnly: true,
        }}
        blockProperties={{
          entityId: shapeBlockData.blockId,
          entityData,
          propertyUpdateDeps: {
            updateProperty: noopAsync,
            updatePropertyImmediate: noop,
          },
          deps: { getEditorSchema: getBlockEditorSchema },
          readonly: true,
        }}
        customProperties={{
          entityId: shapeBlockData.blockId,
          deps: {
            resolveEntityData: () => entityData,
            propertyUpdateDeps: {
              updateProperty: noopAsync,
              updatePropertyImmediate: noop,
            },
          },
          readonly: true,
        }}
        tabsSection={<ShapeNoteTabsSection />}
      />
    </div>
  );
}
