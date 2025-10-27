# Story BM-003: 커스텀 속성 관리

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록에 커스텀 속성을 추가하고 관리할 수 있어야 so that 블록에 더 많은 정보를 저장하고 관리할 수 있다

**Story Points**: 21pts  
**우선순위**: High  
**Epic**: Epic-001 Block Management Domain  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 커스텀 속성 추가
```gherkin
Given 사용자가 블록을 선택했다
When 사용자가 "+ 속성 추가" 버튼을 클릭한다
Then 속성 이름 입력 필드가 표시된다
And 속성 타입 선택 옵션이 제공된다
```

### 시나리오 2: 속성 타입별 설정
```gherkin
Given 사용자가 속성 타입을 선택했다
When 사용자가 속성 설정을 완료한다
Then 속성 정의가 custom_properties에 저장된다
And 속성 값이 properties에 초기화된다
```

### 시나리오 3: 속성 편집 및 삭제
```gherkin
Given 사용자가 속성을 선택했다
When 사용자가 속성 라벨을 클릭한다
Then Field Popover가 표시된다
And 속성 편집/삭제 옵션이 제공된다
```

### 시나리오 4: 선택형 속성 옵션 관리
```gherkin
Given 사용자가 select/multi-select 속성을 선택했다
When 사용자가 옵션을 추가한다
Then 옵션이 속성 정의에 추가된다
And 옵션별 색상과 순서를 설정할 수 있다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] CustomPropertyDefinition Value Object 구현
- [ ] PropertyOption Value Object 구현
- [ ] Commands 정의 (AddCustomProperty, ChangePropertyType, DeleteCustomProperty)
- [ ] Events 정의 (CustomPropertyAdded, PropertyTypeChanged, CustomPropertyDeleted)
- [ ] 속성 타입별 검증 로직
- [ ] 정의-값 동시 업데이트 로직

#### Database
- [ ] custom_properties JSONB 컬럼 활용
- [ ] properties JSONB 컬럼 활용
- [ ] JSONB GIN 인덱스 생성

#### Server Actions
- [ ] manageCustomPropertyAction (속성 관리)
- [ ] addCustomPropertyAction (속성 추가)
- [ ] changePropertyTypeAction (타입 변경)
- [ ] deleteCustomPropertyAction (속성 삭제)

#### Frontend
- [ ] PropertyInput 컴포넌트 (타입별 동적 렌더링)
- [ ] GenericFieldPopover 컴포넌트
- [ ] SelectLikeFieldPopover 컴포넌트
- [ ] StatusFieldPopover 컴포넌트
- [ ] useSchemaFieldEditor Hook

---

### Testing & Quality
- [ ] Unit Tests (CustomPropertyDefinition, PropertyOption)
- [ ] Integration Tests (속성 관리 로직)
- [ ] E2E Tests (속성 추가/편집/삭제 플로우)
- [ ] 성능 테스트 (속성 업데이트 응답 시간 1초 이내)

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 시나리오가 정상 동작함
- [ ] 커스텀 속성 추가/편집/삭제 기능 완성
- [ ] 속성 타입별 동적 UI 렌더링
- [ ] Field Popover 중첩 구조 완성
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
**현재**: 85% 완료 (기본 구조 구현, 고급 기능 미완성)

### ✅ 완료된 구현 (2025-10-24 기준)
- **Value Objects**: PropertyType, PropertyOption, PropertyValidation 완전 구현
- **Backend Repository**: DrizzlePropertyRepository 완전 구현
- **Server Actions**: createCustomPropertyAction, updateCustomPropertyAction, deleteCustomPropertyAction 완전 구현
- **Frontend Hooks**: useSchemaFieldEditor Hook 완전 구현
- **Block Type Schemas**: 분리된 스키마 시스템으로 확장성 개선
- **Testing**: Value Objects 단위 테스트 완전 구현
- **Frontend Components**: PropertyInput 컴포넌트 기본 구조 구현

### ❌ 미구현 사항
- **Backend Logic**: 속성 타입별 고급 검증 로직, 중첩 속성 관리 로직 미구현
- **Frontend Components**: GenericFieldPopover, SelectLikeFieldPopover, StatusFieldPopover 미구현
- **Testing**: Integration Tests, E2E Tests 미구현

## 🔗 의존성
- **선행 Story**: BM-002 (블록 편집)
- **후행 Story**: BM-004 (속성 값 관리)
- **도메인 의존성**: Block Management Domain

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Process Model](../../../event-domain-design/domains/block-management-domain/02-process-model.md) - Scenario 1
- [Software Design](../../../event-domain-design/domains/block-management-domain/03-software-design.md) - CustomPropertyDefinition
- [Testing Strategy](../../../event-domain-design/domains/block-management-domain/05-testing-strategy.md) - Scenario 1 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - JSONB 컬럼
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - PropertyInput, Field Popover

### Agile Planning
- [Epic 문서](../../epics/epic-001-block-management.md)
