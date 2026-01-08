import React from 'react';
import { getPublishedPageActionInternal } from '@/domains/share/actions/share.actions';
import PublishPageClient from './publish-page-client';

interface PublishPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublishPage({ params }: PublishPageProps) {
  const { token } = await params;

  // 서버에서 초기 데이터를 직접 가져옵니다 (Second Layer Defense의 Internal 함수 활용)
  const initialData = await getPublishedPageActionInternal(token);

  return <PublishPageClient initialData={initialData} token={token} />;
}
