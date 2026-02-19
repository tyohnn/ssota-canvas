/**
 * Landing Script Section
 *
 * Provider 없이 View 컴포넌트만 조합
 * 스크립트가 있는 상태로 가상 스크립트 표시
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import { Box } from '@/components/ui/box';
import { LANDING_YOUTUBE_PROPERTIES } from '../../landing-youtube-mock-data';
import { ScriptSectionContainer } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/tab-sections/timeline-tab/components/script-section-container';
import { ScriptTranscriptView } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/tab-sections/timeline-tab/components/script-transcript.view';
import { ScriptTableOfContents } from '@/domains/block-management/frontend/components/block/block-type/youtube/components/tab-sections/timeline-tab/components/script-table-of-contents';

/** "How To Get Your First Users" 기반 가상 스크립트 (약 6분) */
const MOCK_TRANSCRIPT = [
  {
    "text": "How do you get a new product off the ground? And when you're just starting out, where do those first real users actually come from? You see, most people aren't early adopters.",
    "start": 0.24,
    "duration": 11.68
  },
  {
    "text": "Ask yourself, how many products do you use today that you were among the first 10 users of? For most people, the answer is zero.",
    "start": 7.52,
    "duration": 10.48
  },
  {
    "text": "Almost no one wants to be a startup's first paying customer.",
    "start": 14.16,
    "duration": 7.599999999999998
  },
  {
    "text": "Yet, every great product still manages to find a few people willing to take that leap.",
    "start": 18,
    "duration": 7.519000000000002
  },
  {
    "text": "The earliest version of your product only needs to do one thing.",
    "start": 21.76,
    "duration": 8.239999999999998
  },
  {
    "text": "survive contact with a tiny group of people who might actually try it.",
    "start": 25.519,
    "duration": 7.761000000000003
  },
  {
    "text": "You're not building the final form.",
    "start": 30,
    "duration": 5.199999999999996
  },
  {
    "text": "You're building something that can evolve.",
    "start": 31.679,
    "duration": 5.601000000000003
  },
  {
    "text": "When you're starting out, you don't just need a minimum viable product.",
    "start": 33.28,
    "duration": 7.840000000000003
  },
  {
    "text": "You need a minimum evolvable product.",
    "start": 37.28,
    "duration": 7.400000000000006
  },
  {
    "text": "And I'm going to show you how to find one.",
    "start": 39.2,
    "duration": 5.479999999999997
  },
];

const NOOP_HANDLERS = {
  onTimeClick: () => { },
  onAddQuote: async () => { },
};

export function LandingScriptSection() {
  return (
    <ScriptSectionContainer>
      <Box className="space-y-4 relative">
        <ScriptTranscriptView
          transcript={MOCK_TRANSCRIPT}
          youtubeTitle={LANDING_YOUTUBE_PROPERTIES.youtubeTitle}
          onTimeClick={NOOP_HANDLERS.onTimeClick}
          onAddQuote={NOOP_HANDLERS.onAddQuote}
          loadingSegmentIndex={null}
          readonly={true}
        />
        <ScriptTableOfContents
          transcript={MOCK_TRANSCRIPT}
          showTOC={true}
        />
      </Box>
    </ScriptSectionContainer>
  );
}
