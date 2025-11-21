import { redirect } from 'next/navigation';
import { getUserOrganizationsAction } from '@/domains/organization-management/actions/organization-management.actions';

// 동적 렌더링 강제 (cookies 사용으로 인한)
export const dynamic = 'force-dynamic';

/**
 * 대시보드 루트 페이지
 *
 * 유저의 첫 번째 organization으로 자동 리다이렉션
 * - 소유자인 조직 우선
 * - organization이 없으면 onboarding으로 이동
 */
export default async function DashboardRootPage() {
  let organizations;

  try {
    // 유저의 organizations 가져오기
    organizations = await getUserOrganizationsAction();
  } catch (error) {
    console.error('[DashboardRootPage] Error:', error);
    // 인증 실패 시 로그인 페이지로
    redirect('/login');
  }

  // Organization이 없으면 onboarding으로
  if (!organizations || organizations.length === 0) {
    redirect('/onboarding');
  }

  // 첫 번째 organization으로 리다이렉션
  const firstOrg = organizations[0];
  if (!firstOrg) {
    redirect('/onboarding');
  }

  redirect(`/r/${firstOrg.id}`);
}
