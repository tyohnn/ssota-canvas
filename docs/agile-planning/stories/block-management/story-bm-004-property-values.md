# Story BM-004: 속성 값 관리

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 속성에 값을 입력하고 관리할 수 있어야 so that 블록에 실제 데이터를 저장하고 활용할 수 있다

**Story Points**: 13pts  
**우선순위**: High  
**Epic**: Epic-001 Block Management Domain  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 속성 값 입력
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 속성에 값을 입력한다
Then 값이 실시간으로 저장된다
And 타입별 검증이 수행된다
```

### 시나리오 2: 타입별 동적 입력
```gherkin
Given 사용자가 속성을 선택했다
When 속성 타입이 text/select/multi-select/datetime/media/profile이다
Then 해당 타입에 맞는 입력 UI가 표시된다
And 타입별 검증이 수행된다
```

### 시나리오 3: 프로필 속성 멤버 검증
```gherkin
Given 사용자가 profile 속성을 설정했다
When 사용자가 워크스페이스 멤버를 선택한다
Then 멤버 존재 여부가 검증된다
And 유효한 멤버만 선택 가능하다
```

### 시나리오 4: 미디어 속성 파일 업로드
```gherkin
Given 사용자가 media 속성을 설정했다
When 사용자가 파일을 업로드한다
Then Supabase Storage에 파일이 업로드된다
And Public URL이 생성되어 속성에 저장된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] 속성 값 검증 로직 구현
- [ ] 타입별 값 변환 로직
- [ ] 프로필 속성 멤버 검증 로직
- [ ] Commands 정의 (SetPropertyValue, ValidatePropertyValue)
- [ ] Events 정의 (PropertyValueSet, PropertyValueValidated)

#### Database
- [ ] properties JSONB 컬럼 활용
- [ ] JSONB 검색 최적화

#### Server Actions
- [ ] setPropertyValueAction (속성 값 설정)
- [ ] validatePropertyValueAction (값 검증)

#### Frontend
- [ ] PropertyInput 타입별 컴포넌트
- [ ] TextProperty, SelectProperty, MultiSelectProperty
- [ ] DatetimeProperty, MediaProperty, ProfileProperty
- [ ] useBlockFieldUpdate Hook
- [ ] 실시간 자동 저장 기능

---

### Workspace Management Domain (통합)
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/04-technical-specification.md)

#### Backend Implementation
- [ ] 멤버 검증 로직
- [ ] 워크스페이스 멤버십 확인

---

### Supabase Storage (통합)
**참조 문서**: Supabase Storage API

#### Backend Implementation
- [ ] 파일 업로드 로직
- [ ] Public URL 생성
- [ ] 파일 크기/MIME 타입 검증

---

### 도메인 간 통합
- [ ] Block Management ↔ Workspace Management (멤버 검증)
- [ ] Block Management ↔ Supabase Storage (파일 업로드)
- [ ] 권한 검증 로직
- [ ] 에러 처리 및 롤백

---

### Testing & Quality
- [ ] Unit Tests (속성 값 검증 로직)
- [ ] Integration Tests (멤버 검증, 파일 업로드)
- [ ] E2E Tests (속성 값 입력 전체 플로우)
- [ ] 성능 테스트 (속성 업데이트 응답 시간 1초 이내)

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 시나리오가 정상 동작함
- [ ] 속성 값 입력 및 저장 기능 완성
- [ ] 타입별 동적 입력 UI 완성
- [ ] 실시간 자동 저장 기능 완성
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
**현재**: 70% 완료 (기본 UI 구현, 백엔드 로직 미완성)

### ✅ 완료된 구현 (2025-10-24 기준)
- **Frontend Hooks**: useBlockFieldUpdate Hook 완전 구현
- **Frontend Components**: PropertyInput 타입별 컴포넌트 구현
  - TextProperty, SelectProperty, MultiSelectProperty
  - DatetimeProperty, MediaProperty, ProfileProperty
- **UI Components**: 실시간 자동 저장 기능 기본 구현

### ❌ 미구현 사항
- **Backend Domain**: 속성 값 검증 로직, 타입별 값 변환 로직, 프로필 속성 멤버 검증 로직 미구현
- **Server Actions**: setPropertyValueAction, validatePropertyValueAction 미구현
- **Workspace Management 연동**: 멤버 검증 로직 미구현
- **Supabase Storage 연동**: 파일 업로드 로직 미구현
- **Testing**: Unit Tests, Integration Tests, E2E Tests 미구현

## 🔗 의존성
- **선행 Story**: BM-003 (커스텀 속성 관리)
- **후행 Story**: BM-005 (미디어 업로드)
- **도메인 의존성**: Block Management Domain ↔ Workspace Management Domain ↔ Supabase Storage

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Process Model](../../../event-domain-design/domains/block-management-domain/02-process-model.md) - Scenario 2
- [Software Design](../../../event-domain-design/domains/block-management-domain/03-software-design.md) - PropertyValue
- [Testing Strategy](../../../event-domain-design/domains/block-management-domain/05-testing-strategy.md) - Scenario 2 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - properties JSONB
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - PropertyInput 컴포넌트

**Workspace Management Domain**:
- [Software Design](../../../event-domain-design/domains/workspace-management-domain/03-software-design.md)
- [Technical Specification](../../../event-domain-design/domains/workspace-management-domain/04-technical-specification.md)
- [Database Schema](../../../event-domain-design/domains/workspace-management-domain/04-db-schema.md)
- [Frontend Specification](../../../event-domain-design/domains/workspace-management-domain/04-frontend-specification.md)

### Agile Planning
- [Epic 문서](../../epics/epic-001-block-management.md)
