# InvitationDetailDialog

워크스페이스 초대 상세 및 수락/거절 다이얼로그 컴포넌트

## 개요

사용자가 워크스페이스 초대를 확인하고 수락/거절할 수 있는 모달 컴포넌트입니다. 프론트엔드 컴포넌트 개발 가이드라인을 따라 설계되었습니다.

## 아키텍처

### 핵심 원칙

1. **Context 기반 상태 공유**: Props drilling 대신 Context API 사용
2. **UI/Business 로직 분리**: 노코드 툴 호환성 및 테스트 용이성
3. **Compound Component 패턴**: 서브 컴포넌트 조합
4. **노코드 친화적**: 함수 Props 제거, 단순 값만 노출
5. **TanStack Query**: Optimistic Updates 및 서버 상태 관리

### 폴더 구조

```
invitation-detail-dialog/
├── components/                            # UI 컴포넌트만
│   ├── dialog-header.tsx                  # 다이얼로그 헤더
│   ├── dialog-content.tsx                  # 다이얼로그 컨텐츠
│   ├── dialog-footer.tsx                  # 다이얼로그 푸터
│   └── invitation-info.tsx                # 초대 정보 표시
├── core/                                  # 로직만 (상태 + 비즈니스)
│   ├── types.ts                           # 타입 정의
│   ├── context.tsx                        # Context 정의 및 커스텀 훅
│   ├── provider.tsx                       # Context Provider
│   ├── use-invitation-detail-dialog.ui.ts # UI 상태 관리 훅
│   ├── use-invitation-detail-dialog.business.ts # 비즈니스 로직 훅
│   └── use-invitation-detail-dialog.ts    # 통합 훅
├── index.tsx                              # 메인 엔트리
└── README.md                              # 문서
```

## 사용법

### 기본 사용 (Production)

```tsx
import { InvitationDetailDialog } from './invitation-detail-dialog';

function MyComponent() {
  const [open, setOpen] = useState(false);
  const [invitation, setInvitation] = useState<InvitationSummaryDTO | null>(null);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        View Invitation
      </Button>
      
      <InvitationDetailDialog
        open={open}
        onOpenChange={setOpen}
        invitation={invitation}
      />
    </>
  );
}
```

### 테스트/Mock 환경

```tsx
import {
  InvitationDetailDialog,
  useMockInvitationDetailBusiness,
} from './invitation-detail-dialog';

function TestComponent() {
  const mockBusiness = useMockInvitationDetailBusiness();

  return (
    <InvitationDetailDialog
      open={true}
      onOpenChange={() => {}}
      invitation={mockInvitation}
      businessLogic={mockBusiness}
    />
  );
}
```

## 컴포넌트 구조

### Provider

모든 서브 컴포넌트에 상태를 제공합니다:

```tsx
<InvitationDetailDialogProvider
  open={open}
  onOpenChange={setOpen}
  invitation={invitation}
>
  <InvitationDetailDialogContent />
</InvitationDetailDialogProvider>
```

### 서브 컴포넌트

각 서브 컴포넌트는 Context를 통해 자동으로 연결되며, 노코드 친화적인 Props만 노출합니다:

#### `InvitationDetailDialogHeader`

```tsx
<InvitationDetailDialogHeader
  title="Workspace Invitation"  // 커스터마이징 가능
  className="..."              // 스타일 커스터마이징
/>
```

#### `InvitationInfo`

초대 정보를 표시합니다 (상태 뱃지, 워크스페이스 정보, 초대자 정보 등).

#### `InvitationDetailDialogFooter`

```tsx
<InvitationDetailDialogFooter
  acceptText="Accept"          // 수락 버튼 텍스트
  rejectText="Reject"          // 거절 버튼 텍스트
  closeText="Close"            // 닫기 버튼 텍스트
  processingText="Processing..." // 처리 중 텍스트
  className="..."              // 스타일 커스터마이징
/>
```

## 훅 (Hooks)

### UI 상태 훅 (useInvitationDetailDialogUI)

**목적:** UI 상태만 관리 (비즈니스 로직 없음)

**반환 값:**
```typescript
{
  isProcessing: boolean;
  isPending: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  isExpired: boolean;
  
  setIsProcessing: (processing: boolean) => void;
}
```

### 비즈니스 로직 훅 (useInvitationDetailBusiness)

**목적:** API 호출 및 데이터 검증

**반환 값:**
```typescript
{
  acceptInvitation: (invitationId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  rejectInvitation: (invitationId: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  isAccepting?: boolean;  // TanStack Query loading state
  isRejecting?: boolean;   // TanStack Query loading state
}
```

**TanStack Query 워크플로우:**
1. **mutationFn**: API 호출 (accept/reject)
2. **onSuccess**: 성공 토스트 표시
3. **onError**: 에러 토스트 표시

### Mock 비즈니스 로직 훅 (useMockInvitationDetailBusiness)

**목적:** 테스트 및 노코드 툴용 Mock 구현

### 통합 훅 (useInvitationDetailDialog)

**목적:** UI + Business 로직 통합

**파라미터:**
```typescript
useInvitationDetailDialog(
  { open, onOpenChange, invitation },
  businessLogic?: InvitationDetailBusinessLogic
)
```

## 워크플로우

### 1. 사용자가 다이얼로그 열기

```
User clicks "View Invitation"
  ↓
open={true}, invitation={invitationData}
  ↓
Dialog opens with invitation info
```

### 2. 초대 수락/거절

```
User clicks "Accept" or "Reject"
  ↓
handleAccept / handleReject called
  ↓
TanStack Query mutation
  ↓
API 호출 → acceptWorkspaceInvitationAction / rejectWorkspaceInvitationAction
  ↓
Success?
  ├─ Yes:
  │   ├─ Show success toast
  │   └─ Close dialog
  │
  └─ No:
      ├─ Show error toast
      └─ Keep dialog open
```

## 타입

### InvitationDetailDialogProps

```typescript
interface InvitationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: InvitationSummaryDTO | null;
}
```

### InvitationDetailDialogContextValue

```typescript
interface InvitationDetailDialogContextValue {
  // Props
  invitation: InvitationSummaryDTO | null;

  // UI State
  isProcessing: boolean;

  // Business State (TanStack Query)
  isAccepting?: boolean;
  isRejecting?: boolean;

  // Computed state
  isPending: boolean;
  isAccepted: boolean;
  isRejected: boolean;
  isExpired: boolean;

  // Actions
  handleAccept: () => Promise<void>;
  handleReject: () => Promise<void>;
  handleClose: () => void;
}
```

## 의존성

### 내부 의존성

- `@/domains/workspace-management/actions/workspace-member.actions`
- `@/domains/workspace-management/shared/dtos`

### 외부 의존성

- `@tanstack/react-query`: Optimistic Updates 및 서버 상태 관리
- `sonner`: Toast 알림
- `lucide-react`: 아이콘

## 참고 자료

- [프론트엔드 컴포넌트 개발 가이드라인](../../../../../../../docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-12-14 | 2.0.0 | 컴포넌트 가이드라인에 따라 전면 리팩토링: Context 기반, UI/Business 로직 분리, Compound Pattern, TanStack Query |
