"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";
import { DemoOrchestrator } from "../DemoOrchestrator";
import { StructureYoutubeEditorPanel } from "./structure/editor/youtube/StructureYoutubeEditorPanel";
import { StructureShapeEditorPanel } from "./structure/editor/shape/StructureShapeEditorPanel";
import { StructureReactFlow } from "./structure/StructureReactFlow";
import { MockStatusWindow } from "./structure/MockStatusWindow";
import { THESIS_NODE } from "./structure/mock-argument-map-data";
import { ColorToken } from "@/domains/block-management/shared/types/style-tokens.types";
import { ShapeType } from "@/domains/block-management/shared/value-objects/block-properties";
import { useEffect } from "react";

/** Structure Tab - step 타이밍 상수 (ms) */
const INITIAL_INTERVAL_MS = 2400;
const BLOCK_STEP_MS = 100;   // 블록 1개당 step 간격
const STEP_GAP_MS = 1000;    // Details click / panel 간격
const SHAPE_CLICK_STEP_MS = 2200;  // shape 클릭 step - 커서 애니메이션 완료까지 (이동 1s + 도착후클릭 0.9s + 여유)

const T0 = 0;
const T1 = 400;
const T2 = T1 + INITIAL_INTERVAL_MS;
const T3 = T1 + 2 * INITIAL_INTERVAL_MS;
const T4 = T1 + 3 * INITIAL_INTERVAL_MS;
const T5 = T1 + 4 * INITIAL_INTERVAL_MS;  // step 5: group
// step 5~15: 블록 11개 (100ms 간격)
// step 16: 엣지
// step 17: shape 클릭, 18: Details, 19: panel

/** step 0-4: YouTube, 5-15: 블록 순차, 16: 엣지, 17-19: shape/details/panel */
export const STRUCTURE_STEP_DELAYS_MS = [
  T0, T1, T2, T3, T4,  // 0-4
  T5,                                                   // 5: group
  T5 + BLOCK_STEP_MS,                                   // 6
  T5 + 2 * BLOCK_STEP_MS,                               // 7
  T5 + 3 * BLOCK_STEP_MS,                               // 8
  T5 + 4 * BLOCK_STEP_MS,                               // 9
  T5 + 5 * BLOCK_STEP_MS,                               // 10
  T5 + 6 * BLOCK_STEP_MS,                               // 11
  T5 + 7 * BLOCK_STEP_MS,                               // 12
  T5 + 8 * BLOCK_STEP_MS,                               // 13
  T5 + 9 * BLOCK_STEP_MS,                               // 14
  T5 + 10 * BLOCK_STEP_MS,                              // 15: all blocks
  T5 + 11 * BLOCK_STEP_MS,                              // 16: edges
  T5 + 11 * BLOCK_STEP_MS + 600,                        // 17: shape 클릭 (커서 애니메이션 포함)
  T5 + 11 * BLOCK_STEP_MS + 600 + SHAPE_CLICK_STEP_MS,  // 18: Details 클릭
  T5 + 11 * BLOCK_STEP_MS + 600 + SHAPE_CLICK_STEP_MS + STEP_GAP_MS,  // 19: shape panel
];

// Helper to convert color string to ColorToken
const colorStringToToken: Record<string, ColorToken> = {
  red: ColorToken.RED,
  orange: ColorToken.ORANGE,
  amber: ColorToken.AMBER,
  green: ColorToken.GREEN,
  blue: ColorToken.BLUE,
  purple: ColorToken.PURPLE,
  pink: ColorToken.PINK,
  gray: ColorToken.GRAY,
};

// Helper to convert shape string to ShapeType
const shapeStringToType: Record<string, ShapeType> = {
  rectangle: ShapeType.RECTANGLE,
  ellipse: ShapeType.ELLIPSE,
  diamond: ShapeType.DIAMOND,
  triangle: ShapeType.TRIANGLE,
  hexagon: ShapeType.HEXAGON,
  parallelogram: ShapeType.PARALLELOGRAM,
  cylinder: ShapeType.CYLINDER,
};

interface StructureTabProps {
  onTabComplete?: () => void;
  /** 뷰포트 진입 시 true. false면 step 애니메이션 대기 */
  startAnimation?: boolean;
}

/**
 * Structure Tab Content - wrapper component to use hooks properly
 */
function StructureTabContent({
  step,
  reset,
  resetKey,
  onTabComplete,
}: {
  step: number;
  reset: () => void;
  resetKey: number;
  onTabComplete?: () => void;
}) {
  // Call onTabComplete when reaching last step
  useEffect(() => {
    if (step === STRUCTURE_STEP_DELAYS_MS.length - 1) {
      onTabComplete?.();
    }
  }, [step, onTabComplete]);

  // Step 1-3: YouTube editor panel open (summarize와 동일)
  const showYouTubeEditorPanel = step >= 1 && step <= 3;

  // Step 4-18: StatusWindow shows (during block/edge rendering + shape click)
  const showStatusWindow = step >= 4 && step < 18;

  // Step 19: Shape editor panel open (마지막 스텝, Details 클릭 이후)
  const showShapeEditorPanel = step >= 19;

  // step 기반 todo 진행
  const renderPhase =
    step >= 16 ? 4 : step >= 11 ? 3 : step >= 8 ? 2 : step >= 6 ? 1 : 0;
  const todos = showStatusWindow
    ? [
      { id: 'todo-1', title: 'Creating argument map structure', status: (renderPhase >= 1 ? 'completed' : 'pending') as 'completed' | 'pending' },
      { id: 'todo-2', title: 'Generating thesis and claims', status: (renderPhase >= 2 ? 'completed' : 'pending') as 'completed' | 'pending' },
      { id: 'todo-3', title: 'Adding evidence blocks', status: (renderPhase >= 3 ? 'completed' : 'pending') as 'completed' | 'pending' },
      { id: 'todo-4', title: 'Rendering connections', status: (renderPhase >= 4 ? 'completed' : 'pending') as 'completed' | 'pending' },
    ]
    : [];

  // Prepare thesis block data for shape editor panel
  const thesisBlockData = showShapeEditorPanel ? {
    blockId: THESIS_NODE.id,
    title: THESIS_NODE.title,
    properties: {
      shapeType: shapeStringToType[THESIS_NODE.shapeType || 'ellipse'] || ShapeType.ELLIPSE,
      color: colorStringToToken[THESIS_NODE.color || 'purple'] || ColorToken.PURPLE,
      borderStyle: (THESIS_NODE.borderStyle || 'solid') as 'solid' | 'dashed' | 'dotted',
    },
  } : null;

  return (
    <>
      <StructureReactFlow step={step} />

      {/* YouTube Editor Panel - Step 1-3 */}
      {showYouTubeEditorPanel && (
        <StructureYoutubeEditorPanel key={`youtube-${resetKey}`} isOpen step={step} />
      )}

      {/* Shape Editor Panel - Step 6+ */}
      {showShapeEditorPanel && thesisBlockData && (
        <StructureShapeEditorPanel
          key={`shape-${resetKey}`}
          isOpen
          step={step}
          shapeBlockData={thesisBlockData}
        />
      )}

      {/* Reset button + Status Window */}
      <div className="absolute top-3 right-3 z-40 flex flex-col items-end gap-3">
        <div className="pointer-events-auto">
          {step < STRUCTURE_STEP_DELAYS_MS.length - 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 bg-background/90 backdrop-blur-sm shadow-sm"
              onClick={reset}
            >
              <span
                className="h-2 w-2 rounded-full bg-green-500 shrink-0"
                style={{ animation: "live-demo-pulse 1.5s ease-in-out infinite" }}
              />
              Live demo
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 bg-background/90 backdrop-blur-sm shadow-sm"
              onClick={reset}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reload
            </Button>
          )}
        </div>
        {showStatusWindow && (
          <div className="pointer-events-none">
            <MockStatusWindow
              isVisible={true}
              operationType="visual-summary"
              templateName="Argument Map"
              todos={todos}
              isGenerating={step < 18}
              error={null}
              onDismiss={() => { }}
            />
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes live-demo-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.8; }
          }
        `}
      </style>
    </>
  );
}

/**
 * Structure Tab
 *
 * Visual Summary (Argument Map) 플로우 전용 데모.
 */
export function StructureTab({ onTabComplete, startAnimation = true }: StructureTabProps) {
  return (
    <DemoOrchestrator stepDelaysMs={STRUCTURE_STEP_DELAYS_MS} startWhenReady={startAnimation}>
      {({ step, reset, resetKey }) => (
        <StructureTabContent
          step={step}
          reset={reset}
          resetKey={resetKey}
          onTabComplete={onTabComplete}
        />
      )}
    </DemoOrchestrator>
  );
}
