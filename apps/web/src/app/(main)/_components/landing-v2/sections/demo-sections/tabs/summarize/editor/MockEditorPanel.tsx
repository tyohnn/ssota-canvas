"use client";

import { cn } from "@workspace/ui/lib/utils";
import { EditorPanelView } from "@/domains/block-management/frontend/components/editor-panel/editor-panel.view";
import { LandingEditorPanelHeader } from "../../../../../../mocks/editor-panel/sections/LandingEditorPanelHeader";
import { LandingEditorPanelContent } from "../../../../../../mocks/editor-panel/sections/LandingEditorPanelContent";

interface MockEditorPanelProps {
  isOpen: boolean;
  step: number;
}

export function MockEditorPanel({ isOpen, step }: MockEditorPanelProps) {
  // isOpen과 동기화 - 지연 없이 패널 즉시 표시
  const isVisible = isOpen;

  // step 4에서 패널 하이라이트 (glow 효과)
  const isHighlighted = step === 4;

  return (
    <EditorPanelView
      isExpanded={false}
      isVisible={isVisible}
      className={cn(
        "z-50!",
        "pointer-events-none",
        isOpen && "pointer-events-auto",
        isHighlighted && "ring-2 ring-blue-400/60 ring-offset-2"
      )}
    >
      <LandingEditorPanelHeader onClose={() => { }} />
      <LandingEditorPanelContent step={step} />

      {/* 하이라이트 glow 애니메이션 */}
      {isHighlighted && (
        <style>
          {`
            @keyframes panel-glow {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.3), 0 0 16px 3px rgba(96, 165, 250, 0.15);
              }
              50% {
                box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2), 0 0 24px 6px rgba(96, 165, 250, 0.25);
              }
            }
          `}
        </style>
      )}
    </EditorPanelView>
  );
}
