# MCP 서버 통합 기획안 및 설계

## 개요

Model Context Protocol (MCP) 서버를 웹 애플리케이션의 API route에 통합하여, LLM 클라이언트가 워크스페이스, 페이지, 블록, 엣지 등의 데이터에 안전하게 접근할 수 있도록 하는 아키텍처 설계입니다.

## 목표

1. **기존 Server Action 재사용**: 이미 구현된 도메인별 Server Action을 MCP 도구로 노출
2. **보안 유지**: RLS 정책을 우회하면서도 안전한 데이터 접근 보장
3. **확장성**: 새로운 도구와 리소스를 쉽게 추가할 수 있는 구조
4. **일관성**: 기존 비즈니스 로직과 일관된 데이터 처리

## 보안 아키텍처 (RLS 문제 해결 방안)

### 문제점
- MCP 클라이언트에는 Clerk 인증 컨텍스트가 없음
- 기존 RLS 클라이언트 사용 불가
- 데이터베이스 직접 접근 시 보안 위험

### 해결 방안: API 키 기반 인증

```
MCP 클라이언트 → API Route → Admin Client (RLS 우회)
├── 1. MCP 클라이언트가 API 키를 헤더에 포함
├── 2. API Route에서 API 키 검증 (JWT 토큰 또는 고정 키)
├── 3. 검증된 요청은 Admin Client로 RLS 우회
└── 4. Admin Client로 데이터베이스 직접 접근
```

### 인증 방식 옵션

#### 옵션 1: JWT 토큰 방식 (권장)
```typescript
// MCP 클라이언트가 JWT 토큰을 헤더에 포함
Authorization: Bearer <jwt_token>

// API Route에서 토큰 검증 후 사용자 ID 추출
// Admin Client로 해당 사용자의 데이터만 접근
```

**장점:**
- 사용자별 권한 관리 가능
- 토큰 만료 시간 설정 가능
- 기존 Clerk JWT와 호환 가능

**단점:**
- 토큰 관리 복잡성
- MCP 클라이언트에서 토큰 획득 필요

#### 옵션 2: 고정 API 키 방식
```typescript
// 환경변수로 고정 API 키 설정
X-API-Key: <fixed_api_key>

// 간단한 키 검증
```

**장점:**
- 구현 간단
- 빠른 개발 가능

**단점:**
- 보안 수준 낮음
- 키 로테이션 어려움
- 세분화된 권한 관리 불가

## API Route 구조 설계

```
/app/api/mcp/
├── route.ts                    # MCP 서버 메인 엔드포인트
├── auth/
│   └── middleware.ts           # API 키 검증 미들웨어
├── tools/
│   ├── workspace.tools.ts      # 워크스페이스 관련 도구
│   ├── page.tools.ts           # 페이지 관련 도구
│   ├── block.tools.ts          # 블록 관련 도구
│   └── edge.tools.ts           # 엣지 관련 도구
├── handlers/
│   ├── workspace.handler.ts    # 워크스페이스 핸들러
│   ├── page.handler.ts         # 페이지 핸들러
│   ├── block.handler.ts        # 블록 핸들러
│   └── edge.handler.ts         # 엣지 핸들러
└── types/
    └── mcp.types.ts            # MCP 관련 타입 정의
```

## MCP 도구 정의

### 워크스페이스 도구

#### 1. 워크스페이스 목록 조회
```typescript
{
  name: "list_workspaces",
  title: "워크스페이스 목록 조회",
  description: "사용자의 모든 워크스페이스를 조회합니다",
  inputSchema: z.object({}) // 입력 없음
}
```

#### 2. 워크스페이스 단건 조회
```typescript
{
  name: "get_workspace",
  title: "워크스페이스 조회",
  description: "특정 워크스페이스 정보를 조회합니다",
  inputSchema: z.object({
    workspaceId: z.string().describe("워크스페이스 ID")
  })
}
```

#### 3. 워크스페이스 생성
```typescript
{
  name: "create_workspace",
  title: "워크스페이스 생성",
  description: "새 워크스페이스를 생성합니다",
  inputSchema: z.object({
    name: z.string().min(1).describe("워크스페이스 이름"),
    description: z.string().optional().describe("워크스페이스 설명"),
    template: z.enum(["blank", "agent", "task", "workflow"]).default("blank").describe("템플릿 타입")
  })
}
```

#### 4. 워크스페이스 수정
```typescript
{
  name: "update_workspace",
  title: "워크스페이스 수정",
  description: "워크스페이스 정보를 수정합니다",
  inputSchema: z.object({
    workspaceId: z.string().describe("워크스페이스 ID"),
    name: z.string().min(1).optional().describe("새 워크스페이스 이름"),
    description: z.string().optional().describe("새 워크스페이스 설명")
  })
}
```

#### 5. 워크스페이스 삭제
```typescript
{
  name: "delete_workspace",
  title: "워크스페이스 삭제",
  description: "워크스페이스를 삭제합니다",
  inputSchema: z.object({
    workspaceId: z.string().describe("워크스페이스 ID")
  })
}
```

### 페이지 도구

#### 1. 워크스페이스 내 페이지 목록 조회
```typescript
{
  name: "list_workspace_pages",
  title: "페이지 목록 조회",
  description: "워크스페이스 내 모든 페이지를 조회합니다",
  inputSchema: z.object({
    workspaceId: z.string().describe("워크스페이스 ID")
  })
}
```

#### 2. 페이지 단건 조회
```typescript
{
  name: "get_page",
  title: "페이지 조회",
  description: "특정 페이지 정보를 조회합니다",
  inputSchema: z.object({
    pageId: z.string().describe("페이지 ID")
  })
}
```

#### 3. 페이지 생성
```typescript
{
  name: "create_page",
  title: "페이지 생성",
  description: "워크스페이스에 새 페이지를 생성합니다",
  inputSchema: z.object({
    workspaceId: z.string().describe("워크스페이스 ID"),
    name: z.string().min(1).describe("페이지 이름"),
    type: z.enum(["canvas", "workflow"]).describe("페이지 타입"),
    description: z.string().optional().describe("페이지 설명")
  })
}
```

#### 4. 페이지 수정
```typescript
{
  name: "update_page",
  title: "페이지 수정",
  description: "페이지 정보를 수정합니다",
  inputSchema: z.object({
    pageId: z.string().describe("페이지 ID"),
    name: z.string().min(1).optional().describe("새 페이지 이름"),
    description: z.string().optional().describe("새 페이지 설명")
  })
}
```

#### 5. 페이지 삭제
```typescript
{
  name: "delete_page",
  title: "페이지 삭제",
  description: "페이지를 삭제합니다",
  inputSchema: z.object({
    pageId: z.string().describe("페이지 ID")
  })
}
```

### 블록 도구

#### 1. 페이지 내 블록 목록 조회
```typescript
{
  name: "list_page_blocks",
  title: "블록 목록 조회",
  description: "페이지 내 모든 블록을 조회합니다",
  inputSchema: z.object({
    pageId: z.string().describe("페이지 ID")
  })
}
```

#### 2. 블록 단건 조회
```typescript
{
  name: "get_block",
  title: "블록 조회",
  description: "특정 블록 정보를 조회합니다",
  inputSchema: z.object({
    blockId: z.string().describe("블록 ID")
  })
}
```

#### 3. 블록 생성
```typescript
{
  name: "create_block",
  title: "블록 생성",
  description: "페이지에 새 블록을 생성합니다",
  inputSchema: z.object({
    pageId: z.string().describe("페이지 ID"),
    type: z.enum(["text", "image", "video", "component", "code", "markdown"]).describe("블록 타입"),
    content: z.record(z.any()).describe("블록 내용"),
    position: z.object({
      x: z.number().describe("X 좌표"),
      y: z.number().describe("Y 좌표")
    }).optional().describe("블록 위치")
  })
}
```

#### 4. 블록 수정
```typescript
{
  name: "update_block",
  title: "블록 수정",
  description: "기존 블록을 수정합니다",
  inputSchema: z.object({
    blockId: z.string().describe("블록 ID"),
    content: z.record(z.any()).optional().describe("새 블록 내용"),
    position: z.object({
      x: z.number().describe("X 좌표"),
      y: z.number().describe("Y 좌표")
    }).optional().describe("새 블록 위치")
  })
}
```

#### 5. 블록 삭제
```typescript
{
  name: "delete_block",
  title: "블록 삭제",
  description: "블록을 삭제합니다",
  inputSchema: z.object({
    blockId: z.string().describe("블록 ID")
  })
}
```

### 엣지 도구

#### 1. 페이지 내 엣지 목록 조회
```typescript
{
  name: "list_page_edges",
  title: "엣지 목록 조회",
  description: "페이지 내 모든 엣지를 조회합니다",
  inputSchema: z.object({
    pageId: z.string().describe("페이지 ID")
  })
}
```

#### 2. 엣지 생성
```typescript
{
  name: "create_edge",
  title: "엣지 생성",
  description: "두 블록 간의 엣지를 생성합니다",
  inputSchema: z.object({
    sourceBlockId: z.string().describe("시작 블록 ID"),
    targetBlockId: z.string().describe("도착 블록 ID"),
    type: z.enum(["default", "custom"]).default("default").describe("엣지 타입"),
    label: z.string().optional().describe("엣지 라벨")
  })
}
```

#### 3. 엣지 수정
```typescript
{
  name: "update_edge",
  title: "엣지 수정",
  description: "엣지 정보를 수정합니다",
  inputSchema: z.object({
    edgeId: z.string().describe("엣지 ID"),
    label: z.string().optional().describe("새 엣지 라벨"),
    type: z.enum(["default", "custom"]).optional().describe("새 엣지 타입")
  })
}
```

#### 4. 엣지 삭제
```typescript
{
  name: "delete_edge",
  title: "엣지 삭제",
  description: "엣지를 삭제합니다",
  inputSchema: z.object({
    edgeId: z.string().describe("엣지 ID")
  })
}
```

## 데이터 흐름 설계

```
1. MCP 클라이언트 요청
   ↓
2. API Route (/api/mcp)
   ↓
3. 인증 미들웨어 (API 키 검증)
   ↓
4. MCP 서버 인스턴스
   ↓
5. 도구 핸들러 호출
   ↓
6. Server Action 호출 (기존 로직 재사용)
   ↓
7. Admin Client (RLS 우회)
   ↓
8. 데이터베이스
```

### 핸들러 구현 예시

```typescript
// handlers/workspace.handler.ts
export async function handleGetWorkspace(workspaceId: string) {
  try {
    // 기존 Server Action 호출
    const result = await getWorkspaceById(workspaceId);
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(result.data, null, 2) 
      }]
    };
  } catch (error) {
    throw new Error(`워크스페이스 조회 실패: ${error.message}`);
  }
}
```

## 기존 Server Action 재사용 전략

### 재사용 가능한 Server Action 목록

#### 워크스페이스 도메인
- `getWorkspaceById` - 워크스페이스 단건 조회
- `createWorkspace` - 워크스페이스 생성
- `updateWorkspace` - 워크스페이스 수정
- `deleteWorkspace` - 워크스페이스 삭제

#### 페이지 도메인
- `listWorkspacePages` - 워크스페이스 페이지 목록
- `getPageById` - 페이지 단건 조회
- `createPage` - 페이지 생성
- `updatePage` - 페이지 수정
- `deletePage` - 페이지 삭제

#### 블록 도메인
- `listWorkspacePageBlocks` - 페이지 블록 목록
- `getBlockById` - 블록 단건 조회
- `createBlock` - 블록 생성
- `updateBlock` - 블록 수정
- `deleteBlock` - 블록 삭제

#### 엣지 도메인
- `listWorkspaceEdges` - 워크스페이스 엣지 목록
- `getEdgeById` - 엣지 단건 조회
- `createEdge` - 엣지 생성
- `updateEdge` - 엣지 수정
- `deleteEdge` - 엣지 삭제

### RLS 우회 전략

기존 Server Action은 RLS 클라이언트를 사용하므로, MCP API Route에서는 Admin Client를 사용하여 RLS를 우회해야 합니다.

```typescript
// 기존 Server Action 수정 예시
export async function getWorkspaceByIdForMCP(workspaceId: string, userId: string) {
  const adminDb = createSupabaseAdminClient();
  
  const result = await adminDb.rls(async (tx) => {
    // 사용자별 필터링을 명시적으로 추가
    const rows = await tx
      .select()
      .from(workspaces)
      .where(and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.owner_id, userId)
      ))
      .limit(1);
    return rows[0] ?? null;
  });
  
  return result;
}
```

## 보안 고려사항

### API 키 관리
- 환경변수로 관리: `MCP_API_KEY`
- 정기적인 키 로테이션 (월 1회)
- 키별 권한 설정 (읽기/쓰기 분리)

### 요청 제한
- Rate limiting: 분당 100회 요청
- 요청 크기 제한: 1MB
- 타임아웃: 30초

### 로깅 및 모니터링
- 모든 MCP 요청 로깅
- 에러 추적 및 알림
- 성능 모니터링 (응답 시간, 처리량)

### 데이터 접근 제어
- 사용자별 데이터 격리
- 워크스페이스 소유권 검증
- 민감한 데이터 필터링

## 배포 및 운영 고려사항

### 환경별 설정

#### 개발 환경
```bash
MCP_API_KEY=dev_mcp_key_123
MCP_RATE_LIMIT=1000
MCP_TIMEOUT=60
```

#### 스테이징 환경
```bash
MCP_API_KEY=staging_mcp_key_456
MCP_RATE_LIMIT=500
MCP_TIMEOUT=30
```

#### 프로덕션 환경
```bash
MCP_API_KEY=prod_mcp_key_789
MCP_RATE_LIMIT=100
MCP_TIMEOUT=30
```

### 확장성 고려사항
- MCP 서버 인스턴스 풀링
- Redis 캐싱 전략
- 데이터베이스 연결 풀 관리
- 로드 밸런싱

### 모니터링 지표
- API 응답 시간
- 에러율
- 처리량 (TPS)
- 동시 연결 수

## 구현 우선순위

### Phase 1: 기본 인프라 (1주)
1. MCP SDK 설치 및 기본 설정
2. API Route 구조 생성
3. 인증 미들웨어 구현
4. 기본 MCP 서버 인스턴스 설정

### Phase 2: 읽기 도구 (1주)
1. 워크스페이스 조회 도구
2. 페이지 조회 도구
3. 블록 조회 도구
4. 엣지 조회 도구

### Phase 3: 쓰기 도구 (1주)
1. 워크스페이스 생성/수정/삭제 도구
2. 페이지 생성/수정/삭제 도구
3. 블록 생성/수정/삭제 도구
4. 엣지 생성/수정/삭제 도구

### Phase 4: 최적화 및 보안 (1주)
1. 캐싱 전략 구현
2. 보안 강화
3. 모니터링 및 로깅
4. 성능 최적화

## 결론

이 설계를 통해 기존 Server Action을 재사용하면서 MCP 클라이언트가 안전하게 데이터에 접근할 수 있는 아키텍처를 구축할 수 있습니다. API 키 기반 인증과 Admin Client를 통한 RLS 우회를 통해 보안을 유지하면서도 확장 가능한 구조를 만들 수 있습니다.

다음 단계로는 Phase 1의 기본 인프라 구현을 시작하여 점진적으로 기능을 확장해 나가는 것을 권장합니다.
