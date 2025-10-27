# Story BM-002: 블록 편집 및 정보 관리

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록의 기본 정보를 편집할 수 있어야 so that 블록의 내용을 업데이트하고 관리할 수 있다

**Story Points**: 8pts  
**우선순위**: High  
**Epic**: Epic-001 Block Management Domain  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 정보 편집
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 Editor Panel에서 블록 정보를 수정한다
Then 블록 정보가 실시간으로 업데이트된다
And 변경사항이 데이터베이스에 저장된다
```

### 시나리오 2: 블록 타입 변경
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 블록 타입을 변경한다
Then 블록 타입이 업데이트된다
And 기존 속성과의 호환성을 검사한다
```

### 시나리오 3: 블록 메타데이터 관리
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 메타데이터를 수정한다
Then 메타데이터가 업데이트된다
And 편집시각이 자동으로 갱신된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] BlockAggregate 편집 로직 구현
- [ ] UpdateBlockCommand 구현
- [ ] BlockUpdatedEvent 구현
- [ ] 블록 타입 변경 검증 로직
- [ ] 메타데이터 업데이트 로직

#### Database
- [ ] 블록 업데이트 인덱스 최적화
- [ ] updated_at 자동 갱신 트리거

#### Server Actions
- [ ] updateBlockAction (블록 정보 수정)
- [ ] changeBlockTypeAction (블록 타입 변경)

#### Frontend
- [ ] Editor Panel 컴포넌트
- [ ] 블록 정보 편집 폼
- [ ] 실시간 업데이트 기능
- [ ] 블록 타입 변경 UI

---

### Testing & Quality
- [ ] Unit Tests (BlockAggregate 편집 로직)
- [ ] Integration Tests (Repository 업데이트)
- [ ] E2E Tests (블록 편집 전체 플로우)
- [ ] 성능 테스트 (편집 응답 시간 1초 이내)

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 시나리오가 정상 동작함
- [ ] 블록 정보 편집 기능 완성
- [ ] 블록 타입 변경 기능 완성
- [ ] UI/UX가 Frontend Specification을 준수함

### 기술 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족

### 품질 완료
- [ ] RLS 정책 적용 완료
- [ ] 권한 검증 로직 구현 완료
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 90% 완료 (Backend Domain, Database, Server Actions, Frontend Hooks 완전 구현)

### ✅ 완료된 핵심 구현 (2025-10-24 기준)
- **Backend Domain**: BlockAggregate 편집 로직, UpdateBlockCommand, BlockUpdatedEvent 완전 구현
- **Database**: DrizzleBlockRepository updateBlock, updateBlockType, markAsDeleted, restore 메서드 완전 구현
- **Server Actions**: updateBlockInfoAction, changeBlockTypeAction 완전 구현
- **Frontend Hooks**: useBlockUpdate Hook 완전 구현 (Optimistic UI 포함)
- **Testing**: Unit Tests, Integration Tests 완전 구현

### ❌ 미구현 사항 (2025-10-24 기준)
- **Frontend Components**: Editor Panel, 블록 정보 편집 폼 UI 컴포넌트 구현 필요
- **RLS Policies**: blocks 테이블 Row-Level Security 정책 구현 필요

### 🔄 의존성
- **선행 Story**: BM-001 (블록 생성) - 85% 완료
- **후행 Story**: BM-003 (커스텀 속성 관리) - 60% 완료

## 🔗 의존성
- **선행 Story**: BM-001 (블록 생성)
- **후행 Story**: BM-003 (커스텀 속성 관리)
- **도메인 의존성**: Block Management Domain

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Process Model](../../../event-domain-design/domains/block-management-domain/02-process-model.md) - Scenario 0
- [Software Design](../../../event-domain-design/domains/block-management-domain/03-software-design.md) - BlockAggregate
- [Testing Strategy](../../../event-domain-design/domains/block-management-domain/05-testing-strategy.md) - Scenario 0 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - blocks 테이블
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - Editor Panel 컴포넌트

### Agile Planning
- [Epic 문서](../../epics/epic-001-block-management.md)
