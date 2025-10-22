# Frontend Specification: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: 프론트엔드개발자 + UX/UI 디자이너  
**작성일**: 2025-10-19  
**버전**: v1.0

**User Flow 참조**: `03-user-flow.md`  
**Software Design 참조**: `03-software-design.md`  
**다음 단계**: 프론트엔드 구현

---

> **가이드 참조**: `docs/event-domain-design/guide/04-frontend-specification-guide.md`  
> **작성 시점**: User Flow 완료 후, 실제 구현 시작 전  
> **목적**: User Flow를 React 구조로 전환, DTO 설계, Context/Hooks/Components 정의

---

## 📊 Frontend Specification Overview

### 프론트엔드 구현 개요

Block Management Domain의 프론트엔드는 블록 생성, 편집, 삭제, 복제 기능을 제공하는 React 기반 인터페이스입니다. Canvas Management Domain과 연동되어 블록 타입 선택 및 메타데이터 관리 UI를 공유하며, 워크스페이스 기반 권한 관리와 DTO 기반 상태 관리를 특징으로 합니다.

### User Flow 연결점

- **입력**: `03-user-flow.md` - 4개 주요 시나리오 (블록 생성, 편집, 복제, 삭제)
- **입력**: `03-software-design.md` - Block Aggregate 1개
- **출력**: React Context, Hooks, Components

### 핵심 설계 원칙

- **타입 재사용**: Software Design의 Block Aggregate를 DTO로 직렬화
- **도메인 분리**: Block Management만의 독립적인 Context/Hook 구조
- **Result 패턴**: 함수형 에러 처리로 타입 안전성 확보
- **권한 기반 UI**: 워크스페이스 권한에 따른 조건부 렌더링
- **Canvas 연동**: 블록 타입 선택 UI를 Canvas Domain과 공유
- **메타데이터 검증**: 블록 타입별 실시간 스키마 검증

---

## 📦 DTO 및 타입 정의

### 1. DTO 인터페이스

#### BlockView DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: Block의 조회 정보를 직렬화 가능한 형태로 제공
- **주요 속성**:
  - id: string (BlockId Value Object → string 직렬화)
  - workspaceId: string (워크스페이스 ID)
  - blockType: string ('text' | 'image' | 'code' | 'page' | 'shape' | 'todo')
  - metadata: Record<string, unknown> (JSONB 메타데이터)
  - createdAt: string (Date → ISO 8601 string)
  - updatedAt: string (Date → ISO 8601 string)
  - deletedAt: string | null (소프트 삭제 시각 또는 null)
- **직렬화 규칙**:
  - BlockId Value Object → string 변환
  - BlockType Value Object → string 변환 (enum)
  - Date → ISO 8601 string 변환
  - JSONB → Record<string, unknown> 타입
  - Plain Object만 사용 (클래스, 함수 금지)
- **특징**: Next.js Server Actions의 직렬화 제약을 준수하며 Canvas Domain과 호환

**사용 위치**:
- 블록 목록: 블록 정보 표시
- 블록 편집: 현재 블록 정보 로드

---

#### BlockSummary DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: Block의 요약 정보를 제공하여 목록 표시 최적화
- **주요 속성**:
  - id: string
  - blockType: string
  - metadata: Record<string, unknown> (요약된 메타데이터)
  - createdAt: string
  - updatedAt: string
  - isDeleted: boolean (deleted_at 존재 여부)
- **특징**: 목록 조회 성능 향상을 위한 최소 정보만 포함

**사용 위치**:
- 블록 목록: 블록 타입별 필터링
- Canvas 블록 선택: 블록 타입 표시

---

#### Request DTOs

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: Server Actions에 전달되는 입력 데이터 구조 정의
- **CreateBlockRequest**:
  - workspaceId: string (필수)
  - blockType: string (필수)
  - initialMetadata?: Record<string, unknown> (선택적)
- **UpdateBlockRequest**:
  - blockId: string (필수)
  - blockType?: string (수정할 필드만)
  - metadata?: Record<string, unknown> (수정할 필드만)
- **DeleteBlockRequest**:
  - blockId: string (필수)
- **특징**: 폼 입력 데이터를 Server Actions에 전달하기 위한 타입

**사용 위치**:
- 블록 생성 폼: CreateBlockRequest
- 블록 편집 폼: UpdateBlockRequest
- 블록 삭제 확인: DeleteBlockRequest

---

### 2. BlockType DTO

#### BlockTypeInfo DTO

- **파일 위치**: `src/domains/block-management/shared/dtos/index.ts`
- **역할**: 블록 타입 선택 UI에서 사용하는 타입 정보
- **주요 속성**:
  - type: string ('text' | 'image' | 'code' | 'page' | 'shape' | 'todo')
  - displayName: string (UI에 표시될 이름)
  - icon: string (아이콘 이름 또는 URL)
  - description: string (타입 설명)
  - schema: Record<string, unknown> (메타데이터 스키마)
- **특징**: 블록 타입 선택 다이얼로그에서 사용

---

### 3. Result 패턴

- **파일 위치**: `src/domains/block-management/shared/types/index.ts`
- **역할**: 함수형 에러 처리를 위한 Result 패턴
- **주요 속성**:
  - success: boolean (성공 여부)
  - data?: T (성공 시 데이터)
  - error?: string (실패 시 에러 메시지)
- **주요 메서드**:
  - isSuccess(): 성공 여부 확인
  - isError(): 실패 여부 확인
- **특징**: try-catch 대신 함수형 에러 처리 패턴 사용

**사용 예시**:
- Server Actions의 반환값으로 사용
- 블록 작업 결과 처리를 명시적으로 분리
- 에러 메시지를 UI에 표시

---

## 🎯 React Context 설계

### 1. Context 타입 정의

#### BlockManagementContext

- **파일 위치**: `src/domains/block-management/frontend/contexts/block-management-context.tsx`
- **역할**: Block Management 도메인의 전역 상태를 관리하는 React Context
- **State 속성**:
  - blocks: BlockSummary[] (DTO 배열)
  - selectedBlockId: string | null (선택된 블록 ID)
  - blockTypes: BlockTypeInfo[] (사용 가능한 블록 타입들)
  - isLoading: boolean (로딩 상태)
  - error: string | null (에러 상태)
  - editingBlockId: string | null (편집 중인 블록 ID)
- **Actions 메서드**:
  - selectBlock(id): 블록 선택 및 쿠키에 저장
  - refreshBlocks(): Server Actions 호출하여 블록 목록 갱신
  - startEditingBlock(id): 블록 편집 모드 시작
  - stopEditingBlock(): 블록 편집 모드 종료
  - createBlock(request): 새 블록 생성
  - updateBlock(request): 블록 정보 업데이트
  - deleteBlock(blockId): 블록 삭제 (소프트 삭제)
  - duplicateBlock(blockId): 블록 복제
- **Context 타입**: State + Actions 결합
- **특징**: 
  - 도메인별 독립적인 Context 구조
  - DTO 기반 상태 관리
  - 편집 상태 관리 포함
  - 쿠키 기반 선택 상태 영속성

**데이터 흐름**:
1. Server Components에서 초기 블록 목록 로드
2. Provider를 통해 하위 컴포넌트에 상태 전달
3. Hook을 통해 컴포넌트에서 상태 접근
4. Actions를 통해 블록 CRUD 작업 수행

---

### 2. Provider 구현 패턴

- **파일 위치**: `src/domains/block-management/frontend/contexts/block-management-context.tsx`
- **역할**: BlockManagementContext를 실제로 구현하는 Provider 컴포넌트
- **주요 기능**:
  - useState를 통한 DTO 상태 관리
  - useEffect를 통한 초기 데이터 로드
  - 쿠키에서 선택 상태 복원
  - 블록 타입 정보 로드
  - 블록 CRUD 작업 처리
- **Props**:
  - children: React.ReactNode (하위 컴포넌트)
  - initialBlocks: BlockSummary[] (서버에서 전달된 초기 블록 목록)
  - workspaceId: string (현재 워크스페이스 ID)
- **특징**:
  - 워크스페이스별 블록 격리
  - 편집 상태와 선택 상태 분리 관리
  - 실시간 메타데이터 검증 지원

**구현 플로우**:
1. Server Components에서 initialBlocks와 workspaceId 전달
2. useState로 상태 초기화
3. useEffect에서 블록 타입 정보 로드
4. Context Provider로 하위 컴포넌트에 상태 전달

---

## 🪝 Custom Hooks 설계

### 1. 메인 Hook

#### useBlockManagement Hook

- **파일 위치**: `src/domains/block-management/frontend/hooks/use-block-management.ts`
- **역할**: BlockManagementContext를 사용하기 쉽게 추상화한 메인 Hook
- **주요 기능**:
  - Context 상태 및 Actions 접근
  - 선택된 블록 추출 (useMemo)
  - 편집 중인 블록 추출 (useMemo)
  - 비즈니스 로직 메서드 제공
- **제공 메서드**:
  - selectedBlock: 현재 선택된 블록 (useMemo로 최적화)
  - editingBlock: 현재 편집 중인 블록 (useMemo로 최적화)
  - blocksByType: 타입별 블록 필터링
  - canEditBlock(id): 블록 편집 가능 여부 검증
  - findBlocksByType(type): 타입별 블록 검색
  - validateMetadata(type, metadata): 메타데이터 검증
  - getBlockTypeInfo(type): 블록 타입 정보 조회
- **반환값**: Context 상태 + 추가 유틸리티 메서드
- **특징**:
  - Context를 직접 사용하지 않고 Hook을 통해 접근
  - 블록 타입별 검증 로직 캡슐화
  - 편집 권한 검증 로직 포함

**사용 시나리오**:
- 블록 목록에서 선택된 블록 정보 표시
- 편집 모드에서 현재 편집 중인 블록 정보 활용
- 블록 타입별 필터링 및 검색

---

### 2. Context Hook

- **파일 위치**: `src/domains/block-management/frontend/contexts/block-management-context.tsx`
- **역할**: BlockManagementContext 접근을 위한 내부 Hook
- **주요 기능**:
  - useContext를 통해 Context 접근
  - Provider 외부 사용 시 에러 발생
- **특징**:
  - 타입 안전성 보장
  - Provider 누락 시 명확한 에러 메시지
  - 메인 Hook에서 내부적으로 사용

---

## 🎨 UI 컴포넌트 설계

### 1. 블록 타입 선택 컴포넌트

#### BlockTypeSelector

- **파일 위치**: `src/domains/block-management/frontend/components/block-type-selector.tsx`
- **역할**: 블록 타입을 선택할 수 있는 다이얼로그 컴포넌트 (Canvas Domain과 공유)
- **주요 기능**:
  - 블록 타입 목록을 그리드 형태로 표시
  - 각 타입별 아이콘, 이름, 설명 표시
  - 검색 기능으로 타입 필터링
  - 선택 시 콜백 함수 호출
  - 권한 없는 타입 비활성화
- **사용 Hook**: useBlockManagement()
- **UI 라이브러리**: Dialog, DialogContent, DialogHeader, Input, Button, Badge
- **특징**:
  - Canvas Domain에서도 재사용 가능
  - 권한 기반 타입 활성화/비활성화
  - 반응형 그리드 레이아웃

**사용 위치**:
- 블록 생성: 타입 선택 다이얼로그
- Canvas: 플러스 버튼 클릭 시 블록 타입 선택

---

### 2. 블록 목록 컴포넌트

#### BlockList

- **파일 위치**: `src/domains/block-management/frontend/components/block-list.tsx`
- **역할**: 블록 목록을 표시하고 관리할 수 있는 컴포넌트
- **주요 기능**:
  - 블록 목록을 카드 형태로 표시
  - 블록별 타입 아이콘, 생성 시각, 수정 시각 표시
  - 편집, 복제, 삭제 액션 버튼
  - 타입별 필터링 및 검색
  - 로딩 상태 시 Skeleton 표시
  - 에러 발생 시 ErrorMessage 표시
  - 빈 목록 시 EmptyState 표시
- **사용 Hook**: useBlockManagement()
- **UI 라이브러리**: Card, Badge, Button, Input, Skeleton, ErrorMessage, EmptyState
- **특징**:
  - 권한 기반 액션 버튼 활성화/비활성화
  - 블록 타입별 아이콘 표시
  - 실시간 필터링 지원

**사용 위치**:
- 블록 관리 페이지: 블록 목록 표시 및 관리
- Canvas 사이드바: 블록 라이브러리 표시

---

### 3. 블록 편집 컴포넌트

#### BlockEditor

- **파일 위치**: `src/domains/block-management/frontend/components/block-editor.tsx`
- **역할**: 블록 정보를 편집할 수 있는 폼 컴포넌트
- **주요 기능**:
  - 블록 기본 정보 표시 (읽기 전용)
  - 블록 타입 변경 (드롭다운)
  - 메타데이터 JSON 편집기 (코드 에디터)
  - 실시간 메타데이터 스키마 검증
  - 저장/취소 버튼
  - 변경 이력 표시
- **사용 Hook**: useBlockManagement()
- **UI 라이브러리**: Form, Select, Textarea, Button, CodeEditor, Alert
- **특징**:
  - JSON 스키마 실시간 검증
  - 메타데이터 포맷팅 및 문법 하이라이팅
  - 변경사항 감지 및 저장 버튼 활성화

**사용 위치**:
- 블록 편집 모달: 블록 정보 상세 편집
- 블록 상세 페이지: 전체 화면 편집

---

### 4. 블록 생성 폼 컴포넌트

#### CreateBlockForm

- **파일 위치**: `src/domains/block-management/frontend/components/create-block-form.tsx`
- **역할**: 새 블록 생성을 위한 폼 컴포넌트
- **주요 기능**:
  - 블록 타입 선택
  - 초기 메타데이터 설정
  - useTransition을 통한 비동기 상태 관리
  - Server Actions 호출
  - 에러 처리 및 성공 메시지 표시
  - 제출 중 버튼 비활성화
- **사용 Hook**: useTransition, useBlockManagement
- **사용 Actions**: createBlockAction
- **UI 라이브러리**: Form, Button, Input, Select 등
- **특징**:
  - 블록 타입별 초기 메타데이터 템플릿 제공
  - 실시간 유효성 검증
  - 접근성 고려 (aria-label, role 등)

**사용 위치**:
- 블록 생성 모달: 새 블록 추가
- 블록 관리 페이지: 빠른 블록 생성

---

## 🔗 앱 레벨 통합

### 1. Provider 중첩 순서

**Root Layout 통합**:
```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <WorkspaceProvider initialWorkspaces={initialWorkspaces}>
            <BlockManagementProvider 
              initialBlocks={initialBlocks}
              workspaceId={selectedWorkspaceId}
            >
              <CanvasProvider>
                {children}
              </CanvasProvider>
            </BlockManagementProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```

**Provider 순서 원칙**:
- AuthProvider (가장 상위): 인증 상태 관리
- WorkspaceProvider: 워크스페이스 선택 상태
- BlockManagementProvider: 블록 관리 상태 (워크스페이스 의존)
- CanvasProvider: 캔버스 상태 (블록 의존)

---

### 2. 초기 데이터 전달

**Server Components에서 데이터 로드**:
```typescript
// src/app/blocks/layout.tsx
export default async function BlocksLayout({ 
  children, 
  params 
}: { 
  children: React.ReactNode;
  params: { workspaceId: string };
}) {
  const blocks = await getBlocksByWorkspaceAction(params.workspaceId);
  const blockTypes = await getBlockTypesAction();
  
  return (
    <BlockManagementProvider 
      initialBlocks={blocks}
      blockTypes={blockTypes}
      workspaceId={params.workspaceId}
    >
      {children}
    </BlockManagementProvider>
  );
}
```

---

### 3. 페이지에서 Hook 사용

**페이지 컴포넌트**:
```typescript
// src/app/blocks/page.tsx
export default function BlocksPage() {
  const { 
    blocks, 
    selectedBlock, 
    selectBlock,
    editingBlock,
    startEditingBlock 
  } = useBlockManagement();
  
  return (
    <div className="blocks-page">
      <div className="blocks-sidebar">
        <BlockList />
      </div>
      <div className="blocks-main">
        {editingBlock ? (
          <BlockEditor blockId={editingBlock.id} />
        ) : (
          <BlocksEmptyState />
        )}
      </div>
    </div>
  );
}
```

---

## 🔐 쿠키 기반 영속성

### Cookie Helpers

**유틸리티 함수**:
```typescript
// src/domains/block-management/frontend/utils/cookie-helpers.ts

export const BLOCK_COOKIE_KEYS = {
  SELECTED_BLOCK_ID: 'selected-block-id',
  EDITING_BLOCK_ID: 'editing-block-id',
};

export function getSelectedBlockIdFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const selectedBlockCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${BLOCK_COOKIE_KEYS.SELECTED_BLOCK_ID}=`)
  );
  return selectedBlockCookie ? selectedBlockCookie.split('=')[1] : null;
}

export function setSelectedBlockIdToCookie(id: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${BLOCK_COOKIE_KEYS.SELECTED_BLOCK_ID}=${id}; path=/`;
}

export function clearEditingBlockFromCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${BLOCK_COOKIE_KEYS.EDITING_BLOCK_ID}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
```

---

## 🎯 Canvas Domain 연동

### 1. 블록 타입 선택 공유

**BlockTypeSelector 공유**:
```typescript
// src/domains/canvas/frontend/components/canvas-toolbar.tsx
import { BlockTypeSelector } from '@/domains/block-management/frontend/components/block-type-selector';

export function CanvasToolbar() {
  const handleBlockTypeSelect = (blockType: string) => {
    // Canvas에서 블록 생성 로직
    createBlockOnCanvas(blockType);
  };

  return (
    <div className="canvas-toolbar">
      <Button onClick={() => setShowBlockSelector(true)}>
        <PlusIcon /> Add Block
      </Button>
      <BlockTypeSelector 
        onSelect={handleBlockTypeSelect}
        workspaceId={currentWorkspaceId}
      />
    </div>
  );
}
```

### 2. 블록 데이터 연동

**Canvas에서 블록 조회**:
```typescript
// src/domains/canvas/frontend/hooks/use-canvas-blocks.ts
export function useCanvasBlocks() {
  const { blocks, getBlocksByType } = useBlockManagement();
  
  const getAvailableBlocksForCanvas = useCallback(() => {
    return blocks.filter(block => !block.isDeleted);
  }, [blocks]);

  const getBlockById = useCallback((id: string) => {
    return blocks.find(block => block.id === id);
  }, [blocks]);

  return {
    availableBlocks: getAvailableBlocksForCanvas(),
    getBlockById,
    getBlocksByType,
  };
}
```

---

## ✅ 검증 체크리스트

### DTO 타입 정의
- [x] DTO 인터페이스가 Plain Object로 정의되었는가?
- [x] Date 객체가 ISO 문자열로 직렬화되었는가?
- [x] Value Object가 string으로 직렬화되었는가?
- [x] Next.js Server Actions 직렬화 제약을 준수하는가?

### Context 설계
- [x] 도메인별로 독립적인 Context가 생성되었는가?
- [x] DTO 배열과 선택된 엔티티 상태가 관리되는가?
- [x] 쿠키 기반 영속성이 구현되었는가?
- [x] 편집 상태 관리가 포함되었는가?

### Server Actions 연동
- [x] Supabase Auth 인증 확인이 포함되었는가?
- [x] 의존성 주입 패턴으로 Service Layer를 사용하는가?
- [x] Command 객체를 활용하여 입력을 구조화했는가?
- [x] DTO 직렬화가 올바르게 구현되었는가?
- [x] revalidatePath로 관련 페이지 재검증이 포함되었는가?

### Hook 구현
- [x] Context를 적절히 추상화한 Hook이 구현되었는가?
- [x] 비즈니스 로직 메서드가 포함되었는가?
- [x] 블록 타입별 검증 로직이 포함되었는가?
- [x] 편집 권한 검증이 포함되었는가?

### 컴포넌트 연동
- [x] 컴포넌트에서 직접 Context 접근을 피하고 Hook을 사용하는가?
- [x] BlockTypeSelector가 Canvas와 공유 가능한가?
- [x] 로딩 상태와 에러 상태가 적절히 처리되는가?
- [x] 빈 상태 처리가 포함되었는가?

### Canvas 연동
- [x] 블록 타입 선택 UI가 Canvas Domain과 공유되는가?
- [x] 블록 데이터 조회가 Canvas에서 가능한가?
- [x] 워크스페이스 기반 권한 관리가 일관되는가?

---

## 🚀 다음 단계

이 Frontend Specification을 기반으로 실제 구현을 시작하세요:

### TDD Implementation (07단계)
- **가이드**: `guide/07-tdd-implementation-guide.md`
- **산출물**: 실제 프론트엔드 코드 (Context, Hooks, Components)
- **내용**:
  - BlockManagementContext 구현 및 Provider 설정
  - useBlockManagement Hook 구현
  - BlockTypeSelector, BlockList, BlockEditor 컴포넌트 구현
  - Canvas Domain과의 연동 테스트

---

**문서 작성 완료 후**:
- [ ] 프론트엔드 개발자 리뷰 완료
- [ ] UX/UI 디자이너 리뷰 완료
- [ ] User Flow와 일관성 확인
- [ ] Canvas Domain 연동 검증
- [ ] Git 커밋 및 PR 생성
- [ ] 다음 단계(TDD Implementation) 준비

---

## 📁 폴더 구조 요약

```
src/domains/block-management/
├── shared/
│   ├── dtos/
│   │   └── index.ts                    # BlockView, BlockSummary, Request DTOs
│   ├── types/
│   │   └── index.ts                    # Result 패턴 및 공통 타입
│   ├── commands/                       # Command 객체들
│   └── errors/                         # BlockManagementError 타입들
├── frontend/
│   ├── contexts/
│   │   └── block-management-context.tsx # Context + Provider
│   ├── hooks/
│   │   └── use-block-management.ts      # 메인 Hook
│   ├── components/
│   │   ├── block-type-selector.tsx      # 블록 타입 선택 (Canvas 공유)
│   │   ├── block-list.tsx               # 블록 목록 컴포넌트
│   │   ├── block-editor.tsx             # 블록 편집 컴포넌트
│   │   └── create-block-form.tsx        # 블록 생성 폼
│   └── utils/
│       └── cookie-helpers.ts           # 쿠키 유틸리티
└── actions/
    └── block-management.actions.ts     # Server Actions
```

---

이 Frontend Specification을 따라 **User Flow 기반의 Block Management Domain 프론트엔드**와 **Canvas Domain과의 연동**을 구현할 수 있습니다! 🎨
