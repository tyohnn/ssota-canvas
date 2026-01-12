# Share Domain 리팩토링 완벽 가이드 (v2 - ACL 제거 버전)

> **작성일**: 2026-01-09  
> **목적**: Share 도메인 리팩토링의 모든 변경사항을 전/후 비교로 정리하고, ACL 제거를 통한 도메인 간 서비스 호출 구조 확립

---

## 📚 목차

1. [백엔드 아키텍처 개선](#1-백엔드-아키텍처-개선)
2. [프론트엔드 아키텍처 개선](#2-프론트엔드-아키텍처-개선)
3. [도메인 레이어 정리](#3-도메인-레이어-정리)
4. [UI/UX 개선](#4-uiux-개선)
5. [데이터베이스 스키마 개선](#5-데이터베이스-스키마-개선)
6. [앞으로 지켜야 할 코딩 규칙](#6-앞으로-지켜야-할-코딩-규칙)

---

## 1. 백엔드 아키텍처 개선

### 1.1 ACL 제거 및 도메인 서비스 직접 호출

#### ❌ **이전: ACL(Anti-Corruption Layer) 사용**

```typescript
// share/backend/services/workspace-management.acl.ts
// ❌ 문제: Share 도메인 내부에 Workspace 관련 인터페이스를 정의
// 이는 Workspace 도메인의 책임이 Share 도메인으로 누수되는 것
export interface WorkspaceManagementAcl {
  getPageSnapshot(pageId: string): Promise<PageSnapshot>;
  getWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]>;
  getPageInfo(pageId: string): Promise<PageInfo | null>;
  getWorkspaceInfo(workspaceId: string): Promise<WorkspaceInfo | null>;
}

// share/backend/services/default-workspace-management.acl.ts
// ❌ 문제: Workspace 도메인의 쿼리 로직을 Share 도메인에서 다시 구현
// 이는 코드 중복과 유지보수 부담을 증가시킴
export class DefaultWorkspaceManagementAcl implements WorkspaceManagementAcl {
  async getWorkspacesForUser(_userId: string): Promise<WorkspaceSummary[]> {
    // ❌ 문제: adminDb를 직접 사용하여 Workspace 테이블 조회
    // Workspace 도메인의 Repository를 우회하여 데이터에 접근
    const rows = await adminDb
      .select({
        id: workspaces.id,
        name: workspaces.name,
        icon: workspaces.icon,
        organizationName: organizations.name,
      })
      .from(workspaces)
      // 워크스페이스 멤버 정보를 조인하여 사용자가 속한 워크스페이스 찾기
      .leftJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
      // 조직 정보를 조인하여 조직명 가져오기
      .leftJoin(organizations, eq(workspaces.organization_id, organizations.id))
      .where(
        and(
          // 삭제되지 않은 워크스페이스만 조회
          isNull(workspaces.deleted_at),
          or(
            // 사용자가 멤버로 속한 워크스페이스
            eq(workspaceMembers.user_id, _userId),
            // 또는 사용자가 소유자인 워크스페이스
            eq(workspaces.owner_id, _userId)
          )
        )
      )
      // 기본 워크스페이스를 최상단에, 나머지는 생성일 순으로 정렬
      .orderBy(desc(workspaces.is_default), workspaces.created_at);

    // ❌ 문제: Share 도메인의 DTO 형태로 변환
    // Workspace 도메인의 Entity를 사용하지 않고 직접 매핑
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon ?? undefined,
      organizationName: row.organizationName ?? undefined,
    }));
  }
  // ...
}

// share/backend/services/share-query.service.ts
export class ShareQueryService {
  constructor(
    private readonly publishedPageRepository: PublishedPageRepository,
    // ❌ 문제: ACL에 의존하여 Workspace 정보를 가져옴
    // 이는 불필요한 추상화 레이어를 추가하고 복잡도를 증가시킴
    private readonly workspaceManagementAcl: WorkspaceManagementAcl,
    private readonly canvasQueryService: CanvasQueryService
  ) { }
}
```

**문제점:**
- **중복 코드**: Workspace 도메인의 쿼리 로직을 ACL에서 다시 작성 (DRY 원칙 위반)
- **도메인 경계 모호**: Share 도메인이 Workspace의 DB 스키마를 직접 알아야 함
- **유지보수 어려움**: Workspace 스키마 변경 시 ACL도 함께 수정 필요
- **테스트 복잡도**: ACL을 Mock하려면 Workspace 도메인의 내부 구조를 알아야 함
- **책임 분산**: Workspace 관련 로직이 Workspace와 Share 두 곳에 존재

#### ✅ **이후: Workspace 도메인의 서비스 직접 호출**

```typescript
// workspace-management/backend/services/interfaces/workspace-query.service.interface.ts
// ✅ 개선: Workspace 도메인이 자신의 공개 API를 명확히 정의
// 다른 도메인은 이 인터페이스만 알면 됨
export interface WorkspaceQueryService {
  /**
   * 워크스페이스 이름 조회
   * @param workspaceId - 조회할 워크스페이스 ID
   * @returns Result로 감싼 워크스페이스 이름 (에러 처리 명시적)
   */
  getWorkspaceName(workspaceId: WorkspaceId): Promise<Result<string, WorkspaceManagementError>>;
  
  /**
   * 워크스페이스 기본 정보 조회
   * @param workspaceId - 조회할 워크스페이스 ID
   * @returns 워크스페이스의 모든 기본 정보 (id, name, description 등)
   */
  getWorkspaceBasicInfo(workspaceId: WorkspaceId): Promise<
    Result<{
      id: string;
      name: string;
      description: string | null;
      icon: string | null;
      isDefault: boolean;
      organizationId: string;
    }, WorkspaceManagementError>
  >;
  
  /**
   * 사용자가 속한 모든 워크스페이스 조회
   * @param userId - 사용자 ID
   * @returns 사용자가 멤버이거나 소유한 워크스페이스 목록
   */
  getWorkspacesForUser(userId: string): Promise<
    Result<Array<{
      id: string;
      name: string;
      icon?: string;
      organizationName?: string;
    }>, WorkspaceManagementError>
  >;
  
  /**
   * 페이지 기본 정보 조회
   * @param pageId - 페이지 ID
   * @returns 페이지의 제목, 아이콘, 소속 워크스페이스 등
   */
  getPageInfo(pageId: string): Promise<
    Result<{
      pageId: string;
      title: string;
      icon?: string;
      workspaceId?: string;
    }, WorkspaceManagementError>
  >;
  
  /**
   * 페이지가 속한 워크스페이스 정보 조회
   * @param pageId - 페이지 ID
   * @returns 워크스페이스 ID, 이름, 조직 ID
   */
  getWorkspaceByPageId(pageId: string): Promise<
    Result<{
      workspaceId: string;
      workspaceName: string;
      organizationId: string;
    }, WorkspaceManagementError>
  >;
}

// workspace-management/backend/services/workspace-query.service.ts
// ✅ 개선: Workspace 도메인 내부에서 구현
// 이 로직은 Workspace 도메인의 책임이므로 여기서 관리
export class DefaultWorkspaceQueryService implements WorkspaceQueryService {
  constructor(
    // ✅ Repository를 통해 데이터 접근 (도메인 경계 유지)
    private workspaceRepository: WorkspaceRepository,
    private workspaceMemberRepository: WorkspaceMemberRepository,
    private pageRepository: PageRepository
  ) {}

  /**
   * 사용자가 속한 워크스페이스 목록 조회
   * ✅ 개선: Workspace 도메인의 책임으로 명확히 정의
   */
  async getWorkspacesForUser(userId: string): Promise<
    Result<Array<{
      id: string;
      name: string;
      icon?: string;
      organizationName?: string;
    }>, WorkspaceManagementError>
  > {
    try {
      // ✅ 동일한 쿼리 로직이지만, 이제 Workspace 도메인 내부에 위치
      // 스키마 변경 시 이 한 곳만 수정하면 됨
      const rows = await adminDb
        .select({
          id: workspaces.id,
          name: workspaces.name,
          icon: workspaces.icon,
          organizationName: organizations.name,
        })
        .from(workspaces)
        .leftJoin(workspaceMembers, eq(workspaces.id, workspaceMembers.workspace_id))
        .leftJoin(organizations, eq(workspaces.organization_id, organizations.id))
        .where(
          and(
            isNull(workspaces.deleted_at),
            or(
              eq(workspaceMembers.user_id, userId),
              eq(workspaces.owner_id, userId)
            )
          )
        )
        .orderBy(desc(workspaces.is_default), workspaces.created_at);

      const result = rows.map(row => ({
        id: row.id,
        name: row.name,
        icon: row.icon ?? undefined,
        organizationName: row.organizationName ?? undefined,
      }));

      // ✅ Result 타입으로 감싸서 반환 (에러 처리 명시적)
      // 호출하는 쪽에서 성공/실패를 명확히 알 수 있음
      return Result.success(result);
    } catch (error) {
      // ✅ 도메인 에러로 변환하여 반환
      // 데이터베이스 에러를 도메인 에러로 추상화
      return Result.error(
        new WorkspaceManagementError(
          'WORKSPACE_RETRIEVAL_FAILED',
          'Failed to get workspaces for user',
          { error }
        )
      );
    }
  }
  // ...
}

// share/backend/services/share-query.service.ts
export class ShareQueryService {
  constructor(
    private readonly publishedPageRepository: PublishedPageRepository,
    // ✅ 개선: Workspace 도메인의 공개 서비스를 직접 의존
    // ACL이라는 중간 레이어 없이 직접 통신
    private readonly workspaceQueryService: WorkspaceQueryService,
    private readonly canvasQueryService: CanvasQueryService
  ) { }

  async getPublishedPage(publishToken: string): Promise<PublishedPageView> {
    // 1. 게시된 페이지 정보 조회 (Share 도메인의 책임)
    const publishedPage = await this.publishedPageRepository.findByToken(
      new PublishToken(publishToken)
    );

    if (!publishedPage || publishedPage.status !== 'published') {
      throw new ShareManagementError('PUBLISH_LINK_NOT_FOUND', 'Link not found');
    }

    // 2. ✅ Workspace Service를 통해 페이지 정보 조회
    // Result 타입을 받아서 성공/실패를 명시적으로 처리
    const pageInfoResult = await this.workspaceQueryService.getPageInfo(
      publishedPage.pageId
    );
    // Result가 성공이면 값을 추출, 실패면 null
    const pageInfo = pageInfoResult.isSuccess() ? pageInfoResult.value : null;

    // 3. 페이지가 속한 워크스페이스 정보 조회 (필요한 경우에만)
    const workspaceInfoResult = pageInfo?.workspaceId
      ? await this.workspaceQueryService.getWorkspaceByPageId(publishedPage.pageId)
      : null;
    const workspaceInfo = workspaceInfoResult?.isSuccess()
      ? workspaceInfoResult.value
      : null;

    // 4. Canvas 정보 조회 (Canvas 도메인의 서비스 사용)
    const canvasResult = await this.canvasQueryService.getCanvasView(
      new PageId(publishedPage.pageId),
      new UserId(publishedPage.ownerId)
    );

    if (canvasResult.isError()) {
      throw new ShareManagementError(
        'PUBLISH_LINK_NOT_FOUND',
        'Failed to load published page'
      );
    }

    const canvasView = canvasResult.value;

    // 5. 모든 정보를 조합하여 PublishedPageView 생성
    return {
      pageId: publishedPage.pageId,
      title: pageInfo?.title ?? 'Untitled',  // 페이지 정보가 없으면 기본값
      icon: pageInfo?.icon,
      blocks: canvasView.blocks,
      edges: canvasView.edges,
      viewport: canvasView.viewport,
      publishToken: publishedPage.publishToken.toString(),
      status: 'published',
      isReadOnly: true,
      workspaceId: pageInfo?.workspaceId,
      organizationId: workspaceInfo?.organizationId,
    };
  }
}

// share/actions/share.actions.ts
/**
 * ✅ 팩토리 함수: WorkspaceQueryService 인스턴스 생성
 * 필요한 Repository들을 주입하여 서비스 생성
 * 이렇게 하면 테스트 시 Mock Repository를 쉽게 주입 가능
 */
const createWorkspaceQueryService = () => {
  return new DefaultWorkspaceQueryService(
    new DrizzleWorkspaceRepository(),      // Workspace 데이터 접근
    new DrizzleWorkspaceMemberRepository(), // 멤버십 데이터 접근
    new DrizzlePageRepository()             // 페이지 데이터 접근
  );
};

/**
 * 게시된 페이지 조회 액션 (내부용)
 * ✅ 서버 컴포넌트에서 직접 호출 가능 (인증 체크 없음)
 */
export async function getPublishedPageActionInternal(
  publishToken: string
): Promise<PublishedPageView> {
  // Share 도메인의 Repository 생성
  const repository = new DrizzlePublishedPageRepository();

  // ✅ ShareQueryService 생성 시 필요한 모든 서비스 주입
  const queryService = new ShareQueryService(
    repository,
    createWorkspaceQueryService(),  // ✅ Workspace 서비스 주입
    new CanvasQueryService(         // Canvas 서비스 주입
      new DrizzleBlockMountRepository(),
      new DrizzleEdgeRepository(),
      new DrizzleViewportRepository()
    )
  );

  // 서비스를 통해 게시된 페이지 조회
  return queryService.getPublishedPage(publishToken);
}
```

**개선점:**
- ✅ **중복 코드 제거**: Workspace 도메인의 로직을 ACL에서 복제하지 않음
- ✅ **단일 책임 원칙**: Workspace 관련 로직은 Workspace 도메인의 서비스에서만 관리
- ✅ **명확한 도메인 경계**: `WorkspaceQueryService` 인터페이스를 통해 계약 명확화
- ✅ **에러 처리 일관성**: `Result` 타입을 통한 명시적 에러 핸들링
- ✅ **테스트 용이성**: Mock 서비스 주입으로 단위 테스트 작성 용이
- ✅ **유지보수성 향상**: Workspace 스키마 변경 시 Workspace 도메인만 수정하면 됨

---

### 1.2 Repository 패턴 마이그레이션

#### ❌ **이전: Supabase Client 직접 사용**

```typescript
// SupabasePublishedPageRepository (안티패턴)
import { createClient } from '@/utils/supabase/server';

export class SupabasePublishedPageRepository {
  async save(publishedPage: PublishedPage): Promise<void> {
    const supabase = await createClient();
    await supabase.from('published_pages').insert({
      page_id: publishedPage.pageId,
      owner_id: publishedPage.ownerId,
      // ...
    });
  }
}
```

**문제점:**
- Supabase에 강하게 결합됨 (나중에 DB 변경 시 모든 코드 수정 필요)
- 타입 안전성 부족 (Supabase의 타입 추론에 의존)
- 테스트 어려움 (실제 DB 필요)

#### ✅ **이후: DrizzleORM 사용**

```typescript
// DrizzlePublishedPageRepository
import { adminDb } from '@/db';
import { publishedPages } from '@/db/schema';
import { eq } from 'drizzle-orm';

export class DrizzlePublishedPageRepository implements PublishedPageRepository {
  async save(publishedPage: PublishedPage): Promise<void> {
    await adminDb
      .insert(publishedPages)
      .values({
        page_id: publishedPage.pageId,
        owner_id: publishedPage.ownerId,
        publish_token: publishedPage.publishToken.toString(),
        status: publishedPage.status,
        published_at: publishedPage.publishedAt,
        snapshot_version: publishedPage.snapshotVersion,
      })
      .onConflictDoUpdate({
        target: publishedPages.page_id,
        set: {
          publish_token: publishedPage.publishToken.toString(),
          status: publishedPage.status,
          published_at: publishedPage.publishedAt,
          updated_at: new Date(),
        },
      });
  }
}
```

**개선점:**
- ✅ 타입 안전성 (TypeScript 완벽 지원)
- ✅ DB 독립성 (PostgreSQL, MySQL 등 쉽게 전환 가능)
- ✅ 쿼리 빌더로 복잡한 쿼리 작성 용이
- ✅ 마이그레이션 자동 생성

---

### 1.3 Repository Interface 분리

#### ❌ **이전: 구현과 인터페이스가 섞임**

```
src/domains/share/backend/repositories/
  ├── drizzle-published-page.repository.ts  (구현 + 인터페이스)
  └── supabase-published-page.repository.ts (구현 + 인터페이스)
```

#### ✅ **이후: 명확한 계층 분리**

```
src/domains/share/backend/repositories/
  ├── interfaces/
  │   └── published-page.repository.interface.ts  (인터페이스만)
  └── implementations/
      └── drizzle-published-page.repository.ts    (구현만)
```

```typescript
// interfaces/published-page.repository.interface.ts
export interface PublishedPageRepository {
  save(publishedPage: PublishedPage): Promise<void>;
  findByPageId(pageId: PageId): Promise<PublishedPage | null>;
  findByToken(publishToken: PublishToken): Promise<PublishedPage | null>;
}
```

**개선점:**
- ✅ 의존성 역전 원칙 (DIP) 준수
- ✅ 테스트 시 Mock 구현 쉽게 주입 가능
- ✅ 여러 구현체 교체 용이

---

### 1.4 이벤트 기반 아키텍처 구현

#### ❌ **이전: 단순 CRUD**

```typescript
async publishPage(command: PublishPageCommand): Promise<PublishResult> {
  const aggregate = new PublishedPageAggregate();
  const publishedPage = aggregate.publish(command);
  
  await this.publishedPageRepository.save(publishedPage);  // 저장만 하고 끝
  
  return { publishToken: publishedPage.publishToken.toString() };
}
```

**문제점:**
- 이벤트가 생성되지만 아무도 처리하지 않음
- 확장 불가능 (알림, 통계 등 추가 기능 구현 어려움)

#### ✅ **이후: 이벤트 처리 추가**

```typescript
async publishPage(command: PublishPageCommand): Promise<PublishResult> {
  // 1. Aggregate 생성 및 커맨드 실행
  const aggregate = new PublishedPageAggregate();
  const publishedPage = aggregate.publish(command);

  // 2. Entity 저장
  await this.publishedPageRepository.save(publishedPage);

  // 3. 이벤트 핸들러 실행 (Share Management 도메인 내부)
  const events = aggregate.getUncommittedEvents();
  await this.handleDomainEvents(events);

  // 4. 이벤트 커밋 (메모리 정리)
  aggregate.markEventsAsCommitted();

  // 5. 결과 반환
  return { publishToken: publishedPage.publishToken.toString() };
}

private async handleDomainEvents(
  events: Array<PagePublishedEvent | PublishLinkAccessedEvent>
): Promise<void> {
  const results = await Promise.allSettled(
    events.map(async (event) => {
      if (event.type === 'PagePublished') {
        return await this.handlePagePublished(event);
      } else if (event.type === 'PublishLinkAccessed') {
        return await this.handlePublishLinkAccessed(event);
      }
    })
  );
  
  // 실패한 이벤트 로깅 (일부 실패해도 전체는 성공)
  const failures = results.filter(r => r.status === 'rejected');
  if (failures.length > 0) {
    console.warn(`${failures.length} event handler(s) failed`);
  }
}

private async handlePagePublished(event: PagePublishedEvent): Promise<void> {
  console.log('[Share Management] Page Published:', event);
  // Policy 구현 예시:
  // - 알림 전송 (소유자에게 "페이지가 게시되었습니다")
  // - 통계 업데이트 (게시된 페이지 수 증가)
  // - 검색 인덱스 업데이트 (공개 페이지 검색 가능하게)
}
```

**개선점:**
- ✅ Event Storming의 Policy와 1:1 매칭
- ✅ 확장 가능 (나중에 알림, 통계 등 쉽게 추가)
- ✅ `Promise.allSettled` 사용으로 일부 실패해도 전체 프로세스 계속

---

## 2. 프론트엔드 아키텍처 개선

### 2.1 Server-First Data Fetching

#### ❌ **이전: 클라이언트에서 초기 데이터 로딩**

```tsx
// published-page-viewer.tsx
export function PublishedPageViewer({ publishToken }: Props) {
  const { publishedPage, loadPublishedPage } = useShare();
  
  useEffect(() => {
    loadPublishedPage(publishToken);  // 클라이언트에서 데이터 가져옴
  }, [publishToken]);
  
  if (!publishedPage) return <div>Loading...</div>;  // 로딩 화면 필수
  
  return <Canvas data={publishedPage} />;
}
```

**문제점:**
- 사용자가 첫 화면에서 로딩 스피너를 봐야 함
- SEO 불리 (크롤러가 빈 페이지만 봄)
- 성능 저하 (서버 → 클라이언트 → 서버 왕복)

#### ✅ **이후: 서버 컴포넌트에서 데이터 전달**

```tsx
// page.tsx (Server Component)
export default async function PublishPage({ params }: Props) {
  const { token } = await params;
  
  // 서버에서 초기 데이터를 직접 가져옴
  const initialData = await getPublishedPageActionInternal(token);
  
  return <PublishPageClient initialData={initialData} token={token} />;
}

// publish-page-client.tsx (Client Component)
export default function PublishPageClient({ initialData, token }: Props) {
  return (
    <ShareProvider initialPublishedPage={initialData}>
      <PublishedPageViewer 
        publishToken={token}
        initialData={initialData}  // Props로 전달
      />
    </ShareProvider>
  );
}

// published-page-viewer.tsx
export function PublishedPageViewer({ initialData }: Props) {
  const { publishedPage } = useShare();
  const data = publishedPage || initialData;  // Props 우선 사용
  
  // useEffect로 로딩하지 않음!
  
  return <Canvas data={data} />;  // 즉시 렌더링
}
```

**개선점:**
- ✅ 첫 번째 프레임부터 완성된 페이지 표시
- ✅ SEO 개선 (서버에서 완전한 HTML 생성)
- ✅ 성능 향상 (네트워크 왕복 1회 감소)

---

### 2.2 Context 역할 명확화

#### ❌ **이전: Context가 데이터 로딩까지 담당**

```typescript
// share-context.tsx
export function ShareProvider({ children }: Props) {
  const [publishedPage, setPublishedPage] = useState(null);
  
  const loadPublishedPage = async (token: string) => {  // ❌ 클라이언트 로딩
    const data = await getPublishedPageAction(token);
    setPublishedPage(data);
  };
  
  return (
    <ShareContext.Provider value={{ publishedPage, loadPublishedPage }}>
      {children}
    </ShareContext.Provider>
  );
}
```

**문제점:**
- Context의 책임이 과다 (상태 관리 + 데이터 로딩)
- SRP(단일 책임 원칙) 위반

#### ✅ **이후: 서버에서 받은 데이터만 전파**

```typescript
// share-context.tsx
export function ShareProvider({ 
  children,
  initialPublishedPage = null  // 서버에서 전달받음
}: Props) {
  const [publishedPage, setPublishedPage] = useState(initialPublishedPage);
  
  // loadPublishedPage 제거! ✅
  
  return (
    <ShareContext.Provider value={{ publishedPage }}>
      {children}
    </ShareContext.Provider>
  );
}
```

**개선점:**
- ✅ Context는 상태 전파만 담당
- ✅ 데이터 로딩은 서버 컴포넌트의 책임

---

## 3. 도메인 레이어 정리

### 3.1 DTO 구조화

#### ❌ **이전: 모든 DTO가 한 파일에**

```typescript
// dtos/index.ts
export interface PublishedPageView { /* ... */ }
export interface PublishResult { /* ... */ }
export interface PublishPageRequest { /* ... */ }  // Request와 Response 섞임
export interface CopyPublishedPageRequest { /* ... */ }
```

**문제점:**
- Request와 Response 구분 불명확
- Validation 없음 (런타임 에러 가능성)

#### ✅ **이후: Request/Response 분리 + Zod 검증**

```
dtos/
  ├── index.ts          (re-export)
  ├── request.ts        (Request DTOs + Zod schemas)
  └── response.ts       (Response DTOs)
```

```typescript
// request.ts
import { z } from 'zod';

export const PublishPageRequestSchema = z.object({
  pageId: z.string().uuid(),
});

export type PublishPageRequest = z.infer<typeof PublishPageRequestSchema>;

// response.ts
export interface PublishResult {
  pageId: string;
  publishToken: string;
  publishUrl: string;
  publishedAt: string;
}
```

**개선점:**
- ✅ Request는 Zod로 런타임 검증
- ✅ Request/Response 명확히 구분
- ✅ 서버 액션에서 안전하게 사용

---

### 3.2 이벤트 통합 및 Entity 값 사용

#### ❌ **이전: 중복 이벤트 + Command 값 사용**

```typescript
// Aggregate
publish(command: PublishPageCommand): PublishedPage {
  const token = this.generateToken();
  const publishedPage = new PublishedPage(/* ... */);
  
  // Command 값을 그대로 이벤트에 전달 ❌
  this.events.push(
    new PagePublishedEvent(command.pageId, command.requesterId, token.toString())
  );
  this.events.push(
    new PublishLinkGeneratedEvent(command.pageId, token.toString())  // 중복!
  );
  
  return publishedPage;
}
```

**문제점:**
- `PagePublishedEvent`와 `PublishLinkGeneratedEvent`가 사실상 동일
- Command 값을 사용 (성공한 Entity 값이 아님)

#### ✅ **이후: 이벤트 통합 + Entity 값 사용**

```typescript
// Aggregate
publish(command: PublishPageCommand): PublishedPage {
  const token = this.generateToken();
  const publishedAt = new Date();
  
  // Entity 생성
  const publishedPage = new PublishedPage(
    command.pageId,
    command.requesterId,
    'published',
    token,
    publishedAt
  );
  
  // Entity 값을 사용하여 이벤트 생성 ✅
  this.events.push(
    new PagePublishedEvent(
      publishedPage.pageId,      // Entity 값
      publishedPage.ownerId,     // Entity 값
      publishedPage.publishToken, // Entity 값
      publishedPage.publishedAt   // Entity 값
    )
  );
  
  return publishedPage;
}

// Event
export class PagePublishedEvent {
  constructor(
    public readonly pageId: PageId,
    public readonly ownerId: UserId,
    public readonly publishToken: PublishToken,  // VO 사용
    public readonly publishedAt: Date,
    public readonly timestamp: Date = new Date()
  ) {}
}
```

**개선점:**
- ✅ 이벤트 통합 (게시 = 링크 생성)
- ✅ 성공한 Entity의 값을 이벤트에 전달
- ✅ Value Object 사용으로 타입 안전성 향상

---

### 3.3 Value Object 활용

#### ❌ **이전: 원시 타입 사용**

```typescript
// Command
export interface ExecuteCopyPageCommand {
  publishToken: string;  // ❌ 검증 없는 string
  targetWorkspaceId: string;
  requesterId: string;
}
```

**문제점:**
- 비즈니스 규칙 검증 없음
- 잘못된 값이 시스템 전체로 전파될 수 있음

#### ✅ **이후: Value Object 사용**

```typescript
// Command
export interface ExecuteCopyPageCommand {
  publishToken: PublishToken;  // ✅ 검증된 VO
  targetWorkspaceId: WorkspaceId;
  requesterId: UserId;
}

// Value Object
export class PublishToken {
  private readonly value: string;

  constructor(token: string) {
    if (!token || token.trim().length === 0) {
      throw new ShareManagementError('INVALID_TOKEN', 'Token cannot be empty');
    }
    this.value = token;
  }

  toString(): string {
    return this.value;
  }
}
```

**개선점:**
- ✅ 비즈니스 규칙이 검증된 값만 시스템에 진입
- ✅ 타입 안전성 (string과 PublishToken 구분)
- ✅ 불변성 보장

---

### 3.4 불필요한 코드 제거

#### ❌ **이전: 사용하지 않는 Entity/Aggregate**

```typescript
// copy-workflow.entity.ts (사용 안 함)
export class CopyWorkflow {
  constructor(
    public readonly id: CopyWorkflowId,
    public status: WorkflowStatus,
    // ...
  ) {}
}

// copy-workflow.aggregate.ts (사용 안 함)
export class CopyWorkflowAggregate {
  attemptCopy(command: AttemptCopyPageCommand): CopyWorkflow {
    // ...
  }
}
```

**문제점:**
- 실제로 사용하지 않는 코드가 프로젝트에 남아있음
- 유지보수 부담

#### ✅ **이후: 불필요한 코드 제거**

```bash
# 삭제된 파일들
rm copy-workflow.entity.ts
rm copy-workflow.aggregate.ts
rm publish-link-path.vo.ts  # 링크 구조는 변경 가능하므로 토큰만 저장
rm workspace-management.acl.ts  # ACL 제거
rm default-workspace-management.acl.ts  # ACL 구현체 제거
```

**개선점:**
- ✅ 코드베이스 간소화
- ✅ 유지보수 부담 감소

---

### 3.5 Entity 메서드 정리

#### ❌ **이전: 불필요한 권한 검증 메서드**

```typescript
export class PublishedPage {
  canPublishBy(userId: UserId): boolean {  // ❌ Entity에서 권한 검증
    return this.ownerId === userId;
  }
}
```

**문제점:**
- 권한 검증은 이미 상위 레이어(Service/Action)에서 처리됨
- Entity는 도메인 로직에만 집중해야 함

#### ✅ **이후: 도메인 로직만 유지**

```typescript
export class PublishedPage {
  unpublish(): void {  // ✅ 순수 도메인 로직만
    this.status = 'unpublished';
  }
}
```

**개선점:**
- ✅ Entity는 도메인 로직에만 집중
- ✅ 권한 검증은 Service/Action에서 처리

---

## 4. UI/UX 개선

### 4.1 shadcn Dialog 적용

#### ❌ **이전: 커스텀 모달**

```tsx
export function LoginPromptDialog({ isOpen, onClose }: Props) {
  if (!isOpen) return null;  // 수동 조건부 렌더링
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl border bg-background p-5">
        <h3>로그인 필요</h3>
        <p>페이지를 복제하려면 로그인이 필요합니다.</p>
        <div className="flex gap-2">
          <Button onClick={onClose}>닫기</Button>
          <Button onClick={onLogin}>로그인</Button>
        </div>
      </div>
    </div>
  );
}
```

**문제점:**
- ESC 키, 외부 클릭 등 접근성 기능 수동 구현 필요
- 애니메이션 없음
- 프로젝트 전체와 일관성 부족

#### ✅ **이후: shadcn Dialog 사용**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';

export function LoginPromptDialog({ isOpen, onClose }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            You need to log in to copy this page.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onLogin}>Login</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**개선점:**
- ✅ ESC 키, 외부 클릭 자동 처리
- ✅ 부드러운 애니메이션
- ✅ 키보드 포커스 트랩 (접근성)
- ✅ 프로젝트 전체와 일관된 디자인

---

### 4.2 한글 → 영어 변경

#### ❌ **이전: 한글 UI**

```tsx
<Button>게시</Button>
<p>페이지 소유자만 게시할 수 있습니다</p>
<Button>링크 복사</Button>
```

#### ✅ **이후: 영어 UI**

```tsx
<Button>Publish</Button>
<p>You do not have permission to publish</p>
<Button>Copy Link</Button>
```

**개선점:**
- ✅ 글로벌 서비스 대비
- ✅ 일관된 언어 사용

---

### 4.3 권한 모델 개선

#### ❌ **이전: Owner 기반**

```tsx
interface PublishFlowProps {
  isOwner: boolean;  // 소유자만 게시 가능
}

<Button 
  disabled={!isOwner}
  title="Only page owner can publish"
/>
```

**문제점:**
- 향후 워크스페이스/조직 멤버도 게시 권한을 가질 수 있음
- 확장성 제한

#### ✅ **이후: Permission 기반**

```tsx
interface PublishFlowProps {
  isPublishable: boolean;  // 게시 권한 여부
}

<Button 
  disabled={!isPublishable}
  title="You do not have permission to publish"
/>
```

**개선점:**
- ✅ 향후 다양한 역할(Admin, Member 등) 지원 가능
- ✅ 의미가 더 명확함

---

## 5. 데이터베이스 스키마 개선

### 5.1 Soft Delete (Unpublish)

#### ❌ **이전: Hard Delete**

```typescript
async unpublishPage(pageId: string): Promise<void> {
  await this.publishedPageRepository.deleteByPageId(pageId);  // DB에서 완전 삭제
}
```

**문제점:**
- 게시 이력이 완전히 삭제됨
- 재게시 시 새로운 토큰 생성 필요
- 통계 및 분석 데이터 손실

#### ✅ **이후: Soft Delete (상태 변경)**

```typescript
async unpublishPage(pageId: string, userId: string): Promise<void> {
  const publishedPage = await this.publishedPageRepository.findByPageId(pageId);
  
  if (!publishedPage || publishedPage.ownerId !== userId) {
    throw new Error('Not authorized');
  }
  
  // 상태만 변경, 레코드는 유지
  publishedPage.unpublish();
  await this.publishedPageRepository.save(publishedPage);
}

// Entity
unpublish(): void {
  this.status = 'unpublished';  // published → unpublished
}
```

**개선점:**
- ✅ 레코드는 DB에 유지
- ✅ 게시 이력 추적 가능
- ✅ 재게시 시 동일한 토큰 재사용 가능

---

### 5.2 RLS (Row Level Security) 정책

#### ❌ **이전: 불완전한 정책**

```sql
-- 읽기만 가능
CREATE POLICY "published_pages_read" ON published_pages
  FOR SELECT TO anon, authenticated
  USING (true);
```

**문제점:**
- UPDATE, DELETE 정책 없음
- 사용자가 자신의 데이터를 수정할 수 없음

#### ✅ **이후: 완전한 CRUD 정책**

```sql
-- 읽기 (모든 사용자)
CREATE POLICY "Enable read for all users" ON published_pages
  FOR SELECT TO anon, authenticated
  USING (true);

-- 생성 (인증된 사용자, 자신의 데이터만)
CREATE POLICY "Enable insert for page owner" ON published_pages
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- 수정 (인증된 사용자, 자신의 데이터만)
CREATE POLICY "Enable update for page owner" ON published_pages
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

-- 삭제 (인증된 사용자, 자신의 데이터만)
CREATE POLICY "Enable delete for page owner" ON published_pages
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());
```

**개선점:**
- ✅ 완전한 CRUD 정책
- ✅ 데이터베이스 레벨에서 보안 보장

---

## 6. 앞으로 지켜야 할 코딩 규칙

### 6.1 도메인 간 통신 원칙

#### 📐 **ACL vs 서비스 호출 선택 기준**

**서비스 직접 호출을 사용해야 하는 경우 (권장):**
- ✅ 다른 도메인의 **공개 API**를 사용하는 경우
- ✅ 해당 도메인에 이미 **Query Service**가 존재하는 경우
- ✅ 단순 조회 작업 (CQRS의 Query 측면)
- ✅ 여러 도메인에서 공통으로 사용하는 기능

**예시:**
```typescript
// ✅ 올바른 패턴
export class ShareQueryService {
  constructor(
    private readonly workspaceQueryService: WorkspaceQueryService,  // 서비스 직접 의존
    private readonly canvasQueryService: CanvasQueryService
  ) {}
}
```

**ACL을 사용해야 하는 경우 (특수한 경우만):**
- ✅ 외부 시스템과의 통신 (예: Supabase Auth, React Flow)
- ✅ 도메인 모델이 완전히 다른 경우
- ✅ 버전 관리가 필요한 외부 API

**예시:**
```typescript
// ✅ 외부 시스템 ACL (정당한 사용)
export interface SupabaseAuthAcl {
  getCurrentUser(): Promise<User | null>;
  signIn(email: string, password: string): Promise<void>;
}
```

---

### 6.2 아키텍처 원칙

#### 📐 **레이어 분리 원칙**

```
┌─────────────────────────────────────┐
│  Presentation Layer (Frontend)     │
│  - Components, Hooks, Contexts     │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Application Layer (Actions)       │
│  - Server Actions                  │
│  - DTO Validation (Zod)            │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Domain Layer (Services)           │
│  - Business Logic                  │
│  - Event Handling                  │
│  - Query Services (공개 API)       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Infrastructure Layer (Repos)      │
│  - Database Access (DrizzleORM)    │
│  - External APIs                   │
└─────────────────────────────────────┘
```

**규칙:**
1. **상위 레이어는 하위 레이어에만 의존**
   - ✅ Service → Repository (OK)
   - ❌ Repository → Service (NO)

2. **도메인 레이어는 인프라에 의존하지 않음**
   - ✅ Service가 `PublishedPageRepository` 인터페이스에 의존
   - ❌ Service가 `DrizzlePublishedPageRepository` 구현체에 의존

3. **도메인 간 통신은 서비스 인터페이스를 통해**
   - ✅ `ShareQueryService` → `WorkspaceQueryService` (인터페이스)
   - ❌ `ShareQueryService` → `DrizzleWorkspaceRepository` (구현체)

---

### 6.3 이벤트 기반 아키텍처

#### 📢 **이벤트 처리 패턴**

```typescript
// ✅ 올바른 패턴
async someBusinessLogic(command: SomeCommand): Promise<Result> {
  // 1. Aggregate 생성 및 커맨드 실행
  const aggregate = new SomeAggregate();
  const entity = aggregate.executeCommand(command);

  // 2. Entity 저장
  await this.repository.save(entity);

  // 3. 이벤트 핸들러 실행
  const events = aggregate.getUncommittedEvents();
  await this.handleDomainEvents(events);

  // 4. 이벤트 커밋
  aggregate.markEventsAsCommitted();

  // 5. 결과 반환
  return result;
}
```

**규칙:**
1. **이벤트는 Entity 값을 사용**
   - ✅ `new Event(entity.id, entity.name)`
   - ❌ `new Event(command.id, command.name)`

2. **이벤트 핸들러는 실패해도 전체 프로세스 계속**
   - `Promise.allSettled` 사용
   - 실패는 로그만 남기고 계속 진행

3. **이벤트는 커맨드와 1:1 대응**
   - 하나의 커맨드 → 하나의 주요 이벤트
   - 중복 이벤트 지양

---

### 6.4 DTO 설계 원칙

#### 📦 **Request/Response 분리**

```
dtos/
  ├── index.ts          # Re-export만
  ├── request.ts        # Request DTOs + Zod schemas
  └── response.ts       # Response DTOs
```

**규칙:**
1. **Request는 항상 Zod로 검증**
   ```typescript
   // ✅ 올바른 패턴
   export const PublishPageRequestSchema = z.object({
     pageId: z.string().uuid(),
   });
   
   export type PublishPageRequest = z.infer<typeof PublishPageRequestSchema>;
   ```

2. **Response는 순수 TypeScript 인터페이스**
   ```typescript
   // ✅ 올바른 패턴
   export interface PublishResult {
     pageId: string;
     publishToken: string;
     publishUrl: string;
   }
   ```

3. **DTO는 Plain Object만**
   - ❌ 클래스, 함수 포함 금지
   - ✅ 원시 타입, 객체, 배열만

---

### 6.5 Value Object 활용

#### 💎 **언제 VO를 만들어야 하는가?**

**VO를 만들어야 하는 경우:**
- ✅ 비즈니스 규칙이 있는 값 (예: PublishToken, Email, PhoneNumber)
- ✅ 불변성이 중요한 값
- ✅ 타입 안전성이 필요한 값

**원시 타입을 써도 되는 경우:**
- ✅ 단순 식별자 (PageId, UserId - type alias로 충분)
- ✅ 비즈니스 규칙이 없는 값

**예시:**
```typescript
// ✅ VO가 필요한 경우
export class PublishToken {
  private readonly value: string;

  constructor(token: string) {
    if (!token || token.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }
    if (token.length > 100) {
      throw new Error('Token too long');
    }
    this.value = token;
  }

  toString(): string {
    return this.value;
  }
}

// ✅ Type alias로 충분한 경우
export type PageId = string;
export type UserId = string;
```

---

### 6.6 Server-First Data Fetching

#### 🖥️ **데이터 로딩 원칙**

**규칙:**
1. **초기 렌더링 데이터는 서버에서**
   ```tsx
   // ✅ 올바른 패턴
   // page.tsx (Server Component)
   export default async function Page({ params }) {
     const data = await fetchData(params.id);
     return <ClientComponent initialData={data} />;
   }
   ```

2. **검색, 필터링 등은 클라이언트에서**
   ```tsx
   // ✅ 올바른 패턴
   const handleSearch = async (query: string) => {
     const results = await searchAction(query);
     setResults(results);
   };
   ```

3. **Context는 상태 전파만**
   ```typescript
   // ✅ 올바른 패턴
   export function Provider({ children, initialData }) {
     const [data, setData] = useState(initialData);  // 서버에서 받은 데이터
     return <Context.Provider value={{ data }}>{children}</Context.Provider>;
   }
   
   // ❌ 잘못된 패턴
   export function Provider({ children }) {
     const [data, setData] = useState(null);
     
     useEffect(() => {
       fetchData().then(setData);  // Context에서 데이터 로딩 금지
     }, []);
   }
   ```

---

### 6.7 UI 컴포넌트 원칙

#### 🎨 **shadcn 우선 사용**

**규칙:**
1. **모달/다이얼로그는 shadcn Dialog 사용**
   - ❌ 커스텀 모달 만들지 않기
   - ✅ shadcn Dialog 사용

2. **버튼, 입력 등 기본 컴포넌트는 shadcn 사용**
   - ✅ `<Button>`, `<Input>`, `<Select>` 등

3. **커스텀 컴포넌트는 shadcn 위에 구축**
   ```tsx
   // ✅ 올바른 패턴
   export function CustomDialog({ children }) {
     return (
       <Dialog>
         <DialogContent>
           {/* 커스텀 로직 */}
           {children}
         </DialogContent>
       </Dialog>
     );
   }
   ```

---

### 6.8 네이밍 컨벤션

#### 📝 **명확한 이름 사용**

**규칙:**
1. **권한은 `can~` 또는 `is~able` 형태**
   - ✅ `isPublishable`, `canEdit`, `isDeletable`
   - ❌ `isOwner` (역할이 아닌 권한으로 표현)

2. **이벤트는 과거형**
   - ✅ `PagePublishedEvent`, `PageCopiedEvent`
   - ❌ `PublishPageEvent`, `CopyPageEvent`

3. **커맨드는 동사 + 명사**
   - ✅ `PublishPageCommand`, `CopyPageCommand`
   - ❌ `PagePublishCommand`, `PageCopyCommand`

4. **DTO는 명확한 접미사**
   - ✅ `PublishPageRequest`, `PublishResult`
   - ❌ `PublishPageDTO`, `PublishData`

5. **Query Service는 도메인명 + QueryService**
   - ✅ `WorkspaceQueryService`, `CanvasQueryService`
   - ❌ `WorkspaceService`, `WorkspaceAcl`

---

### 6.9 에러 처리

#### ⚠️ **도메인 에러 사용**

**규칙:**
1. **도메인별 에러 클래스 정의**
   ```typescript
   // ✅ 올바른 패턴
   export class ShareManagementError extends Error {
     constructor(
       public readonly code: string,
       message: string
     ) {
       super(message);
       this.name = 'ShareManagementError';
     }
   }
   
   throw new ShareManagementError('NOT_PAGE_OWNER', 'Not page owner');
   ```

2. **에러 코드는 대문자 스네이크 케이스**
   - ✅ `NOT_PAGE_OWNER`, `PUBLISH_LINK_NOT_FOUND`
   - ❌ `notPageOwner`, `publishLinkNotFound`

3. **에러 메시지는 사용자 친화적으로**
   - ✅ `'You do not have permission to publish'`
   - ❌ `'Unauthorized'`

4. **Result 타입 활용 (도메인 간 통신)**
   ```typescript
   // ✅ 올바른 패턴
   async getPageInfo(pageId: string): Promise<
     Result<PageInfo, WorkspaceManagementError>
   > {
     try {
       const page = await this.pageRepository.findById(new PageId(pageId));
       if (!page) {
         return Result.error(
           new WorkspaceManagementError('PAGE_NOT_FOUND', 'Page not found')
         );
       }
       return Result.success(pageInfo);
     } catch (error) {
       return Result.error(
         new WorkspaceManagementError('RETRIEVAL_FAILED', 'Failed to get page info')
       );
     }
   }
   ```

---

### 6.10 테스트 작성 (향후 적용)

#### 🧪 **테스트 전략**

**규칙:**
1. **Repository는 Mock으로 테스트**
   ```typescript
   // ✅ 올바른 패턴
   const mockRepository: PublishedPageRepository = {
     save: jest.fn(),
     findByPageId: jest.fn(),
     findByToken: jest.fn(),
   };
   
   const service = new SharePublishingService(mockRepository);
   ```

2. **Service는 단위 테스트**
   - 각 메서드별로 테스트
   - 이벤트 발생 검증

3. **Server Action은 통합 테스트**
   - 실제 DB 사용
   - 전체 플로우 검증

---

## 📚 요약: 핵심 체크리스트

### ✅ 백엔드 개발 시

- [ ] DrizzleORM 사용 (Supabase Client 직접 사용 금지)
- [ ] Repository 인터페이스 정의 후 구현
- [ ] Service에서 이벤트 처리 구현
- [ ] Entity 값으로 이벤트 생성
- [ ] Value Object 적극 활용
- [ ] Request DTO는 Zod로 검증
- [ ] Soft Delete 고려 (상태 변경 우선)
- [ ] **도메인 간 통신은 Query Service 사용 (ACL 지양)**

### ✅ 프론트엔드 개발 시

- [ ] 초기 데이터는 서버 컴포넌트에서 로딩
- [ ] Context는 상태 전파만 담당
- [ ] shadcn 컴포넌트 우선 사용
- [ ] Props로 데이터 전달 (Context 의존 최소화)
- [ ] 권한은 `isPublishable` 형태로 표현

### ✅ 도메인 레이어 설계 시

- [ ] 이벤트는 커맨드와 1:1 대응
- [ ] 불필요한 Entity/Aggregate 제거
- [ ] Entity는 도메인 로직만 포함
- [ ] DTO는 request/response 분리
- [ ] 명확한 네이밍 컨벤션 준수
- [ ] **다른 도메인 정보 필요 시 해당 도메인의 Query Service에 메서드 추가**

### ✅ 도메인 간 통신 시

- [ ] 먼저 해당 도메인의 Query Service 확인
- [ ] 필요한 메서드가 없으면 해당 도메인에 추가 요청
- [ ] ACL은 외부 시스템과의 통신에만 사용
- [ ] Result 타입으로 명시적 에러 핸들링

---

## 🎯 마무리

이 문서는 Share 도메인 리팩토링의 모든 변경사항과 앞으로 지켜야 할 규칙을 정리한 것입니다.

**핵심 원칙:**
1. **계층 분리**: 각 레이어는 명확한 책임만 가짐
2. **이벤트 기반**: 확장 가능한 아키텍처
3. **타입 안전성**: Zod, Value Object 적극 활용
4. **Server-First**: 초기 데이터는 서버에서
5. **일관성**: 프로젝트 전체와 동일한 패턴
6. **도메인 서비스 중심**: ACL 대신 Query Service를 통한 도메인 간 통신

**ACL 제거의 핵심 가치:**
- 불필요한 추상화 제거로 코드 단순화
- 도메인의 공개 API(Query Service)를 명확히 정의
- 비즈니스 로직의 중복 방지
- 도메인 경계는 인터페이스로 유지

이 규칙들을 지키면 **유지보수하기 쉽고, 확장 가능하며, 안정적인** 코드를 작성할 수 있습니다! 🚀
