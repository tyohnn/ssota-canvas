# WorkspaceSettingsDialog

워크스페이스 설정 관리 다이얼로그 컴포넌트

## 개요

사용자가 워크스페이스 설정을 편집하고 멤버를 관리할 수 있는 탭 기반 모달 컴포넌트입니다. 프론트엔드 컴포넌트 개발 가이드라인을 따라 설계되었습니다.

## 아키텍처

### 핵심 원칙

1. **Context 기반 상태 공유**: Props drilling 대신 Context API 사용
2. **UI/Business 로직 분리**: 노코드 툴 호환성 및 테스트 용이성
3. **Compound Component 패턴**: 서브 컴포넌트 조합
4. **노코드 친화적**: 함수 Props 제거, 단순 값만 노출
5. **TanStack Query**: Optimistic Updates 및 서버 상태 관리

### 폴더 구조

```
workspace-settings-dialog/
├── components/                            # UI 컴포넌트만
│   ├── dialog-content.tsx                 # 다이얼로그 컨텐츠
│   ├── tab-navigation.tsx                 # 탭 네비게이션
│   ├── general-settings-form.tsx         # 일반 설정 폼
│   ├── members-tab.tsx                   # 멤버 관리 탭
│   └── invite-dialog-wrapper.tsx          # 초대 다이얼로그 래퍼
├── core/                                  # 로직만 (상태 + 비즈니스)
│   ├── types.ts                           # 타입 정의
│   ├── context.tsx                        # Context 정의 및 커스텀 훅
│   ├── provider.tsx                       # Context Provider
│   ├── use-workspace-settings-dialog.ui.ts # UI 상태 관리 훅
│   ├── use-workspace-settings-dialog.business.ts # 비즈니스 로직 훅
│   └── use-workspace-settings-dialog.ts   # 통합 훅
├── index.tsx                              # 메인 엔트리
└── README.md                              # 문서
```

## 사용법

### 기본 사용 (Production)

```tsx
import { WorkspaceSettingsDialog } from './workspace-settings-dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceWithPagesDTO | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Settings
      </Button>
      
      {workspace && (
        <WorkspaceSettingsDialog
          workspace={workspace}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}
```

### Personal Workspace (Members 탭 숨김)

```tsx
<WorkspaceSettingsDialog
  workspace={personalWorkspace}
  open={open}
  onOpenChange={setOpen}
  disableInvite={true}
/>
```

### 테스트/Mock 환경

```tsx
import {
  WorkspaceSettingsDialog,
  useMockWorkspaceSettingsBusiness,
} from './workspace-settings-dialog';

function TestComponent() {
  const mockBusiness = useMockWorkspaceSettingsBusiness();

  return (
    <WorkspaceSettingsDialog
      workspace={mockWorkspace}
      open={true}
      onOpenChange={() => {}}
      businessLogic={mockBusiness}
    />
  );
}
```

## 컴포넌트 구조

### Provider

모든 서브 컴포넌트에 상태를 제공합니다:

```tsx
<WorkspaceSettingsDialogProvider
  workspace={workspace}
  open={open}
  onOpenChange={setOpen}
  disableInvite={false}
>
  <WorkspaceSettingsDialogContent />
  <InviteDialogWrapper />
</WorkspaceSettingsDialogProvider>
```

### 서브 컴포넌트

각 서브 컴포넌트는 Context를 통해 자동으로 연결되며, 노코드 친화적인 Props만 노출합니다:

#### `TabNavigation`

왼쪽 사이드바 탭 네비게이션 (Settings, Members)

#### `GeneralSettingsForm`

워크스페이스 정보 편집 폼:
- Workspace Name
- Icon Picker
- Description

#### `MembersTab`

멤버 관리 탭:
- Member list table
- Invite button

#### `InviteDialogWrapper`

멤버 초대 다이얼로그 래퍼

## 훅 (Hooks)

### UI 상태 훅 (useWorkspaceSettingsDialogUI)

**목적:** UI 상태만 관리 (비즈니스 로직 없음)

**반환 값:**
```typescript
{
  form: UseFormReturn<UpdateWorkspaceFormValues>;
  activeTab: SettingsTab;
  isInviteDialogOpen: boolean;
  isLoading: boolean;
  isLoadingMembers: boolean;
  memberView: WorkspaceMemberView | null;
  
  setActiveTab: (tab: SettingsTab) => void;
  setIsInviteDialogOpen: (open: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setIsLoadingMembers: (loading: boolean) => void;
  setMemberView: (view: WorkspaceMemberView | null) => void;
}
```

### 비즈니스 로직 훅 (useWorkspaceSettingsBusiness)

**목적:** API 호출 및 데이터 검증

**반환 값:**
```typescript
{
  updateWorkspace: (params) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  loadMemberView: (workspaceId: string) => Promise<{
    success: boolean;
    data?: WorkspaceMemberView;
    error?: string;
  }>;
  
  isUpdating?: boolean;  // TanStack Query loading state
  isLoadingMembersQuery?: boolean;
}
```

**TanStack Query 워크플로우:**
1. **onMutate**: 워크스페이스를 목록에서 즉시 업데이트 (Optimistic)
2. **mutationFn**: API 호출
3. **onSuccess**: 성공 토스트 표시
4. **onError**: 자동 롤백 + 에러 토스트

### Mock 비즈니스 로직 훅 (useMockWorkspaceSettingsBusiness)

**목적:** 테스트 및 노코드 툴용 Mock 구현

### 통합 훅 (useWorkspaceSettingsDialog)

**목적:** UI + Business 로직 통합

**파라미터:**
```typescript
useWorkspaceSettingsDialog(
  { workspace, open, onOpenChange, disableInvite },
  businessLogic?: WorkspaceSettingsBusinessLogic
)
```

## 워크플로우

### 1. 사용자가 다이얼로그 열기

```
User clicks "Settings"
  ↓
open={true}, workspace={workspaceData}
  ↓
Dialog opens with General tab active
```

### 2. 워크스페이스 정보 수정

```
User edits workspace info
  ↓
Form becomes dirty
  ↓
User clicks "Save"
  ↓
handleSubmit called
  ↓
Optimistic update (workspace list)
  ↓
API 호출 → updateWorkspaceInfoAction
  ↓
Success?
  ├─ Yes:
  │   ├─ Show success toast
  │   └─ Reset form with new values
  │
  └─ No:
      ├─ Auto rollback
      └─ Show error toast
```

### 3. 멤버 관리

```
User switches to Members tab
  ↓
Auto-load member view
  ↓
User clicks "Invite Member"
  ↓
Invite dialog opens
  ↓
User invites member
  ↓
Member list refreshes
```

## 타입

### WorkspaceSettingsDialogProps

```typescript
interface WorkspaceSettingsDialogProps {
  workspace: WorkspaceWithPagesDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disableInvite?: boolean;
}
```

### UpdateWorkspaceFormValues

```typescript
interface UpdateWorkspaceFormValues {
  name: string;
  description?: string;
  icon?: string;
}
```

### SettingsTab

```typescript
type SettingsTab = 'general' | 'members';
```

## 의존성

### 내부 의존성

- `@/domains/workspace-management/actions/workspace.actions`
- `@/domains/workspace-management/actions/workspace-member.actions`
- `@/domains/workspace-management/frontend/hooks/use-workspace`
- `@/domains/workspace-management/shared/dtos`
- `../workspace-member-list-table`
- `../invite-member-dialog`

### 외부 의존성

- `react-hook-form`: 폼 상태 관리
- `@hookform/resolvers/zod`: Zod 검증 리졸버
- `zod`: 스키마 검증
- `sonner`: Toast 알림
- `@tanstack/react-query`: Optimistic Updates 및 서버 상태 관리

## 참고 자료

- [프론트엔드 컴포넌트 개발 가이드라인](../../../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-12-14 | 2.0.0 | 컴포넌트 가이드라인에 따라 전면 리팩토링: Context 기반, UI/Business 로직 분리, Compound Pattern, TanStack Query |

