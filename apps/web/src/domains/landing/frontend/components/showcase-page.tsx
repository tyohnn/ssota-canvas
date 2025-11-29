/**
 * Showcase Page Component
 *
 * Landing Showcase의 최상위 컴포넌트
 * - 스크롤 기반 섹션 관리
 * - 좌측: ShowcaseSections (카피 콘텐츠)
 * - 우측: CanvasDemo (인터랙티브 캔버스)
 */

'use client';

import { CanvasDemo } from './canvas-demo';
import { ShowcaseSections } from './sections';
import { useScrollSections } from './canvas-demo/hooks/use-scroll-sections';

export function ShowcasePage() {
  const { section, subPhase } = useScrollSections();

  return (
    <>
      {/* SEO Content - 검색 엔진을 위한 숨겨진 콘텐츠 */}
      <div className="sr-only">
        <h1>SSOTA - ONE CANVAS WHERE YOUR WORK LIVES</h1>
        <p>
          From Plan, Research, Design to Make, Create, Develop on limitless
          canvas with collaborating AI
        </p>
        <section>
          <h2>For Software Development</h2>
          <article>
            <h3>Plan</h3>
            <p>
              Organize ideas, gather requirements, and map out your entire
              development process in one unified space.
            </p>
          </article>
          <article>
            <h3>Design</h3>
            <p>
              Create wireframes, prototypes, and visual designs alongside your
              planning documents.
            </p>
          </article>
          <article>
            <h3>Develop</h3>
            <p>
              Write code, track issues, and collaborate with your team in
              real-time.
            </p>
          </article>
          <article>
            <h3>Deploy</h3>
            <p>
              Manage deployment pipelines and monitor your applications from the
              same canvas.
            </p>
          </article>
        </section>
      </div>

      {/* Interactive UI */}
      <div className="h-screen overflow-hidden bg-linear-to-br from-background to-muted pt-16">
        {/* Single fixed layout - 100vh minus header */}
        <div className="flex h-full">
          {/* Left: Copy panel - content changes only */}
          <ShowcaseSections section={section} subPhase={subPhase} />

          {/* Right: Single Canvas - blocks change only */}
          <div className="w-[70%] border-l border-border">
            <CanvasDemo />
          </div>
        </div>

        {/* Scroll capture overlay - captures scroll on canvas area too */}
        <div
          className="fixed inset-0 top-16 pointer-events-none"
          style={{ touchAction: 'pan-y' }}
        />
      </div>
    </>
  );
}
