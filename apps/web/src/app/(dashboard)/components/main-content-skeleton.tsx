/**
 * 🎯 MAIN CONTENT SKELETON
 * ========================
 *
 * 📋 컴포넌트 역할:
 * - 메인 콘텐츠 로딩 중 표시될 스켈레톤 UI
 * - 다양한 콘텐츠 타입에 대응하는 유연한 구조
 * - 반응형 그리드 레이아웃
 *
 * 🔧 주요 기능:
 * - 제목, 설명, 카드 그리드 스켈레톤
 * - 반응형 디자인 (md, lg 브레이크포인트)
 * - 접근성을 고려한 구조
 */

export function MainContentSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-4">
        {/* Title Skeleton */}
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />

        {/* Description Skeleton */}
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-muted animate-pulse rounded"
              aria-label={`Loading content item ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
