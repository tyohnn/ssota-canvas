# CreateWorkspaceDialog - Core Logic

이 폴더는 `CreateWorkspaceDialog` 컴포넌트의 모든 로직을 포함합니다.

## 개요

가이드라인에 따라 **UI 컴포넌트**와 **로직**을 명확하게 분리합니다:
- **`components/`**: UI 컴포넌트만 (렌더링 로직)
- **`core/`**: 모든 로직 (상태, 비즈니스 로직, Context, 타입)

## 파일 구조

```
core/
├── types.ts                           # 타입 정의
├── context.tsx                        # Context 정의 및 커스텀 훅
├── provider.tsx                       # Context Provider
├── use-create-workspace-dialog.ui.ts  # UI 상태 관리 훅
├── use-create-workspace-dialog.business.ts # 비즈니스 로직 훅
├── use-create-workspace-dialog.ts     # 통합 훅
└── README.md                          # 이 파일
```

## 파일 설명

### `types.ts`
모든 타입 정의:
- `CreateWorkspaceDialogProps`: 메인 Props
- `CreateWorkspaceFormValues`: 폼 값
- `CreatedWorkspaceInfo`: 생성된 워크스페이스 정보
- `CreateWorkspaceDialogContextValue`: Context 값

### `context.tsx`
Context 정의 및 커스텀 훅:
- `CreateWorkspaceDialogContext`: React Context
- `useCreateWorkspaceDialogContext`: Context 접근 훅

**사용법:**
```tsx
function SubComponent() {
  const { form, isLoading, handleSubmit } = useCreateWorkspaceDialogContext();
  // ...
}
```

### `provider.tsx`
Context Provider:
- 모든 서브 컴포넌트에 상태 제공
- 통합 훅의 값을 Context로 전달
- 다이얼로그 열기/닫기 핸들러 관리

**사용법:**
```tsx
<CreateWorkspaceDialogProvider open={open} onOpenChange={setOpen}>
  <CreateWorkspaceDialogContent />
  <InviteDialogWrapper />
</CreateWorkspaceDialogProvider>
```

### `use-create-workspace-dialog.ui.ts`
UI 상태 관리 훅:
- 폼 상태 (react-hook-form)
- 로딩 상태
- 다이얼로그 상태
- 생성된 워크스페이스 정보

**특징:**
- ✅ 비즈니스 로직 없음
- ✅ 순수 UI 상태만 관리
- ✅ 노코드 툴에서 독립적으로 사용 가능

**반환 값:**
```typescript
{
  form: UseFormReturn<CreateWorkspaceFormValues>;
  isLoading: boolean;
  isInviteDialogOpen: boolean;
  createdWorkspace: CreatedWorkspaceInfo | null;
  
  setIsLoading: (loading: boolean) => void;
  setIsInviteDialogOpen: (open: boolean) => void;
  setCreatedWorkspace: (workspace: CreatedWorkspaceInfo | null) => void;
  resetForm: () => void;
}
```

### `use-create-workspace-dialog.business.ts`
비즈니스 로직 훅 (TanStack Query 사용):
- **Optimistic Updates**: 워크스페이스를 목록에 즉시 추가
- **자동 롤백**: 실패 시 자동으로 이전 상태로 복원
- **로딩 상태 관리**: `isCreating` 자동 제공
- API 호출 (`createWorkspaceAction`)
- 데이터 검증
- 에러 처리
- Toast 알림

**Production 훅: `useCreateWorkspaceBusiness`**
```typescript
{
  createWorkspace: (values) => Promise<{
    success: boolean;
    workspace?: WorkspaceWithPagesDTO;
    createdInfo?: CreatedWorkspaceInfo;
    error?: string;
  }>;
  validateName?: (name: string) => string | null;
  isCreating?: boolean; // 🎯 TanStack Query loading state
}
```

**TanStack Query 워크플로우:**
1. **onMutate**: 임시 워크스페이스를 목록에 추가 (Optimistic)
2. **mutationFn**: API 호출
3. **onSuccess**: 임시 워크스페이스를 실제 데이터로 교체
4. **onError**: 자동 롤백 + 에러 토스트

**Mock 훅: `useMockCreateWorkspaceBusiness`**
- 테스트/노코드 툴용
- 실제 API 호출 없이 동일한 인터페이스 제공
- 500ms 딜레이 시뮬레이션

### `use-create-workspace-dialog.ts`
통합 훅 (UI + Business):
- UI 상태 훅 호출
- 비즈니스 로직 훅 호출 (또는 주입된 로직 사용)
- 폼 제출 핸들러 통합

**Optional Injection 지원:**
```typescript
useCreateWorkspaceDialog(businessLogic?: CreateWorkspaceBusinessLogic)
```

**반환 값:**
```typescript
{
  // UI State
  form: UseFormReturn<CreateWorkspaceFormValues>;
  isLoading: boolean;
  isInviteDialogOpen: boolean;
  createdWorkspace: CreatedWorkspaceInfo | null;
  
  // UI Actions
  setIsLoading: (loading: boolean) => void;
  setIsInviteDialogOpen: (open: boolean) => void;
  setCreatedWorkspace: (workspace: CreatedWorkspaceInfo | null) => void;
  resetForm: () => void;
  
  // Combined Actions
  handleSubmit: (values: CreateWorkspaceFormValues) => Promise<void>;
}
```

## 아키텍처 패턴

### 3-Layer Architecture

```
┌─────────────────────────────────────┐
│  UI Layer (components/)             │
│  - Rendering                        │
│  - User interactions                │
└────────────┬────────────────────────┘
             │ uses Context
             ↓
┌─────────────────────────────────────┐
│  UI State Layer (.ui.ts)            │
│  - Form state                       │
│  - Loading state                    │
│  - Dialog state                     │
└────────────┬────────────────────────┘
             │ combined by
             ↓
┌─────────────────────────────────────┐
│  Integration Layer (.ts)            │
│  - Combines UI + Business           │
│  - Handles form submission          │
└────────────┬────────────────────────┘
             │ uses
             ↓
┌─────────────────────────────────────┐
│  Business Layer (.business.ts)      │
│  - API calls                        │
│  - Validation                       │
│  - Error handling                   │
└─────────────────────────────────────┘
```

### Optional Injection Pattern

비즈니스 로직을 선택적으로 주입할 수 있습니다:

```typescript
// Production: 기본 비즈니스 로직 사용
const state = useCreateWorkspaceDialog();

// Test/Mock: 커스텀 로직 주입
const mockBusiness = useMockCreateWorkspaceBusiness();
const state = useCreateWorkspaceDialog(mockBusiness);
```

**장점:**
- ✅ Production과 Test 환경 쉽게 전환
- ✅ 노코드 툴에서 Mock 로직 사용
- ✅ 유닛 테스트에서 비즈니스 로직만 독립 테스트

## 워크플로우

### 1. 초기화

```
Provider 마운트
  ↓
useCreateWorkspaceDialog 호출
  ↓
useCreateWorkspaceDialogUI (UI 상태 생성)
  ↓
useCreateWorkspaceBusiness (비즈니스 로직 생성)
  ↓
Context에 통합된 값 전달
```

### 2. 폼 제출

```
User submits form
  ↓
handleSubmit (통합 훅)
  ↓
validateName (비즈니스 로직)
  ↓
setIsLoading(true) (UI 상태)
  ↓
createWorkspace (비즈니스 로직)
  ↓
API 호출 → createWorkspaceAction
  ↓
Success?
  ├─ Yes:
  │   ├─ Update workspace state
  │   ├─ Show success toast
  │   ├─ setCreatedWorkspace (UI 상태)
  │   └─ resetForm (UI 상태)
  │
  └─ No:
      ├─ Show error toast
      └─ Keep form open
```

### 3. Context 전파

```
Provider
  ↓ provides
Context
  ↓ consumed by
SubComponents (components/)
  ├─ WorkspaceNameInput
  ├─ WorkspaceDescriptionInput
  ├─ CreateWorkspaceDialogFooter
  └─ InviteDialogWrapper
```

## 의존성

### 내부 의존성
- `@/domains/workspace-management/actions/workspace.actions`
- `@/domains/workspace-management/frontend/hooks/use-workspace`
- `@/domains/workspace-management/shared/dtos`

### 외부 의존성
- `react-hook-form`: 폼 상태 관리
- `@hookform/resolvers/zod`: Zod 검증
- `zod`: 스키마 검증
- `sonner`: Toast 알림
- `@tanstack/react-query`: Optimistic Updates 및 서버 상태 관리

## 테스트 전략

### UI 상태 테스트
```typescript
import { renderHook } from '@testing-library/react';
import { useCreateWorkspaceDialogUI } from './use-create-workspace-dialog.ui';

test('should initialize with default values', () => {
  const { result } = renderHook(() => useCreateWorkspaceDialogUI());
  expect(result.current.isLoading).toBe(false);
});
```

### 비즈니스 로직 테스트
```typescript
import { renderHook } from '@testing-library/react';
import { useMockCreateWorkspaceBusiness } from './use-create-workspace-dialog.business';

test('should create workspace', async () => {
  const { result } = renderHook(() => useMockCreateWorkspaceBusiness());
  const response = await result.current.createWorkspace({
    name: 'Test Workspace',
  });
  expect(response.success).toBe(true);
});
```

### 통합 테스트
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateWorkspaceDialog } from '../index';

test('should submit form and open invite dialog', async () => {
  // Test with mock business logic
  const mockBusiness = useMockCreateWorkspaceBusiness();
  render(<CreateWorkspaceDialog businessLogic={mockBusiness} />);
  // ...
});
```

## 노코드 툴 사용 예제

### Framer에서 UI 상태만 사용

```tsx
import { useCreateWorkspaceDialogUI, useMockCreateWorkspaceBusiness } from './core';

export function FramerWorkspaceForm() {
  // UI 상태만 사용
  const uiState = useCreateWorkspaceDialogUI();
  const mockBusiness = useMockCreateWorkspaceBusiness();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await mockBusiness.createWorkspace({
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <textarea name="description" />
      <button disabled={uiState.isLoading}>
        {uiState.isLoading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

## 모범 사례

### ✅ DO
- UI 상태와 비즈니스 로직을 명확히 분리
- Optional injection으로 테스트 가능하게 설계
- Context를 통해 서브 컴포넌트 간 상태 공유
- Mock 비즈니스 로직 제공

### ❌ DON'T
- UI 상태 훅에 API 호출 포함하지 않기
- 비즈니스 로직 훅에 UI 상태 관리하지 않기
- Props drilling 사용하지 않기
- 전역 Context로 만들지 않기 (컴포넌트 로컬만)

## 참고 자료

- [프론트엔드 컴포넌트 개발 가이드라인](../../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
