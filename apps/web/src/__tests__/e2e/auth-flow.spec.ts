import { test, expect } from '@playwright/test';

test.describe('인증 플로우', () => {
  test('로그인 페이지 접근 및 구글 OAuth 버튼 표시', async ({ page }) => {
    // When: 로그인 페이지 접근
    await page.goto('/login');

    // Then: 페이지 제목이 표시되어야 함
    await expect(page.locator('h1:has-text("로그인")')).toBeVisible();

    // And: 구글 OAuth 버튼이 표시되어야 함
    await expect(page.locator('button:has-text("구글 계정으로 로그인")')).toBeVisible();

    // And: 구글 아이콘이 표시되어야 함
    await expect(page.locator('[data-testid="google-icon"]')).toBeVisible();
  });

  test('구글 OAuth 버튼 클릭 시 OAuth 플로우 시작', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // Mock: OAuth 리다이렉트 응답
    await page.route('**/auth/v1/authorize', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize?client_id=mock&redirect_uri=mock'
        }
      });
    });

    // When: 구글 OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Then: 구글 OAuth 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL(/accounts\.google\.com/);
  });

  test('OAuth 콜백 처리', async ({ page }) => {
    // Mock: OAuth 인증 성공
    await page.route('**/auth/v1/token', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'user-123',
            email: 'test@example.com',
            user_metadata: {
              name: 'Test User',
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
            userId: 'user-123',
            email: 'test@example.com',
            name: 'Test User',
            defaultOrganization: {
              id: 'org-user-123',
              name: 'Test User의 작업공간'
            }
          }
        })
      });
    });

    // When: OAuth 콜백 URL 접근
    await page.goto('/auth/callback?code=mock-code');

    // Then: 대시보드로 리다이렉트되어야 함
    await expect(page).toHaveURL('/dashboard');
  });

  test('OAuth 인증 실패 처리', async ({ page }) => {
    // Mock: OAuth 인증 실패
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

    // When: OAuth 콜백 URL 접근
    await page.goto('/auth/callback?code=invalid-code');

    // Then: 로그인 페이지로 리다이렉트되고 에러 메시지 표시
    await expect(page).toHaveURL(/\/login\?message=/);
    await expect(page.locator('text=로그인에 실패했습니다')).toBeVisible();
  });

  test('로그아웃 기능', async ({ page }) => {
    // Given: 인증된 사용자로 대시보드 접근
    await page.goto('/dashboard');

    // Mock: 로그아웃 성공
    await page.route('**/auth/v1/logout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({})
      });
    });

    // When: 로그아웃 버튼 클릭
    await page.click('button:has-text("로그아웃")');

    // Then: 로그인 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL('/login');
  });

  test('인증되지 않은 사용자의 보호된 페이지 접근', async ({ page }) => {
    // Given: 인증되지 않은 상태
    await page.route('**/auth/v1/user', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Unauthorized'
        })
      });
    });

    // When: 보호된 페이지 접근
    await page.goto('/dashboard');

    // Then: 로그인 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL('/login');
  });

  test('토큰 만료 시 자동 로그아웃', async ({ page }) => {
    // Given: 인증된 사용자로 대시보드 접근
    await page.goto('/dashboard');

    // Mock: 토큰 만료 응답
    await page.route('**/auth/v1/user', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid JWT: token has expired'
        })
      });
    });

    // When: 페이지 새로고침
    await page.reload();

    // Then: 로그인 페이지로 리다이렉트되어야 함
    await expect(page).toHaveURL('/login');
  });

  test('최근 로그인 방법 표시', async ({ page }) => {
    // Given: 구글 OAuth로 최근 로그인한 사용자
    await page.goto('/login');

    // Mock: 최근 로그인 방법 쿠키
    await page.context().addCookies([{
      name: 'lastSignedInMethod',
      value: 'google',
      domain: 'localhost',
      path: '/'
    }]);

    // When: 페이지 새로고침
    await page.reload();

    // Then: 최근 로그인 방법이 표시되어야 함
    await expect(page.locator('text=최근 로그인')).toBeVisible();
    await expect(page.locator('button:has-text("구글 계정으로 로그인")')).toHaveClass(/recent/);
  });

  test('OAuth 버튼 접근성', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // Then: OAuth 버튼이 키보드로 접근 가능해야 함
    await page.keyboard.press('Tab');
    await expect(page.locator('button:has-text("구글 계정으로 로그인")')).toBeFocused();

    // And: Enter 키로 클릭 가능해야 함
    await page.keyboard.press('Enter');

    // Then: OAuth 플로우가 시작되어야 함
    await expect(page).toHaveURL(/accounts\.google\.com/);
  });

  test('OAuth 버튼 로딩 상태', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // Mock: 느린 OAuth 응답
    await page.route('**/auth/v1/authorize', route => {
      setTimeout(() => {
        route.fulfill({
          status: 302,
          headers: {
            'Location': 'https://accounts.google.com/oauth/authorize'
          }
        });
      }, 1000);
    });

    // When: OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Then: 로딩 상태가 표시되어야 함
    await expect(page.locator('button:has-text("구글 계정으로 로그인")')).toHaveClass(/loading/);
    await expect(page.locator('button:has-text("구글 계정으로 로그인")')).toBeDisabled();
  });

  test('네트워크 오류 처리', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // Mock: 네트워크 오류
    await page.route('**/auth/v1/authorize', route => {
      route.abort('failed');
    });

    // When: OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Then: 에러 메시지가 표시되어야 함
    await expect(page.locator('text=네트워크 오류가 발생했습니다')).toBeVisible();

    // And: 재시도 버튼이 표시되어야 함
    await expect(page.locator('button:has-text("다시 시도")')).toBeVisible();
  });

  test('OAuth 버튼 클릭 시 쿠키 설정', async ({ page }) => {
    // Given: 로그인 페이지 접근
    await page.goto('/login');

    // Mock: OAuth 리다이렉트 응답
    await page.route('**/auth/v1/authorize', route => {
      route.fulfill({
        status: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize'
        }
      });
    });

    // When: OAuth 버튼 클릭
    await page.click('button:has-text("구글 계정으로 로그인")');

    // Then: 최근 로그인 방법 쿠키가 설정되어야 함
    const cookies = await page.context().cookies();
    const lastSignedInMethod = cookies.find(cookie => cookie.name === 'lastSignedInMethod');
    expect(lastSignedInMethod?.value).toBe('google');
  });
});
