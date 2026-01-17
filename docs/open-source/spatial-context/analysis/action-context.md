# Action Context 분석

## 개요

**Action Context (액션 맥락)**은 AI 에이전트가 수행할 수 있는 작업/액션에 대한 정보를 제공합니다.

**설계 원리**: 업무에 대한 맥락이 있더라도 해당 업무를 수행하는 방법, 프로그램 사용법을 모르면 업무를 완수할 수 없습니다.

---

## 핵심 기능

### 1. 블록 액션 정의
- **정의**: 각 블록 타입별 수행 가능한 액션 목록
- **구조**: JSON Schema 기반 파라미터 정의
- **목적**: LLM이 사용 가능한 액션 파악

### 2. 액션 파라미터 스키마
- **정의**: 액션 실행에 필요한 파라미터 구조
- **형식**: JSON Schema
- **목적**: 타입 안전한 액션 실행

### 3. 조건부 가용성
- **정의**: 현재 상태에서 실행 가능한 액션 필터링
- **조건**: 블록 타입, 선택 상태, 권한 등
- **목적**: 컨텍스트에 맞는 액션만 제공

### 4. LLM Tool 변환
- **정의**: 액션 정의를 LLM Tool 형식으로 변환
- **형식**: OpenAI Function Calling, Anthropic Tool Use 등
- **목적**: LLM이 직접 액션 호출 가능

---

## SSOTA 구현 분석

### 구현 위치

#### 1. 액션 레지스트리
**파일**: `apps/web/src/domains/block-management/backend/repositories/implementations/drizzle-tool.repository.ts`

```typescript
// 라인 11-27
export interface BlockActionDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  examples?: string[];
  category?: string;
}

export interface BlockTypeRegistry {
  type: string;
  displayName: string;
  actions: BlockActionDefinition[];
}

// 라인 32-242
export const BLOCK_ACTIONS_REGISTRY: Record<string, BlockTypeRegistry> = {
  youtube: { ... },
  pdf: { ... },
  // ...
};
```

**구조**:
- **블록 타입별 그룹화**: 각 블록 타입마다 액션 목록
- **JSON Schema 기반**: `inputSchema`로 파라미터 정의
- **예시 포함**: `examples` 배열로 사용 예시 제공

**예시**:
```typescript
youtube: {
  type: 'youtube',
  displayName: 'YouTube',
  actions: [
    {
      name: 'extractScript',
      description: 'Extract transcript/subtitles from YouTube video',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      examples: ['Extract the script', 'Get YouTube transcript'],
      category: 'content',
    },
    {
      name: 'summarize',
      description: 'Summarize YouTube video content using AI',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      examples: ['Summarize this video', 'Create summary'],
      category: 'ai',
    },
  ],
}
```

#### 2. 액션 실행 흐름
**파일**: `apps/web/src/domains/block-management/frontend/hooks/use-block-action-executor.ts`

```typescript
// 라인 67-178
async executeAction(params: {
  blockId: string;
  action: string;
  blockType: string;
  params?: Record<string, any>;
}): Promise<{ success: boolean; message: string }>
```

**단계**:
1. **액션 정의 조회**: `BLOCK_ACTIONS_REGISTRY`에서 액션 정의 가져오기
2. **JSON Schema 검증**: 파라미터 검증
3. **동적 import**: 블록 타입별 액션 모듈 로드
4. **액션 실행**: `executeAction()` 함수 호출

**특징**:
- **Convention-based**: `{blockType}-actions.ts` 파일 규약
- **동적 로딩**: 필요한 액션만 로드
- **타입 안전성**: JSON Schema 기반 검증

#### 3. LLM Tool 정의
**파일**: `apps/web/src/domains/ai-management/backend/services/prompt/tools.ts`

**주요 Tool**:
- `executeBlockActionTool`: 블록 액션 실행 Tool
- `getBlockTypeDetailTool`: 블록 타입 상세 정보 Tool

**형식**: OpenAI Function Calling (Zod 스키마)

---

## 알고리즘 분석

### 1. 액션 레지스트리 패턴

**현재 구현**: 정적 레지스트리 객체

**SDK 설계**:
- **동적 등록**: 런타임에 액션 등록 가능
- **타입 안전성**: TypeScript 제네릭 활용
- **확장성**: 플러그인 패턴

**의사 코드**:
```
class ActionRegistry {
  private actions: Map<string, ActionDefinition> = new Map();
  
  registerAction(action: ActionDefinition): void {
    this.actions.set(action.id, action);
  }
  
  getActions(blockType?: string): ActionDefinition[] {
    if (blockType) {
      return this.actions.values()
        .filter(action => action.target === 'global' || action.target.includes(blockType));
    }
    return Array.from(this.actions.values());
  }
}
```

### 2. 조건부 가용성 판단

**SDK 설계**:
- **함수 기반**: `isAvailable(context)` 함수
- **컨텍스트 제공**: 선택 블록, 캔버스 상태, 권한 등

**의사 코드**:
```
function filterAvailableActions(actions, context):
  return actions.filter(action => {
    if (!action.isAvailable) {
      return true;  // 가용성 조건 없음
    }
    return action.isAvailable(context);
  })
```

**예시**:
```typescript
{
  id: 'refactor',
  name: 'refactor',
  target: ['python', 'javascript'],
  isAvailable: (context) => {
    // 코드 블록이 선택되어 있어야 함
    return context.selectedBlocks.some(b => 
      ['python', 'javascript'].includes(b.type)
    );
  },
  // ...
}
```

### 3. JSON Schema 검증

**SDK 설계**:
- **라이브러리**: `ajv` 또는 `zod` 사용
- **런타임 검증**: 액션 실행 전 파라미터 검증
- **에러 메시지**: 상세한 검증 에러 제공

**의사 코드**:
```
function validateActionParams(action, params):
  validator = new Ajv().compile(action.inputSchema);
  valid = validator(params);
  
  if (!valid) {
    throw new ValidationError(validator.errors);
  }
  
  return params;
```

### 4. LLM Tool 변환

**SDK 설계**:
- **다양한 형식 지원**: OpenAI, Anthropic, MCP 등
- **자동 변환**: 액션 정의 → Tool 정의

**의사 코드**:
```
function toOpenAITools(actions: ActionDefinition[]): LLMTool[] {
  return actions.map(action => ({
    type: 'function',
    function: {
      name: action.id,
      description: action.description,
      parameters: {
        type: 'object',
        properties: action.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            // ...
          };
          return acc;
        }, {}),
        required: action.parameters
          .filter(p => p.required)
          .map(p => p.name),
      },
    },
  }));
}
```

---

## 인터페이스 설계

### ActionParameter

```typescript
/**
 * 액션 파라미터 스키마 (JSON Schema 기반)
 */
export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  properties?: Record<string, ActionParameter>;  // for object type
  items?: ActionParameter;  // for array type
}
```

### ActionDefinition

```typescript
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;

  /**
   * 액션 대상 (특정 블록 타입 또는 전역)
   */
  target: 'global' | string[];  // 'global' or block type names

  /**
   * 파라미터 스키마
   */
  parameters: ActionParameter[];

  /**
   * 가용성 조건 (optional)
   */
  isAvailable?: (context: ActionAvailabilityContext) => boolean;

  /**
   * 액션 실행 핸들러
   */
  execute: (params: Record<string, unknown>) => Promise<ActionResult>;
}
```

### ActionContextProvider

```typescript
export interface ActionContextProvider {
  /**
   * 액션 등록
   */
  registerAction(action: ActionDefinition): void;

  /**
   * 액션 일괄 등록
   */
  registerActions(actions: ActionDefinition[]): void;

  /**
   * 액션 조회
   */
  getContext(options?: ActionContextOptions): ActionContextResult;

  /**
   * 액션 실행
   */
  executeAction(
    actionId: string,
    params: Record<string, unknown>
  ): Promise<ActionResult>;
}
```

---

## 사용 예시

### 기본 사용

```typescript
import { SpatialContext } from '@spatial-context/core';

const spatial = new SpatialContext();

// 액션 등록
spatial.action.registerAction({
  id: 'refactor',
  name: 'refactor',
  description: 'Refactor code block',
  target: ['python', 'javascript'],
  parameters: [
    {
      name: 'style',
      type: 'string',
      description: 'Refactoring style',
      enum: ['functional', 'oop', 'clean'],
    },
  ],
  execute: async (params) => {
    // 액션 실행 로직
    return { success: true, message: 'Refactored successfully' };
  },
});

// Action Context 조회
const actionContext = spatial.action.getContext({
  blockTypes: ['python'],
  onlyAvailable: true,
});

console.log(actionContext.availableActions);
```

### LLM Tool 변환

```typescript
// Action Context에서 액션 가져오기
const actions = actionContext.availableActions;

// OpenAI Tool 형식으로 변환
const tools = spatial.action.toOpenAITools(actions);

// LLM에 전달
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  tools,
});
```

### 조건부 가용성

```typescript
// 특정 조건에서만 사용 가능한 액션
spatial.action.registerAction({
  id: 'delete',
  name: 'delete',
  description: 'Delete selected block',
  target: 'global',
  isAvailable: (context) => {
    // 선택된 블록이 있어야 함
    return context.selectedBlocks.length > 0;
  },
  execute: async (params) => {
    // 삭제 로직
  },
});
```

---

## 성능 고려사항

### 최적화 전략

1. **액션 레지스트리 인덱싱**:
   - 블록 타입별 인덱스
   - 카테고리별 인덱스

2. **지연 로딩**:
   - 필요한 액션만 로드
   - 동적 import 활용

3. **캐싱**:
   - Tool 정의 캐싱
   - 가용성 판단 결과 캐싱

### 예상 성능

- **액션 등록**: O(1) - 해시맵 기반
- **액션 조회**: O(N) - N은 액션 수
- **가용성 필터링**: O(N) - 각 액션마다 조건 체크

---

## SSOTA 특화 로직 제거 포인트

### 제거 대상

1. **동적 import 경로**:
   - 현재: `@/domains/block-management/...` 경로
   - SDK: 사용자가 액션 핸들러 제공

2. **React Hook 기반 실행**:
   - 현재: React Hook 콜백 사용
   - SDK: 순수 함수 기반 실행

3. **블록 마운트 ID**:
   - 현재: `blockMountId` 사용
   - SDK: 블록 ID만 사용

### 유지 대상

1. **액션 레지스트리 패턴**: 범용 패턴
2. **JSON Schema 구조**: 범용 구조
3. **LLM Tool 변환 로직**: 범용 로직

---

## README 섹션 초안

### Action Context (액션 맥락)

> "What can I do here?"

Provides available actions and their parameters:

```typescript
const actionContext = spatial.action.getContext({
  blockTypes: ['shape', 'markdown'],
  onlyAvailable: true,
  relevanceQuery: "add a new node",
});

// Result:
// - Available actions for current context
// - Action parameters with validation
// - Suggested actions based on user intent
```

**Use cases**:
- Generating LLM tool definitions
- Dynamic action availability
- Context-aware suggestions

**Action Registration**:
```typescript
spatial.action.registerAction({
  id: 'refactor',
  name: 'refactor',
  description: 'Refactor code block',
  target: ['python', 'javascript'],
  parameters: [
    { name: 'style', type: 'string', enum: ['functional', 'oop'] },
  ],
  execute: async (params) => {
    // Your action logic
  },
});
```

**LLM Integration**:
```typescript
// Convert actions to LLM tools
const tools = spatial.action.toOpenAITools(actions);

// Use with any LLM
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  tools,
});
```
