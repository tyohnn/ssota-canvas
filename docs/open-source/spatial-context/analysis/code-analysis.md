# 코드 분석 결과

## 개요

SSOTA 코드베이스에서 Spatial Context Engineering 기능을 분석한 결과입니다. 4가지 컨텍스트 기법의 구현 위치와 핵심 로직을 정리했습니다.

**분석 일자**: 2026-01-20  
**분석 범위**: AI Management Domain, Block Management Domain

---

## 1. Focus Context (초점 맥락)

### 구현 위치

#### 핵심 파일
- **`apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts`**
  - `assembleCanvasContext()`: Canvas Context 조립 메인 메서드
  - `getConnectedBlocks()`: 엣지 기반 1-hop 연결 블록 탐색
  - `getBlocksByIds()`: 블록 정보 조회

- **`apps/web/src/domains/ai-management/frontend/components/ai-agent-runner/core/use-ai-agent.ts`**
  - `visibleBlockIds` 계산 로직: 거리 기반 근접 블록 필터링 (라인 113-136)
  - 유클리드 거리 계산: `Math.sqrt(dx * dx + dy * dy)`
  - 반경 제한: `NEARBY_DISTANCE_THRESHOLD = 1000px`
  - 최대 개수: `MAX_NEARBY_BLOCKS = 10`

- **`apps/web/src/domains/ai-management/backend/services/interfaces/context-assembly.service.interface.ts`**
  - `CanvasContext` 인터페이스: 선택/주변/연결/의미적 블록 구조 정의
  - `BlockInfo` 인터페이스: 블록 기본 정보 구조

### 핵심 로직 분석

#### 1. 선택 블록 추출
```typescript
// context-assembly.service.ts:146-149
const selectedBlocks = await this.getBlocksByIds(
  pageId,
  selectedBlockIds || []
);
```
- **SSOTA 특화**: `pageId` 기반 페이지별 블록 조회
- **범용 추출 가능**: 블록 ID 목록 → 블록 정보 변환 로직

#### 2. 엣지 기반 연결 블록 탐색
```typescript
// context-assembly.service.ts:187-238
private async getConnectedBlocks(
  pageId: string,
  selectedBlockIds: string[]
): Promise<BlockInfo[]>
```
- **알고리즘**: 1-hop BFS (depth=1)
- **구현 방식**: 
  1. 선택된 블록과 연결된 edges 조회 (source 또는 target)
  2. 연결된 블록 ID 수집 (선택된 블록 제외)
  3. 블록 정보 조회
- **SSOTA 특화**: 
  - `pageId` 필터링
  - `deleted_at` NULL 체크
  - `blockMounts` 테이블 조인
- **범용 추출 가능**: 그래프 탐색 알고리즘 (BFS, depth 제한)

#### 3. 거리 기반 근접 블록 탐색
```typescript
// use-ai-agent.ts:116-136
const NEARBY_DISTANCE_THRESHOLD = 1000;
const MAX_NEARBY_BLOCKS = 10;

const nodesWithDistance = allNodes
  .map(node => {
    const dx = node.position.x - referenceCenterX;
    const dy = node.position.y - referenceCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { node, distance };
  })
  .filter(item => item.distance <= NEARBY_DISTANCE_THRESHOLD)
  .sort((a, b) => a.distance - b.distance)
  .slice(0, MAX_NEARBY_BLOCKS);
```
- **알고리즘**: 유클리드 거리 계산 + 필터링 + 정렬
- **SSOTA 특화**: 
  - Viewport 기반 기준점 계산
  - Zoom 레벨 체크 (`viewport.zoom >= 0.75`)
- **범용 추출 가능**: 거리 계산 및 필터링 로직

### SSOTA 특화 vs 범용 로직 분리 포인트

| 항목 | SSOTA 특화 | 범용 추출 가능 |
|------|-----------|--------------|
| 페이지 ID 기반 필터링 | ✅ | ❌ |
| 블록 마운트 테이블 조인 | ✅ | ❌ |
| 삭제된 블록 제외 (`deleted_at`) | ✅ | ❌ |
| 그래프 탐색 알고리즘 (BFS) | ❌ | ✅ |
| 거리 계산 (유클리드) | ❌ | ✅ |
| 반경 필터링 | ❌ | ✅ |

---

## 2. Semantic Context (의미 맥락)

### 구현 위치

#### 핵심 파일
- **`apps/web/src/domains/ai-management/backend/services/tool-execution.service.ts`**
  - `searchBySemantic()`: 벡터 검색 툴 (라인 86-106)
  - **상태**: TODO - 아직 구현되지 않음

- **`apps/web/src/domains/ai-management/backend/repositories/implementations/drizzle-event-log.repository.ts`**
  - `searchByBM25()`: BM25 전문 검색 구현 (라인 73-111)
  - PostgreSQL `ts_rank` 사용
  - 시간 가중치 적용: `exp(-extract(epoch from (now() - timestamp)) / (timeWeightFactor * 86400))`

- **`docs/event-domain-design/discussion/ai-automation/ai-agent-tools-technical-discussion.md`**
  - IntentBlockTypeMatch vs SemanticSim 개념 정의
  - 벡터 검색 설계 계획

### 핵심 로직 분석

#### 1. BM25 검색 구현
```typescript
// drizzle-event-log.repository.ts:73-111
async searchByBM25(
  queryText: string,
  pageId: string,
  topK: number,
  timeWeightFactor: number = 7
): Promise<EventLog[]>
```
- **알고리즘**: PostgreSQL `ts_rank` 기반 BM25
- **시간 가중치**: `exp(-t/τ)` 형태, `τ = timeWeightFactor * 86400` (초 단위)
- **최종 점수**: `ts_rank * time_weight`
- **SSOTA 특화**: 
  - PostgreSQL 특화 SQL 함수 사용
  - `pageId` 필터링
  - `search_content` 컬럼 사용
- **범용 추출 가능**: 
  - BM25 알고리즘 로직
  - 시간 가중치 계산 공식

#### 2. 벡터 검색 (TODO)
```typescript
// tool-execution.service.ts:86-106
async searchBySemantic(...): Promise<ToolExecutionResult> {
  // TODO: Implement semantic search with embeddings
  // 1. 쿼리를 임베딩으로 변환
  // 2. 벡터 DB에서 유사도 검색
  // 3. topK 개의 블럭 반환
}
```
- **현재 상태**: 미구현
- **설계 계획**: 
  - 임베딩 생성
  - 벡터 DB 검색
  - 유사도 점수 기반 정렬

### SSOTA 특화 vs 범용 로직 분리 포인트

| 항목 | SSOTA 특화 | 범용 추출 가능 |
|------|-----------|--------------|
| PostgreSQL `ts_rank` 사용 | ✅ | ❌ |
| `pageId` 필터링 | ✅ | ❌ |
| `search_content` 컬럼 | ✅ | ❌ |
| BM25 알고리즘 로직 | ❌ | ✅ |
| 시간 가중치 공식 | ❌ | ✅ |
| 벡터 검색 설계 | ❌ | ✅ |

---

## 3. Work Context (작업 맥락)

### 구현 위치

#### 핵심 파일
- **`apps/web/src/domains/ai-management/backend/repositories/implementations/drizzle-event-log.repository.ts`**
  - `searchByBM25()`: BM25 검색 (이벤트 로그 대상)
  - `searchByMetadata()`: 메타데이터 패턴 매칭
  - `searchHybrid()`: 하이브리드 검색

- **`apps/web/src/domains/ai-management/backend/services/memory-search.service.ts`**
  - `searchLongTermMemory()`: Long-Term Memory 검색 메인 메서드
  - `searchByBM25()`, `searchByMetadata()`, `searchHybrid()` 래퍼

- **`apps/web/src/domains/ai-management/backend/services/context-assembly.service.ts`**
  - `assembleShortTermMemory()`: Short-Term Memory 조립 (라인 78-100)
  - `assembleLongTermMemory()`: Long-Term Memory 조립 (라인 106-133)

- **`docs/event-domain-design/discussion/ai-automation/basic-ai-context-engineering.md`**
  - Long-Term Memory 설계 문서
  - 시간 가중치 설명

### 핵심 로직 분석

#### 1. Short-Term Memory
```typescript
// context-assembly.service.ts:78-100
async assembleShortTermMemory(
  pageId: string,
  limit: number = 20
): Promise<EventLogSummary[]>
```
- **알고리즘**: 시간순 정렬, 최근 N개 조회
- **SSOTA 특화**: 
  - `pageId` 기반 필터링
  - `EventLog` 엔티티 사용
- **범용 추출 가능**: 시간순 정렬 로직

#### 2. Long-Term Memory
```typescript
// context-assembly.service.ts:106-133
async assembleLongTermMemory(
  queryText: string,
  pageId: string,
  topK: number = 10,
  timeWeightFactor: number = 7
): Promise<EventLogSummary[]>
```
- **알고리즘**: BM25 검색 + 시간 가중치
- **구현**: `memorySearchService.searchLongTermMemory()` 호출
- **SSOTA 특화**: 
  - `pageId` 필터링
  - `EventLog` 엔티티 사용
- **범용 추출 가능**: 
  - BM25 검색 로직
  - 시간 가중치 계산

#### 3. 이벤트 타입
- **정의 위치**: `EventLog` 엔티티
- **타입 예시**: 
  - `block.created`
  - `block.updated`
  - `block.deleted`
  - `tool.executed`
  - 등

### SSOTA 특화 vs 범용 로직 분리 포인트

| 항목 | SSOTA 특화 | 범용 추출 가능 |
|------|-----------|--------------|
| `pageId` 기반 필터링 | ✅ | ❌ |
| `EventLog` 엔티티 | ✅ | ❌ |
| PostgreSQL 기반 검색 | ✅ | ❌ |
| 이벤트 타입 정의 | ❌ | ✅ |
| 시간순 정렬 | ❌ | ✅ |
| BM25 검색 로직 | ❌ | ✅ |
| 시간 가중치 계산 | ❌ | ✅ |

---

## 4. Action Context (액션 맥락)

### 구현 위치

#### 핵심 파일
- **`apps/web/src/domains/block-management/backend/repositories/implementations/drizzle-tool.repository.ts`**
  - `BLOCK_ACTIONS_REGISTRY`: 블록 타입별 액션 레지스트리
  - `BlockActionDefinition` 인터페이스
  - `BlockTypeRegistry` 인터페이스
  - `getBlockActions()`: 블록 타입의 액션 목록 조회
  - `searchBlockActions()`: 액션 검색

- **`apps/web/src/domains/block-management/frontend/hooks/use-block-action-executor.ts`**
  - `executeAction()`: 액션 실행 메인 로직
  - 동적 import 기반 액션 모듈 로드
  - JSON Schema 기반 파라미터 검증

- **`apps/web/src/domains/ai-management/backend/services/prompt/tools.ts`**
  - LLM Tool 정의 생성

### 핵심 로직 분석

#### 1. 액션 레지스트리 구조
```typescript
// drizzle-tool.repository.ts:11-27
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
```
- **JSON Schema 기반**: 파라미터 스키마 정의
- **범용 추출 가능**: 액션 정의 구조

#### 2. 액션 실행 흐름
```typescript
// use-block-action-executor.ts:67-178
async executeAction(params: {
  blockId: string;
  action: string;
  blockType: string;
  params?: Record<string, any>;
}): Promise<{ success: boolean; message: string }>
```
- **단계**:
  1. 액션 정의 조회 (`BLOCK_ACTIONS_REGISTRY`)
  2. JSON Schema 검증
  3. 동적 import로 액션 모듈 로드
  4. 액션 실행
- **SSOTA 특화**: 
  - 동적 import 경로 (`@/domains/block-management/...`)
  - React Hook 기반 실행
- **범용 추출 가능**: 
  - 액션 레지스트리 패턴
  - JSON Schema 검증
  - 액션 실행 인터페이스

#### 3. LLM Tool 변환
- **위치**: `prompt/tools.ts`
- **형식**: OpenAI Function Calling
- **범용 추출 가능**: Tool 정의 생성 로직

### SSOTA 특화 vs 범용 로직 분리 포인트

| 항목 | SSOTA 특화 | 범용 추출 가능 |
|------|-----------|--------------|
| 동적 import 경로 | ✅ | ❌ |
| React Hook 기반 | ✅ | ❌ |
| 블록 타입별 액션 정의 | ❌ | ✅ |
| JSON Schema 구조 | ❌ | ✅ |
| 액션 실행 인터페이스 | ❌ | ✅ |
| LLM Tool 변환 로직 | ❌ | ✅ |

---

## 외부 의존성 분석

### 현재 사용 중인 의존성

1. **데이터베이스**
   - PostgreSQL (BM25 검색용 `ts_rank`)
   - Drizzle ORM

2. **임베딩 API** (계획 중)
   - 아직 구현되지 않음
   - 예상: OpenAI, Voyage AI 등

3. **검색 라이브러리**
   - PostgreSQL 내장 (BM25)
   - 벡터 검색 라이브러리 필요 (향후)

### SDK 추출 시 필요한 의존성

1. **필수**
   - 없음 (Core는 순수 TypeScript)

2. **옵셔널**
   - 임베딩 제공자 (플러그인 패턴)
   - 벡터 검색 라이브러리 (인메모리 또는 외부)
   - BM25 라이브러리 (PostgreSQL 대체용)

---

## 추상화 설계 포인트

### 1. 데이터 모델 추상화
- **현재**: SSOTA 특화 테이블 구조 (`blocks`, `blockMounts`, `edges`, `eventLogs`)
- **추상화**: 범용 그래프 데이터 구조 (`Node`, `Edge`, `Event`)

### 2. 저장소 추상화
- **현재**: PostgreSQL 직접 쿼리
- **추상화**: Repository 패턴, 플러그인 가능한 저장소

### 3. 검색 알고리즘 추상화
- **현재**: PostgreSQL `ts_rank` 의존
- **추상화**: BM25 알고리즘 인터페이스, 다양한 구현체 지원

### 4. 임베딩 제공자 추상화
- **현재**: 미구현
- **추상화**: `EmbeddingProvider` 플러그인 인터페이스

---

## 다음 단계

1. **인터페이스 설계**: 각 컨텍스트 모듈의 public API 정의
2. **패키지 구조 설계**: 모노레포 구조 및 모듈 분리
3. **의존성 제거**: SSOTA 특화 로직 제거, 범용 인터페이스로 대체
