"use client";

import { useCallback, useRef } from "react";
import type { BlockPosition, Block, Edge } from "@/db/schema";
import { listPageBlockPositions } from "@/domains/canvas/actions/block-position.action";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { devLog } from "@/utils/dev-logger";

export interface UsePagePositionCacheResult {
  // Unified cache interface
  getPageData: (
    pageId: string
  ) => { positions: BlockPosition[]; edges: Edge[] } | null;
  loadPageData: (
    pageId: string
  ) => Promise<{ positions: BlockPosition[]; edges: Edge[] }>;
  isPageCached: (pageId: string) => boolean;
  clearCache: () => void;

  // Legacy methods for backward compatibility
  getPagePositions: (pageId: string) => BlockPosition[] | null;
  loadPagePositions: (pageId: string) => Promise<BlockPosition[]>;
  getPageEdges: (pageId: string) => Edge[] | null;
  loadPageEdges: (pageId: string) => Promise<Edge[]>;
  computeAndCachePageEdges: (pageId: string) => Edge[];
}

export function usePagePositionCache(): UsePagePositionCacheResult {
  const data = useCanvasData();
  
  const {
    setPagePositions,
    getPositionsForContext,
    upsertBlocks,
    edgesById,
    setContextEdges,
    getEdgesForContext,
  } = data;

  // 로딩 중인 페이지 추적
  const loadingPages = useRef<Set<string>>(new Set());
  const loadingEdges = useRef<Set<string>>(new Set());

  // 통합된 페이지 데이터 조회 (positions + edges)
  const getPageData = useCallback(
    (pageId: string): { positions: BlockPosition[]; edges: Edge[] } | null => {
      const positions = getPositionsForContext(pageId);
      const edges = getEdgesForContext ? getEdgesForContext(pageId) || [] : [];

      if (positions.length > 0) {
        return { positions, edges };
      }

      return null;
    },
    [getPositionsForContext, getEdgesForContext]
  );

  // 페이지 edges 계산 및 캐시
  const computeAndCachePageEdges = useCallback(
    (pageId: string): Edge[] => {
      if (!edgesById || !setContextEdges) return [];
      const positions = getPositionsForContext(pageId) || [];
      const nodeIdSet = new Set(
        positions.map((p) => p.block_id as string).filter(Boolean)
      );
      const allEdges = Object.values(edgesById) as Edge[];
      const scoped = allEdges.filter(
        (e) =>
          nodeIdSet.has(e.source_block_id as string) &&
          nodeIdSet.has(e.target_block_id as string)
      );
      if (scoped.length > 0) setContextEdges(pageId, scoped);
      return scoped;
    },
    [edgesById, setContextEdges, getPositionsForContext]
  );

  // 페이지 edges 로드 (계산 기반)
  const loadPageEdges = useCallback(
    async (pageId: string): Promise<Edge[]> => {
      // 이미 로딩 중인지 확인
      if (loadingEdges.current.has(pageId)) {
        // 로딩 완료까지 대기
        return new Promise((resolve) => {
          const checkLoaded = () => {
            const edges = getEdgesForContext
              ? getEdgesForContext(pageId) || []
              : [];
            if (edges.length > 0) {
              resolve(edges);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      // 로딩 시작
      loadingEdges.current.add(pageId);

      try {
        // positions가 먼저 로드되어야 edges를 계산할 수 있음
        const positions = getPositionsForContext(pageId);
        if (positions.length === 0) {
          // positions가 없으면 빈 배열 반환 (edges는 positions에 의존)
          return [];
        }

        // edges 계산 및 캐시
        const edges = computeAndCachePageEdges(pageId);

        return edges;
      } catch (error) {
        throw error;
      } finally {
        // 로딩 완료
        loadingEdges.current.delete(pageId);
      }
    },
    [getPositionsForContext, getEdgesForContext, computeAndCachePageEdges]
  );

  // 페이지 데이터 로드 (DB에서 가져오기 + edges 계산)
  const loadPageData = useCallback(
    async (
      pageId: string
    ): Promise<{ positions: BlockPosition[]; edges: Edge[] }> => {
      // 이미 로딩 중인지 확인
      if (loadingPages.current.has(pageId)) {
        // 로딩 완료까지 대기
        return new Promise((resolve) => {
          const checkLoaded = () => {
            const data = getPageData(pageId);
            if (data) {
              resolve(data);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      // 로딩 시작
      loadingPages.current.add(pageId);

      try {
        const result = await listPageBlockPositions({ pageId });

        if (!result.success) {
          throw new Error(result.error || "Failed to load page positions");
        }

        const { positions, blocks } = result.data || {
          positions: [],
          blocks: [],
        };

        // 블록 데이터를 SSOT에 추가
        if (upsertBlocks && blocks.length > 0) {
          upsertBlocks(blocks);
        }

        // positions 캐시에 저장
        setPagePositions(pageId, positions);

        // edges 계산 및 캐시 (positions 로드 후)
        let edges: Edge[] = [];
        if (positions.length > 0 && edgesById) {
          edges = computeAndCachePageEdges(pageId);
        }

        return { positions, edges };
      } catch (error) {
        throw error;
      } finally {
        // 로딩 완료
        loadingPages.current.delete(pageId);
      }
    },
    [
      setPagePositions,
      getPageData,
      upsertBlocks,
      edgesById,
      setContextEdges,
      computeAndCachePageEdges,
    ]
  );

  // 페이지가 캐시되어 있는지 확인
  const isPageCached = useCallback(
    (pageId: string): boolean => {
      const positions = getPositionsForContext(pageId);
      return positions.length > 0;
    },
    [getPositionsForContext]
  );

  // Legacy methods for backward compatibility
  const getPagePositions = useCallback(
    (pageId: string): BlockPosition[] | null => {
      const data = getPageData(pageId);
      return data ? data.positions : null;
    },
    [getPageData]
  );

  const loadPagePositions = useCallback(
    async (pageId: string): Promise<BlockPosition[]> => {
      const data = await loadPageData(pageId);
      return data.positions;
    },
    [loadPageData]
  );

  const getPageEdges = useCallback(
    (pageId: string): Edge[] | null => {
      const data = getPageData(pageId);
      return data ? data.edges : null;
    },
    [getPageData]
  );

  // 전체 캐시 정리
  const clearCache = useCallback(() => {
    // 현재 구현에서는 전역 클리어는 미구현
  }, []);

  return {
    // New unified interface
    getPageData,
    loadPageData,
    isPageCached,
    clearCache,

    // Legacy methods
    getPagePositions,
    loadPagePositions,
    getPageEdges,
    loadPageEdges,
    computeAndCachePageEdges,
  };
}
