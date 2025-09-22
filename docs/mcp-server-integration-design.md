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

### MCP 연결 토큰 스키마 설계

#### 1. MCP 연결 토큰 테이블
```sql
-- MCP 연결 토큰 테이블
CREATE TABLE mcp_connection_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE, -- URL에 포함될 토큰 (예: /mcp/abc123)
  token_name TEXT NOT NULL, -- 토큰 이름 (사용자 정의)
  permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false}', -- 권한 설정
  expires_at TIMESTAMP WITH TIME ZONE, -- 만료 시간 (NULL = 무제한)
  last_used_at TIMESTAMP WITH TIME ZONE, -- 마지막 사용 시간
  revoked_at TIMESTAMP WITH TIME ZONE, -- 폐기 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_mcp_connection_tokens_user_id ON mcp_connection_tokens(user_id);
CREATE INDEX idx_mcp_connection_tokens_workspace_id ON mcp_connection_tokens(workspace_id);
CREATE INDEX idx_mcp_connection_tokens_token ON mcp_connection_tokens(token);
CREATE INDEX idx_mcp_connection_tokens_expires_at ON mcp_connection_tokens(expires_at);
CREATE INDEX idx_mcp_connection_tokens_revoked_at ON mcp_connection_tokens(revoked_at);

-- RLS 정책
ALTER TABLE mcp_connection_tokens ENABLE ROW LEVEL SECURITY;

-- 소유자만 읽기/쓰기 가능
CREATE POLICY "Enable read/write for owners" ON mcp_connection_tokens
  FOR ALL USING (user_id = current_setting('app.user_id', true))
  WITH CHECK (user_id = current_setting('app.user_id', true));
```

#### 2. MCP 연결 로그 테이블
```sql
-- MCP 연결 로그 테이블
CREATE TABLE mcp_connection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID NOT NULL REFERENCES mcp_connection_tokens(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'tool_call', 'resource_access', 'auth_failed', 'connection_established'
  tool_name TEXT, -- 호출된 도구 이름
  resource_uri TEXT, -- 접근한 리소스 URI
  ip_address INET, -- 클라이언트 IP
  user_agent TEXT, -- 클라이언트 User-Agent
  request_size INTEGER, -- 요청 크기 (bytes)
  response_time_ms INTEGER, -- 응답 시간 (ms)
  status_code INTEGER, -- HTTP 상태 코드
  error_message TEXT, -- 에러 메시지 (있는 경우)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스
CREATE INDEX idx_mcp_connection_logs_token_id ON mcp_connection_logs(token_id);
CREATE INDEX idx_mcp_connection_logs_user_id ON mcp_connection_logs(user_id);
CREATE INDEX idx_mcp_connection_logs_workspace_id ON mcp_connection_logs(workspace_id);
CREATE INDEX idx_mcp_connection_logs_action ON mcp_connection_logs(action);
CREATE INDEX idx_mcp_connection_logs_created_at ON mcp_connection_logs(created_at);

-- RLS 정책
ALTER TABLE mcp_connection_logs ENABLE ROW LEVEL SECURITY;

-- 소유자만 읽기 가능
CREATE POLICY "Enable read for owners" ON mcp_connection_logs
  FOR SELECT USING (user_id = current_setting('app.user_id', true));
```

#### 3. Drizzle 스키마 정의
```typescript
// apps/web/src/db/schema.ts에 추가

// MCP 연결 토큰 테이블
export const mcpConnectionTokens = pgTable(
  "mcp_connection_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    workspace_id: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(), // URL에 포함될 토큰
    token_name: text("token_name").notNull(),
    permissions: jsonb("permissions").notNull().default({ read: true, write: false }),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    last_used_at: timestamp("last_used_at", { withTimezone: true }),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 인덱스
    sql`CREATE INDEX idx_mcp_connection_tokens_user_id ON mcp_connection_tokens (user_id)`,
    sql`CREATE INDEX idx_mcp_connection_tokens_workspace_id ON mcp_connection_tokens (workspace_id)`,
    sql`CREATE INDEX idx_mcp_connection_tokens_token ON mcp_connection_tokens (token)`,
    sql`CREATE INDEX idx_mcp_connection_tokens_expires_at ON mcp_connection_tokens (expires_at)`,
    sql`CREATE INDEX idx_mcp_connection_tokens_revoked_at ON mcp_connection_tokens (revoked_at)`,
    
    // RLS 정책
    pgPolicy("Enable read/write for owners", {
      for: "all",
      to: authenticatedRole,
      using: sql`user_id = (SELECT current_setting('app.user_id', true))`,
      withCheck: sql`user_id = (SELECT current_setting('app.user_id', true))`,
    }),
  ]
).enableRLS();

// MCP 연결 로그 테이블
export const mcpConnectionLogs = pgTable(
  "mcp_connection_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token_id: uuid("token_id")
      .references(() => mcpConnectionTokens.id, { onDelete: "cascade" })
      .notNull(),
    user_id: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    workspace_id: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // 'tool_call', 'resource_access', 'auth_failed', 'connection_established'
    tool_name: text("tool_name"),
    resource_uri: text("resource_uri"),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    request_size: integer("request_size"),
    response_time_ms: integer("response_time_ms"),
    status_code: integer("status_code"),
    error_message: text("error_message"),
    created_at: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 인덱스
    sql`CREATE INDEX idx_mcp_connection_logs_token_id ON mcp_connection_logs (token_id)`,
    sql`CREATE INDEX idx_mcp_connection_logs_user_id ON mcp_connection_logs (user_id)`,
    sql`CREATE INDEX idx_mcp_connection_logs_workspace_id ON mcp_connection_logs (workspace_id)`,
    sql`CREATE INDEX idx_mcp_connection_logs_action ON mcp_connection_logs (action)`,
    sql`CREATE INDEX idx_mcp_connection_logs_created_at ON mcp_connection_logs (created_at)`,
    
    // RLS 정책
    pgPolicy("Enable read for owners", {
      for: "select",
      to: authenticatedRole,
      using: sql`user_id = (SELECT current_setting('app.user_id', true))`,
    }),
  ]
).enableRLS();

// Relations 추가
export const mcpConnectionTokensRelations = relations(mcpConnectionTokens, ({ one, many }) => ({
  user: one(users, {
    fields: [mcpConnectionTokens.user_id],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [mcpConnectionTokens.workspace_id],
    references: [workspaces.id],
  }),
  logs: many(mcpConnectionLogs),
}));

export const mcpConnectionLogsRelations = relations(mcpConnectionLogs, ({ one }) => ({
  token: one(mcpConnectionTokens, {
    fields: [mcpConnectionLogs.token_id],
    references: [mcpConnectionTokens.id],
  }),
  user: one(users, {
    fields: [mcpConnectionLogs.user_id],
    references: [users.id],
  }),
  workspace: one(workspaces, {
    fields: [mcpConnectionLogs.workspace_id],
    references: [workspaces.id],
  }),
}));

// 타입 export 추가
export type McpConnectionToken = typeof mcpConnectionTokens.$inferSelect;
export type NewMcpConnectionToken = typeof mcpConnectionTokens.$inferInsert;
export type McpConnectionLog = typeof mcpConnectionLogs.$inferSelect;
export type NewMcpConnectionLog = typeof mcpConnectionLogs.$inferInsert;
```

### MCP 연결 토큰 관리 기능

#### 1. MCP 연결 토큰 생성
```typescript
// 도메인: mcp-connection
// 파일: apps/web/src/domains/mcp-connection/actions/connection-token.action.ts

export async function createMcpConnectionToken(input: {
  workspaceId?: string;
  tokenName: string;
  permissions: { read: boolean; write: boolean };
  expiresAt?: Date;
}): Promise<McpConnectionTokenActionResult<{ connectionUrl: string; tokenRecord: McpConnectionToken }>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Authentication required");
    }

    const db = await createClerkDrizzleSupabaseClient();
    
    // 토큰 생성 (16자리 랜덤 문자열)
    const token = crypto.randomBytes(8).toString('hex');
    const connectionUrl = `${process.env.NEXT_PUBLIC_APP_URL}/mcp/${token}`;

    const result = await db.rls(async (tx) => {
      const [tokenRecord] = await tx
        .insert(mcpConnectionTokens)
        .values({
          user_id: userId,
          workspace_id: input.workspaceId,
          token: token,
          token_name: input.tokenName,
          permissions: input.permissions,
          expires_at: input.expiresAt,
        })
        .returning();

      return tokenRecord;
    });

    return {
      success: true,
      data: {
        connectionUrl, // MCP 클라이언트가 연결할 URL
        tokenRecord: result
      }
    };
  } catch (error) {
    console.error("Error creating MCP connection token:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create connection token"
    };
  }
}
```

#### 2. MCP 연결 토큰 검증
```typescript
// 파일: apps/web/src/app/api/mcp/[token]/route.ts

export async function validateMcpConnectionToken(token: string): Promise<{
  isValid: boolean;
  userId?: string;
  workspaceId?: string;
  permissions?: { read: boolean; write: boolean };
  error?: string;
}> {
  try {
    const { admin } = createSupabaseAdminClient();
    
    // 토큰으로 검색
    const tokenRecord = await admin
      .select()
      .from(mcpConnectionTokens)
      .where(eq(mcpConnectionTokens.token, token))
      .limit(1);

    if (tokenRecord.length === 0) {
      return { isValid: false, error: "Invalid connection token" };
    }

    const record = tokenRecord[0];

    // 만료 확인
    if (record.expires_at && new Date() > record.expires_at) {
      return { isValid: false, error: "Connection token expired" };
    }

    // 폐기 확인
    if (record.revoked_at) {
      return { isValid: false, error: "Connection token revoked" };
    }

    // 사용 시간 업데이트
    await admin
      .update(mcpConnectionTokens)
      .set({ last_used_at: new Date() })
      .where(eq(mcpConnectionTokens.id, record.id));

    return {
      isValid: true,
      userId: record.user_id,
      workspaceId: record.workspace_id,
      permissions: record.permissions
    };
  } catch (error) {
    console.error("Error validating MCP connection token:", error);
    return { isValid: false, error: "Validation error" };
  }
}
```

#### 3. 연결 로그 기록
```typescript
// 파일: apps/web/src/app/api/mcp/[token]/logger.ts

export async function logMcpConnectionUsage(input: {
  tokenId: string;
  userId: string;
  workspaceId?: string;
  action: 'tool_call' | 'resource_access' | 'auth_failed' | 'connection_established';
  toolName?: string;
  resourceUri?: string;
  ipAddress?: string;
  userAgent?: string;
  requestSize?: number;
  responseTimeMs?: number;
  statusCode?: number;
  errorMessage?: string;
}): Promise<void> {
  try {
    const { admin } = createSupabaseAdminClient();
    
    await admin.insert(mcpConnectionLogs).values({
      token_id: input.tokenId,
      user_id: input.userId,
      workspace_id: input.workspaceId,
      action: input.action,
      tool_name: input.toolName,
      resource_uri: input.resourceUri,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
      request_size: input.requestSize,
      response_time_ms: input.responseTimeMs,
      status_code: input.statusCode,
      error_message: input.errorMessage,
    });
  } catch (error) {
    console.error("Error logging MCP connection usage:", error);
    // 로그 실패는 API 응답에 영향을 주지 않도록 함
  }
}
```

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
├── [token]/
│   ├── route.ts                # MCP 서버 메인 엔드포인트 (토큰 기반)
│   ├── tools/
│   │   ├── workspace.tools.ts  # 워크스페이스 관련 도구
│   │   ├── page.tools.ts       # 페이지 관련 도구
│   │   ├── block.tools.ts      # 블록 관련 도구
│   │   └── edge.tools.ts       # 엣지 관련 도구
│   ├── resources/
│   │   ├── workspace.resources.ts  # 워크스페이스 관련 리소스
│   │   ├── page.resources.ts       # 페이지 관련 리소스
│   │   ├── block.resources.ts      # 블록 관련 리소스
│   │   └── edge.resources.ts       # 엣지 관련 리소스
│   ├── handlers/
│   │   ├── workspace.handler.ts    # 워크스페이스 핸들러
│   │   ├── page.handler.ts         # 페이지 핸들러
│   │   ├── block.handler.ts        # 블록 핸들러
│   │   └── edge.handler.ts         # 엣지 핸들러
│   ├── auth/
│   │   └── middleware.ts           # 토큰 검증 미들웨어
│   ├── logger.ts               # 연결 로그 기록
│   └── types/
│       └── mcp.types.ts        # MCP 관련 타입 정의
└── connection/
    ├── route.ts                # MCP 연결 토큰 생성 엔드포인트
    └── actions/
        └── connection-token.action.ts  # 토큰 생성 로직
```

## MCP 도구 및 리소스 정의

### MCP 도구 (Tools)

Tools는 POST 엔드포인트와 유사한 기능을 제공하며, 코드 실행이나 부작용을 일으키는 작업을 수행합니다.

#### 워크스페이스 도구

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

### MCP 리소스 (Resources)

Resources는 GET 엔드포인트와 유사한 정보 제공 기능으로, LLM의 컨텍스트에 로드할 정보를 제공합니다.

#### 워크스페이스 리소스

##### 1. 워크스페이스 정보 리소스
```typescript
{
  name: "workspace_info",
  title: "워크스페이스 정보",
  description: "워크스페이스의 상세 정보를 제공합니다",
  uriTemplate: "workspace://{workspaceId}",
  mimeType: "application/json"
}
```

##### 2. 워크스페이스 페이지 목록 리소스
```typescript
{
  name: "workspace_pages",
  title: "워크스페이스 페이지 목록",
  description: "워크스페이스 내 모든 페이지 목록을 제공합니다",
  uriTemplate: "workspace://{workspaceId}/pages",
  mimeType: "application/json"
}
```

#### 페이지 리소스

##### 1. 페이지 정보 리소스
```typescript
{
  name: "page_info",
  title: "페이지 정보",
  description: "페이지의 상세 정보를 제공합니다",
  uriTemplate: "page://{pageId}",
  mimeType: "application/json"
}
```

##### 2. 페이지 블록 목록 리소스
```typescript
{
  name: "page_blocks",
  title: "페이지 블록 목록",
  description: "페이지 내 모든 블록 목록을 제공합니다",
  uriTemplate: "page://{pageId}/blocks",
  mimeType: "application/json"
}
```

##### 3. 페이지 엣지 목록 리소스
```typescript
{
  name: "page_edges",
  title: "페이지 엣지 목록",
  description: "페이지 내 모든 엣지 목록을 제공합니다",
  uriTemplate: "page://{pageId}/edges",
  mimeType: "application/json"
}
```

#### 블록 리소스

##### 1. 블록 정보 리소스
```typescript
{
  name: "block_info",
  title: "블록 정보",
  description: "블록의 상세 정보를 제공합니다",
  uriTemplate: "block://{blockId}",
  mimeType: "application/json"
}
```

##### 2. 블록 내용 리소스
```typescript
{
  name: "block_content",
  title: "블록 내용",
  description: "블록의 실제 내용을 제공합니다",
  uriTemplate: "block://{blockId}/content",
  mimeType: "text/plain" // 또는 적절한 MIME 타입
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

#### Tools 핸들러
```typescript
// handlers/workspace.handler.ts
export async function handleGetWorkspace(workspaceId: string, userId: string) {
  try {
    const { admin } = createSupabaseAdminClient();
    
    // 사용자별 필터링을 명시적으로 추가
    const rows = await admin
      .select()
      .from(workspaces)
      .where(and(
        eq(workspaces.id, workspaceId),
        eq(workspaces.owner_id, userId)
      ))
      .limit(1);
    
    const workspace = rows[0];
    if (!workspace) {
      throw new Error("Workspace not found or access denied");
    }
    
    return {
      content: [{ 
        type: "text", 
        text: JSON.stringify(workspace, null, 2) 
      }]
    };
  } catch (error) {
    throw new Error(`워크스페이스 조회 실패: ${error.message}`);
  }
}
```

#### Resources 핸들러
```typescript
// handlers/workspace.resource.handler.ts
export async function handleWorkspaceResource(uri: string, params: { workspaceId: string }, userId: string) {
  try {
    const { admin } = createSupabaseAdminClient();
    
    // 사용자별 필터링을 명시적으로 추가
    const rows = await admin
      .select()
      .from(workspaces)
      .where(and(
        eq(workspaces.id, params.workspaceId),
        eq(workspaces.owner_id, userId)
      ))
      .limit(1);
    
    const workspace = rows[0];
    if (!workspace) {
      throw new Error("Workspace not found or access denied");
    }
    
    return {
      contents: [{
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(workspace, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`워크스페이스 리소스 조회 실패: ${error.message}`);
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
  const { admin } = createSupabaseAdminClient();
  
  // 사용자별 필터링을 명시적으로 추가
  const rows = await admin
    .select()
    .from(workspaces)
    .where(and(
      eq(workspaces.id, workspaceId),
      eq(workspaces.owner_id, userId)
    ))
    .limit(1);
  
  return rows[0] ?? null;
}
```

## 보안 고려사항

### MCP 연결 토큰 관리
- 데이터베이스 기반 관리: `mcp_connection_tokens` 테이블
- 사용자별 MCP 연결 토큰 생성 및 관리
- 워크스페이스별 권한 설정
- 토큰별 세분화된 권한 (읽기/쓰기 분리)
- 만료 시간 설정 및 자동 폐기
- 연결 URL 자동 생성: `/mcp/[token]`
- 연결 로그 및 모니터링
- 토큰 폐기 및 재생성 기능

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
# API 키는 데이터베이스에서 관리
MCP_RATE_LIMIT=1000
MCP_TIMEOUT=60
MCP_LOG_LEVEL=debug
```

#### 스테이징 환경
```bash
# API 키는 데이터베이스에서 관리
MCP_RATE_LIMIT=500
MCP_TIMEOUT=30
MCP_LOG_LEVEL=info
```

#### 프로덕션 환경
```bash
# API 키는 데이터베이스에서 관리
MCP_RATE_LIMIT=100
MCP_TIMEOUT=30
MCP_LOG_LEVEL=warn
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
- API 키별 사용량
- 워크스페이스별 접근 빈도
- 권한별 사용 패턴
- 만료된/폐기된 키 통계

## 구현 우선순위

### Phase 1: 기본 인프라 및 MCP 연결 토큰 시스템 (1주)
1. MCP SDK 설치 및 기본 설정
2. MCP 연결 토큰 스키마 마이그레이션 생성 및 적용
3. API Route 구조 생성 (`/api/mcp/[token]/`)
4. MCP 연결 토큰 생성/검증/로그 시스템 구현
5. 토큰 기반 인증 미들웨어 구현
6. 기본 MCP 서버 인스턴스 설정

### Phase 2: 리소스 구현 (1주)
1. 워크스페이스 리소스 (정보, 페이지 목록)
2. 페이지 리소스 (정보, 블록 목록, 엣지 목록)
3. 블록 리소스 (정보, 내용)
4. 리소스 URI 템플릿 및 핸들러 구현

### Phase 3: 읽기 도구 (1주)
1. 워크스페이스 조회 도구
2. 페이지 조회 도구
3. 블록 조회 도구
4. 엣지 조회 도구

### Phase 4: 쓰기 도구 (1주)
1. 워크스페이스 생성/수정/삭제 도구
2. 페이지 생성/수정/삭제 도구
3. 블록 생성/수정/삭제 도구
4. 엣지 생성/수정/삭제 도구

### Phase 5: 최적화 및 보안 (1주)
1. 캐싱 전략 구현
2. 보안 강화
3. 모니터링 및 로깅
4. 성능 최적화

## MCP 공식 문서 기반 개선사항

### 1. Resources 추가
- **Tools**: POST 엔드포인트와 유사한 기능 (데이터 수정, 작업 수행)
- **Resources**: GET 엔드포인트와 유사한 기능 (정보 제공, 컨텍스트 로드)

### 2. URI 템플릿 기반 리소스 설계
- `workspace://{workspaceId}` - 워크스페이스 정보
- `page://{pageId}` - 페이지 정보
- `block://{blockId}` - 블록 정보
- `block://{blockId}/content` - 블록 내용

### 3. MIME 타입 지원
- JSON 데이터: `application/json`
- 텍스트 내용: `text/plain`
- 마크다운: `text/markdown`
- 이미지: `image/*`

### 4. 리소스 목록 기능
- 워크스페이스별 페이지 목록
- 페이지별 블록/엣지 목록
- 동적 리소스 검색 및 필터링

## 결론

MCP 공식 문서를 참고하여 Tools와 Resources를 모두 포함한 완전한 MCP 서버 설계를 제안합니다. 이를 통해 기존 Server Action을 재사용하면서 MCP 클라이언트가 안전하게 데이터에 접근할 수 있는 아키텍처를 구축할 수 있습니다.

**MCP 연결 토큰 기반 인증**과 Admin Client를 통한 RLS 우회를 통해 보안을 유지하면서도 확장 가능한 구조를 만들 수 있으며, Resources를 통해 LLM이 더 풍부한 컨텍스트를 얻을 수 있습니다.

### 주요 특징
- **링크 공유 방식**: `/mcp/[token]` 형태의 URL로 MCP 클라이언트 연결
- **컴팩트한 구조**: MCP 전용 토큰 테이블로 단순화
- **사용자 친화적**: 연결 버튼 클릭으로 즉시 복사 가능한 링크 생성
- **보안 강화**: 토큰별 권한 관리 및 사용 로그 추적

다음 단계로는 Phase 1의 기본 인프라 구현을 시작하여 점진적으로 기능을 확장해 나가는 것을 권장합니다.
