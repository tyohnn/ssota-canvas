import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YoutubeEmptyState } from '../ui-states';

describe('YoutubeEmptyState', () => {
  it('renders empty state with input', () => {
    const inputRef = { current: null };
    render(
      <YoutubeEmptyState
        draftUrl=""
        isActive={false}
        inputRef={inputRef}
        onUrlChange={() => {}}
        onUrlSubmit={async () => {}}
        onUrlKeyDown={() => {}}
      />
    );
    expect(screen.getByPlaceholderText(/youtube\.com/)).toBeDefined();
    expect(screen.getByText(/Enter YouTube URL/)).toBeDefined();
  });
});
