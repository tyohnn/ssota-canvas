/**
 * Community Feed Provider
 *
 * Context Provider 구현
 */

'use client';

import React from 'react';
import { CommunityFeedContext } from './community-feed.context';
import { useCommunityFeed } from './use-community-feed';

/**
 * Community Feed Provider Props
 */
export interface CommunityFeedProviderProps {
  children: React.ReactNode;
}

/**
 * Community Feed Provider
 *
 * Context를 통해 상태 및 액션 제공
 */
export function CommunityFeedProvider({
  children,
}: CommunityFeedProviderProps) {
  const value = useCommunityFeed();

  return (
    <CommunityFeedContext.Provider value={value}>
      {children}
    </CommunityFeedContext.Provider>
  );
}
