# Drive 기능 개발 계획

> 본 문서는 마케팅·제품개발 계획(`marketing-product-development-plan.md`) 및 복붙 지옥 해결 방향에 맞춘 **Drive** 기능의 개발 계획입니다.  
> Inbox → Drive 기획 전환, 기존 컴포넌트 최대 활용·복제를 원칙으로 합니다.

**요약**

- **라우팅**: `/r/[orgId]/drive` (루트), `/r/[orgId]/drive/folder/[folderId]`, `/r/[orgId]/drive/[blockId]` (블록 상세).
- **사이드바**: Search 버튼 자리를 Drive로 교체 → 클릭 시 `/r/[orgId]/drive` 이동.
- **추가 다이얼로그**: 좌측 탭(타입 선택) + 우측 빠른 입력 (Settings 다이얼로그 패턴).
- **도메인**: `drive` 도메인 신설, block/workspace/canvas/organization 컴포넌트 활용·복제.

---

## 1. 개요

### 1.1 목적

- **Drive**: org 단위로 블록을 모아 한 번에 보는 공간 (Google Drive 스타일 UX).
- block_mounts는 사용하지 않고 **blocks만** 조회·표시.
- 블록 타입: **link, audio, markdown, pdf, youtube, image** (shape 제외).

### 1.2 라우팅

| 용도 | 경로 | 비고 |
|------|------|------|
| Drive 루트 (그리드) | `/r/[orgId]/drive` | 루트 폴더 |
| 폴더 내부 그리드 | `/r/[orgId]/drive/folder/[folderId]` | 폴더별 목록 |
| 블록 상세(편집) | `/r/[orgId]/drive/[blockId]` | 좌: 블록 미리보기, 우: Editor Panel |

- 폴더와 블록 ID는 같은 path segment에 섞지 않음. 폴더는 `drive/folder/[folderId]`, 블록은 `drive/[blockId]`로 구분.

### 1.3 사이드바

- **검색(Search) 버튼 자리에 Drive 진입**으로 교체.
- 클릭 시 **다이얼로그가 아닌 페이지 이동**: `/r/[orgId]/drive`.
- 기존 Search 메뉴는 제거하고, Drive 메뉴만 노출 (검색은 Drive 상단 검색창으로 제공).

---

## 2. 도메인 구조

### 2.1 신규 도메인: `drive`

- 위치: `apps/web/src/domains/drive/`
- 역할: Drive 페이지, 그리드, 폴더 뷰, 블록 추가 다이얼로그, Drive 전용 훅/서비스.
- **프론트엔드 아키텍처 원칙** (구현 시 [component-development-guidelines](../patterns/frontend/component-development-guidelines.md) 준수):
  - **도메인 훅** (`domains/drive/frontend/hooks/`): 서버 액션은 도메인 훅으로만 호출. Presentational·UI 훅에서는 서버 액션 직접 호출 금지.
    - `use-drive-block-list.ts` — 블록 목록 조회·**더 보기 무한 스크롤** (TanStack Query **useInfiniteQuery**). queryKey: `['drive', 'blocks', orgId, folderId?, typeFilter?, search?]`. 각 페이지는 **limit + cursor**로 요청, 응답 `nextCursor`로 `getNextPageParam`/`fetchNextPage` 호출. Presentational에는 `blocks`(이어붙인 목록), `hasNextPage`, `fetchNextPage`, `isFetchingNextPage` 등만 props로 전달.
    - `use-drive-create-block.ts` — 블록 생성 (TanStack Query `useMutation`, 생성 후 목록 쿼리 invalidate 또는 optimistic update).
    - `use-drive-search.ts` (선택) — 키워드 검색 API 연동 시 `useQuery`/`useMutation` 래핑.
  - **컴포넌트 폴더 구조**: 각 Drive 전용 컴포넌트(그리드, 헤더, 추가 다이얼로그, 필터 바 등)는 `index.tsx`(Container) + `components/`(Presentational) + `core/`(use-*.ts, use-*.ui.ts, use-*.business.ts, types.ts) 구조 적용.
- 기존 도메인 의존성:
  - **block-management**: 블록 엔티티, Editor Panel, 블록 타입별 뷰 컴포넌트, 블록 CRUD.
  - **workspace-management**: WorkspacePageHeader 스타일/브레드크럼 재사용, org/workspace 컨텍스트.
  - **canvas-management**: 블록 타입 정의(툴바용), React Flow 없이 단일 블록 렌더링 참고.
  - **organization-management**: 사이드바에 Drive 버튼 노출 (SidebarHeaderGroup 수정).

---

## 3. 기존 컴포넌트 활용·복제 전략

### 3.1 원칙

- **최대한 기존 컴포넌트 활용 또는 복제 후 수정**.
- 새로 만드는 것은 Drive 전용 뷰(그리드 셀 미리보기), Drive 라우트/레이아웃, Drive용 훅/서비스만.

### 3.2 활용·복제 매트릭스

| 기능 | 기존 컴포넌트/위치 | Drive에서의 활용 |
|------|---------------------|------------------|
| 상단 헤더(브레드크럼) | `WorkspacePageHeader` (`workspace-management`) | **복제**: Drive용 헤더. Org > Drive > [폴더 경로]. Canvas header와 동일한 스타일, 브레드크럼만 Drive/폴더 경로로 교체. |
| 그리드 셀 미리보기 | 카드 뷰 아님. Original 뷰 블록 컴포넌트 | **Drive 전용 뷰 정의**. 캔버스에 올라가는 블록(DataBlock 등)을 **참고**하여, 동일 크기 그리드 셀용 **단순 미리보기** 컴포넌트 구현 (리사이징/React Flow 없음). |
| 블록 상세 페이지 | `EditorPanel` (`block-management`) | **그대로 사용**. `/[orgId]/drive/[blockId]` 페이지에서 좌측에 해당 블록 단일 배치, 우측에 기존 Editor Panel. |
| 단일 블록 렌더링 | DataBlock / node types (`block-management`, `canvas-management`) | **재사용 또는 래핑**. Drive 상세 페이지 좌측은 캔버스와 동일한 블록 컴포넌트로 렌더링하되, React Flow/노드 배치 없이 고정 영역에 1개만 표시. |
| 블록 추가 다이얼로그 | `BlockAddDialog` (타입 선택), `WorkspaceSettingsDialog` (좌측 탭 레이아웃) | **복제 후 조합**. 좌측 탭(Link, Audio, Markdown, PDF, YouTube, Image) + 우측 타입별 빠른 입력 폼. 툴바 아이콘/타입 정의는 `TOOLBAR_BLOCK_TYPES` 또는 `DEFAULT_BLOCK_TYPES` 참고. |
| 탭 네비게이션(좌측) | `WorkspaceSettingsDialog` + `TabNavigation` (`workspace-management`) | **복제**: Drive 추가 다이얼로그용 좌측 탭. 탭 목록만 블록 타입으로 변경. |
| 필터(타입별) | 일반 필터 UI 패턴 | **신규**. 그리드 상단 필터 바 (전체 / link / audio / markdown / pdf / youtube / image). |
| 검색창 | - | **신규**. Drive 헤더 상단 또는 헤더 내 검색 입력. 키워드 검색 API와 연동. |

### 3.3 제외 사항

- **Card View**: Drive 미리보기는 카드 뷰가 아닌 **Original 기반 Drive 전용 뷰**로 별도 정의.
- **Shape**: Drive에서는 제외 (표시/추가 타입에서 제외).
- **block_mounts**: Drive 목록/필터는 **blocks만** 사용. block_mounts 신경 쓰지 않음.

---

## 4. 페이지·화면 구성

**컴포넌트 패턴**: Drive 그리드, Drive 헤더, Drive 추가 다이얼로그, 타입 필터 바, 검색창 등 새 UI는 **Container/Presentational** 패턴 적용. Container(`index.tsx`)는 단일 오케스트레이션 훅만 사용하고, View(`components/`)는 **props만** 받으며 `useQuery`/`useMutation`/서버 액션을 사용하지 않음. WorkspaceSettingsDialog·MembersTab 복제 시와 동일하게, 컴포넌트별 **use-*.ui.ts**(로컬 UI 상태), **use-*.business.ts**(도메인 훅 조합), **use-*.ts**(오케스트레이션) 분리 유지.

### 4.1 Drive 루트 / 폴더 그리드 (`/drive`, `/drive/folder/[folderId]`)

- **상단**
  - 검색창 (키워드 검색).
  - Canvas 스타일 헤더: Org > Drive > [폴더 경로].
- **그리드 상단 바**
  - 좌측: 타입 필터 (전체 | link | audio | markdown | pdf | youtube | image).
  - 우측: **추가** 버튼 → Drive 추가 다이얼로그 오픈.
- **본문**
  - 동일 크기 그리드 셀. 셀 내용은 Drive 전용 미리보기(Original 기반, 단순화).
  - 클릭 시 `/[orgId]/drive/[blockId]` 로 이동.
- **더 보기 무한 스크롤**:
  - 그리드 하단 **"더 보기" 버튼** (또는 스크롤 끝 감지 시 자동 로드). Container가 도메인 훅의 `fetchNextPage`를 호출.
  - 도메인 훅은 **useInfiniteQuery** 사용: 1페이지는 cursor 없이, 이후는 이전 응답의 `nextCursor`로 요청. `hasNextPage`가 true일 때만 "더 보기" 활성화.
  - View는 **props만** 받음: `blocks`(누적 목록), `onLoadMore`(callback), `hasNextPage`, `isLoadingMore`. 로직은 Container/훅에만 두고 View는 버튼 클릭 시 `onLoadMore()` 호출만 수행.

### 4.2 블록 상세 (`/drive/[blockId]`)

- **좌측**: 해당 블록 1개만 배치. 캔버스와 동일한 블록 컴포넌트 사용, React Flow/리사이징 없음.
- **우측**: 기존 **Editor Panel** 그대로 사용.
- 미리보기는 실제 캔버스에 올라가는 블록과 동일한 데이터 활용.

### 4.3 추가 다이얼로그 (B안: 좌측 탭 + 빠른 입력)

- **트리거**: 그리드 상단 **추가** 버튼.
- **레이아웃**: 현재 Settings 다이얼로그처럼 **좌측 탭**, 우측 콘텐츠.
  - 좌측 탭: Link | Audio | Markdown | PDF | YouTube | Image (아이콘은 캔버스 툴바와 동일).
  - 우측: 선택된 탭에 해당하는 **타입별 빠른 입력 폼** (URL, 파일 업로드, 제목 등).
- **제출**: 블록 생성 후 그리드 반영, 필요 시 `/[orgId]/drive/[blockId]` 로 이동해 에디터 패널 노출.

---

## 5. 데이터·API

### 5.1 블록 목록 (더 보기 무한 스크롤)

- **범위**: org에 속한 워크스페이스들의 블록만 (block_mounts 무시, **blocks 테이블만**).
- **필터**: block_type IN (link, audio, markdown, pdf, youtube, image).
- **폴더**: 폴더가 별도 엔티티라면, 폴더별 블록 목록 API 또는 클라이언트에서 folderId로 필터.
- **무한 스크롤 API 계약**
  - **요청**: `limit`(고정, 예: 24) + `cursor`(선택, 첫 요청은 생략).
  - **응답**: `{ items: Block[], nextCursor: string | null }`. `nextCursor`가 있으면 다음 페이지 존재.
  - 정렬은 일관되게 유지(예: `created_at DESC`). cursor는 해당 정렬 기준의 "다음 위치" 식별자(예: 마지막 블록 id 또는 timestamp).
- **프론트(TanStack Query)**
  - 목록: 도메인 훅 `use-drive-block-list`에서 **useInfiniteQuery** 사용. queryKey: `['drive', 'blocks', orgId, folderId?, typeFilter?, search?]`. `getNextPageParam`: 이전 페이지의 `nextCursor` 반환(없으면 undefined). Container는 `data.pages`를 flat하여 View에 `blocks`로 전달하고, `fetchNextPage`를 "더 보기" 콜백으로 연결.
  - 블록 생성: `use-drive-create-block`에서 **useMutation** 사용. `onSuccess` 시 `queryClient.invalidateQueries({ queryKey: ['drive', 'blocks', ...] })`로 목록 갱신(무한 스크롤 쿼리 전체 invalidate).

**더 보기 무한 스크롤 로직 요약**

| 계층 | 역할 |
|------|------|
| **API** | 요청: `limit` + `cursor`(첫 요청은 생략). 응답: `{ items, nextCursor }` (다음 없으면 nextCursor는 null). |
| **Repository** | `listByWorkspaceIds(workspaceIds, { limit, cursor })` → `{ items, nextCursor }`. cursor 기준 정렬 일관(예: created_at DESC). |
| **도메인 훅** | `useInfiniteQuery`, `getNextPageParam(lastPage) => lastPage.nextCursor ?? undefined`. `fetchNextPage`를 "더 보기"에 연결. |
| **Container** | `data.pages` flat → `blocks`. View에 `blocks`, `onLoadMore`(=fetchNextPage), `hasNextPage`, `isLoadingMore` 전달. |
| **View** | "더 보기" 버튼(또는 스크롤 감지) 클릭 시 `onLoadMore()`만 호출. `hasNextPage`가 false면 버튼 비활성/숨김. |

### 5.2 백엔드

#### 5.2.1 백엔드 데이터 흐름(DDD)

Drive 관련 모든 서버 진입점은 프로젝트 DDD 컨벤션을 따릅니다. 데이터 흐름은 다음과 같습니다.

```
클라이언트 (DTO)
  → Server Action (request: unknown)
  → Zod safeParse → SafeDTO (검증 실패 시 INVALID_REQUEST 반환)
  → Internal Function (인증·권한, SafeDTO + userId)
  → Service (SafeDTO → Command 변환, Repository는 파라미터 주입)
  → Aggregate (Command → Domain Event)
  → Repository (Aggregate/Entity → DB row)
  → Database
```

- **Trust Boundary**: Server Action은 반드시 `unknown` 수신 후 Zod로 검증하고, 검증된 SafeDTO만 내부로 전달.
- **Secure Action**: Drive 신규 Action은 리소스에 맞게 **withPageSecureAction** 또는 **withWorkspaceSecureAction** 등 Secure Action HOF를 사용하는 것을 권장. (정의는 도메인별 `secure-action.ts`에서.)

#### 5.2.2 Drive Server Action·Internal·Service 목록

| 기능 | Server Action (Trust Boundary) | Internal | Service | 비고 |
|------|--------------------------------|----------|---------|------|
| **블록 목록 조회(Drive)** | Drive 스코프 요청 수신, Zod 검증 (**limit**, **cursor** 선택) | org/workspace 접근 권한, userId | Drive 전용 Service: org → workspace IDs 후 Block Repository 호출. **무한 스크롤**: limit + cursor 전달, 응답에 **nextCursor** 포함 (다음 페이지 없으면 null) | block-management 블록 목록과 스코프만 다름, Repository 확장 활용 |
| **블록 생성(추가 다이얼로그)** | 생성 요청 수신, Zod 검증 | 인증·권한, SafeDTO 보강 | 기존 block-management 블록 생성 Service 재사용 시 **SafeDTO만 전달**, Command 생성은 Service에서만 수행. Drive 전용 “블록만 생성(마운트 없음)”이면 해당 Command/Event/Aggregate 설계 | Phase 3에서 구현. 기존 createBlock·BlockMount 흐름 재사용 권장 |
| **검색** | 검색 요청 수신, Zod 검증 | 인증·org 스코프 | 기존 block 검색 로직을 org/workspace 스코프로 제한해 재사용 | 키워드 검색 |

- 모든 경로는 **Action(Trust Boundary) → Internal → Service** 를 거치며, Internal에서는 Command를 만들지 않고 SafeDTO만 Service에 전달.

#### 5.2.3 Repository·Service 컨벤션

- **Block Repository**: org 단위 목록을 위해 **인터페이스**에 `listByWorkspaceIds(workspaceIds, options?)` 를 추가. `options`: **limit**, **cursor**(선택, 무한 스크롤용). 반환은 `{ items, nextCursor }` 형태로 Service에서 그대로 응답 DTO에 매핑. 구현체는 기존 Drizzle Block Repository 확장 또는 Drive 전용 조회 메서드.
- **Service Layer**: **Service Function** 패턴 사용. Repository는 **파라미터로 주입**하며, Service는 SafeDTO를 받아 Command로 변환한 뒤 Aggregate에 전달. (Service Class pass-through는 사용하지 않음.)
- **블록 생성 시**: 기존 block-management의 Block(및 필요 시 BlockMount) Aggregate·Repository 재사용. Drive에서 호출할 때는 Internal이 SafeDTO만 넘기고, Command 생성·Aggregate 호출·Domain Event는 모두 Service 내부에서 처리.

- **목록·검색**: Block Repository에 `listByWorkspaceIds(workspaceIds, options?)` 확장 또는 Drive 전용 서비스에서 org → workspace IDs 조회 후 해당 workspace들의 블록만 조회. 검색은 기존 block 검색을 org/workspace 스코프로 제한해 재사용.

### 5.3 폴더 엔티티·데이터 모델

**필요 여부**: 폴더로 블록을 묶어서 보려면 **Drive 전용 폴더 엔티티와 “폴더–블록” 관계**가 필요합니다. 폴더 없이 **루트만 플랫 리스트**로 할 경우에는 엔티티 없이 구현 가능합니다.

**도입 시점**

- **MVP(Phase 1~4)**: 폴더 없이 `/r/[orgId]/drive` 루트만 구현 → org 소속 워크스페이스들의 블록을 타입 필터만으로 그리드 표시.
- **이후**: “폴더로 정리” UX를 넣을 때 아래 데이터 모델 도입.

**제안 스키마 (폴더 도입 시)**

| 테이블 | 역할 |
|--------|------|
| `drive_folders` | Drive 폴더. org 단위, 트리 구조. |
| `drive_folder_items` | 특정 폴더에 “무엇이 들어 있는지” (블록 또는 하위 폴더). 순서·이동 시 사용. |

- **drive_folders**
  - `id` (PK), `organization_id` (FK), `parent_folder_id` (FK, nullable, 루트는 null), `name`, `created_at`, `updated_at`, `created_by` 등.
  - 같은 org 내에서만 유효. 루트는 `parent_folder_id = null`로 표현하거나, “루트”는 테이블 없이 경로만 `/drive`로 두고, 실제 행은 “사용자가 만든 폴더”만 저장해도 됨.
- **drive_folder_items**
  - `id` (PK), `folder_id` (FK → drive_folders), `item_type` ('block' | 'folder'), `block_id` (nullable, item_type='block'일 때), `child_folder_id` (nullable, item_type='folder'일 때), `position` (정수, 정렬용), `created_at` 등.
  - 한 블록이 여러 폴더에 들어갈 수 있게 할지(복사/링크) vs “한 폴더에만 소속”은 제품 정책으로 결정. 단순화하면 **한 블록은 최대 한 폴더에만** (unique on block_id when item_type='block').

**정리**

- 폴더 **없이** 먼저 출시하려면: 폴더 엔티티/테이블 없이 진행. 라우트는 `/drive`, `/drive/[blockId]`만 사용하고, `/drive/folder/[folderId]`는 추후 추가.
- 폴더 **있게** 가려면: 위와 같이 `drive_folders` + `drive_folder_items` (또는 유사) 모델을 두고, 그리드/헤더 브레드크럼·이동·추가 시 folderId를 넘기는 식으로 연동.

---

## 6. 구현 단계 제안

### Phase 1: 라우트·레이아웃·사이드바

1. **라우트 추가**
   - `app/(dashboard)/r/[orgId]/drive/page.tsx` (루트 그리드).
   - `app/(dashboard)/r/[orgId]/drive/folder/[folderId]/page.tsx` (폴더 그리드).
   - `app/(dashboard)/r/[orgId]/drive/[blockId]/page.tsx` (블록 상세).
2. **drive 도메인 폴더 생성**
   - `domains/drive/` 하위에 frontend/components, hooks, (필요 시 backend/services) 구조.
   - Drive 전용 컴포넌트(그리드, 헤더, 추가 다이얼로그 등)는 각각 **index.tsx**(Container) + **components/** (Presentational) + **core/** (use-*.ts, use-*.ui.ts, use-*.business.ts) 폴더 구조 적용.
3. **사이드바 수정**
   - `SidebarHeaderGroup`: Search 버튼 제거, **Drive** 버튼 추가. 클릭 시 `/r/[orgId]/drive` 이동 (Link 또는 router.push).

### Phase 2: 그리드·헤더·필터

4. **Drive 헤더**
   - WorkspacePageHeader 복제 후 Drive용으로 수정 (Org > Drive > 폴더 경로).
5. **그리드 뷰**
   - Drive 전용 미리보기 셀 컴포넌트 (Original 기반, 동일 크기).
   - 타입 필터 바 (전체 + 6개 타입).
   - 검색창 연동 (키워드 검색).
6. **블록 목록 데이터 (더 보기 무한 스크롤)**
   - **도메인 훅** `use-drive-block-list`: 서버 액션을 **useInfiniteQuery**로 래핑. queryKey: `['drive', 'blocks', orgId, folderId?, typeFilter?, search?]`. 각 페이지 요청: limit(고정) + cursor(페이지마다 이전 응답의 nextCursor). `getNextPageParam(lastPage)` → `lastPage.nextCursor ?? undefined`. Container에서 `data.pages`를 flat해 View에 `blocks` 전달, `fetchNextPage`를 "더 보기" 버튼/스크롤에 연결. 서버는 §5.2.2·§5.1의 **limit + cursor / nextCursor** 계약으로 구현.

### Phase 3: 추가 다이얼로그

7. **Drive 추가 다이얼로그**
   - WorkspaceSettingsDialog·TabNavigation 패턴 복제. 훅 레이어도 동일하게 유지: **use-*.ui.ts**(폼/탭 상태), **use-*.business.ts**(도메인 훅 `use-drive-create-block` 조합), **use-*.ts**(오케스트레이션).
   - 좌측 탭: Link, Audio, Markdown, PDF, YouTube, Image (캔버스 툴바 아이콘 재사용).
   - 우측: 타입별 빠른 입력 폼 (URL, 파일, 제목 등).
   - **제출(블록 생성)**: **도메인 훅** `use-drive-create-block`에서 서버 액션을 **useMutation**으로 래핑. `onSuccess` 시 블록 목록 쿼리 invalidate(또는 optimistic update). 서버 측은 Server Action → Internal → Service(Command 생성은 Service에서만), 기존 block-management 블록 생성 재사용. 블록 생성 후 그리드 갱신 및 필요 시 블록 상세로 이동.

### Phase 4: 블록 상세 페이지

8. **블록 상세 페이지**
   - 좌측: 단일 블록 렌더링 (기존 블록 컴포넌트 재사용, React Flow 없음).
   - 우측: Editor Panel 그대로 사용 (blockId 전달).
9. **폴더**
   - MVP는 폴더 없이 루트 그리드만 구현 가능. 폴더를 쓰려면 **§5.3 폴더 엔티티·데이터 모델** 도입 후 `drive/folder/[folderId]` 라우트·브레드크럼·이동/추가 연동.

---

## 7. 참조

**계획·제품**

- `docs/plans/marketing-product-development-plan.md` — 복붙 지옥·와우 전략.
- `docs/plans/drive-feature-plan-ddd-evaluation.md` — 본 계획의 DDD 레이어 평가 결과.

**백엔드 DDD·Secure Action (구현 시 준수)**

- `docs/patterns/backend/server-side-ddd-conventions.md` — Trust Boundary, SafeDTO→Command→Event, Service Function, Aggregate·Repository 컨벤션.
- `.cursor/skills/server-side-ddd-architecture-check/reference/secure-action-definition.md` — withSecureAction, withPageSecureAction, 도메인 전용 wrapper.
- `.cursor/skills/server-side-ddd-architecture-check/reference/actions-folder-structure.md` — 도메인별 actions 폴더, “불러서 함수 정의만” 규칙.

**프론트엔드·도메인**

- `docs/patterns/frontend/component-development-guidelines.md` — Container/Presentational, 훅 레이어(도메인·UI·비즈니스·오케스트레이션), TanStack Query, 폴더 구조. Drive 구현 시 준수.
- `apps/web/src/domains/organization-management/frontend/components/sidebar/sidebar-header-group.tsx` — Search 버튼 위치, Drive로 교체 대상.
- `apps/web/src/domains/workspace-management/frontend/components/sidebar/components/workspace-item/components/workspace-settings-dialog/` — 좌측 탭 다이얼로그 패턴.
- `apps/web/src/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/canvas-toolbar/core/toolbar-block-types.ts` — 블록 타입·아이콘 (shape 제외하고 Drive에 사용).
- `apps/web/src/domains/block-management/frontend/components/editor-panel/` — Editor Panel 재사용.
