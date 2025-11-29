/**
 * Landing Showcase Layout
 *
 * 랜딩페이지 전용 레이아웃
 * - 헤더/푸터 없음
 * - 전체 페이지 스크롤 가능
 */

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen w-full">{children}</div>;
}
