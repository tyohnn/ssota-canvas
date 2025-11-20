import { useState, useCallback } from 'react';
import type { TopMenu, ExploreTab, CommunityTab } from './types';

/**
 * UI State Interface
 */
export interface ImageSpaceUIState {
  // Dialog 상태
  open: boolean;
  setOpen: (open: boolean) => void;
  handleOpenChange: (open: boolean) => void;

  // 메뉴 상태
  activeTopMenu: TopMenu;
  setActiveTopMenu: (menu: TopMenu) => void;

  // 탐색 탭 상태
  activeExploreTab: ExploreTab;
  setActiveExploreTab: (tab: ExploreTab) => void;

  // 커뮤니티 탭 상태
  activeCommunityTab: CommunityTab;
  setActiveCommunityTab: (tab: CommunityTab) => void;

  // 검색 상태
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // 카테고리 상태
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;

  // 새로고침 상태
  refreshTrigger: number;
  triggerRefresh: () => void;
}

/**
 * UI State Hook (노코드 툴용)
 *
 * 특징:
 * - 비즈니스 로직 없음
 * - 로컬 상태만 관리
 * - Framer에서 독립적으로 테스트 가능
 * - API 호출 없음
 */
export function useImageSpaceUI(): ImageSpaceUIState {
  const [open, setOpen] = useState(false);
  const [activeTopMenu, setActiveTopMenu] = useState<TopMenu>('explore');
  const [activeExploreTab, setActiveExploreTab] =
    useState<ExploreTab>('unsplash');
  const [activeCommunityTab, setActiveCommunityTab] =
    useState<CommunityTab>('ranking');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    // 닫힐 때 상태 초기화
    if (!nextOpen) {
      setSearchQuery('');
      setSelectedCategory(null);
      // 메뉴는 유지 (사용자가 마지막으로 본 탭 기억)
    }
  }, []);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    open,
    setOpen,
    handleOpenChange,
    activeTopMenu,
    setActiveTopMenu,
    activeExploreTab,
    setActiveExploreTab,
    activeCommunityTab,
    setActiveCommunityTab,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    refreshTrigger,
    triggerRefresh,
  };
}
