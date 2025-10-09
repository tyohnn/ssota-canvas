// apps/web/src/__tests__/e2e/member-role-change.spec.ts

import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Scenario 3: 멤버 역할 변경
 * 
 * 테스트 시나리오:
 * 1. 소유자가 멤버를 관리자로 승격
 * 2. 소유자가 관리자를 멤버로 강등
 * 3. 관리자가 멤버를 관리자로 승격
 * 4. 에러 케이스: 관리자의 다운그레이드 시도
 * 5. 에러 케이스: 소유자 역할 변경 시도
 * 6. 에러 케이스: 일반 멤버의 역할 변경 시도
 */

test.describe('Scenario 3: 멤버 역할 변경', () => {
  test.beforeEach(async ({ page }) => {
    // 테스트 환경 설정
    // TODO: 테스트 데이터 준비 (조직 생성, 멤버 추가)
  });

  test('소유자가 멤버를 관리자로 승격하는 전체 플로우', async ({ page }) => {
    // Given: 조직 소유자로 로그인
    // TODO: 로그인 헬퍼 함수 구현
    // await loginAsOrganizationOwner(page);

    // When: 멤버 관리 화면 접근
    await page.goto('/organization/members');

    // Then: 멤버 목록이 표시됨
    await expect(page.locator('[data-testid="member-list"]')).toBeVisible();

    // When: 멤버의 역할 변경 버튼 클릭
    await page.click('[data-testid="change-role-button-member1"]');

    // Then: 역할 선택 옵션이 표시됨
    await expect(page.locator('[data-testid="role-options"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="current-role-checked"]')
    ).toBeVisible();

    // When: 관리자 역할 옵션 선택
    await page.click('[data-testid="role-option-admin"]');

    // Then: 업그레이드 확인 다이얼로그 표시
    await expect(
      page.locator('[data-testid="upgrade-confirmation-dialog"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="role-change-info"]')
    ).toContainText('멤버 → 관리자');
    await expect(
      page.locator('[data-testid="permission-change-info"]')
    ).toBeVisible();

    // When: 확인 버튼 클릭
    await page.click('[data-testid="confirm-role-change"]');

    // Then: 역할 변경 완료 메시지 표시
    await expect(
      page.locator('[data-testid="role-change-success"]')
    ).toBeVisible();

    // Then: 멤버 목록에서 역할이 업데이트됨
    await expect(
      page.locator('[data-testid="member-role-member1"]')
    ).toContainText('관리자');
  });

  test('소유자가 관리자를 멤버로 강등하는 전체 플로우', async ({ page }) => {
    // Given: 조직 소유자로 로그인
    // await loginAsOrganizationOwner(page);

    // When: 멤버 관리 화면 접근
    await page.goto('/organization/members');

    // When: 관리자의 역할 변경 버튼 클릭
    await page.click('[data-testid="change-role-button-admin1"]');

    // Then: 역할 선택 옵션이 표시됨
    await expect(page.locator('[data-testid="role-options"]')).toBeVisible();

    // When: 멤버 역할 옵션 선택
    await page.click('[data-testid="role-option-member"]');

    // Then: 다운그레이드 확인 다이얼로그 표시
    await expect(
      page.locator('[data-testid="downgrade-confirmation-dialog"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="role-change-info"]')
    ).toContainText('관리자 → 멤버');

    // When: 확인 버튼 클릭
    await page.click('[data-testid="confirm-role-change"]');

    // Then: 역할 변경 완료 메시지 표시
    await expect(
      page.locator('[data-testid="role-change-success"]')
    ).toBeVisible();

    // Then: 멤버 목록에서 역할이 업데이트됨
    await expect(
      page.locator('[data-testid="member-role-admin1"]')
    ).toContainText('멤버');
  });

  test('관리자가 멤버를 관리자로 승격하는 플로우', async ({ page }) => {
    // Given: 조직 관리자로 로그인
    // await loginAsOrganizationAdmin(page);

    // When: 멤버 관리 화면 접근
    await page.goto('/organization/members');

    // When: 멤버의 역할 변경 버튼 클릭
    await page.click('[data-testid="change-role-button-member1"]');

    // When: 관리자 역할 옵션 선택
    await page.click('[data-testid="role-option-admin"]');

    // Then: 업그레이드 확인 다이얼로그 표시
    await expect(
      page.locator('[data-testid="upgrade-confirmation-dialog"]')
    ).toBeVisible();

    // When: 확인 버튼 클릭
    await page.click('[data-testid="confirm-role-change"]');

    // Then: 역할 변경 완료
    await expect(
      page.locator('[data-testid="role-change-success"]')
    ).toBeVisible();
  });

  test.skip('관리자가 다른 관리자 강등 시도 시 에러 표시', async ({
    page,
  }) => {
    // Given: 조직 관리자로 로그인
    // await loginAsOrganizationAdmin(page);

    // When: 다른 관리자의 역할 변경 시도
    await page.goto('/organization/members');
    await page.click('[data-testid="change-role-button-admin2"]');
    await page.click('[data-testid="role-option-member"]');

    // Then: 권한 없음 에러 메시지 표시
    await expect(
      page.locator('[data-testid="permission-denied-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="permission-denied-error"]')
    ).toContainText('관리자는 다른 관리자를 강등할 수 없습니다');
  });

  test.skip('소유자 역할 변경 시도 시 에러 표시', async ({ page }) => {
    // Given: 조직 관리자로 로그인
    // await loginAsOrganizationAdmin(page);

    // When: 소유자의 역할 변경 시도
    await page.goto('/organization/members');

    // Then: 소유자의 역할 변경 버튼이 비활성화됨
    await expect(
      page.locator('[data-testid="change-role-button-owner"]')
    ).toBeDisabled();
  });

  test.skip('일반 멤버의 역할 변경 시도 시 에러 표시', async ({ page }) => {
    // Given: 일반 멤버로 로그인
    // await loginAsRegularMember(page);

    // When: 멤버 관리 페이지 접근
    await page.goto('/organization/members');

    // Then: 역할 변경 버튼이 보이지 않음
    await expect(
      page.locator('[data-testid^="change-role-button-"]')
    ).not.toBeVisible();
  });
});

