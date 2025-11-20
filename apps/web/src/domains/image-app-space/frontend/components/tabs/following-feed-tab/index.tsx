/**
 * Following Feed Tab
 *
 * Process Model: Scenario 5 - 팔로잉 피드 조회
 */

'use client';

import { FollowingFeedContext } from './core/following-feed.context';
import { useFollowingFeedBusiness } from './core/use-following-feed.business';
import { TimelineItem } from './components/timeline-item';
import { EmptyFollowingState } from './components/empty-state';
import { useImageSpaceContext } from '../../../core/image-space.context';
import { Box } from '@workspace/ui/components/ui/box';

export function FollowingFeedTab() {
  const businessLogic = useFollowingFeedBusiness();
  const { setActiveTopMenu } = useImageSpaceContext();

  const handleExploreCommunity = () => {
    setActiveTopMenu('community');
  };

  return (
    <FollowingFeedContext.Provider value={businessLogic}>
      <Box className="flex-1 min-h-0 overflow-y-auto">
        {!businessLogic.hasFollowing && !businessLogic.isLoading ? (
          <EmptyFollowingState onExploreCommunity={handleExploreCommunity} />
        ) : (
          <div className="p-6 max-w-2xl mx-auto">
            {businessLogic.images.map(image => (
              <TimelineItem
                key={image.id}
                image={image}
                onLike={() => businessLogic.toggleLike(image.id)}
                onBookmark={() => businessLogic.toggleBookmark(image.id)}
                onToggleFollow={() =>
                  businessLogic.toggleFollow(image.created_by)
                }
                isFollowing={true} // TODO: 실제 팔로우 상태 확인
              />
            ))}

            {businessLogic.isLoading && (
              <div className="text-center py-4 text-muted-foreground">
                Loading...
              </div>
            )}
          </div>
        )}
      </Box>
    </FollowingFeedContext.Provider>
  );
}
