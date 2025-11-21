# AI Agent 및 기본 툴 기술 논의

**작성일**: 2025-11-12  
**상태**: 기술 설계 논의 중  
**관련 기능**: AI Agent, 기본 툴 시스템

---

## 📋 목차

1. [AI Agent 개요](#ai-agent-개요)
2. [기본 툴 시스템](#기본-툴-시스템)
3. [Sensor Score vs Agent 컨텍스트](#sensor-score-vs-agent-컨텍스트)
4. [IntentBlockTypeMatch vs SemanticSim](#intentblocktypematch-vs-semanticsim)
5. [기술 구현 세부사항](#기술-구현-세부사항)

---

## AI Agent 개요

### Agent의 역할

**기본 AI**는 사용자 발화 시점에 컨텍스트를 수집하고 짧은 응답과 액션칩을 제공하는 역할을 하지만, **AI Agent**는 복잡한 작업을 수행할 때 **자신이 직접 툴을 호출**하며 루프를 돌면서 임무를 완수합니다.

### Cursor IDE와의 비교

Cursor IDE에서는 Agent가 다음과 같은 기본 툴을 사용합니다:
- **터미널 명령어 툴**: 코드 실행, 파일 조작 등
- **파일트리 검색 툴**: 파일 시스템 탐색
- **인터넷 검색 툴**: 웹 검색

쏘타에서는 다음과 같은 기본 툴을 제공합니다:
- **블럭 조작 툴**: 블럭 생성, 수정, 삭제, 이동 등
- **블럭 검색 툴**: 시맨틱 검색, 키워드 검색 등

### Agent 실행 흐름

```
사용자 발화
  → Sensor Score로 초기 컨텍스트 수집 (사용자 발화 시점에만)
    → LLM 호출
      → Agent가 작업 계획 수립
        → Agent가 툴 호출 결정
          → 기본 툴 실행
            → 결과를 Agent에 반환
              → Agent가 다음 작업 계획
                → (루프 반복)
                  → 작업 완료 또는 실패
```

---

## 기본 툴 시스템

### 제공되는 기본 툴

#### 1. 블럭 조작 툴 (Block Manipulation Tool)

**기능**: 블럭의 CRUD 작업을 수행

**제공하는 작업**:
- `create_block`: 새 블럭 생성
- `update_block`: 블럭 내용 수정
- `delete_block`: 블럭 삭제
- `move_block`: 블럭 위치 이동
- `update_property`: 블럭 속성 수정
- `create_edge`: 엣지 생성
- `group_blocks`: 블럭 그룹화

**사용 예시**:
```typescript
// Agent가 "3개의 마크다운 블럭을 생성하고 연결해줘" 요청 시
Agent → Block Manipulation Tool 호출
  → create_block(blockType: 'markdown', content: '...')
  → create_block(blockType: 'markdown', content: '...')
  → create_block(blockType: 'markdown', content: '...')
  → create_edge(sourceId: 'block1', targetId: 'block2')
  → create_edge(sourceId: 'block2', targetId: 'block3')
```

#### 2. 블럭 검색 툴 (Block Search Tool)

**기능**: 캔버스에서 블럭을 검색

**제공하는 작업**:
- `search_by_semantic`: 시맨틱 검색으로 관련 블럭 찾기
- `search_by_keyword`: 키워드 검색으로 블럭 찾기
- `search_by_type`: 블럭 타입으로 필터링
- `search_by_property`: 특정 속성 값으로 검색

**사용 예시**:
```typescript
// Agent가 "이벤트 스토밍 관련 블럭들을 찾아줘" 요청 시
Agent → Block Search Tool 호출
  → search_by_semantic(query: '이벤트 스토밍', topK: 10)
  → 결과: [block1, block2, block3, ...]
  → Agent가 찾은 블럭들을 컨텍스트에 추가
```

### 툴 호출 인터페이스

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: {
    [key: string]: {
      type: string;
      description: string;
      required?: boolean;
    };
  };
  execute: (params: any) => Promise<ToolResult>;
}

interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  nextActions?: string[]; // Agent에게 제안할 다음 액션
}
```

### Agent가 툴을 호출하는 방식

Agent는 LLM의 Function Calling 기능을 활용하여 툴을 호출합니다:

1. **툴 정의를 시스템 프롬프트에 포함**: Agent가 사용할 수 있는 툴 목록과 설명을 제공
2. **Agent가 툴 호출 결정**: LLM이 작업을 수행하기 위해 필요한 툴을 선택
3. **툴 실행**: 선택된 툴을 실행하고 결과를 반환
4. **Agent가 결과 처리**: 툴 실행 결과를 바탕으로 다음 작업 계획

---

## Sensor Score vs Agent 컨텍스트

### Sensor Score의 역할

**Sensor Score는 사용자 발화 시점에만 계산됩니다.**

1. **사용자 발화 수신** → Sensor Score 계산 시작
2. **5가지 요소 종합**:
   - IntentBlockTypeMatch: 블럭 타입/액션 설명 매칭
   - SemanticSim: 블럭 데이터 시맨틱 유사도
   - Recency: 최근 편집/조회 시간
   - Proximity: 캔버스 좌표/그룹/엣지 근접성
   - Attention: 사용자 인터랙션 (hover, 선택, 스크롤)
3. **상위 N개 블럭 선택**
4. **선택된 블럭 컨텍스트를 시스템 프롬프트에 포함**

### Agent 루프에서의 컨텍스트

**Agent가 루프를 돌면서 작업을 수행할 때는**:

1. **초기 컨텍스트 유지**: Sensor Score로 선택된 블럭 컨텍스트가 시스템 프롬프트에 계속 포함됨
2. **툴 실행 결과 추가**: Agent가 툴을 호출하여 얻은 결과가 컨텍스트에 추가됨
3. **동적 컨텍스트 확장**: Agent가 블럭 검색 툴을 사용하여 새로운 블럭을 찾으면, 그 블럭도 컨텍스트에 추가됨

### 예시 시나리오

```
사용자: "이벤트 스토밍 다이어그램을 바탕으로 aggregate를 디자인해줘"

1. Sensor Score 계산 (사용자 발화 시점)
   → 이벤트 스토밍 관련 블럭 5개 선택
   → 블럭 타입 정보 + 블럭 데이터를 시스템 프롬프트에 포함

2. LLM 호출 → Agent 작업 계획 수립
   → "이벤트 스토밍 블럭들을 분석하고 aggregate를 설계해야 함"

3. Agent가 블럭 검색 툴 호출
   → search_by_semantic(query: 'aggregate', topK: 5)
   → 결과: 관련 블럭 3개 발견
   → 컨텍스트에 추가 (Sensor Score 재계산 없음)

4. Agent가 블럭 조작 툴 호출
   → create_block(blockType: 'markdown', content: 'Aggregate 설계...')
   → 결과: 새 블럭 생성됨
   → 컨텍스트에 추가

5. Agent가 다음 작업 계획
   → "엣지를 생성하여 연결해야 함"
   → create_edge(...)
   → 작업 완료
```

---

## IntentBlockTypeMatch vs SemanticSim

### IntentBlockTypeMatch (블럭 타입/액션 매칭)

**목적**: 발화 의도와 블럭 타입/액션의 적합성을 평가

**방식**:
1. **블럭 타입 설명 저장**: 각 블럭 타입에 대해 자연어 설명 저장
   - 예: "마크다운 블럭은 텍스트 콘텐츠를 작성하는 데 사용됩니다. 문서, 메모, 요약 등을 작성할 때 적합합니다."
2. **블럭 액션 설명 저장**: 각 블럭 액션에 대해 자연어 설명 저장
   - 예: "리팩터 액션은 코드 블럭의 구조를 개선하는 데 사용됩니다. 중복 제거, 함수 추출, 네이밍 개선 등을 수행합니다."
3. **벡터화**: 블럭 타입/액션 설명을 임베딩으로 변환하여 저장
4. **발화 의도 벡터화**: 사용자 발화를 임베딩으로 변환
5. **유사도 계산**: 발화 임베딩과 블럭 타입/액션 설명 임베딩 간의 유사도 계산
6. **BM25 리랭킹**: 벡터 유사도 결과를 BM25로 리랭킹하여 정확도 향상
7. **컨텍스트 전달**: **블럭 타입 정보만** 컨텍스트로 전달 (블럭 데이터는 전달하지 않음)

**예시**:
```
사용자 발화: "코드를 리팩터링해줘"

IntentBlockTypeMatch 계산:
1. 발화 임베딩 생성
2. "리팩터 액션" 설명 임베딩과 유사도 계산 → 높은 점수
3. "코드 블럭" 타입 설명 임베딩과 유사도 계산 → 높은 점수
4. BM25 리랭킹
5. 컨텍스트에 추가: "코드 블럭 타입이 있고, 리팩터 액션이 가능함" (블럭 내용은 포함하지 않음)
```

### SemanticSim (블럭 데이터 시맨틱 유사도)

**목적**: 발화와 실제 블럭 데이터 내용 간의 관련성을 평가

**방식**:
1. **블럭 데이터 임베딩**: 각 블럭의 실제 내용(텍스트, 코드, 속성 등)을 임베딩으로 변환하여 저장
2. **발화 임베딩**: 사용자 발화를 임베딩으로 변환
3. **시맨틱 검색**: 발화 임베딩을 쿼리로 사용하여 Vector DB에서 유사한 블럭 검색
4. **컨텍스트 전달**: **실제 블럭 데이터**를 컨텍스트로 전달

**예시**:
```
사용자 발화: "이벤트 스토밍 관련 내용을 찾아줘"

SemanticSim 계산:
1. 발화 임베딩 생성
2. Vector DB에서 블럭 데이터 임베딩 검색
3. "이벤트 스토밍 프로세스는..." 내용의 블럭 발견 → 높은 유사도
4. 컨텍스트에 추가: 실제 블럭 내용 전체 포함
```

### 두 가지의 차이점 요약

| 구분 | IntentBlockTypeMatch | SemanticSim |
|------|---------------------|-------------|
| **대상** | 블럭 타입/액션 설명 | 실제 블럭 데이터 |
| **목적** | "어떤 타입의 블럭이 필요한가?" | "어떤 내용의 블럭이 관련 있는가?" |
| **컨텍스트 전달** | 블럭 타입 정보만 | 블럭 데이터 전체 |
| **사용 시점** | 작업 타입 결정 시 | 관련 내용 찾기 시 |
| **리랭킹** | BM25 사용 | 벡터 유사도만 사용 |

### 통합 사용 예시

```
사용자 발화: "이 코드를 리팩터링하고 요약 블럭을 만들어줘"

1. IntentBlockTypeMatch:
   → "코드 블럭" 타입이 필요함
   → "리팩터 액션"이 필요함
   → "마크다운 블럭" 타입이 필요함 (요약용)
   → 컨텍스트: 블럭 타입 정보

2. SemanticSim:
   → 발화와 유사한 코드 블럭 데이터 검색
   → "function calculateTotal() { ... }" 블럭 발견
   → 컨텍스트: 실제 코드 블럭 데이터

3. 최종 컨텍스트:
   - 블럭 타입 정보: 코드 블럭, 마크다운 블럭
   - 블럭 데이터: function calculateTotal() { ... }
   - 액션 정보: 리팩터 액션 사용 가능
```

---

## 기술 구현 세부사항

### 블럭 타입/액션 설명 저장 구조

```typescript
interface BlockTypeDescription {
  blockType: string;
  description: string; // 자연어 설명
  useCases: string[]; // 사용 사례 목록
  embedding?: number[]; // 임베딩 벡터
}

interface BlockActionDescription {
  actionName: string;
  blockType: string; // 적용 가능한 블럭 타입
  description: string; // 자연어 설명
  whenToUse: string; // 언제 사용하는지
  embedding?: number[]; // 임베딩 벡터
}
```

### IntentBlockTypeMatch 계산 알고리즘

```typescript
async function calculateIntentBlockTypeMatch(
  utterance: string,
  blockTypes: BlockTypeDescription[],
  blockActions: BlockActionDescription[]
): Promise<MatchScore[]> {
  // 1. 발화 임베딩 생성
  const utteranceEmbedding = await generateEmbedding(utterance);
  
  // 2. 블럭 타입 설명 임베딩과 유사도 계산
  const typeScores = await Promise.all(
    blockTypes.map(async (type) => {
      const similarity = cosineSimilarity(
        utteranceEmbedding,
        type.embedding
      );
      return { blockType: type.blockType, score: similarity };
    })
  );
  
  // 3. 블럭 액션 설명 임베딩과 유사도 계산
  const actionScores = await Promise.all(
    blockActions.map(async (action) => {
      const similarity = cosineSimilarity(
        utteranceEmbedding,
        action.embedding
      );
      return { actionName: action.actionName, score: similarity };
    })
  );
  
  // 4. BM25 리랭킹
  const rerankedScores = bm25Rerank(
    [...typeScores, ...actionScores],
    utterance
  );
  
  return rerankedScores;
}
```

### SemanticSim 계산 알고리즘

```typescript
async function calculateSemanticSim(
  utterance: string,
  pageId: string,
  topK: number = 10
): Promise<Block[]> {
  // 1. 발화 임베딩 생성
  const utteranceEmbedding = await generateEmbedding(utterance);
  
  // 2. Vector DB에서 시맨틱 검색
  const similarBlocks = await vectorDB.search({
    query: utteranceEmbedding,
    filter: { pageId },
    topK,
  });
  
  // 3. 블럭 데이터 조회
  const blocks = await blockService.getBlocksByIds(
    similarBlocks.map(b => b.blockId)
  );
  
  return blocks;
}
```

### Agent 툴 호출 구현

```typescript
class AIAgent {
  private tools: Tool[];
  private context: AgentContext;
  
  async executeTask(userUtterance: string): Promise<AgentResult> {
    // 1. 초기 컨텍스트 설정 (Sensor Score로 선택된 블럭 포함)
    this.context = await this.initializeContext(userUtterance);
    
    // 2. Agent 루프 시작
    let iteration = 0;
    const maxIterations = 10;
    
    while (iteration < maxIterations) {
      // 3. LLM 호출하여 다음 액션 결정
      const action = await this.llm.decideNextAction(
        this.context,
        this.tools
      );
      
      if (action.type === 'complete') {
        return { success: true, result: action.result };
      }
      
      if (action.type === 'tool_call') {
        // 4. 툴 실행
        const toolResult = await this.executeTool(
          action.toolName,
          action.parameters
        );
        
        // 5. 결과를 컨텍스트에 추가
        this.context.addToolResult(toolResult);
      }
      
      iteration++;
    }
    
    return { success: false, error: 'Max iterations reached' };
  }
  
  private async executeTool(
    toolName: string,
    parameters: any
  ): Promise<ToolResult> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    
    return await tool.execute(parameters);
  }
}
```

---

## 🔗 관련 문서

- [기본 AI 컨텍스트 엔지니어링 설계](./basic-ai-context-engineering.md)
- [Event Storming: AI Management Domain](../domains/ai-management-domain/01-event-storm.md)
- [Process Model: AI Management Domain](../domains/ai-management-domain/02-process-model.md)

---

*이 문서는 AI Agent 및 기본 툴 시스템의 기술적 세부사항을 다룹니다. 비즈니스 프로세스는 Event Storming 및 Process Model 문서를 참조하세요.*

