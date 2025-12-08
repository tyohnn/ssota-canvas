# Story E005-002: 마크다운 블록 마이그레이션

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 기존 마크다운 블록이 기본 블록으로 자동 변환되어 so that 기존 데이터를 잃지 않고 새로운 시스템을 사용할 수 있다

**Story Points**: 8pts  
**우선순위**: High (P0)  
**Epic**: Epic-005 Basic Block & View System  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 마크다운 블록 마이그레이션 실행
```gherkin
Given 기존 마크다운 블록이 데이터베이스에 있다
When 마이그레이션 스크립트를 실행한다
Then 모든 마크다운 블록이 기본 블록으로 변환된다
And 블록 타입은 'basic'으로 변경된다
And viewMode는 'markdown'으로 설정된다
And 기존 콘텐츠가 유지된다
```

### 시나리오 2: 데이터 검증
```gherkin
Given 마이그레이션이 실행되었다
When 마이그레이션 결과를 검증한다
Then 모든 마크다운 블록이 변환되었는지 확인된다
And 데이터 손실이 없는지 확인된다
And 변환된 블록이 정상적으로 조회된다
```

### 시나리오 3: 롤백 실행
```gherkin
Given 마이그레이션이 실행되었다
When 문제가 발생하여 롤백을 실행한다
Then 모든 블록이 원래 상태로 복원된다
And 데이터가 정상적으로 복원된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md)

#### Backend Implementation
- [ ] 마이그레이션 스크립트 작성 (마크다운 블록 → 기본 블록 변환)
- [ ] 데이터 검증 로직 (변환 전후 데이터 무결성 확인)
- [ ] 롤백 스크립트 작성 (원래 상태 복원)

#### Database
- [ ] 마이그레이션 SQL 작성 (블록 타입 변경, view_mode 업데이트, 트랜잭션 처리)
- [ ] 롤백 SQL 작성
- [ ] 마이그레이션 전 백업 스크립트

#### Server Actions
- [ ] migrateMarkdownBlocksAction (마이그레이션 실행)
- [ ] validateMigrationAction (마이그레이션 검증)
- [ ] rollbackMigrationAction (롤백 실행)

---

### Testing & Quality
- [ ] 마이그레이션 테스트 (테스트 데이터로 실행, 무결성 검증, 성능 테스트)
- [ ] 롤백 테스트 (롤백 스크립트 실행, 데이터 복원 검증)

## 🎯 Definition of Done

### 기능 완료
- [ ] 마이그레이션 스크립트 실행 완료
- [ ] 모든 마크다운 블록이 기본 블록으로 변환됨
- [ ] 데이터 손실 없이 변환 완료
- [ ] 롤백 스크립트 준비 완료

### 기술 완료
- [ ] 마이그레이션 테스트 통과
- [ ] 롤백 테스트 통과
- [ ] 성능 테스트 통과 (대량 데이터)
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 데이터 무결성 검증 완료
- [ ] 백업 및 롤백 준비 완료
- [ ] 마이그레이션 로그 기록 완료

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: 
  - E005-001: 기본 블록 정의 및 아키텍처 설계
- **후행 Story**: 
  - E005-003: 보기 방식 시스템 구현
- **도메인 의존성**: 
  - Block Management Domain: 마이그레이션 로직

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - blocks 테이블

### Agile Planning
- [Epic-005: Basic Block & View System](../../epics/epic-005-basic-block-view-system.md)
- [Initiative 002](../../initiatives/initiative-002-mvp-launch-ai-note.md)
