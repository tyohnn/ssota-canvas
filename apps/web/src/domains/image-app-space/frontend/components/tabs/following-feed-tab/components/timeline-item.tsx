/**
 * Timeline Item Component
 */

'use client';

import { Heart, Bookmark, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';
import type { ImageAssetWithStats } from '@/domains/image-app-space/backend/repositories/interfaces/image-asset.repository.interface';

interface TimelineItemProps {
  image: ImageAssetWithStats;
  onLike: () => void;
  onBookmark: () => void;
  onToggleFollow: () => void;
  isFollowing: boolean;
}

export function TimelineItem({
  image,
  onLike,
  onBookmark,
  onToggleFollow,
  isFollowing,
}: TimelineItemProps) {
  const creator = image.creatorProfile;

  return (
    <div className="border-b pb-6 mb-6">
      {/* Creator Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={creator?.avatarUrl || ''} />
            <AvatarFallback>{creator?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{creator?.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(image.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isFollowing ? 'outline' : 'default'}
          onClick={onToggleFollow}
          className="gap-2"
        >
          {isFollowing ? (
            <>
              <UserMinus className="h-4 w-4" />
              Unfollow
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Follow
            </>
          )}
        </Button>
      </div>

      {/* Image */}
      <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
        <img
          src={image.thumbnail_url || image.image_url}
          alt={image.title || 'Image'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Title & Description */}
      {image.title && <h3 className="font-medium mb-2">{image.title}</h3>}
      {image.description && (
        <p className="text-sm text-muted-foreground mb-4">
          {image.description}
        </p>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-4">
        <Button size="sm" variant="ghost" onClick={onLike} className="gap-2">
          <Heart
            className={`h-4 w-4 ${image.isLiked ? 'fill-current text-red-500' : ''}`}
          />
          {image.like_count}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onBookmark}
          className="gap-2"
        >
          <Bookmark
            className={`h-4 w-4 ${image.isBookmarked ? 'fill-current' : ''}`}
          />
          {image.bookmark_count}
        </Button>
      </div>
    </div>
  );
}
