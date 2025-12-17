# WorkspaceItem 컴포넌트 테스팅 전략

## 📊 테스팅 피라미드

```
        /\
       /E2E\          ← Playwright (최소, 핵심 시나리오만)
      /------\
     /Integration\    ← Vitest + Testing Library (중간)
    /------------\
   /   Unit Tests   \ ← Vitest + Testing Library (최대)
  /------------------\
```

## 🎯 테스팅 레벨별 전략

### 1. Unit Tests (Vitest + Testing Library) ⭐️⭐️⭐️⭐️⭐️

**목적**: 개별 Hook과 함수의 로직 검증  
**대상**: 
- `use-workspace-item.ts` (로직)
- `use-page-tree.ts` (로직)
- `use-page-tree.ui.ts` (상태 관리)
- `use-page-tree.business.ts` (비즈니스 로직)

**장점**:
- 빠른 실행 (< 100ms)
- 격리된 테스트
- 디버깅 용이

**예시**:
```typescript
// use-workspace-item.test.ts
describe('useWorkspaceItem', () => {
  it('workspace를 펼치고 접을 수 있어야 한다', () => {
    const { result } = renderHook(() => 
      useWorkspaceItem({ workspace: mockWorkspace, organizationId: 'org-1' })
    );
    
    expect(result.current.isExpanded).toBe(false);
    act(() => result.current.toggleExpand());
    expect(result.current.isExpanded).toBe(true);
  });
});
```

---

### 2. Component Integration Tests (Vitest + Testing Library) ⭐️⭐️⭐️⭐️

**목적**: 컴포넌트와 Hook의 통합 동작 검증  
**대상**: 
- `WorkspaceItem` 컴포넌트
- `PageTree` 컴포넌트
- `WorkspaceHeader` 컴포넌트

**장점**:
- 실제 사용자 상호작용 시뮬레이션
- Props와 State 흐름 검증
- Mock을 통한 외부 의존성 제어

**예시**:
```typescript
// workspace-item.integration.test.tsx
describe('WorkspaceItem Integration', () => {
  it('페이지를 생성하면 트리에 표시되어야 한다', async () => {
    const { user } = setup();
    render(<WorkspaceItem workspace={mockWorkspace} />);
    
    // Workspace 펼치기
    await user.click(screen.getByRole('button', { name: /expand/i }));
    
    // 페이지 생성 버튼 클릭
    await user.click(screen.getByRole('button', { name: /create page/i }));
    
    // 새 페이지가 트리에 표시되는지 확인
    await waitFor(() => {
      expect(screen.getByText(/untitled/i)).toBeInTheDocument();
    });
  });
});
```

---

### 3. E2E Tests (Playwright) ⭐️⭐️⭐️

**목적**: 실제 브라우저에서 전체 사용자 플로우 검증  
**대상**: 
- 페이지 생성 → 편집 → 삭제 플로우
- 드래그앤드롭으로 순서 변경
- 펼침/접힘 상태 유지

**장점**:
- 실제 브라우저 환경
- 네트워크, localStorage 등 실제 동작 검증
- 시각적 회귀 테스트 가능

**예시**:
```typescript
// workspace-item.e2e.spec.ts
test('페이지를 드래그앤드롭하여 순서를 변경할 수 있다', async ({ page }) => {
  await page.goto('/r/org-1/workspace/ws-1');
  
  // Workspace 펼치기
  await page.click('[data-testid="workspace-header"]');
  
  // 첫 번째 페이지를 두 번째 위치로 드래그
  const page1 = page.locator('[data-page-id="page-1"]');
  const page2 = page.locator('[data-page-id="page-2"]');
  
  await page1.dragTo(page2);
  
  // 순서가 변경되었는지 확인
  await expect(page.locator('[data-page-id="page-1"]')).toHaveCSS('order', '2');
});
```

---

### 4. Visual Regression Tests (Storybook + Chromatic) ⭐️⭐️

**목적**: UI 변경사항 시각적 검증  
**대상**: 
- 다양한 상태의 컴포넌트 렌더링
- 다크모드/라이트모드
- 다양한 데이터 상태 (빈 상태, 많은 페이지 등)

**장점**:
- 시각적 회귀 방지
- 디자인 시스템 일관성 유지
- 문서화 효과

**예시**:
```typescript
// WorkspaceItem.stories.tsx
export default {
  component: WorkspaceItem,
  title: 'WorkspaceItem',
};

export const Collapsed = {
  args: {
    workspace: { ...mockWorkspace, pageTree: [] },
  },
};

export const Expanded = {
  args: {
    workspace: mockWorkspace,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
  },
};
```

---

### 5. Manual QA (수동 테스트) ⭐️⭐️⭐️⭐️

**목적**: 자동화하기 어려운 사용성 검증  
**체크리스트**:

#### 기본 기능
- [ ] Workspace 펼치기/접기 동작
- [ ] 페이지 생성 버튼 클릭 시 새 페이지 생성
- [ ] 페이지 클릭 시 해당 페이지로 이동
- [ ] 페이지 펼치기/접기 동작

#### 드래그앤드롭
- [ ] 같은 부모 안에서 순서 변경
- [ ] 다른 부모로 이동
- [ ] 드래그 중 시각적 피드백
- [ ] 드롭 불가능한 위치에서의 동작

#### 상태 유지
- [ ] 새로고침 후 펼침 상태 복원
- [ ] 새로고침 후 선택된 페이지 복원
- [ ] 여러 Workspace 간 상태 독립성

#### 엣지 케이스
- [ ] 빈 Workspace (페이지 없음)
- [ ] 깊은 중첩 구조 (5단계 이상)
- [ ] 긴 페이지 이름 (텍스트 오버플로우)
- [ ] 많은 페이지 (100개 이상)

---

## 🛠️ 구현 우선순위

### Phase 1: Unit Tests (1-2일)
1. `use-workspace-item.test.ts` - 기본 상태 관리
2. `use-page-tree.ui.test.ts` - 펼침 상태 복원 로직
3. `use-page-tree.business.test.ts` - 페이지 CRUD 로직

### Phase 2: Integration Tests (2-3일)
1. `workspace-item.integration.test.tsx` - 기본 상호작용
2. `page-tree.integration.test.tsx` - 페이지 트리 동작
3. Mock 전략 설정 (MSW 또는 vi.mock)

### Phase 3: E2E Tests (1-2일)
1. 핵심 플로우: 페이지 생성 → 편집 → 삭제
2. 드래그앤드롭 순서 변경
3. 상태 유지 (localStorage)

### Phase 4: Visual Tests (선택사항)
1. Storybook 스토리 작성
2. Chromatic 연동 (선택사항)

---

## 📝 테스트 작성 가이드

### Mock 전략

```typescript
// __mocks__/use-workspace.ts
export const useWorkspace = vi.fn(() => ({
  organizationId: 'org-1',
  selectedPageId: null,
  selectedWorkspaceId: null,
  selectPage: vi.fn(),
  setWorkspaces: vi.fn(),
}));
```

### 테스트 유틸리티

```typescript
// test-utils.tsx
export function renderWorkspaceItem(workspace: WorkspaceWithPagesDTO) {
  const mockUseWorkspace = vi.mocked(useWorkspace);
  mockUseWorkspace.mockReturnValue({
    organizationId: 'org-1',
    selectedPageId: null,
    selectedWorkspaceId: workspace.workspaceId,
    selectPage: vi.fn(),
    setWorkspaces: vi.fn(),
  });
  
  return render(<WorkspaceItem workspace={workspace} />);
}
```

### 테스트 데이터 팩토리

```typescript
// test-factories.ts
export function createMockWorkspace(overrides?: Partial<WorkspaceWithPagesDTO>): WorkspaceWithPagesDTO {
  return {
    workspaceId: 'ws-1',
    name: 'Test Workspace',
    pageTree: [
      {
        id: 'page-1',
        title: 'Page 1',
        children: [],
        // ... 기본값
      },
    ],
    ...overrides,
  };
}
```

---

## 🎯 커버리지 목표

| 레벨 | 목표 커버리지 | 테스트 수 |
|------|--------------|----------|
| Unit Tests | 80% | ~15개 |
| Integration Tests | 70% | ~10개 |
| E2E Tests | 핵심 시나리오 | ~5개 |
| **전체** | **75%** | **~30개** |

---

## ✅ 체크리스트

### Unit Tests
- [ ] `use-workspace-item.ts` - 상태 관리 로직
- [ ] `use-page-tree.ui.ts` - 펼침 상태 복원
- [ ] `use-page-tree.business.ts` - 페이지 CRUD
- [ ] `tree-helpers.ts` - 헬퍼 함수들

### Integration Tests
- [ ] WorkspaceItem 기본 렌더링
- [ ] 페이지 생성 플로우
- [ ] 페이지 선택 플로우
- [ ] 드래그앤드롭 (같은 부모)
- [ ] 드래그앤드롭 (부모 변경)

### E2E Tests
- [ ] 페이지 생성 → 편집 → 삭제
- [ ] 드래그앤드롭 순서 변경
- [ ] 새로고침 후 상태 복원
- [ ] 여러 Workspace 간 전환

---

## 🚀 실행 방법

```bash
# Unit + Integration Tests
pnpm test workspace-item

# Watch 모드
pnpm test:watch workspace-item

# 커버리지
pnpm test:coverage workspace-item

# E2E Tests
pnpm test:e2e workspace-item

# E2E UI 모드 (디버깅)
pnpm test:e2e:ui workspace-item
```

---

## 📚 참고 자료

- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Vitest Documentation](https://vitest.dev/)

