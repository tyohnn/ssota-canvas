/**
 * Landing Title Input
 * 
 * Replicated from Title Input
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 * YouTube 블록과 Shape 블록 모두에서 사용 가능
 */

'use client';

import { LANDING_YOUTUBE_PROPERTIES } from '../../landing-youtube-mock-data';
import { TitleInputView } from '@/domains/block-management/frontend/components/editor-panel/components/content-area/components/title-input.view';

interface LandingTitleInputProps {
  /** Shape 블록의 경우 title을 prop으로 받음 */
  title?: string;
}

export function LandingTitleInput({ title }: LandingTitleInputProps = {}) {
  // Mock context values
  // title prop이 있으면 사용, 없으면 YouTube properties에서 가져옴
  const displayTitle = title ?? (LANDING_YOUTUBE_PROPERTIES.youtubeTitle ?? "YouTube Video");
  const setTitle = (e: React.ChangeEvent<HTMLInputElement>) => console.log('Title changed:', e.target.value);
  const handleKeyDown = () => { };
  const handleTitleSave = () => { };

  // Mock readonly state
  const isReadOnly = false;

  return (
    <TitleInputView
      value={displayTitle}
      onChange={setTitle}
      onKeyDown={handleKeyDown}
      onBlur={handleTitleSave}
      readOnly={isReadOnly}
    />
  );
}
