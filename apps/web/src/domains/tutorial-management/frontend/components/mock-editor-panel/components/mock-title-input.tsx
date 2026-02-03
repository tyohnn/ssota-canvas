'use client';

import { TitleInputView } from '@/domains/block-management/frontend/components/editor-panel/components/content-area/components/title-input.view';
import { TUTORIAL_YOUTUBE_PROPERTIES } from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';

/**
 * Mock title input for tutorial editor panel. Uses real TitleInputView with static title.
 */
export function MockTitleInput() {
  const displayTitle =
    TUTORIAL_YOUTUBE_PROPERTIES.youtubeTitle ?? 'YouTube Video';

  return (
    <TitleInputView
      value={displayTitle}
      onChange={() => {}}
      onKeyDown={() => {}}
      onBlur={() => {}}
      readOnly={true}
    />
  );
}
