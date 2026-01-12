import React from 'react';
import { getPublishedPageAction } from '@/domains/share/actions/share.actions';
import PublishPageClient from './publish-page-client';

interface PublishPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function PublishPage({ params }: PublishPageProps) {
  const { token } = await params;

  // 서버에서 초기 데이터를 가져옵니다 (공식 Action 함수 활용)
  const initialData = await getPublishedPageAction(token);

  return <PublishPageClient initialData={initialData} token={token} />;
}
