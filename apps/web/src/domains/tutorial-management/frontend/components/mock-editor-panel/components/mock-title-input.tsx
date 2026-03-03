'use client';

import { TitleInputView } from '@workspace/editor-panel';
import { TUTORIAL_YOUTUBE_PROPERTIES } from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';

/**
 * Mock title input for tutorial editor panel. Uses real TitleInputView with static title.
 */
export function MockTitleInput() {
  const displayTitle =
    TUTORIAL_YOUTUBE_PROPERTIES.youtubeTitle ?? 'YouTube Video';

  return (
    <TitleInputView
      initialTitle={displayTitle}
      onTitleSave={() => {}}
      readOnly={true}
    />
  );
}
