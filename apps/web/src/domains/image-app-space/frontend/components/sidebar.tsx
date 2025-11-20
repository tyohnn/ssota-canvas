'use client';

import {
  Grid,
  Trees,
  Building2,
  Users,
  Dog,
  Cpu,
  UtensilsCrossed,
  Plane,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { useImageSpaceContext } from '../core/image-space.context';
import type { Category } from '../core/types';

/**
 * 카테고리 목록 (기본값)
 */
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', label: 'All', icon: <Grid className="h-4 w-4" /> },
  { id: 'nature', label: 'Nature', icon: <Trees className="h-4 w-4" /> },
  {
    id: 'architecture',
    label: 'Architecture',
    icon: <Building2 className="h-4 w-4" />,
  },
  { id: 'people', label: 'People', icon: <Users className="h-4 w-4" /> },
  { id: 'animals', label: 'Animals', icon: <Dog className="h-4 w-4" /> },
  { id: 'technology', label: 'Technology', icon: <Cpu className="h-4 w-4" /> },
  { id: 'food', label: 'Food', icon: <UtensilsCrossed className="h-4 w-4" /> },
  { id: 'travel', label: 'Travel', icon: <Plane className="h-4 w-4" /> },
  {
    id: 'business',
    label: 'Business',
    icon: <Briefcase className="h-4 w-4" />,
  },
  { id: 'abstract', label: 'Abstract', icon: <Sparkles className="h-4 w-4" /> },
];

/**
 * Image Space Sidebar Props
 */
export interface ImageSpaceSidebarProps {
  categories?: Category[];
}

/**
 * Image Space Sidebar
 *
 * 좌측 카테고리 리스트
 */
export function ImageSpaceSidebar({
  categories = DEFAULT_CATEGORIES,
}: ImageSpaceSidebarProps) {
  const { selectedCategory, setSelectedCategory } = useImageSpaceContext();

  return (
    <div className="w-48 border-r bg-muted/20">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">
          Categories
        </h3>
        <ScrollArea className="h-[calc(90vh-200px)]">
          <div className="flex flex-col gap-1">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? 'secondary' : 'ghost'
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="justify-start gap-2"
              >
                {category.icon}
                {category.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
