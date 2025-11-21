/**
 * Layout Template (Deprecated)
 *
 * ⚠️ 이 파일은 더 이상 사용되지 않습니다.
 * Root Layout (app/layout.tsx)이 생성되었습니다.
 *
 * Next.js에서 <html>과 <body> 태그는 오직 Root Layout에만 있어야 합니다.
 * 모든 nested layout은 children만 렌더링해야 합니다.
 */
export default function LayoutTemplate({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nested layout에서 사용 시 children만 반환
  return <>{children}</>;
}
