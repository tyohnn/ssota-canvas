# Epic-016: Canvasdown 패키지 개발 (Phase 1 - MVP)

## 🎯 Epic 개요
**Epic Goal**: As a 개발자, I want to 텍스트 기반 DSL로 다이어그램을 정의하고 React Flow로 렌더링할 수 있어야 so that AI가 생성한 다이어그램을 SSOTA 캔버스에서 바로 시각화할 수 있다

**기간**: 2026-01-11 ~ 2026-02-08 (4주, 2 Sprints)  
**Story Points**: 34pts (예상)  
**우선순위**: High (P1)  
**현재 상태**: 📋 계획 중

## 📊 비즈니스 가치

### 문제 정의
1. **AI 다이어그램 생성의 제약**: 
   - AI는 텍스트 출력에 최적화되어 있음
   - 현재는 프로그래밍 방식으로만 블록 생성 가능
   - Mermaid 스타일의 텍스트 입력 방식 미지원

2. **재사용 불가능한 파서**: 
   - 매번 파서/레이아웃 로직을 재구현해야 함
   - 커뮤니티에서 공유 가능한 표준 도구 부재

### 해결책
1. **Canvasdown 라이브러리**: 
   - 텍스트 기반 DSL로 다이어그램 정의
   - Chevrotain 기반 강력한 파서
   - 동적 블록/엣지 타입 등록 시스템

2. **프레임워크 독립적 설계**: 
   - Core는 순수 TypeScript, 프레임워크 독립
   - React Flow 어댑터 제공
   - 향후 다른 렌더러 지원 가능

### 기대 효과
- ✅ **AI 친화적 인터페이스**: AI가 텍스트로 다이어그램 생성 가능
- ✅ **재사용 가능한 라이브러리**: 다른 프로젝트에서도 사용 가능
- ✅ **확장성**: 커스텀 블록 타입 시스템으로 어떤 프로젝트에도 적용 가능
- ✅ **오픈소스 가능성**: 향후 독립 패키지로 배포 가능

---

## 🎯 성공 기준

### 기능적 기준
- [ ] **DSL 파서**: Chevrotain 기반 DSL 텍스트 파싱 가능
- [ ] **타입 레지스트리**: 블록/엣지 타입 동적 등록 시스템
- [ ] **레이아웃 엔진**: dagre 기반 자동 레이아웃 계산
- [ ] **React Flow 어댑터**: Core 출력을 React Flow 노드/엣지로 변환
- [ ] **SSOTA 통합**: SSOTA 블록 타입들 등록 및 캔버스 렌더링 동작

### 성능 기준
- [ ] **파싱 속도**: 100줄 DSL 파싱 < 100ms
- [ ] **레이아웃 속도**: 50개 노드 레이아웃 계산 < 500ms
- [ ] **렌더링 성능**: React Flow에서 부드러운 렌더링 (60fps)

### 사용성 기준
- [ ] **직관적인 문법**: Mermaid 스타일로 읽기 쉬운 문법
- [ ] **명확한 에러 메시지**: 파싱 에러 시 라인 번호 및 컬럼 정보 제공
- [ ] **타입 안전성**: TypeScript로 타입 안전한 API

### 품질 기준
- [ ] **코드 커버리지**: Core 로직 단위 테스트 80% 이상
- [ ] **문서화**: README 및 API 문서 완성
- [ ] **타입 정의**: 모든 공개 API에 TypeScript 타입 정의

---

## 📋 포함 기능

### 핵심 기능
- **DSL 파서**: Chevrotain 기반 LL(k) 파서
- **타입 레지스트리**: 블록/엣지 타입 동적 등록 시스템
- **AST 빌더**: 파싱 결과를 그래프 데이터로 변환
- **레이아웃 엔진**: dagre 기반 자동 위치 계산
- **React Flow 어댑터**: Core → React Flow 변환

### 지원 기능
- **에러 처리**: 상세한 파싱 에러 메시지
- **기본 레이아웃**: LR, RL, TB, BT 방향 지원
- **SSOTA 통합**: 기존 블록 타입들 등록

---

## 🚫 제외 범위

- **고급 레이아웃**: elkjs 지원 (Phase 2)
- **역변환**: Canvas → DSL 변환 (Phase 2)
- **양방향 동기화**: 편집 시 DSL 업데이트 (Phase 2)
- **주석 지원**: DSL 내 주석 처리 (Phase 2)
- **오픈소스 배포**: npm 배포 및 문서화 (Phase 3)

---

## 🔗 의존성

**선행 Epic**: 
- ✅ Epic-003: Block Management (완료) - 블록 타입 시스템 필요
- ✅ Epic-002: Canvas Management (완료) - React Flow 통합 필요

**외부 의존성**: 
- Chevrotain (DSL 파서)
- dagre (레이아웃)
- @xyflow/react (React Flow)
- React 18+

---

## 🏗️ 기술적 고려사항

### 아키텍처
- **Core 패키지**: 순수 TypeScript, 프레임워크 독립
- **React Flow 어댑터**: Core 출력을 React Flow 형식으로 변환
- **타입 레지스트리**: 런타임 타입 검증 및 기본값 제공

### 성능
- **파싱 성능**: Chevrotain의 높은 성능 활용
- **레이아웃 최적화**: dagre의 효율적인 그래프 레이아웃
- **메모리 관리**: 큰 그래프 처리 시 메모리 효율성 고려

### 확장성
- **동적 타입 시스템**: 새로운 블록/엣지 타입 런타임 등록
- **어댑터 패턴**: 향후 D3, Canvas 등 다른 렌더러 지원 가능
- **모노레포 구조**: packages/ 폴더 내에서 독립적으로 관리

---

## 📅 마일스톤

### Sprint 026: Canvasdown Core (2주)
- **Week 1**: 패키지 셋업, Chevrotain 파서 기본 구조
- **Week 2**: 타입 레지스트리, AST 빌더, 레이아웃 통합

### Sprint 027: React Flow 어댑터 및 SSOTA 통합 (2주)
- **Week 1**: React Flow 어댑터 구현
- **Week 2**: SSOTA 통합, POC 완성

---

## 🎯 완료 기준

- [ ] Core 패키지가 독립적으로 동작함
- [ ] DSL 텍스트를 파싱하여 그래프 데이터 생성 가능
- [ ] React Flow로 렌더링 가능
- [ ] SSOTA 캔버스에서 실제 사용 가능
- [ ] 기본 테스트 및 문서화 완료

---

## 📊 Story 목록

### Core 패키지 개발
- **E016-001**: [패키지 구조 셋업 및 기본 타입 정의](../stories/canvasdown/story-e016-001-package-setup.md) (3pts, P1)
- **E016-002**: [Chevrotain 파서 기본 구조 구현](../stories/canvasdown/story-e016-002-chevrotain-parser.md) (8pts, P1)
- **E016-003**: [타입 레지스트리 시스템 구현](../stories/canvasdown/story-e016-003-type-registry.md) (5pts, P1)
- **E016-004**: [AST → Graph Data 빌더 구현](../stories/canvasdown/story-e016-004-ast-builder.md) (5pts, P1)
- **E016-005**: [dagre 레이아웃 통합](../stories/canvasdown/story-e016-005-dagre-layout.md) (3pts, P1)

### React Flow 어댑터
- **E016-006**: [React Flow 어댑터 구현](../stories/canvasdown/story-e016-006-react-flow-adapter.md) (5pts, P1)
- **E016-007**: [useCanvasdown 훅 구현](../stories/canvasdown/story-e016-007-usecanvasdown-hook.md) (3pts, P1)

### SSOTA 통합
- **E016-008**: [SSOTA 블록 타입 등록 및 통합](../stories/canvasdown/story-e016-008-ssota-integration.md) (2pts, P1)

**총 Story Points**: 34pts

---

## 📁 관련 문서

- [Canvasdown README](../../packages/canvasdown/README.md)
- [Mermaid React Flow Discussion](../../domains/react-flow-mermaid/first-discussion.md)
- [Epic-003: Block Management](./epic-003-block-management.md)
- [Epic-002: Canvas Management](./epic-002-canvas-management.md)

---

## 🎯 Story 및 Sprint 계획

### Story 상세 계획

각 Story는 아래 형식으로 정의됩니다:
- Story ID: `E016-[순번]` 형식
- 예상 기간: 1-3일
- 도메인: Canvasdown Domain (새로운 도메인)
- 모든 Story 문서: `docs/agile-planning/stories/canvasdown/` 폴더

### Sprint 구성

**Sprint 026: Canvasdown Core** (2주)
- Story: E016-001 ~ E016-005
- 목표: Core 패키지 완성
- Sprint 문서: [sprint-026-canvasdown-core.md](../sprints/sprint-026-canvasdown-core.md)

**Sprint 027: 어댑터 및 통합** (2주)
- Story: E016-006 ~ E016-008
- 목표: SSOTA 통합 및 POC 완성
- Sprint 문서: [sprint-027-canvasdown-adapter-integration.md](../sprints/sprint-027-canvasdown-adapter-integration.md)

---

이 Epic을 통해 AI 친화적인 다이어그램 DSL 라이브러리를 구축합니다! 🚀
