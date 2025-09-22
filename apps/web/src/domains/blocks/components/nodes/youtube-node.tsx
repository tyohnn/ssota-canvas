"use client";

import { memo, useMemo } from 'react';
import { Handle, Position, Node } from '@xyflow/react';
import { NodeTopToolbar } from "./node-top-toolbar";
import { YouTubeRatioResizer } from "./youtube-ratio-resizer";
import { YouTubeLinkToolbarItem } from "./toolbar-items/youtube-link-toolbar-item";
import type { ReactFlowYouTubeNodeData } from "@/domains/blocks/types/youtube.node";

type YouTubeNodeProps = {
  id: string;
  type: string;
  data: ReactFlowYouTubeNodeData;
  selected?: boolean;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
};

const YouTubeNode = ({ 
  id,
  type,
  selected,
  position = { x: 0, y: 0 },
  data,
  width = 320,
  height = 180,
}: YouTubeNodeProps) => {
  // 현재 노드 객체 생성 (props 기반)
  const currentNode: Node = {
    id,
    type,
    selected,
    position,
    data,
    width,
    height,
  };

  // YouTube URL에서 video ID 추출
  const videoId = useMemo(() => {
    const url = data.formData?.url || '';
    if (!url) return null;

    // YouTube URL 패턴 매칭
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }, [data.formData?.url]);

  // YouTube iframe src 생성
  const iframeSrc = useMemo(() => {
    if (!videoId) return '';
    
    const params = new URLSearchParams({
      v: videoId,
      rel: '0', // 관련 동영상 표시 안함
      modestbranding: '1', // YouTube 로고 최소화
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId]);

  // 툴바 아이템들
  const toolbarItems = (
    <>
      <YouTubeLinkToolbarItem
        node={currentNode}
        currentUrl={data.formData?.url || ''}
      />
    </>
  );

  return (
    <>
      {/* 비율 유지 리사이저 */}
      <YouTubeRatioResizer
        node={currentNode}
        selected={selected || false}
        minWidth={320}
        minHeight={180}
        aspectRatio={16/9}
      />

      {/* 상단 툴바 */}
      <NodeTopToolbar
        node={currentNode}
        toolbarItems={toolbarItems}
      />

      {/* 핸들 */}
      <Handle type="target" position={Position.Left} className="opacity-50 w-2.5 h-2.5" />

      {/* 노드 본문 */}
      <div
        className="w-full h-full rounded-md transition-colors relative flex overflow-hidden bg-gray-100 border border-border"
        style={{ 
          width,
          height,
        }}
      >
        {videoId && iframeSrc ? (
          <iframe
            src={iframeSrc}
            title="YouTube video player"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-2">📺</div>
              <div className="text-sm">YouTube 링크를 입력하세요</div>
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="opacity-50 w-2.5 h-2.5" />
    </>
  );
};

export default memo(YouTubeNode);
