'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Search, Clock, Loader2 } from 'lucide-react';

interface IconPickerProps {
  value?: string;
  onChange: (icon: string) => void;
  className?: string;
  /**
   * 최근 사용 아이콘 저장 키 (localStorage)
   * 기본값: 'icon-picker-recent'
   */
  storageKey?: string;
  /**
   * 최근 사용 아이콘 최대 개수
   * 기본값: 16
   */
  maxRecentIcons?: number;
  /**
   * 커스텀 트리거 엘리먼트
   * 제공되지 않으면 기본 버튼 사용
   */
  trigger?: React.ReactNode;
}

/**
 * 모든 Lucide 아이콘 이름 추출 (중복 제거)
 *
 * Lucide React는 같은 아이콘을 여러 이름으로 export합니다:
 * - Beef (기본)
 * - BeefIcon (별칭)
 * - LucideBeef (별칭)
 *
 * 전략: 같은 컴포넌트 reference를 가진 것들 중 가장 짧은 이름만 선택
 */
const getAllLucideIcons = (): string[] => {
  const iconMap = new Map<any, string>(); // component ref -> shortest name

  Object.keys(Icons)
    .filter(key => {
      // 대문자로 시작하는 키만 (React 컴포넌트)
      if (!/^[A-Z]/.test(key)) return false;

      // 특수 export 제외
      if (key === 'Icon' || key === 'LucideIcon') return false;

      // 실제 값이 존재하는지 확인
      const value = (Icons as any)[key];
      return value !== undefined && value !== null;
    })
    .forEach(key => {
      const component = (Icons as any)[key];
      const existing = iconMap.get(component);

      // 같은 컴포넌트가 이미 있으면 더 짧은 이름 선택
      // 길이가 같으면 알파벳 순으로 앞선 것 선택
      if (
        !existing ||
        key.length < existing.length ||
        (key.length === existing.length && key < existing)
      ) {
        iconMap.set(component, key);
      }
    });

  return Array.from(iconMap.values()).sort(); // 알파벳 순 정렬
};

const ALL_LUCIDE_ICONS = getAllLucideIcons();

/**
 * 인기 아이콘 (빠른 선택용)
 */
const POPULAR_ICONS = [
  'Folder',
  'FolderOpen',
  'Briefcase',
  'Building',
  'Palette',
  'Sparkles',
  'Laptop',
  'Code',
  'Rocket',
  'Target',
  'Users',
  'MessageSquare',
  'BarChart',
  'TrendingUp',
  'Heart',
  'Star',
];

/**
 * IconPicker 컴포넌트
 *
 * 🎨 프로덕션 레디 Lucide 아이콘 선택기
 *
 * **Features:**
 * - ✨ 1400+ Lucide 아이콘 지원
 * - 🔍 실시간 검색 (대소문자 무시)
 * - 🕒 최근 사용 아이콘 (localStorage 영속성)
 * - ⚡ 빠른 선택 (인기 아이콘)
 * - ⌨️  자동 포커스 검색 필드
 * - 🎭 동적 아이콘 렌더링
 * - ♿ 접근성 지원 (title, aria-label)
 * - 📦 컴팩트한 UI (360px × 480px)
 *
 * **Performance:**
 * - 🚀 가상 스크롤 (처음 100개만 렌더링)
 * - 📜 무한 스크롤 (스크롤 시 점진적 로딩)
 * - useMemo로 필터링 최적화
 * - useCallback로 핸들러 최적화
 *
 * @example
 * ```tsx
 * <IconPicker
 *   value={selectedIcon}
 *   onChange={setSelectedIcon}
 *   storageKey="workspace-icons"
 *   maxRecentIcons={16}
 * />
 * ```
 */
export function IconPicker({
  value,
  onChange,
  className,
  storageKey = 'icon-picker-recent',
  maxRecentIcons = 16,
  trigger,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIcons, setRecentIcons] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(100); // 처음에 100개만 렌더링
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null); // NEW: Sentinel for observer
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 검색어로 필터링 (useMemo를 먼저 정의)
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return ALL_LUCIDE_ICONS;

    const query = searchQuery.toLowerCase();
    return ALL_LUCIDE_ICONS.filter(name => name.toLowerCase().includes(query));
  }, [searchQuery]);

  // 최근 사용 아이콘 불러오기 (localStorage)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentIcons(parsed);
        }
      }
    } catch (error) {
      console.warn('[IconPicker] Failed to load recent icons:', error);
    }
  }, [storageKey]);

  // NEW: Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // 기존 Observer 해제
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // NEW: 지연으로 DOM 마운트 대기
    const timer = setTimeout(() => {
      if (!sentinelRef.current || !scrollContainerRef.current) {
        console.log('[IconPicker] Observer 스킵 (DOM 여전히 미준비)');
        return;
      }

      const observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          if (
            entry &&
            entry.isIntersecting &&
            visibleCount < filteredIcons.length
          ) {
            const nextCount = Math.min(
              visibleCount + 100,
              filteredIcons.length
            );
            console.log(
              '[IconPicker] Observer: 더 로드',
              visibleCount,
              '→',
              nextCount
            );
            setVisibleCount(nextCount);
          }
        },
        {
          root: scrollContainerRef.current,
          rootMargin: '0px 0px 200px 0px', // 하단 200px 전에 로드
          threshold: 0.1,
        }
      );

      observer.observe(sentinelRef.current);
      observerRef.current = observer;
      console.log('[IconPicker] Observer 등록 ✅ (지연 후)');
    }, 0);

    return () => {
      clearTimeout(timer);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      console.log('[IconPicker] Observer 클린업');
    };
  }, [isOpen, visibleCount, filteredIcons.length]);

  // 스크롤은 기본 브라우저 동작에 맡긴다 (overscroll CSS로 제어)

  // Popover가 열릴 때 visibleCount 초기화
  useEffect(() => {
    if (isOpen) {
      console.log('[IconPicker] Popover 열림 - 초기화');
      setVisibleCount(100);
      setSearchQuery('');
    } else {
      console.log('[IconPicker] Popover 닫힘');
    }
  }, [isOpen]);

  // 아이콘 선택 핸들러 (최근 사용 업데이트)
  const handleSelectIcon = useCallback(
    (iconName: string) => {
      onChange(iconName);
      setIsOpen(false);
      setSearchQuery(''); // 검색 초기화

      // 최근 사용 아이콘 업데이트
      if (typeof window === 'undefined') return;

      try {
        const newRecent = [
          iconName,
          ...recentIcons.filter(i => i !== iconName),
        ].slice(0, maxRecentIcons);

        setRecentIcons(newRecent);
        localStorage.setItem(storageKey, JSON.stringify(newRecent));
      } catch (error) {
        console.warn('[IconPicker] Failed to save recent icon:', error);
      }
    },
    [onChange, recentIcons, storageKey, maxRecentIcons]
  );

  // 동적 아이콘 렌더링
  const renderIcon = useCallback((iconName: string, size: number = 16) => {
    const IconComponent = (Icons as any)[iconName];
    if (!IconComponent) return null;
    return <IconComponent size={size} />;
  }, []);

  // 아이콘 버튼 렌더링 (재사용)
  const renderIconButton = useCallback(
    (iconName: string, size: number = 20) => (
      <Button
        key={iconName}
        type="button"
        variant={value === iconName ? 'default' : 'ghost'}
        size="sm"
        className="h-9 w-9 p-0"
        onClick={() => handleSelectIcon(iconName)}
        title={iconName}
        aria-label={`Select ${iconName} icon`}
      >
        {renderIcon(iconName, size)}
      </Button>
    ),
    [value, handleSelectIcon, renderIcon]
  );

  // 표시할 아이콘 목록 (visibleCount만큼만)
  const visibleIcons = useMemo(() => {
    const icons = filteredIcons.slice(0, visibleCount);
    return icons;
  }, [filteredIcons, visibleCount]);

  // 최근 사용 아이콘 (실제로 존재하는 것만)
  const validRecentIcons = useMemo(
    () => recentIcons.filter(name => ALL_LUCIDE_ICONS.includes(name)),
    [recentIcons]
  );

  // 검색 결과가 없을 때
  const noResults = filteredIcons.length === 0;

  // 더 로드할 아이콘이 있는지
  const hasMore = visibleCount < filteredIcons.length;
  const isLoadingMore = hasMore && isOpen; // show spinner only when open and more to load

  // 내부 상태 디버그가 필요하면 주석 해제
  // console.log('[IconPicker] 렌더링:', { isOpen, searchQuery, noResults, hasMore, visibleCount, filteredCount: filteredIcons.length });

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {trigger || (
          <Button
            type="button"
            variant="outline"
            className={cn('h-9 w-9 p-0', className)}
            title={`현재 아이콘: ${value || 'Folder'}`}
            aria-label="Open icon picker"
          >
            {renderIcon(value || 'Folder', 20)}
          </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-[360px] h-[420px] p-0 flex flex-col overflow-hidden"
          align="start"
          side="bottom"
          sideOffset={4}
        >
          {/* 검색 필드 - sticky */}
          <div className="p-3 border-b bg-background shrink-0 sticky top-0 z-10">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="아이콘 검색... (예: folder, home)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
                autoFocus
                aria-label="Search icons"
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {searchQuery ? (
                <>
                  <strong>{filteredIcons.length}</strong>개 발견
                </>
              ) : (
                <>
                  총 <strong>{ALL_LUCIDE_ICONS.length}</strong>개
                </>
              )}
            </p>
          </div>

          {/* 아이콘 그리드 - 스크롤 영역 */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-background overscroll-contain [scrollbar-width:thin]"
          >
            {/* 최근 사용 아이콘 (검색 없을 때만) */}
            {!searchQuery && validRecentIcons.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-medium">최근 사용</h3>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {validRecentIcons.map(iconName => renderIconButton(iconName))}
                </div>
              </div>
            )}

            {/* 인기 아이콘 (검색 없을 때만) */}
            {!searchQuery && (
              <div className="p-3 border-b">
                <h3 className="text-xs font-medium mb-2">인기 아이콘</h3>
                <div className="grid grid-cols-7 gap-0.5">
                  {POPULAR_ICONS.map(iconName => renderIconButton(iconName))}
                </div>
              </div>
            )}

            {/* 전체 아이콘 그리드 */}
            <div className="p-3">
              {!searchQuery && (
                <h3 className="text-xs font-medium mb-2">모든 아이콘</h3>
              )}

              {noResults ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-2">
                    "{searchQuery}" 검색 결과가 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground">
                    다른 키워드로 검색해보세요
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-7 gap-0.5">
                    {visibleIcons.map(iconName => renderIconButton(iconName))}
                  </div>
                  {hasMore && <div ref={sentinelRef} className="h-1" />}
                  {hasMore && (
                    <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground">
                      {isLoadingMore && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <p className="text-xs">
                        더 로드 중... ({visibleCount} / {filteredIcons.length})
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 안내 - 고정 */}
          <div className="px-3 py-2 border-t bg-muted/50 shrink-0">
            <p className="text-xs text-muted-foreground text-center">
              스크롤하여 더 많은 아이콘 탐색
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}

/**
 * WorkspaceIcon 컴포넌트
 *
 * Workspace 아이콘 표시
 * - Lucide 아이콘 이름으로 동적 렌더링
 * - 기본 아이콘 폴백 (Folder)
 */
interface WorkspaceIconProps {
  icon?: string | null;
  size?: number;
  className?: string;
}

export function WorkspaceIcon({
  icon,
  size = 16,
  className,
}: WorkspaceIconProps) {
  const iconName = icon || 'Folder'; // 기본값
  const IconComponent = (Icons as any)[iconName];

  if (!IconComponent) {
    // 아이콘을 찾을 수 없으면 기본 Folder 아이콘
    return <Icons.Folder size={size} className={className} />;
  }

  return <IconComponent size={size} className={className} />;
}
