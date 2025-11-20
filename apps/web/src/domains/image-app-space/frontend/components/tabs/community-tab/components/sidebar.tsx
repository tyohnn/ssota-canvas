/**
 * Community Sidebar Component
 *
 * Sort 선택 및 Category 필터
 */

'use client';

import {
  TrendingUp,
  Trophy,
  Grid,
  Trees,
  Building2,
  Users,
  Dog,
  Cpu,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { useCommunityFeedContext } from '../core/community-feed.context';
import type { ImageCategory } from '@/db/schemas/image-app-space-schema';

/**
 * Category Definition
 */
interface CategoryItem {
  id: ImageCategory | 'all';
  label: string;
  icon: React.ReactNode;
}

/**
 * Community Categories
 */
const COMMUNITY_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', icon: <Grid className="h-4 w-4" /> },
  { id: 'art', label: 'Art', icon: <Trophy className="h-4 w-4" /> },
  { id: 'nature', label: 'Nature', icon: <Trees className="h-4 w-4" /> },
  {
    id: 'architecture',
    label: 'Architecture',
    icon: <Building2 className="h-4 w-4" />,
  },
  { id: 'portrait', label: 'Portrait', icon: <Users className="h-4 w-4" /> },
  { id: 'photo', label: 'Photo', icon: <Dog className="h-4 w-4" /> },
  {
    id: 'design',
    label: 'Design',
    icon: <Cpu className="h-4 w-4" />,
  },
];

/**
 * Community Sidebar
 *
 * Sort 방식 및 Category 필터
 */
export function CommunitySidebar() {
  const { sort, setSort, category, setCategory } = useCommunityFeedContext();

  return (
    <div className="w-48 border-r bg-muted/20">
      <div className="p-4">
        {/* Sort Buttons */}
        <div className="mb-4">
          <div className="flex flex-col gap-1">
            <Button
              variant={sort === 'trending' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort('trending')}
              className="justify-start gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Trending
            </Button>
            <Button
              variant={sort === 'recent' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setSort('recent')}
              className="justify-start gap-2"
            >
              <Trophy className="h-4 w-4" />
              Recent
            </Button>
          </div>
        </div>

        {/* Categories */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">
            Categories
          </h3>
          <ScrollArea className="h-[calc(90vh-300px)]">
            <div className="flex flex-col gap-1">
              {COMMUNITY_CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={
                    (category ?? 'all') === cat.id ? 'secondary' : 'ghost'
                  }
                  size="sm"
                  onClick={() =>
                    setCategory(
                      cat.id === 'all' ? undefined : (cat.id as ImageCategory)
                    )
                  }
                  className="justify-start gap-2"
                >
                  {cat.icon}
                  {cat.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
