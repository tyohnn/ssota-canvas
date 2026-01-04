'use client';

import React, { useMemo, useState } from 'react';
import { useShare } from '../hooks/use-share';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface PublishFlowProps {
  pageId: string;
  isOwner: boolean;
  onPublished?: (publishUrl: string) => void;
}

export function PublishFlow({ pageId, isOwner, onPublished }: PublishFlowProps) {
  const { publishPage, unpublishPage, copyLinkToClipboard } = useShare();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  const handlePublish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await publishPage({ pageId });
      setPublishUrl(result.publishUrl);
      onPublished?.(result.publishUrl);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to publish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!publishUrl) return;
    const fullUrl = publishUrl.startsWith('http')
      ? publishUrl
      : `${window.location.origin}${publishUrl}`;
    await copyLinkToClipboard(fullUrl);
    setIsLinkCopied(true);
    window.setTimeout(() => setIsLinkCopied(false), 1200);
  };

  const handleUnpublish = async () => {
    if (!publishUrl) return;
    const confirmed = window.confirm('게시를 취소하시겠습니까?');
    if (!confirmed) return;

    setIsUnpublishing(true);
    setError(null);
    try {
      await unpublishPage({ pageId });
      setPublishUrl(null);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to unpublish');
    } finally {
      setIsUnpublishing(false);
    }
  };

  const normalizedUrl = useMemo(() => {
    if (!publishUrl) return null;
    const fullUrl = publishUrl.startsWith('http')
      ? publishUrl
      : `${window.location.origin}${publishUrl}`;
    return fullUrl;
  }, [publishUrl]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!isOwner}
          title={!isOwner ? '페이지 소유자만 게시할 수 있습니다' : undefined}
          className={cn(
            'h-8 px-3 text-sm font-medium',
            'hover:bg-accent/60 hover:text-accent-foreground'
          )}
        >
          게시
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 overflow-hidden rounded-xl border border-border/70 shadow-xl"
      >
        <div className="border-b border-border/60 px-4 pt-3">
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="relative pb-2 text-foreground">
              게시
              <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-foreground" />
            </span>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">웹사이트 게시</h3>
            <p className="text-xs text-muted-foreground">
              게시된 페이지는 링크로 누구나 접근할 수 있습니다.
            </p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="rounded-md border border-border/60 bg-background">
              <div className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
              </div>
              <div className="px-3 pb-3 pt-1 space-y-2">
                <div className="h-2 w-24 rounded-full bg-muted-foreground/30" />
                <div className="h-2 w-32 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-20 rounded-full bg-muted-foreground/20" />
              </div>
            </div>
          </div>

          {publishUrl ? (
            <div className="space-y-3">
              <div className="rounded-md border border-border/60 bg-background px-3 py-2">
                <input
                  type="text"
                  readOnly
                  value={normalizedUrl ?? ''}
                  className="w-full bg-transparent text-xs text-muted-foreground outline-none select-all truncate"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleCopy}
                  className={`transition-shadow active:shadow-inner ${
                    isLinkCopied ? 'bg-accent text-accent-foreground shadow-sm' : ''
                  }`}
                >
                  {isLinkCopied ? '링크 복사됨' : '링크 복사'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (publishUrl) window.open(publishUrl, '_blank');
                  }}
                  className="transition-shadow active:shadow-inner"
                >
                  게시된 페이지 보기
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUnpublish}
                  disabled={isUnpublishing}
                  className="transition-shadow active:shadow-inner"
                >
                  게시 취소
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handlePublish}
                disabled={isSubmitting}
                className="w-full"
              >
                게시
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                닫기
              </Button>
            </div>
          )}

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
