/**
 * 🎯 DASHBOARD HEADER SKELETON
 * =============================
 *
 * 📋 컴포넌트 역할:
 * - DashboardHeader 로딩 중 표시될 스켈레톤 UI
 * - 실제 헤더와 동일한 레이아웃 구조
 * - 부드러운 애니메이션 효과 제공
 *
 * 🔧 주요 기능:
 * - 로고, 네비게이션, 액션 버튼 스켈레톤
 * - 반응형 디자인 지원
 * - 접근성을 고려한 구조
 */

export function DashboardHeaderSkeleton() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo and Brand Area */}
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons Area */}
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        </div>
      </div>
    </header>
  );
}
