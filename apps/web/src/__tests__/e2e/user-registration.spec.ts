import { test, expect } from '@playwright/test';

test.describe('사용자 등록 플로우', () => {
  test('구글 OAuth를 통한 신규 사용자 등록', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // When: 구글 OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Then: 구글 OAuth 페이지로 리다이렉트
    await expect(page).toHaveURL(/accounts\.google\.com/);

    // Mock: 구글 OAuth 성공 응답
    await page.route('**/oauth/authorize', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': 'http://localhost:3000/auth/callback?code=mock-code'
        }
      });
    });

    // Mock: Supabase Auth 세션 생성
    await page.route('**/auth/v1/token', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            user_metadata: {
              name: 'New User',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          }
        })
      });
    });

    // Mock: 온보딩 페이지에서 프로필 생성
    await page.route('**/api/user-management/create-profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'new-user-id',
            email: 'newuser@example.com',
            name: 'New User'
          }
        })
      });
    });

    // Mock: 기본 조직 생성
    await page.route('**/api/user-management/create-default-organization', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            organizationId: 'org-new-user-id',
            name: 'New User의 작업공간'
          }
        })
      });
    });

    // When: OAuth 콜백 처리
    await page.goto('/auth/callback?code=mock-code');

    // Then: 온보딩 페이지로 리다이렉트
    await expect(page).toHaveURL('/onboarding');

    // When: 온보딩 페이지에서 프로필 생성 완료 대기
    await page.waitForSelector('text=프로필이 생성되었습니다');

    // Then: 대시보드로 리다이렉트
    await expect(page).toHaveURL('/dashboard');
  });

  test('기존 사용자 로그인', async ({ page }) => {
    // Given: 기존 사용자 세션
    await page.goto('/login');

    // When: 구글 OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Mock: 기존 사용자 세션
    await page.route('**/auth/v1/token', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'existing-user-id',
            email: 'existing@example.com',
            user_metadata: {
              name: 'Existing User',
              avatar_url: 'https://example.com/avatar.jpg'
            }
          }
        })
      });
    });

    // Mock: 기존 사용자 프로필 조회
    await page.route('**/api/user-management/user-profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            userId: 'existing-user-id',
            email: 'existing@example.com',
            name: 'Existing User',
            defaultOrganization: {
              id: 'org-existing-user-id',
              name: 'Existing User의 작업공간'
            }
          }
        })
      });
    });

    // When: OAuth 콜백 처리
    await page.goto('/auth/callback?code=mock-code');

    // Then: 온보딩을 건너뛰고 대시보드로 직접 이동
    await expect(page).toHaveURL('/dashboard');
  });

  test('OAuth 인증 실패 처리', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // When: 구글 OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Mock: OAuth 실패 응답
    await page.route('**/auth/v1/token', route => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        })
      });
    });

    // When: OAuth 콜백 처리
    await page.goto('/auth/callback?code=invalid-code');

    // Then: 로그인 페이지로 리다이렉트되고 에러 메시지 표시
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.locator('text=로그인에 실패했습니다')).toBeVisible();
  });

  test('네트워크 오류 처리', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // When: 구글 OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Mock: 네트워크 오류
    await page.route('**/auth/v1/token', route => {
      route.abort('failed');
    });

    // When: OAuth 콜백 처리
    await page.goto('/auth/callback?code=mock-code');

    // Then: 에러 페이지로 리다이렉트
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.locator('text=서버 오류가 발생했습니다')).toBeVisible();
  });

  test('프로필 생성 실패 처리', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // Mock: 성공적인 OAuth 인증
    await page.route('**/auth/v1/token', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          user: {
            id: 'new-user-id',
            email: 'newuser@example.com',
            user_metadata: {
              name: 'New User'
            }
          }
        })
      });
    });

    // Mock: 프로필 생성 실패
    await page.route('**/api/user-management/create-profile', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed'
        })
      });
    });

    // When: OAuth 콜백 처리
    await page.goto('/auth/callback?code=mock-code');

    // Then: 온보딩 페이지에서 에러 메시지 표시
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('text=프로필 생성에 실패했습니다')).toBeVisible();
  });
});
