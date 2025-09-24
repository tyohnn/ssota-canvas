# Technology Stack

쏘타 MVP에서 사용하는 기술 스택과 각 기술의 선택 이유를 정의합니다.

---

## 🎯 Technology Selection Principles

1. **Type Safety First**: TypeScript 기반의 강타입 시스템
2. **Developer Experience**: 뛰어난 개발자 경험과 생산성
3. **Performance**: 빠른 로딩과 반응성
4. **Scalability**: 확장 가능한 아키텍처
5. **Community Support**: 활발한 커뮤니티와 생태계

---

## 🏗️ Core Technologies

### Frontend Framework

#### Next.js 15
**Purpose**: Full-stack React framework  
**Version**: 15.x (Latest)  
**Why Chosen**:
- **Server Actions**: 타입 안전한 서버-클라이언트 통신
- **App Router**: 최신 라우팅 시스템과 레이아웃
- **Built-in Optimizations**: 이미지, 폰트, 번들 최적화
- **Full-stack Capabilities**: API routes와 서버 컴포넌트

```typescript
// Server Action Example
async function createBlockAction(input: CreateBlockInput) {
  'use server'
  
  // Server-side validation
  const validated = createBlockSchema.parse(input)
  
  // Domain logic execution
  const result = await blockService.createBlock(validated)
  
  return result
}
```

### Language & Type System

#### TypeScript 5.x
**Purpose**: Type-safe JavaScript  
**Features**:
- **Strict Mode**: 모든 타입 체크 활성화
- **Domain Types**: 도메인 모델을 위한 강타입
- **Utility Types**: 복잡한 타입 변환
- **Decorators**: 메타데이터 지원

```typescript
// Domain Value Object
class BlockId {
  private constructor(private readonly value: string) {}
  
  static create(value: string): BlockId {
    if (!isValidUUID(value)) {
      throw new InvalidBlockIdError(value)
    }
    return new BlockId(value)
  }
  
  toString(): string {
    return this.value
  }
}
```

### Database & ORM

#### Supabase (PostgreSQL)
**Purpose**: Database and Backend-as-a-Service  
**Features**:
- **Real-time Subscriptions**: 실시간 데이터 동기화
- **Row Level Security**: 세밀한 권한 제어
- **Built-in Auth**: 인증 시스템 (Clerk와 함께 사용)
- **Edge Functions**: 서버리스 함수

#### Drizzle ORM
**Purpose**: Type-safe database queries  
**Why Chosen**:
- **Type Safety**: 쿼리 결과의 완전한 타입 추론
- **SQL-like Syntax**: 직관적인 쿼리 작성
- **Migration System**: 스키마 변경 관리
- **Performance**: 최적화된 SQL 생성

```typescript
// Drizzle Schema
export const blocksTable = pgTable('blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at')
})

// Type-safe Query
const blocks = await db
  .select()
  .from(blocksTable)
  .where(eq(blocksTable.pageId, pageId))
  .orderBy(blocksTable.createdAt)
```

### Authentication & User Management

#### Clerk
**Purpose**: Authentication and Organization Management  
**Features**:
- **JWT Tokens**: Stateless authentication
- **Organization Management**: 팀 기반 권한 관리
- **Webhooks**: 실시간 사용자 동기화
- **Custom Claims**: 도메인별 권한 정보

```typescript
// Clerk Integration
import { auth } from '@clerk/nextjs'

async function createWorkspaceAction(input: CreateWorkspaceInput) {
  const { userId, orgId } = auth()
  
  if (!userId || !orgId) {
    throw new UnauthorizedError()
  }
  
  // Organization-based authorization
  const hasPermission = await checkOrganizationPermission(userId, orgId)
  // ... rest of logic
}
```

---

## 🎨 UI & Styling

### CSS Framework

#### Tailwind CSS 3.x
**Purpose**: Utility-first CSS framework  
**Features**:
- **Utility Classes**: 빠른 스타일링
- **Design System**: 일관된 디자인 토큰
- **Dark Mode**: 자동 다크 모드 지원
- **Responsive**: 모바일 우선 반응형 디자인

### Component Library

#### Shadcn/ui + Radix UI
**Purpose**: Accessible component library  
**Why Chosen**:
- **Accessibility**: WCAG 2.1 준수
- **Customizable**: Tailwind 기반 커스터마이징
- **Copy-Paste**: 소스 코드 직접 사용
- **Radix Primitives**: 복잡한 UI 패턴 지원

```tsx
// Shadcn Component Example
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

function CreateBlockDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create Block</Button>
      </DialogTrigger>
      <DialogContent>
        {/* Dialog content */}
      </DialogContent>
    </Dialog>
  )
}
```

### Form Handling

#### React Hook Form
**Purpose**: Performant form library  
**Features**:
- **Uncontrolled Components**: 성능 최적화
- **Validation**: Zod와의 완벽한 통합
- **Type Safety**: TypeScript 지원
- **Minimal Re-renders**: 효율적인 렌더링

```typescript
// Form with Validation
const form = useForm<CreateBlockForm>({
  resolver: zodResolver(createBlockSchema),
  defaultValues: {
    type: 'text',
    content: '',
    position: { x: 0, y: 0 }
  }
})

const onSubmit = async (data: CreateBlockForm) => {
  await createBlockAction(data)
}
```

### Validation

#### Zod 4.x
**Purpose**: TypeScript-first schema validation  
**Features**:
- **Type Inference**: 스키마에서 타입 자동 생성
- **Runtime Validation**: 런타임 타입 체크
- **Transform**: 데이터 변환 지원
- **Error Messages**: 사용자 친화적 에러 메시지

```typescript
// Zod Schema
const createBlockSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'shape']),
  content: z.object({
    text: z.string().optional(),
    url: z.string().url().optional(),
    shape: z.enum(['rectangle', 'circle', 'triangle']).optional()
  }),
  position: z.object({
    x: z.number().min(0),
    y: z.number().min(0)
  }),
  pageId: z.string().uuid()
})

// Type inference
type CreateBlockInput = z.infer<typeof createBlockSchema>
```

---

## 🎯 Specialized Libraries

### Canvas & Visualization

#### React Flow 12.x
**Purpose**: Node-based editor and diagrams  
**Features**:
- **Custom Nodes**: 도메인별 커스텀 블록
- **Custom Edges**: 관계 표현을 위한 엣지
- **Real-time Updates**: 실시간 동기화
- **Performance**: 대용량 노드 처리

```typescript
// React Flow Integration
import { ReactFlow, Node, Edge, useReactFlow } from 'reactflow'

function CanvasEditor() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useReactFlow()
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={customNodeTypes}
      edgeTypes={customEdgeTypes}
    />
  )
}
```

### State Management

#### Zustand 4.x
**Purpose**: Lightweight state management  
**Why Chosen**:
- **Minimal Boilerplate**: 간단한 API
- **TypeScript Support**: 완전한 타입 지원
- **No Providers**: Context 없이 사용
- **Devtools**: Redux DevTools 지원

```typescript
// Zustand Store
interface CanvasStore {
  selectedBlocks: string[]
  canvasViewport: Viewport
  setSelectedBlocks: (blocks: string[]) => void
  updateViewport: (viewport: Viewport) => void
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  selectedBlocks: [],
  canvasViewport: { x: 0, y: 0, zoom: 1 },
  setSelectedBlocks: (blocks) => set({ selectedBlocks: blocks }),
  updateViewport: (viewport) => set({ canvasViewport: viewport })
}))
```

---

## 🔧 Development Tools

### Code Quality

#### ESLint + Prettier
**Purpose**: Code formatting and linting  
**Configuration**:
- **@typescript-eslint**: TypeScript 규칙
- **Next.js Rules**: Next.js 특화 규칙
- **Import Sorting**: 자동 import 정렬
- **Prettier Integration**: 코드 포맷팅

#### Husky + lint-staged
**Purpose**: Git hooks for code quality  
**Features**:
- **Pre-commit Hooks**: 커밋 전 자동 검사
- **Staged Files Only**: 변경된 파일만 검사
- **Type Checking**: TypeScript 컴파일 검사
- **Test Running**: 자동 테스트 실행

### Testing

#### Vitest + Playwright
**Purpose**: Unit and E2E testing  
**Setup**:
- **Vitest**: 빠른 단위 테스트
- **Playwright**: E2E 테스트
- **Testing Library**: 컴포넌트 테스트
- **MSW**: API 모킹

```typescript
// Vitest Test Example
import { describe, it, expect } from 'vitest'
import { Block } from '@/domains/visual-canvas/entities/block'

describe('Block Entity', () => {
  it('should create a block with valid data', () => {
    const block = Block.create({
      type: 'text',
      content: { text: 'Hello World' },
      position: { x: 100, y: 200 }
    })
    
    expect(block.type).toBe('text')
    expect(block.content.text).toBe('Hello World')
  })
})
```

### Build & Deployment

#### Vercel
**Purpose**: Hosting and deployment  
**Features**:
- **Edge Network**: 글로벌 CDN
- **Automatic Deployments**: Git 연동 배포
- **Preview Deployments**: PR별 미리보기
- **Analytics**: 성능 모니터링

#### Turbo (Turborepo)
**Purpose**: Monorepo build system  
**Features**:
- **Incremental Builds**: 변경된 부분만 빌드
- **Parallel Execution**: 병렬 작업 처리
- **Remote Caching**: 빌드 캐시 공유
- **Task Dependencies**: 작업 의존성 관리

---

## 📦 Package Management

### pnpm
**Purpose**: Fast, disk space efficient package manager  
**Benefits**:
- **Disk Efficiency**: 중복 패키지 제거
- **Speed**: 빠른 설치 속도
- **Strict**: 엄격한 의존성 관리
- **Workspaces**: 모노레포 지원

```json
// package.json
{
  "name": "xbowl",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "latest",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 🔄 Integration Patterns

### Domain ↔ Infrastructure

```typescript
// Repository Pattern
interface BlockRepository {
  save(block: Block): Promise<void>
  findById(id: BlockId): Promise<Block | null>
  findByPage(pageId: PageId): Promise<Block[]>
}

class DrizzleBlockRepository implements BlockRepository {
  constructor(private db: DrizzleDatabase) {}
  
  async save(block: Block): Promise<void> {
    await this.db
      .insert(blocksTable)
      .values({
        id: block.id.toString(),
        type: block.type,
        content: block.content.toJSON()
      })
  }
}
```

### Domain ↔ Presentation

```typescript
// Server Action Pattern
async function createBlockAction(input: CreateBlockInput) {
  'use server'
  
  // 1. Validation
  const validated = createBlockSchema.parse(input)
  
  // 2. Domain Logic
  const command = new CreateBlockCommand(validated)
  const events = await blockService.execute(command)
  
  // 3. Cross-domain Processing
  await processBlockEvents(events)
  
  // 4. Response
  return { success: true, blockId: events[0].blockId }
}
```

---

## 📊 Performance Considerations

### Bundle Optimization

1. **Code Splitting**: 동적 import 사용
2. **Tree Shaking**: 사용하지 않는 코드 제거
3. **Bundle Analysis**: webpack-bundle-analyzer
4. **Image Optimization**: Next.js Image 컴포넌트

### Database Optimization

1. **Connection Pooling**: Supabase 자동 관리
2. **Query Optimization**: Drizzle ORM 최적화
3. **Indexing Strategy**: 자주 사용되는 쿼리 인덱싱
4. **Real-time Efficiency**: 필요한 데이터만 구독

### Runtime Performance

1. **React Optimization**: useMemo, useCallback 활용
2. **State Management**: Zustand로 최소 리렌더링
3. **Canvas Performance**: React Flow 가상화
4. **Caching Strategy**: 적절한 캐싱 레이어

---

## 🛡️ Security Considerations

### Authentication & Authorization

1. **JWT Validation**: Clerk 토큰 검증
2. **Role-based Access**: 조직/워크스페이스 권한
3. **Input Sanitization**: Zod 스키마 검증
4. **SQL Injection Prevention**: Drizzle ORM 사용

### Data Protection

1. **Row Level Security**: Supabase RLS 정책
2. **Encryption**: 전송/저장 데이터 암호화
3. **CORS Configuration**: 적절한 CORS 설정
4. **Rate Limiting**: API 호출 제한

이 기술 스택은 **타입 안전성**, **개발자 경험**, **성능**을 모두 고려하여 선택되었으며, 쏘타의 복잡한 도메인 요구사항을 효과적으로 지원합니다.
