/**
 * Following Feed Empty State
 */

'use client';

import { Users } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';

interface EmptyFollowingStateProps {
  onExploreCommunity: () => void;
}

export function EmptyFollowingState({
  onExploreCommunity,
}: EmptyFollowingStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="mb-4 flex justify-center">
          <div className="p-4 rounded-full bg-muted">
            <Users className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Follow creators to see their latest images
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Discover amazing creators in the community and follow them to get
          updates on their latest work.
        </p>
        <Button onClick={onExploreCommunity}>Explore Community</Button>
      </div>
    </div>
  );
}
