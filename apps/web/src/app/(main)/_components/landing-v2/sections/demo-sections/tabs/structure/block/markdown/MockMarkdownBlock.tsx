"use client";

/**
 * MockMarkdownBlock
 *
 * Structure 탭 전용 마크다운 블록.
 * Action Plan 등 마크다운 타입 노드 렌더링용 (view-only).
 * 앱의 NoteView/TipTap 스타일을 모방한 MarkdownBlockView 사용.
 */

import { memo, useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { marked } from "marked";
import { BaseBlockView } from "@/domains/block-management/frontend/components/block/base-block/components/base-block-view";
import { Content } from "@/domains/block-management/frontend/components/block/base-block/components/content";
import { HandlesView } from "@/domains/block-management/frontend/components/block/base-block/components/handles.view";
import { MarkdownBlockView } from "@/domains/block-management/frontend/components/block/block-type/markdown/markdown-block.view";

export interface MockMarkdownBlockData extends Record<string, unknown> {
  title?: string;
  content?: string;
  step?: number;
}

function MockMarkdownBlockComponent({ data, selected, width, height }: NodeProps) {
  const blockData = data as MockMarkdownBlockData;
  const content = blockData.content ?? blockData.title ?? "";
  const nodeWidth = typeof width === "number" ? width : 250;
  const nodeHeight = typeof height === "number" ? height : 150;

  // 마크다운 → HTML 변환 (memoized)
  const htmlContent = useMemo(() => {
    return marked.parse(content, { async: false, gfm: true }) as string;
  }, [content]);

  const mockBlockData = {
    blockId: "action_plan",
    blockMountId: "action_plan",
    title: blockData.title ?? "Action Plan",
    blockType: "markdown" as const,
    properties: {},
  };

  return (
    <BaseBlockView
      data={mockBlockData as any}
      width={nodeWidth}
      height={nodeHeight}
      draggable={false}
      onMouseEnter={() => { }}
      onMouseMove={() => { }}
      onMouseLeave={() => { }}
      showAddButtonZones={false}
      setHoverDirection={() => { }}
    >
      <HandlesView
        isConnectable={false}
        showLeft={false}
        showRight={false}
        showTop={false}
        showBottom={false}
      />

      <Content textColorClass="">
        <MarkdownBlockView
          htmlContent={htmlContent}
          selected={selected}
        />
      </Content>
    </BaseBlockView>
  );
}

export const MockMarkdownBlock = memo(MockMarkdownBlockComponent);
