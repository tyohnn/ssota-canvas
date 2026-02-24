/**
 * Open Graph Metadata Type
 *
 * Shared type for link block metadata. No server deps so it can be
 * imported by client components.
 */
export type OpenGraphMetadata = {
  title: string;
  description: string;
  imageUrl: string;
  siteName: string;
  domain: string;
  faviconUrl: string;
  type: string;
  author?: string;
  publishedAt?: string;
};
