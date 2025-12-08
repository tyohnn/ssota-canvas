# Story E005-003: 보기 방식 시스템 구현

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록의 보기 방식을 전환할 수 있어야 so that 블록을 다양한 형태로 조회하고 관리할 수 있다

**Story Points**: 8pts  
**우선순위**: High (P0)  
**Epic**: Epic-005 Basic Block & View System  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 보기 방식 전환
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 컨텍스트 메뉴에서 보기 방식을 선택한다
Then 블록의 viewMode가 변경된다
And 블록이 선택한 보기 방식으로 렌더링된다
And 변경사항이 저장된다
```

### 시나리오 2: 기본 보기 자동 선택
```gherkin
Given 새로운 블록이 생성되었다
When 블록의 타입을 확인한다
Then 블록 타입에 맞는 기본 viewMode가 자동 설정된다
And 블록이 기본 보기로 렌더링된다
```

### 시나리오 3: 보기 방식 저장 및 로드
```gherkin
Given 사용자가 블록의 보기 방식을 변경했다
When 페이지를 새로고침한다
Then 변경한 보기 방식이 유지된다
And 블록이 저장된 보기 방식으로 렌더링된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] ViewModeService 구현 (보기 방식 전환, 기본 보기 자동 선택, 검증)
- [ ] BlockRepository 확장 (viewMode 저장/조회, 기본 보기 매핑 조회)

#### Server Actions
- [ ] updateBlockViewModeAction (보기 방식 업데이트)
- [ ] getDefaultViewModeAction (기본 보기 조회)

#### Frontend
- [ ] ViewModeSelector 컴포넌트 (컨텍스트 메뉴에 보기 방식 옵션, 단축키 지원 선택적)
- [ ] useBlockViewMode Hook (viewMode 상태 관리, 전환 로직, 기본 보기 자동 선택)
- [ ] 보기 방식 전환 애니메이션 (선택적)

---

### 도메인 간 통합
- [ ] Block Management → Canvas Management 연동 (viewMode 변경 시 Canvas 업데이트, 블록 렌더링 업데이트)

---

### Testing & Quality
- [ ] Unit Tests (ViewModeService, 기본 보기 매핑)
- [ ] Integration Tests (보기 방식 전환 플로우)
- [ ] E2E Tests (사용자 시나리오)
- [ ] 성능 테스트 (보기 전환 속도 < 100ms)

## 🎯 Definition of Done

### 기능 완료
- [ ] 보기 방식 전환 기능 완료
- [ ] 기본 보기 자동 선택 완료
- [ ] 보기 방식 저장/로드 완료
- [ ] 컨텍스트 메뉴/단축키 연동 완료

### 기술 완료
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 보기 전환 속도 < 100ms
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 보기 방식 변경 권한 확인 완료
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: 
  - E005-001: 기본 블록 정의 및 아키텍처 설계
  - E005-002: 마크다운 블록 마이그레이션
- **후행 Story**: 
  - E005-004: 마크다운 보기 구현
  - E005-005: 카드 보기 구현
- **도메인 의존성**: 
  - Block Management Domain: 보기 방식 시스템
  - Canvas Management Domain: 블록 렌더링 업데이트

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - blocks 테이블
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - 블록 컴포넌트

### Agile Planning
- [Epic-005: Basic Block & View System](../../epics/epic-005-basic-block-view-system.md)
- [Initiative 002](../../initiatives/initiative-002-mvp-launch-ai-note.md)
