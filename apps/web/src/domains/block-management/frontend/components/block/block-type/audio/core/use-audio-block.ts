/**
 * Audio Block Hook (Composition)
 *
 * use-audio-block-player (재생) + use-audio-block-data (데이터/업로드/녹음)를 조합.
 */
'use client';

import { useCallback, useEffect, useMemo } from 'react';

import { useReactFlow } from '@xyflow/react';

import {
  loadBlockInteractions,
  useBlockInteraction,
} from '@/domains/canvas-management/frontend/contexts/block-interaction-context';

import type { UseAudioBlockProps, UseAudioBlockReturn } from './types';
import { useAudioBlockData } from './use-audio-block-data';
import { useAudioBlockPlayer } from './use-audio-block-player';

export function useAudioBlock(props: UseAudioBlockProps): UseAudioBlockReturn {
  const { nodeData, nodeId, selected, updateBlockTitle } = props;
  const { getNode, updateNode } = useReactFlow();
  const reactFlow = { getNode, updateNode };
  const { registerBlockInteractions, unregisterBlockInteractions } =
    useBlockInteraction();

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

  const registerInteractions = useCallback(async () => {
    if (!selected || !data.audioUrl) return;
    try {
      const interactions = await loadBlockInteractions('audio');
      const boundInteractions: Record<string, (...args: any[]) => void> = {};
      if (interactions.seekTo && typeof interactions.seekTo === 'function') {
        const seekToFn = interactions.seekTo;
        boundInteractions.seekTo = (seconds: number) => {
          seekToFn(player.audioRef, seconds);
        };
      }
      registerBlockInteractions(nodeId, boundInteractions);
    } catch (error) {
      console.warn(
        '[Audio Block] Failed to load and register interactions:',
        error
      );
    }
  }, [
    selected,
    data.audioUrl,
    nodeId,
    player.audioRef,
    registerBlockInteractions,
  ]);

  useEffect(() => {
    if (selected && data.audioUrl) {
      registerInteractions();
    } else {
      unregisterBlockInteractions(nodeId);
    }
    return () => unregisterBlockInteractions(nodeId);
  }, [
    selected,
    data.audioUrl,
    nodeId,
    registerInteractions,
    unregisterBlockInteractions,
  ]);

  return useMemo(
    (): UseAudioBlockReturn => ({
      ...data,
      ...player,
    }),
    [data, player]
  );
}
