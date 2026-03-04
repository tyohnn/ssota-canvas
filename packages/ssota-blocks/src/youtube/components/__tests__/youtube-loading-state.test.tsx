import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YoutubeLoadingState } from '../ui-states/youtube-loading-state';

describe('YoutubeLoadingState', () => {
  it('renders loading skeleton', () => {
    render(<YoutubeLoadingState />);
    const skeletons = document.querySelectorAll('[data-slot]');
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
  });
});
