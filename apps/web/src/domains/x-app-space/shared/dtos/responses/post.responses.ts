/**
 * Post Response DTOs
 */
import type { PostView } from '../views/post.views';

export interface GetXMetadataDTO {
  post: PostView;
  sourceId?: string;
  blockUuid?: string;
}
