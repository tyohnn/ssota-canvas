# Workspace Context 리팩토링 계획

## 목표
- `workspace-context.tsx` → `workspace.context.tsx` 패턴으로 변경
- block-management의 custom-properties-section 패턴 적용
- UI와 비즈니스 로직 분리

## 현재 구조

```
contexts/
└── workspace-context.tsx (160 lines)
    ├── WorkspaceContextValue 인터페이스
    ├── WorkspaceContext (createContext)
    ├── WorkspaceProvider 컴포넌트
    │   ├── 상태 관리 (workspaces, selectedPageId, selectedWorkspaceId)
    │   ├── 초기화 로직 (쿠키 복원, 페이지 찾기)
    │   └── findPageInTree 헬퍼
    └── useWorkspaceContext hook
```

## 리팩토링 후 구조

### 옵션 1: 분리 유지 (권장)
```
contexts/
└── workspace/
    ├── context.tsx              # Context 정의 + useContext hook
    ├── provider.tsx             # Provider 컴포넌트
    ├── use-workspace-provider.ts # Provider 내부용 hook (상태 관리 + 초기화)
    └── types.ts                 # 타입 정의

hooks/
└── use-workspace.ts             # 외부 소비용 hook (계산된 속성 + 유틸리티)
```

### 옵션 2: 통합 (단순화)
```
contexts/
└── workspace/
    ├── context.tsx              # Context 정의 + useContext hook
    ├── provider.tsx             # Provider 컴포넌트
    ├── use-workspace-context.ts # 통합 hook (상태 관리 + 초기화)
    ├── use-workspace.ts         # 외부 소비용 hook (계산된 속성 + 유틸리티)
    └── types.ts                 # 타입 정의
```

## 파일별 역할

### 1. `context.tsx`
**역할**: Context 정의 및 접근 hook

```typescript
// ContextValue 타입 정의
export interface WorkspaceContextValue {
  organizationId: string;
  workspaces: WorkspaceWithPagesDTO[];
  setWorkspaces: React.Dispatch<...>;
  selectedPageId: string | null;
  selectedWorkspaceId: string | null;
  setSelectedPageId: React.Dispatch<...>;
  setSelectedWorkspaceId: React.Dispatch<...>;
}

// Context 생성
export const WorkspaceContext = createContext<...>(null);

// useContext hook
export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  }
  return context;
}
```

### 2. `provider.tsx`
**역할**: Provider 컴포넌트 (hook 호출)

```typescript
import { WorkspaceContext } from './context';
import { useWorkspaceContext } from './use-workspace-context';
import type { WorkspaceProviderProps } from './types';

export function WorkspaceProvider({
  children,
  organizationId,
  initialWorkspaces,
  initialSelectedPageId,
}: WorkspaceProviderProps) {
  const value = useWorkspaceContext({
    organizationId,
    initialWorkspaces,
    initialSelectedPageId,
  });

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
```

### 3. `use-workspace-provider.ts` (옵션 1) 또는 `use-workspace-context.ts` (옵션 2)
**역할**: Provider 내부용 - 상태 관리 + 초기화 로직

```typescript
export function useWorkspaceProvider({
  organizationId,
  initialWorkspaces,
  initialSelectedPageId,
}: UseWorkspaceProviderParams): WorkspaceContextValue {
  // 상태 관리
  const [workspaces, setWorkspaces] = useState(...);
  const [selectedPageId, setSelectedPageId] = useState(...);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(...);

  // 초기화 로직 (비즈니스)
  useEffect(() => {
    // 쿠키 복원, 페이지 찾기 등
  }, []);

  return {
    organizationId,
    workspaces,
    setWorkspaces,
    selectedPageId,
    selectedWorkspaceId,
    setSelectedPageId,
    setSelectedWorkspaceId,
  };
}
```

### 4. `use-workspace.ts` (외부 소비용)
**역할**: Context를 소비하여 계산된 속성과 유틸리티 제공

```typescript
export function useWorkspace() {
  const context = useWorkspaceContext(); // Context 소비
  
  // 계산된 속성
  const selectedPage = useMemo(...);
  const selectedWorkspace = useMemo(...);
  const favoritePages = useMemo(...);
  
  // 유틸리티 함수
  const findPageById = useCallback(...);
  const getWorkspaceByPage = useCallback(...);
  
  return {
    ...context, // Context 값 전달
    selectedPage,
    selectedWorkspace,
    favoritePages,
    findPageById,
    getWorkspaceByPage,
  };
}
```

### 4. `types.ts` (선택적)
**역할**: Props 타입 정의

```typescript
export interface WorkspaceProviderProps {
  children: React.ReactNode;
  organizationId: string;
  initialWorkspaces: WorkspaceWithPagesDTO[];
  initialSelectedPageId?: string | null;
}

export interface UseWorkspaceContextParams {
  organizationId: string;
  initialWorkspaces: WorkspaceWithPagesDTO[];
  initialSelectedPageId?: string | null;
}
```

## use-workspace.ts와의 관계

### 현재 구조
- `useWorkspaceContext()`: Context Provider 내부에서만 사용 (1곳)
- `useWorkspace()`: 외부 컴포넌트에서 널리 사용 (20+ 곳)

### 역할 분리
1. **`use-workspace-provider.ts`** (또는 `use-workspace-context.ts`)
   - Provider 내부용
   - Context 값을 생성 (상태 관리 + 초기화)
   - Provider 컴포넌트에서만 호출

2. **`use-workspace.ts`**
   - 외부 소비용
   - Context를 소비하여 계산된 속성 + 유틸리티 제공
   - 모든 컴포넌트에서 사용

### 통합 가능 여부
**결론: 분리 유지 권장**

이유:
- 역할이 명확히 다름 (생성 vs 소비)
- `use-workspace.ts`는 Context 외부에서 사용 (20+ 곳)
- block-management 패턴도 분리 유지
- 테스트와 유지보수 용이

### 옵션 비교

#### 옵션 1: 분리 유지 (권장) ✅
```
contexts/workspace/
  ├── use-workspace-provider.ts  # Provider 내부용
hooks/
  └── use-workspace.ts            # 외부 소비용
```
- 명확한 역할 분리
- 기존 import 경로 유지 가능
- 테스트 용이

#### 옵션 2: 통합
```
contexts/workspace/
  ├── use-workspace-context.ts   # Provider 내부용
  └── use-workspace.ts            # 외부 소비용 (같은 폴더)
```
- 관련 코드를 한 곳에 모음
- import 경로 변경 필요

## 마이그레이션 단계

### Step 1: 새 폴더 구조 생성
```
contexts/
└── workspace/
    ├── context.tsx
    ├── provider.tsx
    ├── use-workspace-context.ts
    └── types.ts
```

### Step 2: 파일 생성 및 코드 이동
1. `context.tsx` 생성 (Context 정의)
2. `types.ts` 생성 (타입 정의)
3. `use-workspace-provider.ts` 생성 (상태 관리 + 초기화) - Provider 내부용
4. `provider.tsx` 생성 (Provider 컴포넌트)
5. `use-workspace.ts` 유지 또는 이동 (외부 소비용)

### Step 3: Import 경로 업데이트
- `use-workspace.ts`
- `layout.tsx` (WorkspaceProvider 사용)
- `index.ts` (export)

### Step 4: 기존 파일 삭제
- `workspace-context.tsx` 삭제

## Import 경로 변경

### Before
```typescript
// Context
import { WorkspaceProvider, useWorkspaceContext } from '@/domains/workspace-management/frontend/contexts/workspace-context';

// Hook
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
```

### After (옵션 1: 분리 유지)
```typescript
// Context
import { WorkspaceProvider } from '@/domains/workspace-management/frontend/contexts/workspace/provider';
import { useWorkspaceContext } from '@/domains/workspace-management/frontend/contexts/workspace/context';

// Hook (기존 경로 유지)
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
```

### After (옵션 2: 통합)
```typescript
// 모두 같은 폴더에서
import { WorkspaceProvider, useWorkspaceContext, useWorkspace } from '@/domains/workspace-management/frontend/contexts/workspace';
```

또는 index.ts를 통해:
```typescript
import { WorkspaceProvider, useWorkspaceContext, useWorkspace } from '@/domains/workspace-management/frontend/contexts/workspace';
```

## 체크리스트

### 옵션 1: 분리 유지
- [ ] 새 폴더 구조 생성 (`contexts/workspace/`)
- [ ] `context.tsx` 생성
- [ ] `types.ts` 생성
- [ ] `use-workspace-provider.ts` 생성
- [ ] `provider.tsx` 생성
- [ ] `index.ts` 생성 (export)
- [ ] Import 경로 업데이트
  - [ ] `use-workspace.ts` (useWorkspaceContext import만 변경)
  - [ ] `layout.tsx` (WorkspaceProvider import)
  - [ ] `index.ts` (frontend/index.ts)
- [ ] 기존 `workspace-context.tsx` 삭제
- [ ] 린터 오류 확인
- [ ] 테스트 확인

### 옵션 2: 통합
- [ ] 새 폴더 구조 생성 (`contexts/workspace/`)
- [ ] `context.tsx` 생성
- [ ] `types.ts` 생성
- [ ] `use-workspace-context.ts` 생성
- [ ] `provider.tsx` 생성
- [ ] `use-workspace.ts` 이동 (hooks → contexts/workspace)
- [ ] `index.ts` 생성 (export)
- [ ] Import 경로 업데이트 (20+ 파일)
  - [ ] 모든 `use-workspace.ts` import
  - [ ] `layout.tsx`
  - [ ] `index.ts` (frontend/index.ts)
- [ ] 기존 `workspace-context.tsx` 삭제
- [ ] 린터 오류 확인
- [ ] 테스트 확인

