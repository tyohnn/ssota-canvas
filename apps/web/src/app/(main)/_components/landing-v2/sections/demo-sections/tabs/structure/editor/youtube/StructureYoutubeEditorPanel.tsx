"use client";

import { cn } from "@workspace/ui/lib/utils";
import { EditorPanelView } from "@workspace/editor-panel";
import { LandingBlockContentTabsSection } from "../../../../../../../mocks/editor-panel/sections/LandingBlockContentTabsSection";
import {
  LANDING_MOCK_BLOCK_DATA,
  LANDING_YOUTUBE_PROPERTIES,
} from "../../../../../../../mocks/landing-youtube-mock-data";
import { getBlockEditorSchema } from "@/domains/block-management/frontend/registries/block-editor-schema-registry";

const noop = () => {};
const noopAsync = async () => {};

interface StructureYoutubeEditorPanelProps {
  isOpen: boolean;
  step: number;
}

export function StructureYoutubeEditorPanel({ isOpen, step }: StructureYoutubeEditorPanelProps) {
  const contentStep = 6;
  const isVisible = isOpen;
  const isHighlighted = step === 1;
  const frameClassName = cn(
    "absolute z-50 bg-background backdrop-blur-md border-border shadow-2xl",
    "bottom-0 right-0 w-full md:w-[50%] h-full md:h-[90%] border-l border-t rounded-tl-lg",
    isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
    "z-50!",
    "pointer-events-none",
    isOpen && "pointer-events-auto",
    isHighlighted && "ring-2 ring-blue-400/60 ring-offset-2"
  );

  const title = LANDING_YOUTUBE_PROPERTIES.youtubeTitle ?? "YouTube Video";

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
          initialTitle: title,
          onTitleSave: noop,
          readOnly: true,
        }}
        blockProperties={{
          entityId: LANDING_MOCK_BLOCK_DATA.blockId,
          entityData: LANDING_MOCK_BLOCK_DATA,
          propertyUpdateDeps: {
            updateProperty: noopAsync,
            updatePropertyImmediate: noop,
          },
          deps: { getEditorSchema: getBlockEditorSchema },
          readonly: true,
        }}
        customProperties={{
          entityId: LANDING_MOCK_BLOCK_DATA.blockId,
          deps: {
            resolveEntityData: () => LANDING_MOCK_BLOCK_DATA,
            propertyUpdateDeps: {
              updateProperty: noopAsync,
              updatePropertyImmediate: noop,
            },
          },
          readonly: true,
        }}
        tabsSection={<LandingBlockContentTabsSection step={contentStep} />}
      />
    </div>
  );
}
