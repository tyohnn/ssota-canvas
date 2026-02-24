import type { RefObject } from 'react';

/**
 * Audio Block Interactions
 *
 * Audio 블록의 인터랙션 함수들을 정의합니다.
 * 각 인터랙션은 블록 인스턴스의 상태(audioRef 등)를 받아서 실행됩니다.
 *
 * Convention:
 * - 파일명: {blockType}-block-interactions.ts
 * - Export: {BlockType}BlockInteractions (예: AudioBlockInteractions)
 * - 각 인터랙션은 함수 팩토리 형태로 정의 (블록 인스턴스 상태를 받음)
 */

/**
 * Audio Block Interactions
 *
 * Audio 블록에서 사용 가능한 인터랙션 함수들
 * 각 함수는 블록 인스턴스의 상태를 받아서 실행됩니다.
 */
export const AudioBlockInteractions = {
  /**
   * 오디오 재생 위치를 특정 시간(초)으로 이동
   *
   * @param audioRef - HTMLAudioElement ref
   * @param seconds - 이동할 시간 (초)
   */
  seekTo: (audioRef: RefObject<HTMLAudioElement | null>, seconds: number) => {
    const el = audioRef?.current;
    if (!el || !isFinite(seconds)) return;
    try {
      el.currentTime = seconds;
    } catch (error) {
      console.warn(
        '[Audio Block] seekTo failed (element may be unmounted):',
        error
      );
    }
  },
};
