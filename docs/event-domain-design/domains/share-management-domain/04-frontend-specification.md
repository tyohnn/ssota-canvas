# Share Management Domain - Frontend Specification

이 문서는 **Share Management Domain**의 User Flow와 Software Design을 기반으로 프론트엔드 명세를 정의합니다.

---

## 🎯 Frontend Implementation Overview

### 구현 범위
- **도메인**: Share Management (게시/접속/복제)
- **주요 기능**: 게시 링크 생성, 게시 링크 접속, 복제 플로우
- **UI 컴포넌트**: 게시 확인/결과 다이얼로그, 게시 링크 뷰어, 복제 다이얼로그
- **제외 범위**: 실제 페이지 편집 UI, 워크스페이스 도메인 내부 구현

### 현재 구현 상태
- 📋 **Phase 1**: 게시 플로우 UI
- 📋 **Phase 2**: 게시 링크 뷰어 + 링크 복사
- 📋 **Phase 3**: 복제 플로우 (회원/비회원 분기)

---

## 📋 1. DTO 타입 정의

### 1.1 DTO 직렬화 컨벤션

**파일 위치**: `src/domains/share/shared/dtos/index.ts`

- **Plain Object만 사용**: 클래스, 함수, Date 객체 금지
- **ISO 문자열 사용**: Date → string 변환
- **Value Object 직렬화**: Domain Value Object → string 변환

### 1.2 DTO 타입 정의

#### PublishedPageView DTO
```typescript
export interface PublishedPageView {
  pageId: string;
  title: string;
  icon?: string;
  blocks: BlockData[];
  publishToken: string;
  status: 'published';
  isReadOnly: true;
}
```

#### PublishResult DTO
```typescript
export interface PublishResult {
  pageId: string;
  publishToken: string;
  publishUrl: string; // /p/[token]
  publishedAt: string;
}
```

#### WorkspaceSelectionView DTO
```typescript
export interface WorkspaceSelectionView {
  workspaces: {
    id: string;
    name: string;
    icon?: string;
    organizationName?: string;
  }[];
}
```

#### CopyResult DTO
```typescript
export interface CopyResult {
  copiedPageId: string;
  targetWorkspaceId: string;
  status: 'completed' | 'failed';
  errorMessage?: string; // status가 failed일 때만 사용
}
```

#### Request DTOs
```typescript
export interface PublishPageRequest {
  pageId: string;
}

export interface CopyPublishedPageRequest {
  publishToken: string;
  targetWorkspaceId: string;
}
```

---

## 🎛️ 2. React Context 설계

### 2.1 Context 타입 정의

**파일 위치**: `src/domains/share/frontend/contexts/share-context.tsx`

```typescript
interface ShareContextType {
  publishedPage: PublishedPageView | null;
  workspaces: WorkspaceSelectionView['workspaces'];
  isLoading: boolean; // 현재 화면 기준 단일 로딩 상태 (동시 액션은 고려하지 않음)
  error: string | null;

  loadPublishedPage: (token: string) => Promise<void>;
  loadWorkspaces: () => Promise<void>;
  publishPage: (request: PublishPageRequest) => Promise<PublishResult>;
  copyPublishedPage: (request: CopyPublishedPageRequest) => Promise<CopyResult>;
}
```

### 2.2 Provider 구현

- ShareContext는 Share Management Domain 내 UI 상태를 통합 관리하는 Facade Context이다
- **상태 관리**: publishedPage, workspaces, isLoading, error
- **초기 데이터 로드**:
  - 게시 링크 뷰어 진입 시 `loadPublishedPage`
  - 복제 다이얼로그 오픈 시 `loadWorkspaces`
- **에러 처리**: 공통 에러 메시지 + 재시도 경로 제공

---

## 🪝 3. Custom Hooks 설계

### useShare Hook

**파일 위치**: `src/domains/share/frontend/hooks/use-share.ts`

```typescript
export function useShare() {
  // Context 상태 접근
  // publish/copy 액션 래핑
  // 읽기 전용 상태 및 링크 복사 헬퍼 제공
}
```

**제공 메서드**:
- `openPublishDialog(pageId)`
- `confirmPublish()`
- `copyLinkToClipboard(url)`
- `openCopyDialog(token)`
  
**설계 의도**:
- useShare는 Share Domain 관련 UI 행동을 묶은 convenience hook이다

---

## 🧩 4. UI 컴포넌트 설계

### 4.1 PublishFlow

**파일 위치**: `src/domains/share/frontend/components/publish-flow.tsx`

- **역할**: 게시 버튼 → 확인 다이얼로그 → 결과 피드백
- **입력**: pageId
- **출력**: publishUrl 표시

### 4.2 PublishedPageViewer

**파일 위치**: `src/domains/share/frontend/components/published-page-viewer.tsx`

- **역할**: 게시된 페이지 렌더링
- **UI 요소**:
  - 읽기 전용 배너: "이 페이지는 게시된 읽기 전용 페이지입니다"
  - 링크 복제 버튼
  - 복제 버튼

### 4.3 CopyFlowDialog

**파일 위치**: `src/domains/share/frontend/components/copy-flow-dialog.tsx`

- **역할**: 복제 확인, 워크스페이스 선택, 결과 피드백
- **UX 규칙**:
  - 워크스페이스 미선택 시 복제 버튼 비활성화
  - 실패 시 워크스페이스 선택 상태로 복귀

### 4.4 LoginPromptDialog

**파일 위치**: `src/domains/share/frontend/components/login-prompt-dialog.tsx`

- **역할**: 비회원 복제 시 로그인 안내
- **모바일 처리**: Bottom Sheet 대체

---

## ⚡ 5. Server Actions 연동

**파일 위치**: `src/domains/share/actions/share.actions.ts`

### publishPageAction
- **입력**: PublishPageRequest
- **로직**: 소유자 검증 → 게시 상태 업데이트 → 링크 생성
- **반환**: PublishResult

### getPublishedPageAction
- **입력**: token
- **로직**: 토큰 검증 → 페이지/스냅샷 조회
- **반환**: PublishedPageView

### getWorkspaceSelectionAction
- **입력**: 없음 (현재 사용자 기준)
- **로직**: 워크스페이스 목록 조회
- **반환**: WorkspaceSelectionView

### copyPublishedPageAction
- **입력**: CopyPublishedPageRequest
- **로직**: 회원 확인 → 워크스페이스 권한 검증 → 복제 실행
- **반환**: CopyResult
  - Login Required 응답 시 LoginPromptDialog를 노출한다
  - 에러 유형 세분화는 Phase 이후 고려

---

## 🧭 6. 화면-컴포넌트 매핑

| User Flow 화면 | 컴포넌트 | 주요 상태 |
|--------------|---------|---------|
| 게시 확인 다이얼로그 | PublishFlow | isOpen, isLoading, publishUrl |
| 게시 결과 피드백 | PublishFlow | success/error |
| 게시된 페이지 뷰어 | PublishedPageViewer | publishedPage |
| 로그인 안내 다이얼로그 | LoginPromptDialog | isOpen (로그인 성공 후 CopyFlowDialog로 복귀) |
| 복제 확인 다이얼로그 | CopyFlowDialog | selectedWorkspaceId, isLoading |

---

## ✅ 7. UX 규칙 요약

- 비소유자 게시 버튼 비활성화 시 툴팁 표시
- 게시 완료 후 "게시된 페이지 보기" 또는 "공유하기" 보조 액션 제공
- 읽기 전용 안내 텍스트 상단 고정 표시
- 로그인 후 복제 다이얼로그 자동 재오픈
- 워크스페이스 미선택 시 복제 버튼 비활성화
- 복제 실패 시 워크스페이스 선택 상태로 복귀
- 모바일에서 로그인/복제 다이얼로그는 Bottom Sheet 사용

---

*이 문서는 Share Management Domain의 프론트엔드 구현을 위한 기준 문서입니다.*
