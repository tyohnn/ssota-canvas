# Story E005-004: 마크다운 보기 구현

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록을 마크다운 보기로 조회하고 편집할 수 있어야 so that 콘텐츠 중심으로 블록을 관리할 수 있다

**Story Points**: 5pts  
**우선순위**: Medium (P1)  
**Epic**: Epic-005 Basic Block & View System  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 마크다운 보기 렌더링
```gherkin
Given 블록의 viewMode가 'markdown'으로 설정되었다
When 블록을 조회한다
Then 블록이 마크다운 보기로 렌더링된다
And 상단에 제목이 표시된다
And 마크다운 콘텐츠가 렌더링된다
```

### 시나리오 2: 한번 클릭 편집
```gherkin
Given 블록이 마크다운 보기로 표시되고 있다
When 사용자가 블록을 한번 클릭한다
Then 편집 모드로 전환된다
And 마크다운 에디터가 표시된다
And 사용자가 콘텐츠를 수정할 수 있다
```

### 시나리오 3: 상단 바 이동
```gherkin
Given 블록이 마크다운 보기로 표시되고 있다
When 사용자가 상단 바를 드래그한다
Then 블록이 드래그한 위치로 이동한다
And 블록의 위치가 저장된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Frontend
- [ ] MarkdownView 컴포넌트 (상단 제목 표시, 마크다운 렌더링, 상단 바 드래그 핸들)
- [ ] MarkdownEditor 컴포넌트 (한번 클릭 편집 모드, 마크다운 에디터, 실시간 미리보기 선택적)
- [ ] useMarkdownView Hook (편집 모드 상태 관리, 콘텐츠 저장, 드래그 이동)

---

### Canvas Management Domain (통합)
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

#### Frontend
- [ ] 블록 드래그 이동 연동 (상단 바 드래그 시 Canvas 이동, 위치 업데이트)

---

### Testing & Quality
- [ ] Unit Tests (MarkdownView, MarkdownEditor 컴포넌트)
- [ ] Integration Tests (마크다운 보기 플로우)
- [ ] E2E Tests (사용자 시나리오)
- [ ] 접근성 테스트 (키보드 네비게이션)

## 🎯 Definition of Done

### 기능 완료
- [ ] 마크다운 보기 렌더링 완료
- [ ] 상단 제목 표시 완료
- [ ] 한번 클릭 편집 모드 완료
- [ ] 상단 바 드래그 이동 완료
- [ ] 마크다운 콘텐츠 렌더링 완료

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 접근성 기준 충족 (키보드 네비게이션)
- [ ] 마크다운 렌더링 성능 최적화
- [ ] 보안 취약점 0개 (XSS 방지)

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: 
  - E005-003: 보기 방식 시스템 구현
- **후행 Story**: 
  - E005-005: 카드 보기 구현
- **도메인 의존성**: 
  - Block Management Domain: 마크다운 보기
  - Canvas Management Domain: 블록 이동

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - 블록 컴포넌트

**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-005: Basic Block & View System](../../epics/epic-005-basic-block-view-system.md)
- [Initiative 002](../../initiatives/initiative-002-mvp-launch-ai-note.md)

