# Semantic Context 분석

## 개요

**Semantic Context (의미 맥락)**은 유저 발화/요청과 의미적으로 가까운 블록을 탐색하여 전달합니다.

**설계 원리**: 물리적으로 거리가 멀지만 현재 발화에 꼭 필요한 블록을 탐색해 제공합니다.

---

## 핵심 기능

### 1. Vector Embedding 시맨틱 서치
- **정의**: 의미적 유사도 기반 검색
- **상태**: 계획 중 (TODO)
- **목적**: 발화와 블록 내용 간 의미적 관련성 평가

### 2. BM25 알고리즘
- **정의**: 키워드 기반 텍스트 검색
- **상태**: 구현 완료
- **목적**: 자연어 쿼리와 블록 텍스트 매칭

### 3. 하이브리드 검색
- **정의**: 벡터 + 키워드 결합
- **상태**: 계획 중
- **목적**: 두 검색 방식의 장점 결합

---

## SSOTA 구현 분석

### 구현 위치

#### 1. BM25 검색 구현
**파일**: `apps/web/src/domains/ai-management/backend/repositories/implementations/drizzle-event-log.repository.ts`

```typescript
// 라인 73-111
async searchByBM25(
  queryText: string,
  pageId: string,
  topK: number,
  timeWeightFactor: number = 7
): Promise<EventLog[]>
```

**알고리즘**:
1. **PostgreSQL `ts_rank` 사용**: 
   ```sql
   ts_rank(
     to_tsvector('simple', search_content),
     plainto_tsquery('simple', queryText)
   )
   ```

2. **시간 가중치 적용**:
   ```sql
   exp(
     -extract(epoch from (now() - timestamp)) / (timeWeightFactor * 86400)
   )
   ```
   - `timeWeightFactor = 7`: 7일 기준 감쇠
   - `exp(-t/τ)`: 지수 감쇠 함수

3. **최종 점수**:
   ```sql
   ts_rank(...) * exp(...)
   ```

4. **정렬 및 제한**: `ORDER BY final_score DESC LIMIT topK`

**특징**:
- **PostgreSQL 특화**: `ts_rank`, `to_tsvector`, `plainto_tsquery` 사용
- **시간 가중치**: 최근 이벤트일수록 높은 점수
- **페이지 필터링**: `pageId` 기반

#### 2. 벡터 검색 (TODO)
**파일**: `apps/web/src/domains/ai-management/backend/services/tool-execution.service.ts`

```typescript
// 라인 86-106
async searchBySemantic(...): Promise<ToolExecutionResult> {
  // TODO: Implement semantic search with embeddings
  // 1. 쿼리를 임베딩으로 변환
  // 2. 벡터 DB에서 유사도 검색
  // 3. topK 개의 블럭 반환
}
```

**현재 상태**: 미구현

**설계 계획**:
1. 쿼리 임베딩 생성
2. 벡터 DB에서 유사도 검색
3. 상위 K개 반환

#### 3. IntentBlockTypeMatch vs SemanticSim
**파일**: `docs/event-domain-design/discussion/ai-automation/ai-agent-tools-technical-discussion.md`

**개념**:
- **IntentBlockTypeMatch**: 블록 타입/액션 설명과 발화 의도 매칭
- **SemanticSim**: 실제 블록 데이터와 발화 의미 매칭

**차이점**:

| 구분 | IntentBlockTypeMatch | SemanticSim |
|------|---------------------|-------------|
| 대상 | 블록 타입/액션 설명 | 실제 블록 데이터 |
| 목적 | "어떤 타입이 필요한가?" | "어떤 내용이 관련 있는가?" |
| 컨텍스트 | 블록 타입 정보만 | 블록 데이터 전체 |
| 리랭킹 | BM25 사용 | 벡터 유사도만 |

---

## 알고리즘 분석

### 1. BM25 검색

**현재 구현**: PostgreSQL `ts_rank`

**SDK 설계**:
- **순수 JavaScript 구현**: PostgreSQL 의존성 제거
- **라이브러리 옵션**: 
  - `lunr.js`: 클라이언트 사이드 BM25
  - `flexsearch`: 고성능 텍스트 검색
  - 직접 구현: 경량화

**BM25 공식**:
```
score(D, Q) = Σ IDF(qi) * f(qi, D) * (k1 + 1) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
```

**의사 코드**:
```
function bm25Search(query, documents, topK):
  // 1. 쿼리 토큰화
  queryTerms = tokenize(query)
  
  // 2. 각 문서에 대해 BM25 점수 계산
  scores = documents.map(doc => {
    score = 0
    for term in queryTerms:
      termFreq = getTermFrequency(term, doc)
      idf = calculateIDF(term, documents)
      score += idf * termFreq * (k1 + 1) / (termFreq + k1 * (1 - b + b * docLength / avgDocLength))
    return { doc, score }
  })
  
  // 3. 정렬 및 상위 K개 반환
  return scores.sort((a, b) => b.score - a.score).slice(0, topK)
```

### 2. 벡터 검색

**SDK 설계**:
- **임베딩 제공자 플러그인**: 다양한 임베딩 API 지원
- **벡터 인덱스**: 인메모리 또는 외부 DB
- **유사도 계산**: 코사인 유사도

**의사 코드**:
```
function vectorSearch(queryEmbedding, blockEmbeddings, topK):
  // 1. 쿼리 임베딩 생성 (이미 제공됨)
  
  // 2. 각 블록 임베딩과 유사도 계산
  similarities = blockEmbeddings.map(blockEmbedding => {
    similarity = cosineSimilarity(queryEmbedding, blockEmbedding)
    return { block, similarity }
  })
  
  // 3. 정렬 및 상위 K개 반환
  return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, topK)
```

**코사인 유사도**:
```
cosineSimilarity(A, B) = (A · B) / (||A|| * ||B||)
```

### 3. 하이브리드 검색

**SDK 설계**:
- **점수 정규화**: 두 검색 결과를 0-1 범위로 정규화
- **가중치 결합**: `finalScore = w * vectorScore + (1-w) * bm25Score`
- **리랭킹**: 결합 점수로 재정렬

**의사 코드**:
```
function hybridSearch(query, blocks, vectorWeight = 0.7):
  // 1. 벡터 검색
  vectorResults = vectorSearch(queryEmbedding, blockEmbeddings, topK * 2)
  
  // 2. BM25 검색
  bm25Results = bm25Search(query, blocks, topK * 2)
  
  // 3. 점수 정규화
  normalizedVector = normalizeScores(vectorResults)
  normalizedBM25 = normalizeScores(bm25Results)
  
  // 4. 가중치 결합
  combined = mergeResults(normalizedVector, normalizedBM25, vectorWeight)
  
  // 5. 리랭킹 및 상위 K개 반환
  return combined.sort((a, b) => b.score - a.score).slice(0, topK)
```

### 4. 시간 가중치

**현재 구현**: `exp(-t/τ)`

**SDK 설계**:
- **플러그인 가능**: 다양한 시간 가중치 함수 지원
- **기본 함수**: 지수 감쇠

**수식**:
```
timeWeight = exp(-t / τ)
```
- `t`: 시간 경과 (초)
- `τ`: 감쇠 상수 (`timeWeightFactor * 86400`)

**예시**:
- `timeWeightFactor = 7`: 7일 기준
- 1일 전: `exp(-1/7) ≈ 0.87`
- 7일 전: `exp(-7/7) ≈ 0.37`
- 14일 전: `exp(-14/7) ≈ 0.14`

---

## 인터페이스 설계

### EmbeddingProvider (플러그인 인터페이스)

```typescript
/**
 * 임베딩 제공자 인터페이스 (플러그인 패턴)
 */
export interface EmbeddingProvider {
  /**
   * 텍스트를 임베딩 벡터로 변환
   */
  embed(text: string): Promise<number[]>;

  /**
   * 여러 텍스트를 일괄 임베딩
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * 임베딩 벡터 차원
   */
  dimensions: number;
}
```

**구현 예시**:
```typescript
// OpenAI 임베딩 제공자
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  dimensions = 1536;
  
  async embed(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });
    return response.data.map(item => item.embedding);
  }
}
```

### SemanticContextProvider

```typescript
export interface SemanticContextProvider {
  /**
   * 임베딩 제공자 설정
   */
  setEmbeddingProvider(provider: EmbeddingProvider): void;

  /**
   * 블록 인덱싱
   */
  indexBlocks(blocks: BlockInfo[]): Promise<void>;

  /**
   * 시맨틱 검색
   */
  search(options: SemanticContextOptions): Promise<SemanticContextResult>;
}
```

### SemanticContextOptions

```typescript
export interface SemanticContextOptions {
  /**
   * 검색 쿼리 (유저 발화)
   */
  query: string;

  /**
   * 검색 전략
   * @default 'hybrid'
   */
  strategy?: 'vector' | 'bm25' | 'hybrid';

  /**
   * 하이브리드 검색 시 벡터 가중치 (0-1)
   * @default 0.7
   */
  vectorWeight?: number;

  /**
   * 최대 결과 수
   * @default 10
   */
  topK?: number;

  /**
   * 최소 유사도 임계값
   * @default 0.5
   */
  minScore?: number;
}
```

---

## 사용 예시

### 기본 사용

```typescript
import { SpatialContext } from '@spatial-context/core';
import { OpenAIEmbeddingProvider } from '@spatial-context/openai';

const spatial = new SpatialContext();

// 임베딩 제공자 설정
const embeddingProvider = new OpenAIEmbeddingProvider({
  apiKey: process.env.OPENAI_API_KEY,
});
spatial.semantic.setEmbeddingProvider(embeddingProvider);

// 블록 인덱싱
await spatial.semantic.indexBlocks(blocks);

// 시맨틱 검색
const semanticContext = await spatial.semantic.search({
  query: "How do we handle user authentication?",
  strategy: 'hybrid',
  vectorWeight: 0.7,
  topK: 10,
});

console.log(semanticContext.relevantBlocks);
```

### 다양한 임베딩 제공자

```typescript
// OpenAI
import { OpenAIEmbeddingProvider } from '@spatial-context/openai';
spatial.semantic.setEmbeddingProvider(new OpenAIEmbeddingProvider({ apiKey }));

// Voyage AI
import { VoyageEmbeddingProvider } from '@spatial-context/voyage';
spatial.semantic.setEmbeddingProvider(new VoyageEmbeddingProvider({ apiKey }));

// 로컬 모델 (예: Transformers.js)
import { LocalEmbeddingProvider } from '@spatial-context/local';
spatial.semantic.setEmbeddingProvider(new LocalEmbeddingProvider({ model }));
```

---

## 성능 고려사항

### 최적화 전략

1. **임베딩 캐싱**:
   - 블록 내용 변경 시에만 재임베딩
   - 임베딩 결과 캐싱

2. **배치 임베딩**:
   - 여러 텍스트를 한 번에 임베딩
   - API 비용 절감

3. **벡터 인덱스**:
   - 인메모리 인덱스 (작은 그래프)
   - 외부 벡터 DB (큰 그래프)

### 예상 성능

- **BM25 검색**: O(N) - N은 문서 수
- **벡터 검색**: O(N * D) - D는 벡터 차원
- **하이브리드**: O(N * D + N) ≈ O(N * D)

---

## SSOTA 특화 로직 제거 포인트

### 제거 대상

1. **PostgreSQL `ts_rank`**:
   - 현재: PostgreSQL 특화 SQL 함수
   - SDK: 순수 JavaScript BM25 구현

2. **페이지 ID 필터링**:
   - 현재: `pageId` 기반 필터링
   - SDK: 그래프 데이터 자체에 포함

3. **이벤트 로그 테이블**:
   - 현재: `eventLogs` 테이블 사용
   - SDK: 블록 데이터 직접 검색

### 유지 대상

1. **BM25 알고리즘 로직**: 범용 알고리즘
2. **시간 가중치 공식**: 범용 수식
3. **벡터 검색 설계**: 범용 설계

---

## README 섹션 초안

### Semantic Context (의미 맥락)

> "What's relevant to the user's question?"

Finds semantically related blocks using vector search and BM25:

```typescript
const semanticContext = await spatial.semantic.search({
  query: "How do we handle user authentication?",
  strategy: 'hybrid',     // 'vector' | 'bm25' | 'hybrid'
  vectorWeight: 0.7,      // 70% vector, 30% BM25
  topK: 10,
});

// Result:
// - Blocks semantically related to the query
// - Relevance scores for each result
// - Works even when relevant blocks are far away
```

**Use cases**:
- Finding relevant information across the entire canvas
- Answering questions about canvas content
- Connecting ideas that are physically distant

**Embedding Providers**:
- OpenAI (`text-embedding-3-small`)
- Voyage AI
- Local models (Transformers.js)
