/**
 * WorkspaceItem E2E Tests
 *
 * Playwright를 사용한 실제 브라우저 환경 테스트
 * - 전체 사용자 플로우 검증
 * - 실제 네트워크, localStorage 동작 검증
 */

import { test, expect } from '@playwright/test';

test.describe('WorkspaceItem E2E', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 및 테스트 데이터 설정
    // 실제 구현에 맞게 수정 필요
    await page.goto('/');
    // await loginAsTestUser(page);
  });

  test('workspace를 펼치고 접을 수 있어야 한다', async ({ page }) => {
    await page.goto('/r/org-1/workspace/ws-1');

    // Workspace 헤더 찾기
    const workspaceHeader = page.locator('[data-testid="workspace-header"]').first();
    
    // 초기 상태: 접혀있음
    await expect(workspaceHeader).toBeVisible();
    
    // 펼치기
    await workspaceHeader.click();
    
    // 페이지 트리가 표시되어야 함
    await expect(page.locator('[data-testid="page-tree"]')).toBeVisible();
    
    // 다시 접기
    await workspaceHeader.click();
    
    // 페이지 트리가 숨겨져야 함
    await expect(page.locator('[data-testid="page-tree"]')).not.toBeVisible();
  });

  test('페이지를 생성할 수 있어야 한다', async ({ page }) => {
    await page.goto('/r/org-1/workspace/ws-1');

    // Workspace 펼치기
    await page.locator('[data-testid="workspace-header"]').first().click();

    // 페이지 생성 버튼 클릭
    await page.locator('[aria-label="Create page"]').first().click();

    // 새 페이지가 트리에 표시되어야 함
    await expect(page.locator('text=Untitled')).toBeVisible();
  });

  test('페이지를 클릭하면 해당 페이지로 이동해야 한다', async ({ page }) => {
    await page.goto('/r/org-1/workspace/ws-1');

    // Workspace 펼치기
    await page.locator('[data-testid="workspace-header"]').first().click();

    // 페이지 클릭 (실제 페이지 ID로 수정 필요)
    await page.locator('text=Page 1').click();

    // URL이 변경되어야 함
    await expect(page).toHaveURL(/\/page\/page-1/);
  });

  test('드래그앤드롭으로 페이지 순서를 변경할 수 있어야 한다', async ({ page }) => {
    await page.goto('/r/org-1/workspace/ws-1');

    // Workspace 펼치기
    await page.locator('[data-testid="workspace-header"]').first().click();

    // 두 개 이상의 페이지가 있어야 함
    const page1 = page.locator('[data-page-id="page-1"]');
    const page2 = page.locator('[data-page-id="page-2"]');

    await expect(page1).toBeVisible();
    await expect(page2).toBeVisible();

    // page1을 page2 아래로 드래그
    await page1.dragTo(page2);

    // 순서가 변경되었는지 확인
    // (실제 구현에 따라 검증 방법 조정 필요)
    const pages = page.locator('[data-page-id]');
    const firstPageId = await pages.first().getAttribute('data-page-id');
    expect(firstPageId).toBe('page-2');
  });

  test('새로고침 후 펼침 상태가 유지되어야 한다', async ({ page }) => {
    await page.goto('/r/org-1/workspace/ws-1');

    // Workspace 펼치기
    await page.locator('[data-testid="workspace-header"]').first().click();

    // 페이지 트리가 표시되는지 확인
    await expect(page.locator('[data-testid="page-tree"]')).toBeVisible();

    // 새로고침
    await page.reload();

    // 펼침 상태가 유지되어야 함
    await expect(page.locator('[data-testid="page-tree"]')).toBeVisible();
  });

  test('페이지를 펼치고 접을 수 있어야 한다', async ({ page }) => {
    await page.goto('/r/org-1/workspace/ws-1');

    // Workspace 펼치기
    await page.locator('[data-testid="workspace-header"]').first().click();

    // 자식이 있는 페이지 찾기
    const pageWithChildren = page.locator('[data-page-id="page-2"]');
    await expect(pageWithChildren).toBeVisible();

    // 페이지의 chevron 클릭하여 펼치기
    const chevron = pageWithChildren.locator('[aria-label="Expand"]');
    await chevron.click();

    // 자식 페이지가 표시되어야 함
    await expect(page.locator('text=Page 2-1')).toBeVisible();

    // 다시 접기
    await chevron.click();

    // 자식 페이지가 숨겨져야 함
    await expect(page.locator('text=Page 2-1')).not.toBeVisible();
  });
});

