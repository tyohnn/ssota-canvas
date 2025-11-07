'use client';

import React, { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Search } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Input } from '@workspace/ui/components/ui/input';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { useBlockPropertyUpdate } from '../../../hooks/use-block-property-update';
import type {
  UnsplashImage,
  UnsplashSearchResponse,
} from '@/domains/block-management/shared/types/unsplash.types';

export interface UnsplashSearchActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

/**
 * UnsplashSearchAction Component
 *
 * Unsplash에서 이미지를 검색하고 선택하여 블록의 이미지를 변경하는 액션 컴포넌트
 */
export function UnsplashSearchAction({
  blockId,
  blockData,
}: UnsplashSearchActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { updateProperties } = useBlockPropertyUpdate();

  // Unsplash API 호출
  const fetchUnsplashImages = useCallback(async (query?: string) => {
    const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      console.error('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is not set');
      return [];
    }

    try {
      const params = new URLSearchParams({
        client_id: accessKey,
        per_page: '10',
        ...(query && { query }),
      });

      const endpoint = query
        ? `https://api.unsplash.com/search/photos?${params}`
        : `https://api.unsplash.com/photos/random?${params}&count=10`;

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      const data = await response.json();
      return query ? (data as UnsplashSearchResponse).results : data;
    } catch (error) {
      console.error('Failed to fetch Unsplash images:', error);
      return [];
    }
  }, []);

  // 다이얼로그 열기 시 랜덤 이미지 로드
  const handleOpenDialog = useCallback(async () => {
    setIsDialogOpen(true);
    setIsLoading(true);
    const randomImages = await fetchUnsplashImages();
    setImages(randomImages);
    setIsLoading(false);
  }, [fetchUnsplashImages]);

  // 검색 핸들러
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const searchResults = await fetchUnsplashImages(searchQuery);
    setImages(searchResults);
    setIsLoading(false);
  }, [searchQuery, fetchUnsplashImages]);

  // 이미지 선택 핸들러
  const handleSelectImage = useCallback(
    async (image: UnsplashImage) => {
      try {
        const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        if (!accessKey) {
          console.error('NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is not set');
          return;
        }

        // 1. Unsplash 다운로드 엔드포인트 트리거 (백그라운드 - API 가이드라인)
        // 응답을 기다릴 필요 없음 (통계 수집용)
        fetch(
          `https://api.unsplash.com/photos/${image.id}/download?client_id=${accessKey}`
        ).catch(err => console.warn('Unsplash download tracking failed:', err));

        // 2. 다이얼로그 즉시 닫기 (UX 개선)
        setIsDialogOpen(false);

        // 3. 블록 속성 일괄 업데이트 (한 번에 모든 속성 업데이트)
        const propertiesToUpdate: Record<string, unknown> = {
          imageUrl: image.urls.regular,
          imageSource: 'unsplash' as const,
          unsplashAuthorName: image.user.name,
          unsplashAuthorLink: `${image.user.links.html}?utm_source=ssota&utm_medium=referral`,
          caption: `Photo by @${image.user.name} on Unsplash`,
        };

        // alt 텍스트도 함께 업데이트 (선택적)
        if (image.alt_description) {
          propertiesToUpdate.alt = image.alt_description;
        }

        // 한 번의 호출로 모든 속성 업데이트
        await updateProperties(blockId, propertiesToUpdate, blockData);
      } catch (error) {
        console.error('Failed to select Unsplash image:', error);
      }
    },
    [blockId, updateProperties, blockData]
  );

  return (
    <>
      {/* Unsplash 검색 버튼 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              handleOpenDialog();
            }}
            className="h-6 w-6 p-0"
          >
            <Search className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" hasArrow={false} sideOffset={10}>
          <p>Unsplash 이미지 검색</p>
        </TooltipContent>
      </Tooltip>

      {/* Unsplash 검색 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          {/* 헤더 */}
          <DialogHeader>
            <DialogTitle>Unsplash 이미지 검색</DialogTitle>
            <DialogDescription>
              고품질 무료 이미지를 검색하고 선택하세요
            </DialogDescription>
          </DialogHeader>

          {/* 검색창 */}
          <div className="flex gap-2">
            <Input
              placeholder="검색어를 입력하세요..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 이미지 그리드 */}
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {images.map(image => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-blue-500 transition-all"
                    onClick={() => handleSelectImage(image)}
                  >
                    <img
                      src={image.urls.small}
                      alt={image.alt_description || 'Unsplash image'}
                      className="w-full aspect-video object-cover"
                    />

                    {/* 저자 정보 오버레이 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white">
                        Photo by{' '}
                        <a
                          href={`${image.user.links.html}?utm_source=ssota&utm_medium=referral`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-300"
                          onClick={e => e.stopPropagation()}
                        >
                          {image.user.name}
                        </a>
                        {' on '}
                        <a
                          href="https://unsplash.com?utm_source=ssota&utm_medium=referral"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-300"
                          onClick={e => e.stopPropagation()}
                        >
                          Unsplash
                        </a>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
