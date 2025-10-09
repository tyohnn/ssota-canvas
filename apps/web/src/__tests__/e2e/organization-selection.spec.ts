import { test, expect } from '@playwright/test';

test.describe('조직 선택 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // Mock: 인증된 사용자 세션
    await page.route('**/auth/v1/user', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            name: 'Test User'
          }
        })
      });
    });

    // Mock: 조직 목록 조회
    await page.route('**/api/user-management/organizations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ownedOrganizations: [
              {
                id: 'org-1',
                name: '개인 작업공간',
                isDefault: true
              },
              {
                id: 'org-2',
                name: '팀 작업공간',
                isDefault: false
              }
            ],
            memberOrganizations: []
          }
        })
      });
    });
  });

  test('조직 목록 표시 및 선택', async ({ page }) => {
    // Given: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // Then: 조직 목록이 표시되어야 함
    await expect(page.locator('text=개인 작업공간')).toBeVisible();
    await expect(page.locator('text=팀 작업공간')).toBeVisible();

    // When: 다른 조직 선택
    await page.click('button:has-text("팀 작업공간")');

    // Then: 선택된 조직이 표시되어야 함
    await expect(page.locator('text=팀 작업공간')).toHaveClass(/selected/);

    // And: 쿠키에 저장되어야 함
    const cookies = await page.context().cookies();
    const orgCookie = cookies.find(cookie => cookie.name === 'selectedOrganizationId');
    expect(orgCookie?.value).toBe('org-2');
  });

  test('기본 조직 자동 선택', async ({ page }) => {
    // Given: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // Then: 기본 조직이 자동으로 선택되어야 함
    await expect(page.locator('text=개인 작업공간')).toHaveClass(/selected/);

    // And: 기본 조직이 쿠키에 저장되어야 함
    const cookies = await page.context().cookies();
    const orgCookie = cookies.find(cookie => cookie.name === 'selectedOrganizationId');
    expect(orgCookie?.value).toBe('org-1');
  });

  test('조직 선택 상태 유지', async ({ page }) => {
    // Given: 대시보드에서 조직 선택
    await page.goto('/dashboard');
    await page.click('button:has-text("팀 작업공간")');

    // When: 페이지 새로고침
    await page.reload();

    // Then: 선택된 조직 상태가 유지되어야 함
    await expect(page.locator('text=팀 작업공간')).toHaveClass(/selected/);
  });

  test('조직 목록 로딩 상태', async ({ page }) => {
    // Given: 느린 조직 목록 응답
    await page.route('**/api/user-management/organizations', route => {
      // 2초 지연
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ownedOrganizations: [
                {
                  id: 'org-1',
                  name: '개인 작업공간',
                  isDefault: true
                }
              ],
              memberOrganizations: []
            }
          })
        });
      }, 2000);
    });

    // When: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // Then: 로딩 상태가 표시되어야 함
    await expect(page.locator('text=로딩 중...')).toBeVisible();

    // And: 로딩 완료 후 조직 목록이 표시되어야 함
    await expect(page.locator('text=개인 작업공간')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=로딩 중...')).not.toBeVisible();
  });

  test('조직 목록 조회 실패 처리', async ({ page }) => {
    // Given: 조직 목록 조회 실패
    await page.route('**/api/user-management/organizations', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed'
        })
      });
    });

    // When: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // Then: 에러 메시지가 표시되어야 함
    await expect(page.locator('text=조직 목록을 불러올 수 없습니다')).toBeVisible();

    // And: 재시도 버튼이 표시되어야 함
    await expect(page.locator('button:has-text("다시 시도")')).toBeVisible();
  });

  test('재시도 기능', async ({ page }) => {
    // Given: 첫 번째 요청 실패
    let requestCount = 0;
    await page.route('**/api/user-management/organizations', route => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Network error'
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ownedOrganizations: [
                {
                  id: 'org-1',
                  name: '개인 작업공간',
                  isDefault: true
                }
              ],
              memberOrganizations: []
            }
          })
        });
      }
    });

    // When: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // Then: 에러 메시지 표시
    await expect(page.locator('text=조직 목록을 불러올 수 없습니다')).toBeVisible();

    // When: 재시도 버튼 클릭
    await page.click('button:has-text("다시 시도")');

    // Then: 조직 목록이 표시되어야 함
    await expect(page.locator('text=개인 작업공간')).toBeVisible({ timeout: 5000 });
    expect(requestCount).toBe(2);
  });

  test('빈 조직 목록 처리', async ({ page }) => {
    // Given: 빈 조직 목록
    await page.route('**/api/user-management/organizations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            ownedOrganizations: [],
            memberOrganizations: []
          }
        })
      });
    });

    // When: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // Then: 빈 상태 메시지가 표시되어야 함
    await expect(page.locator('text=조직이 없습니다')).toBeVisible();

    // And: 조직 생성 버튼이 표시되어야 함
    await expect(page.locator('button:has-text("조직 생성")')).toBeVisible();
  });

  test('조직 선택 시 URL 업데이트', async ({ page }) => {
    // Given: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // When: 다른 조직 선택
    await page.click('button:has-text("팀 작업공간")');

    // Then: URL에 선택된 조직 ID가 포함되어야 함
    await expect(page).toHaveURL(/orgSlug=org-2/);
  });

  test('조직 선택 시 사이드바 업데이트', async ({ page }) => {
    // Given: 대시보드 페이지 접근
    await page.goto('/dashboard');

    // When: 다른 조직 선택
    await page.click('button:has-text("팀 작업공간")');

    // Then: 사이드바에 선택된 조직 정보가 표시되어야 함
    await expect(page.locator('[data-testid="sidebar-organization-name"]')).toHaveText('팀 작업공간');
  });
});
