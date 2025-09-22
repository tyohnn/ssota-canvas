"use client";

import React, { useMemo } from "react";
import type { NodeProps } from "@xyflow/react";
import { TwitterPreviewNodeData } from "@/domains/blocks/types";
import {
  useTweet,
  EmbeddedTweet,
  TweetNotFound,
  TweetSkeleton,
} from "react-tweet";

export function TwitterPreviewNode({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps) {
  const d = (data || {}) as TwitterPreviewNodeData;
  const w = width ?? 360;
  const h = height ?? 320;
  const url = d.url?.trim();

  const tweetId = useMemo(() => {
    if (!url) return undefined;
    const m = url.match(/\/status\/(\d+)/);
    return m?.[1];
  }, [url]);

  const { data: tweet, isLoading, error } = useTweet(tweetId, undefined);

  return (
    <>
      {tweetId ? (
        isLoading ? (
          <div className="h-full w-full overflow-auto p-2">
            <TweetSkeleton />
          </div>
        ) : error || !tweet ? (
          <div className="h-full w-full overflow-auto p-2">
            <TweetNotFound />
          </div>
        ) : (
          <div className="h-full w-full overflow-auto p-2">
            <EmbeddedTweet tweet={tweet} />
          </div>
        )
      ) : (
        <div className="h-full w-full overflow-auto p-2">
          <TweetSkeleton />
        </div>
      )}
    </>
  );
}
