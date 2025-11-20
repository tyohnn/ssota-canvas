/**
 * Unsplash Tab Types
 */

// Re-export types from shared
export type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Category Mapping (for API queries)
 */
export type CategoryKey =
  | 'all'
  | 'nature'
  | 'architecture'
  | 'people'
  | 'animals'
  | 'technology'
  | 'food'
  | 'travel'
  | 'business'
  | 'abstract';

/**
 * Unsplash Tab Props (외부 노출)
 */
export interface UnsplashTabProps {
  className?: string;
}
