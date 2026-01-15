'use client';

import React from 'react';

import YouTube, { type YouTubeProps } from 'react-youtube';

import { Box } from '@/components/ui/box';

import type { YouTubePlayer } from '../core/types';

interface YoutubePlayerOverlayProps {
  videoId: string;
  title: string;
  isLoading: boolean;
  onReady: (event: { target: YouTubePlayer }) => void;
}

/**
 * YouTube Player Overlay Component
 *
 * react-youtube를 사용한 플레이어 오버레이 컴포넌트
 */
export function YoutubePlayerOverlay({
  videoId,
  title,
  isLoading,
  onReady,
}: YoutubePlayerOverlayProps) {
  const opts: YouTubeProps['opts'] = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <Box className="absolute inset-0 bg-black flex items-center justify-center">
      {/* 로딩 스켈레톤 */}
      {isLoading && (
        <Box className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <Box className="flex flex-col items-center gap-3">
            <Box className="w-16 h-16 border-4 border-white/30 border-t-red-500 rounded-full animate-spin" />
            <p className="text-sm text-white/80">Loading video...</p>
          </Box>
        </Box>
      )}

      {/* react-youtube 플레이어 (항상 렌더링, 재생 상태 유지) */}
      {/* key prop을 추가하여 videoId 변경 시 완전히 리마운트하여 이전 player 인스턴스와의 충돌 방지 */}
      <Box className="w-full h-full">
        <YouTube
          key={videoId}
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          className="w-full h-full"
          iframeClassName="w-full h-full"
        />
      </Box>
    </Box>
  );
}
