# CreateWorkspaceDialog

워크스페이스 생성 다이얼로그 컴포넌트

## 개요

사용자가 새로운 워크스페이스를 생성할 수 있는 모달 컴포넌트입니다. 프론트엔드 컴포넌트 개발 가이드라인을 따라 설계되었습니다.

## 아키텍처

### 핵심 원칙

1. **Context 기반 상태 공유**: Props drilling 대신 Context API 사용
2. **UI/Business 로직 분리**: 노코드 툴 호환성 및 테스트 용이성
3. **Compound Component 패턴**: 서브 컴포넌트 조합
4. **노코드 친화적**: 함수 Props 제거, 단순 값만 노출

### 폴더 구조

```
create-workspace-dialog/
├── components/                            # UI 컴포넌트만
│   ├── dialog-header.tsx                  # 다이얼로그 헤더
│   ├── dialog-content.tsx                 # 다이얼로그 컨텐츠
│   ├── dialog-footer.tsx                  # 다이얼로그 푸터
│   ├── workspace-form-fields.tsx          # 폼 필드 (Name, Description)
│   └── invite-dialog-wrapper.tsx          # 초대 다이얼로그 래퍼
├── core/                                  # 로직만 (비즈니스 로직 + 상태)
│   ├── types.ts                           # 타입 정의
│   ├── context.tsx                        # Context 정의 및 커스텀 훅
│   ├── provider.tsx                       # Context Provider
│   ├── use-create-workspace-dialog.ui.ts  # UI 상태 관리 훅
│   ├── use-create-workspace-dialog.business.ts # 비즈니스 로직 훅
│   └── use-create-workspace-dialog.ts     # 통합 훅 (UI + Business)
├── index.tsx                              # 메인 엔트리 (Provider + Dialog 조합)
└── README.md                              # 문서
```

## 사용법

### 기본 사용 (Production)

```tsx
import { CreateWorkspaceDialog } from './create-workspace-dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Create Workspace
      </Button>
      
      <CreateWorkspaceDialog 
        open={open} 
        onOpenChange={setOpen} 
      />
    </>
  );
}
```

### 테스트/Mock 환경

```tsx
import { 
  CreateWorkspaceDialog,
  useMockCreateWorkspaceBusiness 
} from './create-workspace-dialog';

function TestComponent() {
  const mockBusiness = useMockCreateWorkspaceBusiness();

  return (
    <CreateWorkspaceDialog
      open={true}
      onOpenChange={() => {}}
      businessLogic={mockBusiness}
    />
  );
}
```

### 노코드 툴 (Framer, Webflow)

디자이너는 UI 상태 훅만 사용하여 독립적으로 작업할 수 있습니다:

```tsx
import { 
  useCreateWorkspaceDialogUI,
  useMockCreateWorkspaceBusiness 
} from './create-workspace-dialog';

function FramerComponent() {
  // UI 상태만 사용 (비즈니스 로직 없음)
  const uiState = useCreateWorkspaceDialogUI();
  const mockBusiness = useMockCreateWorkspaceBusiness();

  // 커스텀 UI 구성
  return (
    <Dialog open={uiState.isLoading}>
      <form onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        mockBusiness.createWorkspace({
          name: formData.get('name') as string,
          description: formData.get('description') as string,
        });
      }}>
        {/* 커스텀 UI */}
      </form>
    </Dialog>
  );
}
```

## 컴포넌트 구조

### Provider

모든 서브 컴포넌트에 상태를 제공합니다:

```tsx
<CreateWorkspaceDialogProvider open={open} onOpenChange={setOpen}>
  <CreateWorkspaceDialogContent />
  <InviteDialogWrapper />
</CreateWorkspaceDialogProvider>
```

### 서브 컴포넌트

각 서브 컴포넌트는 Context를 통해 자동으로 연결되며, 노코드 친화적인 Props만 노출합니다:

#### `CreateWorkspaceDialogHeader`

```tsx
<CreateWorkspaceDialogHeader 
  title="Create Workspace"           // 커스터마이징 가능
  description="Create a new space"   // 커스터마이징 가능
  className="..."                    // 스타일 커스터마이징
/>
```

#### `WorkspaceNameInput`

```tsx
<WorkspaceNameInput 
  placeholder="e.g. My Project"  // 커스터마이징 가능
  className="..."                // 스타일 커스터마이징
/>
```

#### `WorkspaceDescriptionInput`

```tsx
<WorkspaceDescriptionInput 
  placeholder="Enter description"  // 커스터마이징 가능
  rows={3}                         // 행 수
  maxLength={500}                  // 최대 길이
  className="..."                  // 스타일 커스터마이징
/>
```

#### `CreateWorkspaceDialogFooter`

```tsx
<CreateWorkspaceDialogFooter 
  cancelText="Cancel"      // 취소 버튼 텍스트
  submitText="Create"      // 제출 버튼 텍스트
  loadingText="Creating..."  // 로딩 중 텍스트
  className="..."          // 스타일 커스터마이징
/>
```

## 훅 (Hooks)

### UI 상태 훅 (useCreateWorkspaceDialogUI)

**목적:** UI 상태만 관리 (비즈니스 로직 없음)

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

**사용 시나리오:**
- 노코드 툴에서 UI만 테스트
- 디자이너가 독립적으로 작업
- 비즈니스 로직 없이 UI 테스트

### 비즈니스 로직 훅 (useCreateWorkspaceBusiness)

**목적:** API 호출 및 데이터 검증

**반환 값:**
```typescript
{
  createWorkspace: (values: CreateWorkspaceFormValues) => Promise<{
    success: boolean;
    workspace?: WorkspaceWithPagesDTO;
    createdInfo?: CreatedWorkspaceInfo;
    error?: string;
  }>;
  
  validateName?: (name: string) => string | null;
}
```

**사용 시나리오:**
- Production 환경
- 실제 API 호출
- 데이터 검증

### Mock 비즈니스 로직 훅 (useMockCreateWorkspaceBusiness)

**목적:** 테스트 및 노코드 툴용 Mock 구현

**반환 값:** `useCreateWorkspaceBusiness`와 동일한 인터페이스

**사용 시나리오:**
- 단위 테스트
- 통합 테스트
- 노코드 툴에서 API 없이 테스트
- 디자이너가 UI 작업 시

### 통합 훅 (useCreateWorkspaceDialog)

**목적:** UI + Business 로직 통합

**파라미터:**
```typescript
businessLogic?: CreateWorkspaceBusinessLogic  // Optional injection
```

**반환 값:** UI State + Combined Actions

**사용 시나리오:**
- Production: 기본 비즈니스 로직 사용
- Test: Mock 로직 주입
- Custom: 커스텀 로직 주입

### Context 훅 (useCreateWorkspaceDialogContext)

**목적:** 서브 컴포넌트에서 Context 접근

**사용법:**
```tsx
function CustomSubComponent() {
  const { form, isLoading, handleSubmit } = useCreateWorkspaceDialogContext();
  
  // Use context values...
}
```

**주의사항:** `CreateWorkspaceDialogProvider` 내부에서만 사용 가능

## 워크플로우

### 1. 사용자가 다이얼로그 열기

```
User clicks "Create Workspace"
  ↓
open={true}
  ↓
Dialog opens with form
```

### 2. 폼 작성 및 제출

```
User fills in:
  - Workspace name (required)
  - Icon (optional, default: Folder)
  - Description (optional)
  ↓
User clicks "Create"
  ↓
Validation (zod schema)
  ↓
handleSubmit called
```

### 3. 워크스페이스 생성

```
handleSubmit
  ↓
UI: Set loading state
  ↓
Business: createWorkspaceAction (API call)
  ↓
Success?
  ├─ Yes: 
  │   ├─ Update workspace state
  │   ├─ Show success toast
  │   ├─ Close dialog
  │   ├─ Store created workspace info
  │   └─ Open invite dialog
  │
  └─ No:
      ├─ Show error toast
      └─ Keep dialog open
```

### 4. 초대 다이얼로그 (선택)

```
Workspace created
  ↓
InviteDialogWrapper automatically opens
  ↓
User can:
  - Invite members
  - Skip
```

## 타입

### CreateWorkspaceDialogProps

```typescript
interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

### CreateWorkspaceFormValues

```typescript
interface CreateWorkspaceFormValues {
  name: string;
  description?: string;
  icon?: string;
}
```

### CreatedWorkspaceInfo

```typescript
interface CreatedWorkspaceInfo {
  workspaceId: string;
  workspaceName: string;
}
```

### CreateWorkspaceDialogContextValue

```typescript
interface CreateWorkspaceDialogContextValue {
  // UI State
  isLoading: boolean;
  isInviteDialogOpen: boolean;
  createdWorkspace: CreatedWorkspaceInfo | null;

  // Form state
  form: UseFormReturn<CreateWorkspaceFormValues>;

  // Actions
  setIsInviteDialogOpen: (open: boolean) => void;
  handleSubmit: (values: CreateWorkspaceFormValues) => Promise<void>;
  handleCloseDialog: () => void;
}
```

## 의존성

### 내부 의존성

- `@/components/ui/dialog`: Radix UI Dialog 컴포넌트
- `@/components/ui/form`: React Hook Form 래퍼
- `@/components/ui/input`: Input 컴포넌트
- `@/components/ui/textarea`: Textarea 컴포넌트
- `@/components/ui/button`: Button 컴포넌트
- `@/domains/workspace-management/frontend/components/shared/icon-picker`: 아이콘 선택기
- `@/domains/workspace-management/frontend/hooks/use-workspace`: 워크스페이스 상태 관리
- `@/domains/workspace-management/actions/workspace.actions`: 워크스페이스 액션

### 외부 의존성

- `react-hook-form`: 폼 상태 관리
- `@hookform/resolvers/zod`: Zod 검증 리졸버
- `zod`: 스키마 검증
- `sonner`: Toast 알림
- `@tanstack/react-query`: Optimistic Updates 및 서버 상태 관리

## 테스트

### 단위 테스트 예제

```tsx
import { renderHook } from '@testing-library/react';
import { useCreateWorkspaceDialogUI } from './use-create-workspace-dialog.ui';
import { useMockCreateWorkspaceBusiness } from './use-create-workspace-dialog.business';

describe('useCreateWorkspaceDialogUI', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCreateWorkspaceDialogUI());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isInviteDialogOpen).toBe(false);
    expect(result.current.createdWorkspace).toBeNull();
  });
});

describe('useMockCreateWorkspaceBusiness', () => {
  it('should create workspace with mock data', async () => {
    const { result } = renderHook(() => useMockCreateWorkspaceBusiness());
    
    const response = await result.current.createWorkspace({
      name: 'Test Workspace',
      description: 'Test description',
    });
    
    expect(response.success).toBe(true);
    expect(response.createdInfo?.workspaceName).toBe('Test Workspace');
  });
});
```

### 통합 테스트 예제

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateWorkspaceDialog, useMockCreateWorkspaceBusiness } from './';

describe('CreateWorkspaceDialog', () => {
  it('should create workspace and open invite dialog', async () => {
    const onOpenChange = jest.fn();
    const mockBusiness = useMockCreateWorkspaceBusiness();
    
    render(
      <CreateWorkspaceDialog
        open={true}
        onOpenChange={onOpenChange}
        businessLogic={mockBusiness}
      />
    );
    
    // Fill in form
    fireEvent.change(screen.getByPlaceholderText(/Marketing Project/i), {
      target: { value: 'My Workspace' },
    });
    
    // Submit
    fireEvent.click(screen.getByText('Create'));
    
    // Wait for invite dialog
    await waitFor(() => {
      expect(screen.getByText(/Invite Members/i)).toBeInTheDocument();
    });
  });
});
```

## 참고 자료

- [프론트엔드 컴포넌트 개발 가이드라인](../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-12-14 | 2.1.0 | 폴더 구조 개선: `components/` (UI 컴포넌트) + `core/` (로직) 분리 |
| 2025-12-14 | 2.0.0 | 컴포넌트 가이드라인에 따라 전면 리팩토링: Context 기반, UI/Business 로직 분리, Compound Pattern |
| 2025-11-XX | 1.0.0 | 초기 구현 (단일 컴포넌트) |
