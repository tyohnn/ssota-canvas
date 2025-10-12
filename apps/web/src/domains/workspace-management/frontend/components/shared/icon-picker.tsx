'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Search, Clock } from 'lucide-react';

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
}

/**
 * 모든 Lucide 아이콘 이름 추출
 *
 * Lucide React는 각 아이콘을 ForwardRefExoticComponent로 export합니다.
 *
 * 필터링 전략:
 * 1. 대문자로 시작하는 키 (React 컴포넌트 네이밍 컨벤션)
 * 2. 특수 export 제외 (Icon, LucideIcon 등)
 */
const getAllLucideIcons = (): string[] => {
  const iconNames = Object.keys(Icons)
    .filter(key => {
      // 대문자로 시작하는 키만 (React 컴포넌트)
      if (!/^[A-Z]/.test(key)) return false;

      // 특수 export 제외
      if (key === 'Icon' || key === 'LucideIcon') return false;

      // 실제 값이 존재하는지 확인
      const value = (Icons as any)[key];
      return value !== undefined && value !== null;
    })
    .sort(); // 알파벳 순 정렬

  console.log(`[IconPicker] Loaded ${iconNames.length} Lucide icons`);

  return iconNames;
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
 * 🎨 오픈소스 품질의 Lucide 아이콘 선택기
 *
 * **Features:**
 * - ✨ 1400+ Lucide 아이콘 지원
 * - 🔍 실시간 검색 (대소문자 무시)
 * - 🕒 최근 사용 아이콘 (localStorage 영속성)
 * - ⚡ 빠른 선택 (인기 아이콘)
 * - ⌨️  자동 포커스 검색 필드
 * - 🎯 큰 아이콘 버튼 (쉬운 타겟)
 * - 🎭 동적 아이콘 렌더링
 * - ♿ 접근성 지원 (title, aria-label)
 *
 * **Performance:**
 * - useMemo로 필터링 최적화
 * - useCallback로 핸들러 최적화
 * - 고정 높이 스크롤 (overflow-y-scroll)
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
}: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentIcons, setRecentIcons] = useState<string[]>([]);

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

  // 검색어로 필터링
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return ALL_LUCIDE_ICONS;

    const query = searchQuery.toLowerCase();
    return ALL_LUCIDE_ICONS.filter(name => name.toLowerCase().includes(query));
  }, [searchQuery]);

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
        className="h-12 w-12 p-0"
        onClick={() => handleSelectIcon(iconName)}
        title={iconName}
        aria-label={`Select ${iconName} icon`}
      >
        {renderIcon(iconName, size)}
      </Button>
    ),
    [value, handleSelectIcon, renderIcon]
  );

  // 최근 사용 아이콘 (실제로 존재하는 것만)
  const validRecentIcons = useMemo(
    () => recentIcons.filter(name => ALL_LUCIDE_ICONS.includes(name)),
    [recentIcons]
  );

  // 검색 결과가 없을 때
  const noResults = filteredIcons.length === 0;

  return (
    <>
      <style jsx>{`
        .icon-picker-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .icon-picker-scroll::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 6px;
        }
        .icon-picker-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground) / 0.3);
          border-radius: 6px;
          border: 2px solid hsl(var(--muted));
        }
        .icon-picker-scroll::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--muted-foreground) / 0.5);
        }
      `}</style>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn('h-16 w-16 p-0', className)}
            title={`현재 아이콘: ${value || 'Folder'}`}
            aria-label="Open icon picker"
          >
            {renderIcon(value || 'Folder', 32)}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[520px] h-[600px] p-0 flex flex-col"
          align="start"
          side="bottom"
          sideOffset={4}
        >
        {/* 검색 필드 - 고정 */}
        <div className="p-4 border-b bg-background shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="아이콘 검색... (예: folder, home, arrow)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
              aria-label="Search icons"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {searchQuery ? (
              <>
                <strong>{filteredIcons.length}</strong>개 아이콘 발견
              </>
            ) : (
              <>
                총 <strong>{ALL_LUCIDE_ICONS.length}</strong>개의 Lucide 아이콘
              </>
            )}
          </p>
        </div>

        {/* 아이콘 그리드 - 스크롤 가능 영역 */}
        <div
          className="icon-picker-scroll flex-1 overflow-y-scroll overflow-x-hidden bg-background"
          style={{
            minHeight: 0, // flex 자식이 스크롤되도록
          }}
        >
            {/* 최근 사용 아이콘 (검색 없을 때만) */}
            {!searchQuery && validRecentIcons.length > 0 && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">최근 사용</h3>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {validRecentIcons.map(iconName => renderIconButton(iconName))}
                </div>
              </div>
            )}

            {/* 인기 아이콘 (검색 없을 때만) */}
            {!searchQuery && (
              <div className="p-4 border-b">
                <h3 className="text-sm font-medium mb-3">인기 아이콘</h3>
                <div className="grid grid-cols-8 gap-1">
                  {POPULAR_ICONS.map(iconName => renderIconButton(iconName))}
                </div>
              </div>
            )}

            {/* 전체 아이콘 그리드 */}
            <div className="p-4">
              {!searchQuery && (
                <h3 className="text-sm font-medium mb-3">모든 아이콘</h3>
              )}

              {noResults ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground mb-2">
                    "{searchQuery}" 검색 결과가 없습니다
                  </p>
                  <p className="text-xs text-muted-foreground">
                    다른 키워드로 검색해보세요
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-1">
                  {filteredIcons.map(iconName => renderIconButton(iconName))}
                </div>
              )}
            </div>
        </div>

        {/* 안내 - 고정 */}
        <div className="p-3 border-t bg-muted/50 shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            마우스 휠로 스크롤하거나 아이콘을 클릭하여 선택하세요 · Made with ❤️
            for Open Source
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
