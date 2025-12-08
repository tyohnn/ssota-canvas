# Story E009-004: 블록 공유하기

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 특정 블록 선택 상태로 공유 링크를 생성하여 so that 다른 사용자가 해당 블록에 바로 접근할 수 있다

**Story Points**: 3pts  
**우선순위**: Medium (P1)  
**Epic**: Epic-009 Sharing & Templates  
**Domain**: Sharing Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 블록 선택 상태로 공유 링크 생성
```gherkin
Given 사용자가 페이지에서 블록을 선택했다
When 공유 버튼을 클릭한다
Then 공유 링크가 생성된다
And URL에 블록 선택 상태가 query params로 포함된다
And 링크가 클립보드에 복사된다
```

### 시나리오 2: 공유 링크에서 블록 선택 상태 복원
```gherkin
Given 블록 선택 상태가 포함된 공유 링크가 있다
When 다른 사용자가 링크를 열다
Then 페이지가 표시된다
And 지정된 블록이 자동으로 선택된다
And 블록이 하이라이트된다
```

### 시나리오 3: 여러 블록 선택 공유
```gherkin
Given 사용자가 여러 블록을 선택했다
When 공유 링크를 생성한다
Then 모든 선택된 블록이 query params에 포함된다
And 링크를 열면 모든 블록이 선택된다
```

## 🎯 Definition of Done

### 기능 완료
- [ ] 블록 선택 상태 공유 링크 생성 완료
- [ ] 공유 링크에서 블록 선택 상태 복원 완료
- [ ] 여러 블록 선택 공유 완료
- [ ] URL query params 처리 완료

### 기술 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] URL query params 보안 검증
- [ ] 블록 선택 상태 검증 로직 구현
- [ ] 보안 취약점 0개

## 📊 진행 상황
**현재**: 0% 완료 (설계 완료, 구현 대기 중)

## 🔗 의존성
- **선행 Story**: 
  - E009-003: 페이지 공유하기
- **도메인 의존성**: 
  - Sharing Management Domain: 블록 공유 서비스
  - Canvas Management Domain: 블록 선택 상태 관리

## 📁 관련 문서

### Domain Documentation
**Sharing Management Domain**:
- [Event Storming](../../../event-domain-design/domains/collaboration-access-control-domain/event-storm.md)

**Canvas Management Domain**:
- [Technical Specification](../../../event-domain-design/domains/canvas-management-domain/04-technical-specification.md)

### Agile Planning
- [Epic-009: Sharing & Templates](../../epics/epic-009-sharing-templates.md)
- [Initiative 002](../../initiatives/initiative-002-mvp-launch-ai-note.md)

