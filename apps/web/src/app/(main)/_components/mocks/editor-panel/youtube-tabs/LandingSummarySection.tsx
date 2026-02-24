/**
 * Landing Summary Section
 * 
 * Replicated from Summary Section
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 * StepHighlight는 사용하지 않음 (각 탭에서 필요시 래핑)
 */

'use client';

import { useEffect, useState } from 'react';
import { SummarySectionView } from '@/domains/source-management/frontend/components/summary-tab';
import type { VideoSummaryView } from '@/domains/youtube-app-space/shared/dtos/views/video-summary.views';

interface LandingSummarySectionProps {
  step: number;
}

const MOCK_SUMMARY = `
## 🧭 Finding the first users for a new startup product and evolving it into maturity
Most people aren't <strong>early adopters</strong>, so startups must search for rare individuals like the <strong>Gustafs</strong> with burning needs rather than persuade masses. <mark>The key insight is treating user acquisition as a <strong>search problem</strong>, not persuasion, leading to a <strong>minimum evolvable product</strong> that adapts via early feedback.</mark>

## 🚀 Build a minimum evolvable product by searching for desperate early users and iterating rapidly
- Target <strong>early adopters</strong> or those with <strong>burning problems</strong> through personal outreach, not broad marketing.
- <strong>Charge real money early</strong>, launch fast, study users anthropologically, and experiment without fearing <strong>churn</strong>.
This approach delivers <strong>sharper feedback</strong> from paying customers, enables <strong>path-dependent evolution</strong> shaped by early users, and frees founders from perfectionism by focusing on survival and adaptation in the <strong>phylogenetic tree</strong> of product development.

# 🎞️ Strategies for Acquiring Early Users and Evolving Startups into Mature Products

## 1. The Reality of First Users and the Need for a Minimum Evolvable Product

### 1.1 Rare Early Adopters Exist Despite Widespread Resistance
- Few people join as a startup's <strong>first 10 users</strong> or paying customers, as most avoid unproven products.
  a. <strong>Gustaf</strong> at Airbnb loved testing startups and introducing them company-wide.
  b. Others try anything solving a <strong>burning issue</strong>, like the speaker's team paying a startup for a quick <strong>inference API billing solution</strong> within <strong>3 days</strong>.
- Acquisition is a <strong>search problem</strong>, not persuasion—hunt for <strong>Gustafs and Ankits</strong> eager for novelty or relief.

### 1.2 Shift from Minimum Viable to Minimum Evolvable Product
- Early versions must <mark>survive contact</mark> with tiny groups and evolve, not be final forms.
- Build basic functions to expose to <strong>market pressures</strong>, allowing rapid adaptation.

## 2. Counterintuitive Strategies for Engaging Early Users

### 2.1 Charge Real Money from Day One
- <strong>Early adopters</strong> and desperate users ignore price; focus on <strong>feedback quality</strong>.
  a. Paying customers provide <strong>sharper feedback</strong> than free users—angry high-payers motivate more than indifferent ones.
  b. Revenue is secondary; validation comes from real stakes.

### 2.2 Use Targeted Personal Outreach and Launch Early
- Skip billboards; opt for <strong>cold emails</strong> or door-knocks to reach niches.
- YC mantra: <strong>Launch early</strong> to maximize <strong>surface area</strong> for unknown early users.

### 2.3 Study and Experiment Relentlessly Without Fearing Churn
- Act as an <strong>anthropologist</strong>: Analyze decisions, trust factors, and desires of early users.
- Run constant <strong>experiments</strong> on pricing, onboarding, features; fix annoyances personally.
  a. <strong>Churn is fine</strong>—relationships are direct, and irrelevance (not headlines) is the foe.
  b. Startups win by iterating unseen, unlike big companies.

## 3. Early Users Shape Market and Product Direction

### 3.1 B2B and High-Value Niches Over Consumer Apps
- Consumer software budgets are tiny (<strong>$150/month</strong> personally vs. corporate tools exceeding that).
- In <strong>AI era</strong>, target <strong>proumers</strong>, businesses, or high-ad-value users like doctors—ads rarely cover AI costs.

### 3.2 Early Users Steer Long-Term Evolution
- Users don't just feedback; they <mark>path-dependently evolve</mark> the product via preferences.

## 4. Phylogenetic Tree Analogy and Tesla Case Study

### 4.1 Startups as Evolving Organisms
- View startups as <strong>phylogenetic tree</strong>: From <strong>amoeba</strong> (basic survival) to complex leaves (mature products).
  a. Founders run <strong>evolutionary search</strong> through pressures, morphing via user interactions.
  b. Maturity emerges from millions of users, refined pitches—not starting perfect.

### 4.2 Tesla Roadster as Amoeba Probing Early Adopters
- <strong>Tesla Roadster</strong> ($<strong>150,000</strong>) tested "crazy" buyers for impractical EV: low range, no charging, odd looks.
  a. Funded capex for <strong>Model S/3/Y</strong>, but primarily searched adopter preferences.
  b. Result: <strong>Model Y</strong> prioritizes <strong>acceleration</strong> (<strong>under 3 seconds 0-60</strong>) and tech over comfort/suspension—echoing early fans, not mass market.
- Alternate paths possible: Plush early adopters might yield different cars today.

## Conclusion: Embrace Evolution Over Perfection
- Build a <strong>minimum evolvable product</strong> to let <strong>early users</strong> guide the <strong>phylogenetic journey</strong> from amoeba to maturity.
- <strong>Action</strong>: Search personally for desperate pioneers, charge early, iterate fast—your starting users define the endgame.`;

const MOCK_VIDEO_SUMMARY: VideoSummaryView = {
  id: 'mock-summary-id',
  videoId: 'mock-id',
  language: 'en',
  summary: MOCK_SUMMARY,
  keywords: [
    "early adopters",
    "minimum evolvable product",
    "search problem",
    "burning problems",
    "phylogenetic tree",
    "charge real money",
    "path-dependent evolution",
    "first 10 users",
    "launch early",
    "sharper feedback"
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/** step 6에서 스크롤할 헤더 텍스트 (요약 본문에 포함된 헤더) */
const SCROLL_TO_HEADING_TEXT = 'Phylogenetic Tree';

export function LandingSummarySection({ step }: LandingSummarySectionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // step 4: English 클릭 → 에디터 패널 열림 + 로딩, step 5+: summary 완료
  // structure 탭에서는 이미 summary가 있는 상태로 시작하므로 항상 표시
  const isLoading = step === 4;
  const isExtracting = step === 4;
  const showSummary = step >= 5;

  // step 6: summary 표시 후 특정 헤더로 자동 스크롤 (summarize 탭에서만 사용)
  useEffect(() => {
    if (step !== 6 || selectedLanguage !== 'en') return;

    const delay = 400; // TipTap 헤더 ID 부여 대기
    const timer = setTimeout(() => {
      const scrollContainer = document.querySelector(
        '[data-content-area-scroll-container="true"]'
      ) as HTMLElement | null;
      if (!scrollContainer) return;

      const headings = scrollContainer.querySelectorAll('h1, h2, h3');
      const target = Array.from(headings).find((el) =>
        el.textContent?.includes(SCROLL_TO_HEADING_TEXT)
      ) as HTMLElement | undefined;
      if (!target) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollTop =
        scrollContainer.scrollTop +
        (targetRect.top - containerRect.top) -
        16;
      scrollContainer.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
    }, delay);

    return () => clearTimeout(timer);
  }, [step, selectedLanguage]);

  // step 4: isExtracting으로 로딩 뷰, step 5+: en이면 요약 표시
  const summaries: VideoSummaryView[] = showSummary ? [MOCK_VIDEO_SUMMARY] : [];
  const currentSummary: VideoSummaryView | null | undefined =
    showSummary && selectedLanguage === 'en' ? MOCK_VIDEO_SUMMARY : null;

  return (
    <SummarySectionView
      summaries={summaries}
      availableLanguages={['en']}
      selectedLanguage={selectedLanguage}
      setSelectedLanguage={setSelectedLanguage}
      currentSummary={currentSummary}
      isLoading={isLoading}
      error={null}
      onExtractSummary={async (_language: string) => { }}
      isExtracting={isExtracting}
      hasAccessForSelectedLanguage={true}
      sourceSummaryAccessLanguages={['en']}
      readonly={false}
    />
  );
}
