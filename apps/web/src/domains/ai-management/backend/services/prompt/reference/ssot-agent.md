# SSOTA AI Agent - System Overview

## 1. 쏘타(SSOTA)란?

**SSOTA**는 2차원 캔버스 기반의 Operating System입니다.

### 핵심 개념

#### 1.1 캔버스 (Canvas)
- 2D 무한 캔버스 공간
- 블럭들이 배치되는 작업 공간
- 워크스페이스 내 여러 페이지로 구성

#### 1.2 블럭 앱 (Block App)
- 캔버스 위에 올라가는 독립적인 앱 단위
- 다양한 형태와 데이터/미디어 포맷 지원
  - 텍스트 블럭, 마크다운 블럭
  - 이미지 블럭, 영상 블럭, 유튜브 블럭
  - 코드 블럭 (Python 등)
  - PDF 블럭, Shape 블럭 등

#### 1.3 블럭 속성 (Block Properties)
- **기본 속성**: 각 블럭 타입이 기본으로 가지는 속성 (에디터 패널에서 수정 가능)
- **커스텀 속성**: 노션의 데이터베이스처럼 다양한 데이터 타입으로 정의 가능
  - 사용자가 직접 추가/삭제/수정
  - 동일한 커스텀 속성을 가진 블럭들은 정형성을 가짐 (데이터베이스 개념)
  - 표, 타임라인 등 다양한 보기 형식 지원

#### 1.4 엣지 (Edge)
- 블럭 간의 의미적 연결 관계
- 단순 포함 관계를 넘어 다양한 의미를 표현
- 방향성 및 라벨 지정 가능

#### 1.5 블럭 앱 스페이스 (Block App Space)
- 각 블럭 앱이 제공하는 전용 작업 공간
- 예시:
  - 이미지 블럭: 이미지 에디터, 이미지 탐색/검색 공간
  - 페이지에서 모달 형태로 열림

#### 1.6 블럭 액션 (Block Action)
- 블럭에서 실행할 수 있는 간단한 동작
- 종류:
  - 소프트웨어 함수 (예: 코드 포맷팅, 데이터 변환)
  - AI 기반 액션 (예: 이미지 생성, 이미지 자연어 검색, 코드 리팩토링, 요약)

#### 1.7 블럭의 다중 마운트
- 하나의 블럭은 워크스페이스에 속함
- 동일한 블럭을 여러 페이지에 마운트 가능
- 각 페이지에서 다른 관계(엣지)를 맺을 수 있음

### 쏘타의 목표
> 소프트웨어 간 흩어진 맥락과 데이터, 작업 공간의 분절을 막고, 하나의 소프트웨어에서 다양한 작업을 수행하며 맥락을 유지한다.

---

## 2. AI 에이전트 아키텍처

### 2.1 전체 구조
```
┌─────────────────────────────────────────────────┐
│                   사용자 발화                      │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│          프론트엔드 (Client Side)                 │
│  - 사용자 입력 수집                                │
│  - Client Context 전달                           │
│    (pageId, selectedBlockIds, visibleBlockIds)  │
│  - 툴 실행 (Canvas & Block Actions)              │
└──────────────┬──────────────────────────────────┘
               │ POST /api/agent
               ▼
┌─────────────────────────────────────────────────┐
│            백엔드 (Server Side)                   │
│  1. Context Assembly (컨텍스트 조립)              │
│     - Short-term Memory                         │
│     - Long-term Memory (BM25 검색)              │
│     - Canvas Context                            │
│                                                  │
│  2. System Prompt 생성                           │
│                                                  │
│  3. LLM Reasoning (Vercel AI SDK)               │
│     - 사용자 의도 이해                             │
│     - 툴 선택 및 파라미터 추론                      │
│     - 스트리밍 응답 생성                           │
└──────────────┬──────────────────────────────────┘
               │ Tool Call (schema only)
               ▼
┌─────────────────────────────────────────────────┐
│          프론트엔드 (onToolCall)                  │
│  - Canvas/Block Hooks를 통한 실제 실행            │
│  - 실행 결과를 LLM에 피드백 (addToolResult)       │
└─────────────────────────────────────────────────┘
```

### 2.2 책임 분리
- **Server**: LLM reasoning, 컨텍스트 조립, 시스템 프롬프트 생성
- **Client**: 툴 실행, 실시간 Canvas 상태 접근, 사용자 피드백

---

## 3. 컨텍스트 시스템

AI 에이전트는 3가지 컨텍스트를 병렬로 수집하여 사용자 발화를 이해합니다.

### 3.1 Short-Term Memory (단기 기억)
- **목적**: 최근 사용자 활동 파악
- **구현**: 페이지별 최근 N개 이벤트 (기본 20개)
- **내용**: 
  - 블럭 생성/삭제/수정 이벤트
  - 타임스탬프, 이벤트 타입, 내용
- **특징**: 시간순 정렬, 최대 200자 제한

### 3.2 Long-Term Memory (장기 기억)
- **목적**: 유사한 과거 작업 복원
- **구현**: BM25 검색 (Hybrid 모드: 시간 가중치 적용)
- **파라미터**:
  - topK: 10 (상위 10개 결과)
  - timeWeightFactor: 7 (최근성 가중치)
- **내용**:
  - 사용자 발화와 의미적으로 유사한 과거 이벤트
  - "N일 전", "N시간 전" 형태의 시간 정보

### 3.3 Canvas Context (캔버스 컨텍스트)
3가지 유형의 블럭 정보를 제공합니다:

#### a) Selected Blocks (선택된 블럭)
- 사용자가 현재 선택한 블럭들
- 블럭 ID, 타입, 제목, 속성, 위치, 크기 포함
- **우선순위**: 가장 높음

#### b) Nearby Blocks (주변 블럭)
- 화면에 보이는 블럭들 (선택된 블럭 제외)
- 공간적 맥락 제공

#### c) Semantic Blocks (의미적 블럭)
- 의미적으로 관련된 블럭 (MVP에서는 스킵)
- 향후: 벡터 검색 또는 그래프 탐색으로 구현 예정

### 3.4 컨텍스트 조립 성능
- Promise.all로 병렬 처리
- 목표: 2초 이내
- 부분 실패 허용 (최소 컨텍스트로 Agent 실행)

---

## 4. AI 에이전트 툴 (Tools)

AI 에이전트가 사용할 수 있는 툴 목록입니다.

### 4.1 블럭 생성: `addBlock`
**목적**: 캔버스에 새로운 블럭 생성 및 배치

**파라미터**:
```typescript
{
  blockType: 'markdown' | 'text' | 'shape' | 'image' | 'youtube' | 'pdf' | 'python',
  content?: any,  // 초기 콘텐츠
  position: { x: number, y: number }  // 캔버스 좌표
}
```

**실행 흐름**:
1. 프론트엔드 `blockLifecycle.createAndMountBlock()` 호출
2. 블럭 생성 + 페이지에 마운트
3. 성공 메시지 반환

---

### 4.2 블럭 삭제: `deleteBlock`
**목적**: 블럭을 소프트 삭제

**파라미터**:
```typescript
{
  blockId: UUID
}
```

**실행 흐름**:
1. `blockLifecycle.softDeleteBlockMounts()` 호출
2. deleted_at 타임스탬프 설정
3. 캔버스에서 제거

---

### 4.3 속성 업데이트: `updateProperty`
**목적**: 블럭의 속성 값 변경

**파라미터**:
```typescript
{
  blockId: UUID,
  propertyPath: string,  // 예: "title", "customProps.status"
  value: any
}
```

**실행 흐름**:
1. React Flow에서 노드 조회
2. `blockPropertyUpdate.updateProperty()` 호출
3. 속성 값 업데이트

---

### 4.4 블럭 연결: `connectBlocks`
**목적**: 두 블럭을 엣지로 연결

**파라미터**:
```typescript
{
  sourceBlockId: UUID,
  targetBlockId: UUID,
  edgeType?: string,  // 엣지 형태 (기본: 'default')
  label?: string      // 엣지 라벨
}
```

**실행 흐름**:
1. `edgeManagement.createEdge()` 호출
2. 엣지 생성 및 캔버스에 렌더링

---

### 4.5 블럭 액션 실행: `executeBlockAction`
**목적**: 블럭의 특정 액션 실행 (AI 기반 액션 포함)

**파라미터**:
```typescript
{
  blockId: UUID,
  action: string,  // 예: "refactor", "summarize", "generateImage"
  params?: Record<string, any>  // 액션별 추가 파라미터
}
```

**실행 흐름**:
1. `blockToolExecution.executeTool()` 호출
2. 블럭 타입에 맞는 액션 실행
3. 결과 반환

**예시**:
- 코드 블럭: "refactor", "addComments"
- 이미지 블럭: "generateImage", "searchSimilar"

---

### 4.6 키워드 검색: `searchByKeyword`
**목적**: 캔버스에서 키워드로 블럭 검색

**파라미터**:
```typescript
{
  keyword: string,
  blockTypes?: string[]  // 선택적 타입 필터
}
```

**실행 흐름**:
1. React Flow `getNodes()`로 전체 블럭 조회
2. title, properties, content에서 키워드 매칭
3. 매칭된 블럭 목록 반환

---

### 4.7 Hop 검색: `searchByHop` (구현 예정)
**목적**: 블럭에서 N-hop 떨어진 블럭 탐색

**파라미터**:
```typescript
{
  startBlockId: UUID,
  hops: number,  // 탐색 깊이
  direction?: 'in' | 'out' | 'both'
}
```

**현재 상태**: Mock 구현

---

## 5. 현재 구현 상태

### ✅ 완료된 기능
- [x] Context Assembly Service (3가지 컨텍스트 병렬 조립)
- [x] Memory Search Service (BM25 검색)
- [x] 클라이언트 측 툴 실행 (addBlock, deleteBlock, updateProperty, connectBlocks, executeBlockAction, searchByKeyword)
- [x] Vercel AI SDK 통합 (streamText)
- [x] 시스템 프롬프트 자동 생성
- [x] 한국어 응답 지원

### 🚧 구현 중
- [ ] Event Log 저장 (툴 실행 기록)
- [ ] Semantic Blocks 조립 (벡터 검색)
- [ ] searchByHop 툴
- [ ] 블럭 크기/위치 변경 툴
- [ ] 블럭 복제 툴

### 🎯 향후 계획
- [ ] 커스텀 속성 추가/삭제/수정 툴
- [ ] 커스텀 블럭 정의 툴
- [ ] 블럭 인스턴스화 툴
- [ ] 멀티턴 대화 기억
- [ ] 툴 실행 재시도 로직 강화
- [ ] 권한 검증 (사용자별 액세스 제어)

---

## 6. AI 에이전트 동작 원리

### 6.1 기본 흐름
```
1. 사용자가 자연어 발화 입력
   예: "이 블럭을 마크다운으로 바꿔줘"

2. 프론트엔드가 Client Context 수집
   - pageId, selectedBlockIds, visibleBlockIds

3. 백엔드가 Server Context 조립
   - Short-term Memory: 최근 20개 이벤트
   - Long-term Memory: BM25 검색 결과
   - Canvas Context: 선택/주변 블럭 정보

4. System Prompt 생성
   - 에이전트 역할 정의
   - 전체 컨텍스트 주입
   - 사용 가능한 툴 안내

5. LLM Reasoning
   - 사용자 의도 이해
   - 필요한 툴 선택
   - 파라미터 추론

6. 툴 실행 (클라이언트)
   - 선택된 블럭 조회
   - updateProperty 호출
   - 결과 피드백

7. 최종 응답
   - "속성을 마크다운으로 변경했습니다."
```

### 6.2 에러 처리
- 툴 실행 실패 시: `addToolResult`에 에러 전달 → LLM이 재시도 또는 대안 제시
- 컨텍스트 조립 실패 시: 빈 컨텍스트로 진행 (부분 실패 허용)
- 인증 실패 시: 401 응답

### 6.3 성능 최적화
- 컨텍스트 조립: Promise.all 병렬 처리
- 이벤트 로그: 비동기 저장 (블로킹 없음)
- 스트리밍 응답: 사용자 대기 시간 단축

---

## 7. 사용 예시

### 예시 1: 블럭 생성
**사용자**: "여기에 할 일 목록을 만들어줘"
**에이전트**:
1. 선택된 블럭 없음 확인
2. visible 블럭 중앙 위치 계산
3. `addBlock` 호출 (blockType: 'markdown', content: '# 할 일 목록')
4. "마크다운 블럭을 생성했습니다."

### 예시 2: 블럭 연결
**사용자**: "이 두 블럭을 연결해줘"
**에이전트**:
1. 선택된 블럭 2개 확인
2. `connectBlocks` 호출 (source: 블럭1, target: 블럭2)
3. "블럭을 연결했습니다."

### 예시 3: 검색 후 작업
**사용자**: "코드 블럭을 모두 찾아서 정리해줘"
**에이전트**:
1. `searchByKeyword` 호출 (keyword: 'code', blockTypes: ['python'])
2. 검색 결과 3개 확인
3. 각 블럭에 `updateProperty` 호출 (정렬, 그룹화)
4. "3개의 코드 블럭을 정리했습니다."

---

## 8. 설계 철학

### 8.1 자율성 (Autonomy)
- 사용자 확인 없이 툴 실행 (critical한 경우 제외)
- 여러 툴을 연속으로 호출하여 복잡한 작업 완료

### 8.2 맥락 유지 (Context Preservation)
- 3가지 컨텍스트로 사용자의 작업 흐름 이해
- 과거 작업 기억을 통한 일관성 있는 응답

### 8.3 투명성 (Transparency)
- 툴 실행 과정을 사용자에게 스트리밍
- 실행 결과 명확히 전달

### 8.4 확장성 (Extensibility)
- 새로운 툴 추가 용이 (schema + execute)
- 블럭 타입별 커스텀 액션 지원

---

## 9. 다음 단계 (Prompt Engineering)

이 문서를 기반으로 다음을 작성할 예정입니다:
1. **System Prompt 최적화**: 더 명확한 역할 정의, 예시 추가
2. **Few-shot Examples**: 대표적인 사용 사례 제공
3. **Tool Usage Guidelines**: 각 툴의 사용 시기와 조합 전략
4. **Error Recovery Strategies**: 실패 시나리오별 대응 방법

