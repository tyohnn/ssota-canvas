/**
 * Audio Block Hook (Composition)
 *
 * use-audio-block-player (재생) + use-audio-block-data (데이터/업로드/녹음)를 조합.
 */
'use client';

import { useMemo } from 'react';

import { useReactFlow } from '@xyflow/react';

import type { UseAudioBlockProps, UseAudioBlockReturn } from './types';
import { useAudioBlockData } from './use-audio-block-data';
import { useAudioBlockPlayer } from './use-audio-block-player';

export function useAudioBlock(props: UseAudioBlockProps): UseAudioBlockReturn {
  const { nodeData, nodeId, selected, updateBlockTitle } = props;
  const { getNode, updateNode } = useReactFlow();
  const reactFlow = { getNode, updateNode };

  const data = useAudioBlockData({
    nodeData,
    nodeId,
    updateBlockTitle,
    reactFlow,
  });

  const player = useAudioBlockPlayer({
    audioUrl: data.audioUrl,
    nodeData,
    reactFlow,
  });

  return useMemo(
    (): UseAudioBlockReturn => ({
      ...data,
      ...player,
    }),
    [data, player]
  );
}
