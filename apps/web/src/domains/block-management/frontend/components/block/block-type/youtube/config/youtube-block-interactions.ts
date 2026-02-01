/**
 * YouTube Block Interactions
 *
 * YouTube 블록의 인터랙션 함수들을 정의합니다.
 * 각 인터랙션은 블록 인스턴스의 상태(playerRef 등)를 받아서 실행됩니다.
 *
 * Convention:
 * - 파일명: {blockType}-block-interactions.ts
 * - Export: {BlockType}BlockInteractions (예: YoutubeBlockInteractions)
 * - 각 인터랙션은 함수 팩토리 형태로 정의 (블록 인스턴스 상태를 받음)
 */
import type { YouTubePlayer } from '../core/types';

/**
 * YouTube Block Interactions
 *
 * YouTube 블록에서 사용 가능한 인터랙션 함수들
 * 각 함수는 블록 인스턴스의 상태를 받아서 실행됩니다.
 */
export const YoutubeBlockInteractions = {
  /**
   * YouTube 비디오의 재생 위치를 특정 시간으로 이동하고 자동 재생
   *
   * @param playerRef - YouTube Player 인스턴스 ref
   * @param seconds - 이동할 시간 (초)
   */
  seekTo: (playerRef: { current: YouTubePlayer | null }, seconds: number) => {
    const player = playerRef.current;
    if (!player || typeof player.seekTo !== 'function') return;
    try {
      player.seekTo(seconds, true);
      if (typeof player.playVideo === 'function') {
        player.playVideo();
      }
    } catch (error) {
      console.warn('[YouTube Block] seekTo/playVideo failed (player may be unmounted):', error);
    }
  },

  // 향후 추가 가능한 인터랙션들:
  // play: (playerRef: { current: YouTubePlayer | null }) => { ... },
  // pause: (playerRef: { current: YouTubePlayer | null }) => { ... },
  // setVolume: (playerRef: { current: YouTubePlayer | null }, volume: number) => { ... },
};
