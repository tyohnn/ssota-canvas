# Work Context 분석

## 개요

**Work Context (작업 맥락)**은 캔버스 내에서 일어난 과거 이력들을 추적하고 관련 컨텍스트를 제공합니다.

**설계 원리**: 사람이 자신의 업무 맥락을 장기적으로 기억하고 있는 것과 같은 효과를 제공합니다.

---

## 핵심 기능

### 1. Short-Term Memory (숏텀 메모리)
- **정의**: 최근 작업 이력 (최근 20개 이벤트)
- **목적**: 최근 작업 맥락 유지
- **사용 사례**: "방금 만든 블록", "아까 말한 내용" 이해

### 2. Long-Term Memory (롱텀 메모리)
- **정의**: 발화와 유사성 높은 과거 작업 이력
- **검색 방식**: BM25 검색 + 시간 가중치
- **목적**: 과거 유사 작업 패턴 복원

### 3. 이벤트 추적
- **정의**: 캔버스 내 모든 작업 이벤트 기록
- **이벤트 타입**: 블록 생성/수정/삭제, 엣지 생성/삭제 등
- **목적**: 작업 히스토리 관리

---

## SSOTA 구현 분석

### 구현 위치

#### 1. Short-Term Memory
**파일**: `apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts`

```typescript
// 라인 78-100
async assembleShortTermMemory(
  pageId: string,
  limit: number = 20
): Promise<EventLogSummary[]>
```

**알고리즘**:
1. **최근 이벤트 조회**: 페이지별 최근 N개 이벤트 시간순 조회
2. **메타데이터 추출**: 이벤트 타입, 타임스탬프, 내용 요약
3. **내용 제한**: 최대 200자로 제한

**특징**:
- **시간순 정렬**: `timestamp DESC`
- **페이지 필터링**: `pageId` 기반
- **부분 실패 허용**: 에러 시 빈 배열 반환

#### 2. Long-Term Memory
**파일**: `apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts`

```typescript
// 라인 106-133
async assembleLongTermMemory(
  queryText: string,
  pageId: string,
  topK: number = 10,
  timeWeightFactor: number = 7
): Promise<EventLogSummary[]>
```

**알고리즘**:
1. **BM25 검색**: 발화와 유사한 과거 이벤트 검색
2. **시간 가중치 적용**: 최근 이벤트일수록 높은 점수
3. **상위 K개 선택**: 점수 순으로 정렬

**구현**: `memorySearchService.searchLongTermMemory()` 호출

#### 3. 이벤트 로그 저장소
**파일**: `apps/web/src/domains/ai-management/backend/repositories/implementations/drizzle-event-log.repository.ts`

**주요 메서드**:
- `searchByBM25()`: BM25 전문 검색
- `searchByMetadata()`: 메타데이터 패턴 매칭
- `searchHybrid()`: 하이브리드 검색

#### 4. 메모리 검색 서비스
**파일**: `apps/web/src/domains/ai-management/backend/services/memory-search.service.ts`

**주요 메서드**:
- `searchLongTermMemory()`: Long-Term Memory 검색 메인 메서드
- `searchByBM25()`, `searchByMetadata()`, `searchHybrid()`: 검색 전략별 래퍼

---

## 이벤트 타입 정의

### CanvasEventType

```typescript
export type CanvasEventType =
  | 'block.created'
  | 'block.updated'
  | 'block.deleted'
  | 'block.moved'
  | 'block.resized'
  | 'block.selected'
  | 'edge.created'
  | 'edge.deleted'
  | 'viewport.changed'
  | 'user.action';
```

### CanvasEvent

```typescript
export interface CanvasEvent {
  id: string;
  type: CanvasEventType;
  timestamp: Date;

  /**
   * 이벤트 대상
   */
  targetId?: string;
  targetType?: 'block' | 'edge' | 'viewport';

  /**
   * 이벤트 상세 데이터
   */
  data: Record<string, unknown>;

  /**
   * 이벤트 발생 사용자
   */
  userId?: string;

  /**
   * 세션 식별자
   */
  sessionId?: string;
}
```

---

## 알고리즘 분석

### 1. 시간 기반 필터링

**현재 구현**: 시간순 정렬, 최근 N개 조회

**SDK 설계**:
- **시간 범위 필터**: `from`, `to` 날짜 지정
- **이벤트 타입 필터**: 특정 타입만 조회
- **블록 ID 필터**: 특정 블록 관련 이벤트만

**의사 코드**:
```
function filterEvents(events, options):
  filtered = events
  
  // 시간 범위 필터
  if options.timeRange:
    filtered = filtered.filter(e => 
      e.timestamp >= options.timeRange.from &&
      e.timestamp <= options.timeRange.to
    )
  
  // 이벤트 타입 필터
  if options.eventTypes:
    filtered = filtered.filter(e => 
      options.eventTypes.includes(e.type)
    )
  
  // 블록 ID 필터
  if options.blockIds:
    filtered = filtered.filter(e => 
      options.blockIds.includes(e.targetId)
    )
  
  return filtered
```

### 2. BM25 기반 관련성 검색

**현재 구현**: PostgreSQL `ts_rank` + 시간 가중치

**SDK 설계**:
- **BM25 검색**: 순수 JavaScript 구현
- **시간 가중치**: `exp(-t/τ)` 적용
- **최종 점수**: `bm25Score * timeWeight`

**의사 코드**:
```
function searchRelevantEvents(query, events, topK, timeWeightFactor):
  // 1. BM25 점수 계산
  bm25Scores = events.map(event => ({
    event,
    bm25Score: calculateBM25(query, event.content)
  }))
  
  // 2. 시간 가중치 적용
  now = Date.now()
  weightedScores = bm25Scores.map(({ event, bm25Score }) => {
    timeDiff = (now - event.timestamp) / (1000 * 60 * 60 * 24)  // 일 단위
    timeWeight = Math.exp(-timeDiff / timeWeightFactor)
    return {
      event,
      finalScore: bm25Score * timeWeight
    }
  })
  
  // 3. 정렬 및 상위 K개 반환
  return weightedScores
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topK)
    .map(item => item.event)
```

### 3. 이벤트 저장 전략

**SDK 설계**:
- **인메모리**: 세션 기반 단기 저장
- **로컬 스토리지**: 브라우저 기반 영구 저장
- **서버 동기화**: 장기 저장 및 공유 (옵션)

**인터페이스**:
```typescript
export interface EventStore {
  save(event: CanvasEvent): Promise<void>;
  find(options: EventStoreOptions): Promise<CanvasEvent[]>;
  clear(): Promise<void>;
}
```

---

## 인터페이스 설계

### WorkContextProvider

```typescript
export interface WorkContextProvider {
  /**
   * 이벤트 기록
   */
  recordEvent(event: Omit<CanvasEvent, 'id' | 'timestamp'>): void;

  /**
   * 컨텍스트 조회
   */
  getContext(options?: WorkContextOptions): WorkContextResult;

  /**
   * 이벤트 스트림 구독
   */
  subscribe(
    callback: (event: CanvasEvent) => void
  ): () => void;  // unsubscribe 함수 반환

  /**
   * 세션 관리
   */
  startSession(): string;
  endSession(sessionId: string): void;
}
```

### WorkContextOptions

```typescript
export interface WorkContextOptions {
  /**
   * 시간 범위 필터
   */
  timeRange?: {
    from?: Date;
    to?: Date;
  };

  /**
   * 이벤트 타입 필터
   */
  eventTypes?: CanvasEventType[];

  /**
   * 특정 블록 관련 이벤트만
   */
  blockIds?: string[];

  /**
   * 최대 이벤트 수
   * @default 50
   */
  maxEvents?: number;

  /**
   * 관련성 검색 쿼리 (유저 발화)
   */
  relevanceQuery?: string;
}
```

### WorkContextResult

```typescript
export interface WorkContextResult {
  /**
   * 관련 이벤트 목록
   */
  events: CanvasEvent[];

  /**
   * 이벤트 요약
   */
  summary: {
    totalEvents: number;
    eventTypeCounts: Record<CanvasEventType, number>;
    timeRange: { from: Date; to: Date };
  };

  /**
   * 컨텍스트 요약 (LLM 프롬프트용)
   */
  contextSummary: string;
}
```

---

## 사용 예시

### 기본 사용

```typescript
import { SpatialContext } from '@spatial-context/core';

const spatial = new SpatialContext();

// 이벤트 기록
spatial.work.recordEvent({
  type: 'block.created',
  targetId: 'block-123',
  targetType: 'block',
  data: { blockType: 'markdown', title: 'New Note' },
});

// Work Context 조회
const workContext = spatial.work.getContext({
  timeRange: { from: new Date('2024-01-01') },
  eventTypes: ['block.created', 'block.updated'],
  maxEvents: 50,
});

console.log(workContext.events);
console.log(workContext.summary);
```

### 관련성 검색

```typescript
// 발화와 관련된 과거 이벤트 검색
const relevantContext = spatial.work.getContext({
  relevanceQuery: "코드 리팩터링",
  maxEvents: 10,
});

// BM25 + 시간 가중치로 관련 이벤트 반환
console.log(relevantContext.events);
```

### 이벤트 구독

```typescript
// 이벤트 스트림 구독
const unsubscribe = spatial.work.subscribe((event) => {
  console.log('New event:', event);
  
  // 실시간으로 이벤트 처리
  if (event.type === 'block.created') {
    // 새 블록 생성 알림
  }
});

// 구독 해제
unsubscribe();
```

### 세션 관리

```typescript
// 세션 시작
const sessionId = spatial.work.startSession();

// 세션 동안 이벤트 기록
spatial.work.recordEvent({
  type: 'block.created',
  sessionId,
  // ...
});

// 세션 종료
spatial.work.endSession(sessionId);
```

---

## 성능 고려사항

### 최적화 전략

1. **이벤트 보존 정책**:
   - TTL (Time To Live): 일정 기간 후 자동 삭제
   - 최대 개수 제한: 오래된 이벤트 자동 삭제

2. **인덱싱**:
   - 시간 인덱스: 빠른 시간 범위 조회
   - 타입 인덱스: 빠른 타입 필터링
   - 블록 ID 인덱스: 빠른 블록별 조회

3. **배치 처리**:
   - 여러 이벤트 일괄 저장
   - 검색 결과 캐싱

### 예상 성능

- **이벤트 저장**: O(1) - 해시맵 기반
- **시간 필터링**: O(N) - N은 이벤트 수
- **BM25 검색**: O(N) - N은 이벤트 수

---

## SSOTA 특화 로직 제거 포인트

### 제거 대상

1. **페이지 ID 필터링**:
   - 현재: `pageId` 기반 필터링
   - SDK: 세션 기반 또는 그래프별 관리

2. **PostgreSQL 의존성**:
   - 현재: PostgreSQL `ts_rank` 사용
   - SDK: 순수 JavaScript BM25 구현

3. **이벤트 로그 테이블**:
   - 현재: `eventLogs` 테이블 사용
   - SDK: 추상화된 EventStore 인터페이스

### 유지 대상

1. **이벤트 타입 정의**: 범용 타입
2. **시간 가중치 공식**: 범용 수식
3. **BM25 검색 로직**: 범용 알고리즘

---

## README 섹션 초안

### Work Context (작업 맥락)

> "What happened before this moment?"

Tracks canvas events and provides historical context:

```typescript
const workContext = spatial.work.getContext({
  timeRange: { from: new Date('2024-01-01') },
  eventTypes: ['block.created', 'block.updated'],
  maxEvents: 50,
});

// Result:
// - Recent block operations
// - Who did what and when
// - Session-based activity tracking
```

**Use cases**:
- Understanding the evolution of ideas
- Resuming work after a break
- Collaborative context sharing

**Event Types**:
- `block.created`, `block.updated`, `block.deleted`
- `edge.created`, `edge.deleted`
- `viewport.changed`
- `user.action`
