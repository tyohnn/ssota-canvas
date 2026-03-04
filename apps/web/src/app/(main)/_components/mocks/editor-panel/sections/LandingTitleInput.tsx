/**
 * Landing Title Input
 * 
 * Replicated from Title Input
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 * YouTube 블록과 Shape 블록 모두에서 사용 가능
 */

'use client';

import { LANDING_YOUTUBE_PROPERTIES } from '../../landing-youtube-mock-data';
import { TitleInputView } from '@workspace/editor-panel';

interface LandingTitleInputProps {
  /** Shape 블록의 경우 title을 prop으로 받음 */
  title?: string;
}

export function LandingTitleInput({ title }: LandingTitleInputProps = {}) {
  const displayTitle = title ?? (LANDING_YOUTUBE_PROPERTIES.youtubeTitle ?? "YouTube Video");
  const isReadOnly = false;

  return (
    <TitleInputView
      initialTitle={displayTitle}
      onTitleSave={() => {}}
      readOnly={isReadOnly}
    />
  );
}
