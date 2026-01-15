# Canvasdown

**Canvasdown**는 텍스트 기반 DSL로 노드-엣지 다이어그램을 정의하고, 이를 React Flow 등의 렌더러로 시각화하는 라이브러리입니다.

```
DSL 텍스트 → Parser → Graph Data → Layout → Renderer (React Flow, etc.)
```

## 📋 목차

1. [개요](#개요)
2. [필요성](#필요성)
3. [철학 및 설계 원칙](#철학-및-설계-원칙)
4. [아키텍처](#아키텍처)
5. [DSL 문법](#dsl-문법)
6. [관련 라이브러리 조사](#관련-라이브러리-조사)
7. [개발 단계](#개발-단계)
8. [기술 스택](#기술-스택)

---

## 1. 개요

Canvasdown는 **"텍스트로 정의하고, 어디서든 렌더링한다"**는 철학을 가진 다이어그램 DSL 라이브러리입니다.

### 핵심 특징

- ✅ **Mermaid 스타일 DSL** - 텍스트 기반, AI 친화적
- ✅ **동적 타입 시스템** - 블록/엣지 타입을 런타임에 등록
- ✅ **프레임워크 독립적 Core** - React Flow뿐만 아니라 다양한 렌더러 지원 가능
- ✅ **자동 레이아웃** - dagre/elkjs 기반 위치 계산
- ✅ **기존 컴포넌트 활용** - 사용자의 노드 컴포넌트를 그대로 사용

---

## 2. 필요성

### 2.1 AI 시대의 다이어그램

- **AI가 다이어그램을 생성**하는 시대가 왔습니다
- AI는 텍스트 출력에 최적화되어 있어 → **텍스트 기반 DSL**이 가장 자연스러운 인터페이스
- Mermaid가 이 영역을 선점했지만, **커스텀 노드 시스템**과의 통합은 불가능

### 2.2 기존 솔루션의 한계

| 솔루션 | 한계 |
|--------|------|
| **Mermaid** | 고정된 노드 타입, React Flow 통합 불가, 커스텀 컴포넌트 불가 |
| **React Flow** | 프로그래밍 방식 정의, AI 생성에 부적합, 텍스트 기반 정의 불가 |
| **직접 구현** | 매번 파서/레이아웃 재구현 필요, 표준화 부족 |

### 2.3 Canvasdown의 해결책

- **Mermaid 스타일 DSL** + **커스텀 노드 시스템** + **React Flow 통합**
- 블록/엣지 타입을 **동적으로 등록** → 어떤 프로젝트에서든 사용 가능
- Core는 **프레임워크 독립적** → 다양한 렌더러 지원 가능

---

## 3. 철학 및 설계 원칙

### 3.1 핵심 철학

> **"텍스트로 정의하고, 어디서든 렌더링한다"**

1. **DSL은 입력 인터페이스일 뿐** - 새로운 렌더링 시스템이 아님
2. **기존 컴포넌트 시스템 활용** - 사용자의 노드 컴포넌트를 그대로 사용
3. **동적 타입 시스템** - 블록/엣지 타입을 런타임에 등록
4. **Mermaid 문법 스타일 차용** - 하지만 1:1 대응은 아님, 우리만의 문법

### 3.2 설계 원칙

#### 1. Core는 프레임워크 독립적

- 순수 TypeScript, React 의존성 없음
- `{ nodes, edges }` 범용 그래프 데이터 반환
- 어떤 렌더러와도 통합 가능

#### 2. 어댑터 패턴

- React Flow, D3, Canvas 등 다양한 렌더러 지원 가능
- 각 어댑터가 Core 출력을 해당 렌더러 형식으로 변환
- 양방향 동기화(Canvas → DSL)는 어댑터별로 구현

#### 3. 레이아웃은 Core 책임

- dagre/elkjs 기반 자동 레이아웃
- 방향 힌트(LR, TB, RL, BT) 지원
- 렌더러는 위치 계산된 데이터를 받아 그리기만

#### 4. 타입 안전성

- TypeScript 기반, 제네릭 활용
- 등록된 타입에 대한 컴파일타임 검증
- 런타임 타입 검증도 지원

---

## 4. 아키텍처

### 4.1 패키지 구조

```
packages/
└── canvasdown/
    ├── core/           # @canvasdown/core (나중에 npm 배포)
    │   ├── parser/     # DSL 텍스트 → AST
    │   ├── registry/   # 블록/엣지 타입 등록
    │   ├── builder/    # AST → Graph Data
    │   └── layout/     # dagre/elkjs 레이아웃
    │
    └── react-flow/     # @canvasdown/react-flow (나중에 npm 배포)
        ├── adapter/    # Core 출력 → React Flow 노드/엣지
        └── hooks/      # useCanvasdown, useCanvasdownSync 등
```

### 4.2 Core 모듈 인터페이스

```typescript
// @canvasdown/core

// 1. 타입 레지스트리
interface BlockTypeDefinition<TProps = Record<string, unknown>> {
  name: string;
  defaultProperties: TProps;
  defaultSize: { width: number; height: number };
  validate?: (props: TProps) => boolean;
}

interface EdgeTypeDefinition<TData = Record<string, unknown>> {
  name: string;
  defaultShape: 'default' | 'straight' | 'step' | 'smoothstep' | 'simplebezier';
  defaultStyle?: { stroke: string; strokeWidth: number };
  defaultData?: TData;
}

// 2. 파싱 결과 (AST)
interface CanvasdownAST {
  direction: 'LR' | 'RL' | 'TB' | 'BT';
  nodes: ASTNode[];
  edges: ASTEdge[];
}

interface ASTNode {
  id: string;
  type: string;  // 등록된 블록 타입 이름
  label: string;
  properties: Record<string, unknown>;
}

interface ASTEdge {
  source: string;
  target: string;
  label?: string;
  edgeType?: string;  // 등록된 엣지 타입 이름
  edgeData?: Record<string, unknown>;
}

// 3. 최종 출력 (레이아웃 적용됨)
interface GraphNode<TNodeData = Record<string, unknown>> {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: TNodeData;
}

interface GraphEdge<TEdgeData = Record<string, unknown>> {
  id: string;
  source: string;
  target: string;
  label?: string;
  shape?: string;
  style?: { stroke: string; strokeWidth: number };
  data: TEdgeData;
}

interface CanvasdownOutput<TNodeData, TEdgeData> {
  nodes: GraphNode<TNodeData>[];
  edges: GraphEdge<TEdgeData>[];
  metadata: {
    direction: string;
    layoutEngine: 'dagre' | 'elkjs';
  };
}
```

### 4.3 사용 예시

```typescript
// 1. 타입 등록
import { CanvasdownCore } from '@canvasdown/core';

const core = new CanvasdownCore();

core.registerBlockType('shape', {
  name: 'shape',
  defaultProperties: { shapeType: 'rectangle', color: 'blue' },
  defaultSize: { width: 200, height: 100 },
});

core.registerBlockType('text', {
  name: 'text',
  defaultProperties: { content: '' },
  defaultSize: { width: 300, height: 150 },
});

core.registerEdgeType('flow', {
  name: 'flow',
  defaultShape: 'default',
  defaultStyle: { stroke: '#333', strokeWidth: 2 },
});

// 2. DSL 파싱 및 렌더링
const dsl = `
canvas LR

@shape start "Start" {
  shapeType: ellipse
  color: green
}

@text process "Process Data" {
  color: blue
}

start -> process : flow
`;

const result = core.parseAndLayout(dsl);
// result.nodes, result.edges 반환
```

---

## 5. DSL 문법

### 5.1 기본 문법 (v1)

```
canvas LR                           // 레이아웃 방향 (LR, RL, TB, BT)

// 블록 정의
@blockType ID "Title" {             // @타입 아이디 "제목"
  property1: value1                 // 속성들
  property2: value2
}

// 엣지 정의
sourceID -> targetID                // 기본 연결
sourceID -> targetID : "label"      // 라벨 포함
sourceID -> targetID : edgeType     // 엣지 타입 지정
sourceID -> targetID : edgeType {   // 엣지 타입 + 속성
  property: value
}
```

### 5.2 예시

```
canvas LR

@shape start "Start" {
  shapeType: ellipse
  color: green
}

@text process "Process Data" {
  color: blue
}

@shape end "End" {
  shapeType: ellipse
  color: red
}

start -> process : "begins"
process -> end : flow
```

### 5.3 문법 특징

- **@prefix로 블록 타입 명시** - 등록된 타입만 사용 가능
- **속성은 JSON-like** - 하지만 JSON은 아님, 더 간단한 문법
- **엣지 라벨/타입** - 의미적 관계 표현 가능
- **방향 힌트** - 레이아웃 엔진에 전달

---

## 6. 관련 라이브러리 조사

### 6.1 유사한 접근의 라이브러리

#### Mermaid-to-ReactFlow 변환기들

1. **mermaid-reactflow-editor** (albingcj)
   - Mermaid를 React Flow로 변환
   - **차이점**: Mermaid 문법 그대로 사용, 커스텀 타입 불가

2. **mermaid-to-reactflow-converter**
   - Mermaid → React Flow 실시간 변환
   - **차이점**: Mermaid 고정, 동적 타입 시스템 없음

#### DSL 파서 라이브러리들

3. **RenderMaid** (@rendermaid/core)
   - TypeScript로 Mermaid 파싱/렌더링
   - **차이점**: Mermaid 전용, 커스텀 DSL 불가

4. **ts-graphviz**
   - Graphviz DOT 언어를 TypeScript로
   - **차이점**: DOT 문법, React Flow 통합 없음

5. **PlantUML Parser**
   - PlantUML 파싱
   - **차이점**: PlantUML 전용, React Flow 통합 없음

### 6.2 Canvasdown의 차별점

| 특징 | Canvasdown | 기존 라이브러리들 |
|------|-----------|-----------------|
| **커스텀 타입** | ✅ 동적 등록 | ❌ 고정 타입 |
| **프레임워크 독립** | ✅ Core 분리 | ❌ 특정 프레임워크 의존 |
| **기존 컴포넌트 활용** | ✅ 그대로 사용 | ❌ 새로 구현 필요 |
| **React Flow 통합** | ✅ 어댑터 제공 | ⚠️ 일부만 지원 |
| **양방향 동기화** | ✅ 어댑터별 구현 | ❌ 대부분 단방향 |

### 6.3 React Flow 공식 움직임

**React Flow(@xyflow/react) 공식적으로는 DSL 파서를 계획하지 않습니다.**

조사 결과 (2026년 1월 기준):
- ❌ 공식 로드맵에 DSL/텍스트 파서 관련 계획 없음
- ❌ GitHub 이슈/디스커션에서 DSL 관련 요청/논의 없음
- ❌ React Flow v12 업데이트에도 DSL 기능 포함 안 됨
- ✅ React Flow UI 컴포넌트 라이브러리는 제공 (하지만 DSL 파서는 아님)

**React Flow의 방향성:**
- 프로그래밍 방식 정의에 집중 (코드로 노드/엣지 정의)
- 커스텀 컴포넌트 시스템 강화 (BaseNode, React Flow UI)
- 프레임워크 지원 확대 (Svelte Flow 등)

**결론:** React Flow는 **"프레임워크"**로서의 역할에 집중하고, DSL 파서 같은 **"도구"**는 커뮤니티나 서드파티에 맡기는 전략인 것으로 보입니다.

### 6.4 Canvasdown의 차별점 및 기회

**비슷한 철학을 가진 라이브러리는 없습니다.**

- Mermaid → React Flow 변환기는 있지만, **Mermaid 문법 고정**
- DSL 파서는 많지만, **커스텀 타입 시스템 + React Flow 통합**은 없음
- React Flow 공식팀도 이 영역을 다루지 않음
- Canvasdown는 **"Mermaid 스타일의 커스텀 DSL + 동적 타입 + 프레임워크 독립"**이라는 독특한 조합

**시장 기회:**
- React Flow 커뮤니티에서 DSL 요청이 있다면 Canvasdown가 그 답이 될 수 있음
- React Flow 공식 팀이 직접 개발하지 않는 영역이므로, 서드파티 라이브러리로 성장 가능
- markdown, streamdown, milkdown과 같은 네이밍 패턴으로 친숙함

---

## 7. 개발 단계

### Phase 1: 내부 패키지 (MVP) 🎯 현재 단계

**목표:** SSOTA 캔버스에서 DSL → 블록 렌더링 동작

#### 1.1 Core 기본 구조
- [ ] Chevrotain 기반 DSL 파서 구현
- [ ] 블록/엣지 타입 레지스트리
- [ ] AST → Graph Data 빌더
- [ ] dagre 레이아웃 통합

#### 1.2 React Flow 어댑터
- [ ] Core 출력 → React Flow 변환
- [ ] `useCanvasdown(dsl, options)` 훅
- [ ] 기본 에러 핸들링

#### 1.3 SSOTA 통합
- [ ] 기존 블록 타입들 등록 (text, shape, markdown, image 등)
- [ ] AI 에이전트가 DSL 생성 → 캔버스 렌더링
- [ ] POC 완성

**산출물:**
- `packages/canvasdown/core`
- `packages/canvasdown/react-flow`
- SSOTA 캔버스에서 동작하는 POC

### Phase 2: 기능 확장

#### 2.1 파서 고도화
- [ ] Chevrotain 에러 메시지 개선 (라인 번호, 컬럼)
- [ ] 주석 지원 (`// comment`)
- [ ] 멀티라인 속성 지원
- [ ] 문법 확장 (그룹, 서브그래프 등)

#### 2.2 레이아웃 옵션
- [ ] elkjs 지원 추가
- [ ] 노드 간격, 랭크 간격 커스터마이징
- [ ] 레이아웃 알고리즘 선택 가능

#### 2.3 엣지 타입 확장
- [ ] 화살표 스타일 (arrowhead)
- [ ] 점선, 굵기 등 스타일 옵션
- [ ] 엣지 라벨 위치 커스터마이징

#### 2.4 역변환 (Canvas → DSL)
- [ ] React Flow 어댑터에서 지원
- [ ] 양방향 동기화 가능
- [ ] 편집 시 DSL 자동 업데이트

### Phase 3: 오픈소스 배포

#### 3.1 API 안정화
- [ ] 내부 사용으로 충분히 검증
- [ ] Breaking change 최소화
- [ ] 타입 정의 완성

#### 3.2 문서화
- [ ] README.md (빠른 시작)
- [ ] API Reference (TypeDoc)
- [ ] 예제 모음 (Storybook 또는 예제 앱)
- [ ] 마이그레이션 가이드

#### 3.3 배포 준비
- [ ] GitHub 레포 분리 (`ssota/canvasdown`)
- [ ] npm 배포 (`@canvasdown/core`, `@canvasdown/react-flow`)
- [ ] CI/CD 설정
- [ ] 라이선스 (MIT)

#### 3.4 홍보
- [ ] 블로그 포스트
- [ ] 트위터/X 공유
- [ ] React Flow 커뮤니티 공유

---

## 8. 기술 스택

### Core
- **TypeScript** (순수 TS, 런타임 의존성 최소화)
- **Chevrotain** (DSL 파서 - LL(k) 파서 생성기)
- **dagre** (기본 레이아웃)
- **elkjs** (고급 레이아웃, Phase 2)

### React Flow 어댑터
- **@xyflow/react** (React Flow)
- **React 18+**

### 개발 도구
- **Vitest** (테스트)
- **tsup** (번들링)
- **TypeDoc** (API 문서)
- **ESLint** (린팅)

---

## 8.1 DSL 파서 라이브러리 옵션

Canvasdown의 DSL 파서 구현을 위해 사용할 수 있는 라이브러리 옵션들입니다.

### 파서 생성기 (Parser Generator)

#### 1. **Chevrotain** ⭐ 선택됨
- **타입**: LL(k) 파서 생성기
- **최신 버전**: 11.0.3 (2024년 초, 약 2년 전)
- **유지보수 상태**: GitHub 레포는 활발히 유지보수 중 (2026년 1월 기준)
- **특징**: 
  - 코드로 문법 정의 (별도 파일 불필요)
  - 높은 성능, 강력한 에러 복구
  - TypeScript 네이티브 지원
  - 런타임 문법 리플렉션
  - ESM 전용 (v11.0.0부터)
- **장점**: 성능 우수, TypeScript 친화적, 강력한 에러 처리, 안정적
- **단점**: 최근 릴리즈가 오래됨 (하지만 안정적이라서 문제 없을 수 있음)
- **주의사항**: v11.0.0부터 ESM 전용이므로 모노레포 설정 확인 필요

#### 2. **Nearley**
- **타입**: Earley 알고리즘 (모든 CFG 지원)
- **특징**:
  - 별도 문법 파일 필요 (`.ne` 파일)
  - 모호한 문법도 처리 가능
  - 브라우저/Node.js 모두 지원
- **장점**: 강력한 문법 표현력, 모호성 처리
- **단점**: 별도 문법 파일 관리 필요
- **사용 시기**: 복잡한 문법 확장 시

#### 3. **Peggy** (구 PEG.js)
- **타입**: PEG (Parsing Expression Grammar)
- **특징**:
  - 간단하고 표현력 있는 문법
  - 좋은 에러 메시지
  - 소스맵 지원
- **장점**: 사용하기 쉬움, 좋은 에러 리포트
- **단점**: LL(k)보다 제한적
- **사용 시기**: 중간 복잡도 문법

#### 4. **Ohm**
- **타입**: PEG 기반
- **특징**:
  - 문법과 의미 분리
  - 온라인 에디터/비주얼라이저 제공
  - 왼쪽 재귀 지원
- **장점**: 개발 도구 우수, 모듈러
- **단점**: 상대적으로 덜 알려짐
- **사용 시기**: 실험적 프로젝트

### 파서 컴비네이터 (Parser Combinator)

#### 5. **Parsimmon**
- **타입**: Monadic LL(∞) 파서 컴비네이터
- **특징**:
  - 함수형 프로그래밍 스타일
  - 작은 조각을 조합해서 파서 구성
  - TypeScript 지원
- **장점**: 유연함, 테스트하기 쉬움
- **단점**: 성능이 상대적으로 낮을 수 있음
- **사용 시기**: 작은 DSL, 프로토타이핑

#### 6. **mini-parse**
- **타입**: 경량 파서 컴비네이터
- **특징**:
  - 매우 작음 (< 4KB 압축)
  - 간단한 API (`or()`, `repeat()`, `seq()`)
  - 런타임 임베딩 가능
- **장점**: 가벼움, 간단함
- **단점**: 복잡한 문법에는 부족
- **사용 시기**: Phase 1 MVP, 매우 간단한 문법

#### 7. **ts-parsec**
- **타입**: TypeScript 파서 컴비네이터
- **특징**:
  - 500줄 미만의 경량 라이브러리
  - 타입 안전성 강조
  - PEG 문법 지원
- **장점**: 가볍고 타입 안전
- **단점**: 기능 제한적
- **사용 시기**: 프로토타이핑

### 언어 엔지니어링 도구

#### 8. **Langium**
- **타입**: 언어 엔지니어링 도구
- **특징**:
  - VS Code 통합
  - 타입 안전 AST 생성
  - LSP 지원
- **장점**: IDE 통합, 전문적
- **단점**: 오버킬일 수 있음 (너무 무거움)
- **사용 시기**: 완전한 언어 도구 필요 시

### 선택: Chevrotain 사용

Canvasdown는 **Phase 1부터 Chevrotain을 사용**합니다.

**이유:**
1. **TypeScript 네이티브 지원** - 타입 안전성과 개발 경험 최적화
2. **높은 성능** - LL(k) 파서로 빠른 파싱
3. **강력한 에러 처리** - 상세한 에러 메시지와 복구 기능
4. **코드로 문법 정의** - 별도 문법 파일 없이 TypeScript 코드로 관리
5. **확장성** - Phase 2에서 문법 확장이 쉬움
6. **프로덕션 준비** - MVP부터 프로덕션 수준의 파서
7. **안정성** - v11.0.3이 2년 전 릴리즈지만, 안정적이고 GitHub은 활발히 유지보수 중

**주의사항:**
- **ESM 전용**: v11.0.0부터 ESM만 지원 (CommonJS 불가)
- **모노레포 설정**: ESM 설정 확인 필요
- **최신 릴리즈**: 2년 전이지만 안정적이라서 문제 없을 가능성 높음

**대안 고려 시점:**
- Chevrotain이 ESM 설정에 문제가 있거나, 실제로 유지보수가 중단되면:
  - **Peggy** (PEG.js 후속) - 활발히 유지보수 중
  - **mini-parse** - 경량, 간단한 문법용

### 비교표

| 라이브러리 | 타입 | 크기 | 학습 곡선 | 성능 | TypeScript | 선택 여부 |
|-----------|------|------|----------|------|-----------|----------|
| **Chevrotain** ⭐ | LL(k) | 중간 | 중간 | ⭐⭐⭐⭐⭐ | ✅ 네이티브 | ✅ **채택** |
| **Nearley** | Earley | 중간 | 낮음 | ⭐⭐⭐ | ⚠️ 부분 | ❌ |
| **Peggy** | PEG | 작음 | 낮음 | ⭐⭐⭐⭐ | ✅ | ❌ |
| **mini-parse** | Combinator | 매우 작음 | 낮음 | ⭐⭐⭐ | ✅ | ❌ |
| **Parsimmon** | Combinator | 작음 | 중간 | ⭐⭐⭐ | ✅ | ❌ |
| **Ohm** | PEG | 중간 | 낮음 | ⭐⭐⭐ | ✅ | ❌ |

**참고**: 다른 라이브러리들은 비교 참고용으로만 제공하며, Canvasdown는 Chevrotain을 사용합니다.

---

## 9. 성공 지표

### 내부 단계 (Phase 1-2)
- [ ] SSOTA AI 에이전트가 DSL로 다이어그램 생성 가능
- [ ] 기존 블록 타입 100% 지원
- [ ] 레이아웃이 자연스럽게 계산됨
- [ ] 파싱 에러 메시지가 명확함

### 오픈소스 단계 (Phase 3)
- [ ] 외부 프로젝트에서 독립적으로 사용 가능
- [ ] npm 주간 다운로드 1,000+
- [ ] GitHub 스타 100+
- [ ] 외부 기여자 PR

---

## 10. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| Chevrotain 학습 곡선 | 문서와 예제 제공, 단계적 구현 |
| 레이아웃 성능 | 노드 수 제한 벤치마크, 필요시 Web Worker |
| API 변경 | 내부 단계에서 충분히 사용 후 안정화 |
| 오픈소스 유지보수 부담 | 명확한 scope 정의, 외부 PR 환영, 문서화 강화 |

---

## 11. 다음 단계

1. **Phase 1 태스크 브레이크다운** (상세 TODO)
2. **Core 폴더 구조 셋업** (`packages/canvasdown/core/`)
3. **MVP 파서 구현** 시작

---

## 12. 참고 자료

- [Mermaid 문법](https://mermaid.js.org/intro/)
- [React Flow 문서](https://reactflow.dev/)
- [Chevrotain 문서](https://chevrotain.io/)
- [dagre 레이아웃](https://github.com/dagrejs/dagre)
- [elkjs 레이아웃](https://github.com/kieler/elkjs)
