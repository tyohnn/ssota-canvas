'use client';

import React from 'react';

import { Youtube } from 'lucide-react';

/**
 * YouTube Error State Component
 *
 * 유효하지 않은 YouTube URL일 때 표시되는 에러 컴포넌트
 */
export function YoutubeErrorState() {
  return (
    <>
      <Youtube className="h-12 w-12 text-red-500 mb-2" />
      <p className="text-sm text-red-500">Invalid YouTube URL</p>
    </>
  );
}
