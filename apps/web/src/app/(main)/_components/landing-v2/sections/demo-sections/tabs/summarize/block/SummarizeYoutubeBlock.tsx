"use client";

/**
 * SummarizeYoutubeBlock
 *
 * Summarize 탭 전용 YouTube 블록.
 * Extract Summary 플로우만 사용.
 * step 0: 초기(선택X), 1: 블록 클릭 유도(선택X), 2: 블록 선택됨, 3: Extract Summary 팝오버, 4: 패널 열림, 5+: 완료
 */

import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Check, Sparkles } from "lucide-react";
import { DataBlockView } from "@/domains/block-management/frontend/components/block/data-block/components/data-block-view";
import { YoutubeView } from "@workspace/ssota-blocks/youtube";
import { BaseBlockView } from "@/domains/block-management/frontend/components/block/base-block/components/base-block-view";
import { Content } from "@/domains/block-management/frontend/components/block/base-block/components/content";
import { ResizeControlView } from "@/domains/block-management/frontend/components/block/base-block/components/resize-control.view";
import { HandlesView } from "@/domains/block-management/frontend/components/block/base-block/components/handles.view";
import { BlockActionBarView } from "@/domains/block-management/frontend/components/block/block-action-bar/block-action-bar.view";
import { MockExtractSummaryActionView } from "./MockExtractSummaryActionView";
import { MockYoutubeBlockToolbar } from "../../../../../../mocks/components/MockYoutubeBlockToolbar";
import { VisualSummaryActionView } from "@/domains/block-management/frontend/components/block/block-type/youtube/components/action-items/components/visual-summary-action/visual-summary-action.view";
import { Box } from "@/components/ui/box";
import { SUPPORTED_LANGUAGES } from "@/domains/youtube-app-space/shared/value-objects/language-code.vo";
import {
  LANDING_MOCK_BLOCK_DATA as MOCK_BLOCK_DATA,
  LANDING_YOUTUBE_PROPERTIES as MOCK_YOUTUBE_PROPERTIES,
  YOUTUBE_VIDEO_ID,
} from "../../../../../../mocks/landing-youtube-mock-data";
import { StepHighlight } from "../../../../../../mocks/components/StepHighlight";
import { AlertCircle } from "lucide-react";

export interface SummarizeYoutubeBlockData extends Record<string, unknown> {
  step?: number;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ru: "Русский",
  ar: "العربية",
};

const LANGUAGES = SUPPORTED_LANGUAGES.map((code) => ({
  code,
  label: LANGUAGE_LABELS[code] ?? code.toUpperCase(),
}));

function SummarizeYoutubeBlockComponent({
  data,
  selected,
  width,
  height,
}: NodeProps) {
  const step = (data as SummarizeYoutubeBlockData).step ?? 0;
  const nodeWidth = typeof width === "number" ? width : 400;
  const nodeHeight = typeof height === "number" ? height : 260;
  const showToolbars = selected || step >= 2; // step 2부터 블록 선택 상태

  // Extract Summary 플로우 (step 2: 블록선택+하이라이트, step 3: 팝오버)
  const showSummarizePopoverFromStep = step === 3;
  const isSummarizeHighlighted = step >= 2;
  const hasSummary = step >= 5;
  const availableLanguagesForStep = step >= 5 ? ["en"] : [];
  const highlightLanguageCode = step === 3 ? "en" : undefined;

  const [viewMode, setViewMode] = useState<"original" | "note" | "card">("original");
  const [showExtractSummaryPopover, setShowExtractSummaryPopover] = useState(false);

  const isExtractSummaryPopoverOpen =
    showSummarizePopoverFromStep || showExtractSummaryPopover;

  const extractSummaryIcon = isSummarizeHighlighted ? (
    <Check className="text-green-600" />
  ) : (
    <Sparkles />
  );

  const renderOriginalView = () => (
    <YoutubeView
      url={MOCK_YOUTUBE_PROPERTIES.url}
      isLoading={false}
      hasError={false}
      draftUrl=""
      showPlayer={true}
      isIframeLoading={false}
      isActive={selected}
      properties={MOCK_YOUTUBE_PROPERTIES}
      thumbnailUrl={MOCK_YOUTUBE_PROPERTIES.youtubeThumbnail ?? null}
      videoId={YOUTUBE_VIDEO_ID}
      inputRef={{ current: null }}
      onUrlChange={() => { }}
      onUrlSubmit={async () => { }}
      onUrlKeyDown={() => { }}
      onPlayerReady={() => { }}
      onImageLoad={() => { }}
      onImageError={() => { }}
    />
  );

  return (
    <BaseBlockView
      data={MOCK_BLOCK_DATA as any}
      width={nodeWidth}
      height={nodeHeight}
      draggable={false}
      onMouseEnter={() => { }}
      onMouseMove={() => { }}
      onMouseLeave={() => { }}
      showAddButtonZones={false}
      setHoverDirection={() => { }}
    >
      {showToolbars && (
        <MockYoutubeBlockToolbar
          title={MOCK_YOUTUBE_PROPERTIES.youtubeTitle ?? "YouTube Video"}
          width={nodeWidth}
          url={MOCK_YOUTUBE_PROPERTIES.url}
          blockId={MOCK_BLOCK_DATA.blockId}
          blockMountId={MOCK_BLOCK_DATA.blockMountId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      <ResizeControlView
        nodeId={MOCK_BLOCK_DATA.blockMountId}
        show={false}
        keepAspectRatio={true}
        onResizeStart={() => { }}
        onResizeEnd={async () => { }}
      />

      <HandlesView
        isConnectable={false}
        showLeft={false}
        showRight={false}
        showTop={false}
        showBottom={false}
      />

      {showToolbars && (
        <BlockActionBarView show={true}>
          <StepHighlight
            isActive={step === 2 || step === 3}
            pointer="top"
            label="Extract Summary"
            className="inline-block"
            cursorAction={step === 2 ? "click" : undefined}
          >
            <MockExtractSummaryActionView
              isPopoverOpen={isExtractSummaryPopoverOpen}
              onPopoverOpenChange={setShowExtractSummaryPopover}
              icon={extractSummaryIcon}
              tooltip="Extract Summary"
              disabled={false}
              languages={LANGUAGES}
              availableLanguages={availableLanguagesForStep}
              onLanguageSelect={() => { }}
              highlightLanguageCode={highlightLanguageCode}
            />
          </StepHighlight>
          <VisualSummaryActionView
            icon={<Sparkles />}
            tooltip={hasSummary ? "Generate Visual Summary" : "Extract summary first"}
            disabled={false}
            isPopoverOpen={false}
            onPopoverOpenChange={() => { }}
            popoverContent={
              <Box className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Please extract summary first to generate visual summary.</span>
              </Box>
            }
          />
        </BlockActionBarView>
      )}

      <Content textColorClass="">
        <StepHighlight
          isActive={step === 1}
          cursorAction="click"
          cursorOffset={{ x: 20, y: 20 }}
          preserveChildSize
        >
          <DataBlockView
            viewMode="original"
            data={MOCK_BLOCK_DATA as any}
            renderOriginalView={renderOriginalView}
            selected={selected}
          />
        </StepHighlight>
      </Content>
    </BaseBlockView>
  );
}

export const SummarizeYoutubeBlock = memo(SummarizeYoutubeBlockComponent);
