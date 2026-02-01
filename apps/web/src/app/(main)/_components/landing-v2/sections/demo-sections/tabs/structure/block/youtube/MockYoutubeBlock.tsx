"use client";

/**
 * MockYoutubeBlock
 *
 * Structure 탭 전용 YouTube 블록.
 * Visual Summary 플로우만 사용.
 * step 1: 초기(선택됨, 패널 열림), 2: Visual Summary 하이라이트, 3: 팝오버(첫번째 템플릿 하이라이트), 4+: StatusWindow, 블록 작아짐
 */

import { memo, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { DataBlockView } from "@/domains/block-management/frontend/components/block/data-block/components/data-block-view";
import { YoutubeView } from "@/domains/block-management/frontend/components/block/block-type/youtube/components/youtube.view";
import { BaseBlockView } from "@/domains/block-management/frontend/components/block/base-block/components/base-block-view";
import { Content } from "@/domains/block-management/frontend/components/block/base-block/components/content";
import { ResizeControlView } from "@/domains/block-management/frontend/components/block/base-block/components/resize-control.view";
import { HandlesView } from "@/domains/block-management/frontend/components/block/base-block/components/handles.view";
import { MockYoutubeBlockToolbar } from "../../../../../../../mocks/components/MockYoutubeBlockToolbar";
import { MockYoutubeBlockActionBar } from "./MockYoutubeBlockActionBar";
import {
  LANDING_MOCK_BLOCK_DATA,
  LANDING_YOUTUBE_PROPERTIES,
  YOUTUBE_VIDEO_ID,
} from "../../../../../../../mocks/landing-youtube-mock-data";

export interface MockYoutubeBlockData extends Record<string, unknown> {
  step?: number;
}

function MockYoutubeBlockComponent({
  data,
  selected,
  width,
  height,
}: NodeProps) {
  const step = (data as MockYoutubeBlockData).step ?? 0;
  const nodeWidth = typeof width === "number" ? width : 400;
  const nodeHeight = typeof height === "number" ? height : 260;

  // Step 1-3: Show toolbars (editor panel open), Step 4+: Hide toolbars (panel closed, zoomed out)
  const showToolbars = step >= 1 && step <= 3;

  const [viewMode, setViewMode] = useState<"original" | "note" | "card">("original");

  const renderOriginalView = () => (
    <YoutubeView
      url={LANDING_YOUTUBE_PROPERTIES.url}
      isLoading={false}
      hasError={false}
      draftUrl=""
      showPlayer={true}
      isIframeLoading={false}
      selected={selected}
      properties={LANDING_YOUTUBE_PROPERTIES}
      thumbnailUrl={LANDING_YOUTUBE_PROPERTIES.youtubeThumbnail ?? null}
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
      data={LANDING_MOCK_BLOCK_DATA as any}
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
          title={LANDING_YOUTUBE_PROPERTIES.youtubeTitle ?? "YouTube Video"}
          width={nodeWidth}
          url={LANDING_YOUTUBE_PROPERTIES.url}
          blockId={LANDING_MOCK_BLOCK_DATA.blockId}
          blockMountId={LANDING_MOCK_BLOCK_DATA.blockMountId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      )}

      <ResizeControlView
        nodeId={LANDING_MOCK_BLOCK_DATA.blockMountId}
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

      {showToolbars && <MockYoutubeBlockActionBar step={step} />}

      <Content textColorClass="">
        <DataBlockView
          viewMode="original"
          data={LANDING_MOCK_BLOCK_DATA as any}
          renderOriginalView={renderOriginalView}
          selected={selected}
        />
      </Content>
    </BaseBlockView>
  );
}

export const MockYoutubeBlock = memo(MockYoutubeBlockComponent);
