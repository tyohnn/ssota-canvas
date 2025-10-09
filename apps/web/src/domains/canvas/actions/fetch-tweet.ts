'use server';

import { getTweet } from 'react-tweet/api';

export type FetchedTweetData = {
  id?: string;
  authorName?: string;
  authorUsername?: string;
  text?: string;
  createdAt?: string;
  images?: string[];
  raw?: any;
};

/**
 * Fetches and normalizes tweet data for the given tweet identifier.
 *
 * Retrieves tweet details from the upstream API and returns an object with
 * selected fields (author name, author username, text, creation timestamp,
 * extracted photo URLs, and the raw API response).
 *
 * @param id - The tweet identifier to fetch.
 * @returns The normalized tweet data including `id`, `authorName`, `authorUsername`, `text`, `createdAt`, `images` (array of `media_url_https` strings for photo media), and `raw` (original API response); `null` if `id` is falsy, the tweet cannot be fetched, or an error occurs.
 */
export async function fetchTweetDataAction(
  id: string
): Promise<FetchedTweetData | null> {
  try {
    if (!id) return null;
    const data = await getTweet(id);
    if (!data) return null;
    const authorName = (data as any)?.user?.name as string | undefined;
    const authorUsername = (data as any)?.user?.screen_name as
      | string
      | undefined;
    const text = (data as any)?.full_text || (data as any)?.text;
    const createdAt = (data as any)?.created_at as string | undefined;
    const media =
      (data as any)?.extended_entities?.media ||
      (data as any)?.entities?.media ||
      [];
    const images = Array.isArray(media)
      ? media
          .filter(
            (m: any) =>
              m?.type === 'photo' && typeof m?.media_url_https === 'string'
          )
          .map((m: any) => m.media_url_https as string)
      : [];
    return {
      id,
      authorName,
      authorUsername,
      text: typeof text === 'string' ? text : undefined,
      createdAt,
      images,
      raw: data,
    };
  } catch {
    return null;
  }
}