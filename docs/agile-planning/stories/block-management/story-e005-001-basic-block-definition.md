# Story E005-001: 기본 블록 정의 및 아키텍처 설계

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 기본 블록 아키텍처를 사용하여 so that 모든 블록 타입이 일관된 구조를 가지며 확장 가능한 시스템을 사용할 수 있다

**Story Points**: 13pts  
**우선순위**: High (P0)  
**Epic**: Epic-005 Basic Block & View System  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 기본 블록 아키텍처 정의 (프론트엔드)
```gherkin
Given 개발자가 새로운 블록 타입을 추가하려고 한다
When 프론트엔드에서 기본 블록 타입을 사용한다
Then 모든 블록이 일관된 구조를 가진다
And 블록 타입별 기본 보기가 자동으로 매핑된다
And viewMode 속성을 가진다
And viewMode는 프론트엔드에서 관리된다
```

### 시나리오 2: View Mode 시스템 정의 (확장 가능)
```gherkin
Given 블록이 생성되었다
When 블록의 viewMode를 확인한다
Then viewMode는 'default' | 'card' | 'markdown' 중 하나이다
And 블록 타입에 따라 기본 viewMode가 자동 설정된다
And viewMode는 프론트엔드에서 관리되며 데이터베이스에 저장된다
And 향후 새로운 viewMode를 추가할 수 있다
```

### 시나리오 3: 마이그레이션 스키마 설계
```gherkin
Given 기존 마크다운 블록이 있다
When 마이그레이션 스키마를 설계한다
Then 기존 마크다운 블록을 기본 블록으로 변환할 수 있다
And 데이터 손실 없이 변환이 가능하다
And 롤백 스키마가 준비된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Frontend
- [ ] 기본 블록 타입 정의 (TypeScript 인터페이스)
- [ ] ViewMode 타입 정의 (확장 가능한 유니온 타입: 'default' | 'card' | 'markdown')
- [ ] 블록 타입별 기본 보기 매핑 상수 정의
- [ ] 기본 블록 렌더링 로직 (viewMode에 따른 분기)

#### Database
- [ ] blocks 테이블에 view_mode 컬럼 추가 (enum 타입, 기본값 'default')
- [ ] view_mode 인덱스 추가 (필요시)
- [ ] 마이그레이션 스키마 설계 (마크다운 블록 → 기본 블록 변환, 롤백 스크립트 포함)

#### Server Actions
- [ ] updateBlockViewModeAction (프론트엔드에서 설정한 viewMode 저장)

---

### 도메인 간 통합
- [ ] **Block Management → Canvas Management 연동**
  - 기본 블록 렌더링 시 Canvas 마운트
  - viewMode 변경 시 Canvas 렌더링 업데이트 (프론트엔드)

---

### Testing & Quality
- [ ] Unit Tests (ViewMode 타입, 기본 보기 매핑)
- [ ] Integration Tests (viewMode 저장/조회)
- [ ] E2E Tests (기본 블록 렌더링 및 viewMode 전환)
- [ ] 마이그레이션 테스트 (기존 데이터 변환 검증)

## 🎯 Definition of Done

### 기능 완료
- [ ] 기본 블록 아키텍처 정의 완료
- [ ] ViewMode 시스템 정의 완료
- [ ] 블록 타입별 기본 보기 매핑 완료
- [ ] 마이그레이션 스키마 설계 완료

### 기술 완료
- [ ] 프론트엔드 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과 (viewMode 저장/조회)
- [ ] E2E Tests 통과 (기본 블록 렌더링)
- [ ] 마이그레이션 테스트 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 데이터 무결성 검증 완료
- [ ] 마이그레이션 롤백 스크립트 준비 완료
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: 
  - ✅ E003-001: 블록 생성 및 기본 관리 (완료, Epic-003)
- **후행 Story**: 
  - E005-002: 마크다운 블록 마이그레이션
  - E005-003: 보기 방식 시스템 구현
- **도메인 의존성**: 
  - Block Management Domain: 기본 블록 아키텍처
  - Canvas Management Domain: 블록 마운트 연동

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - blocks 테이블
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - 블록 컴포넌트

### Agile Planning
- [Epic-005: Basic Block & View System](../../epics/epic-005-basic-block-view-system.md)
- [Initiative 002](../../initiatives/initiative-002-mvp-launch-ai-note.md)
