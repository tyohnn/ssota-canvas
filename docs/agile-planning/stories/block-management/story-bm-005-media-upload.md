# Story BM-005: 미디어 업로드 및 관리

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록에 이미지나 파일을 업로드하고 관리할 수 있어야 so that 시각적 정보를 추가하고 관리할 수 있다

**Story Points**: 21pts  
**우선순위**: Medium  
**Epic**: Epic-001 Block Management Domain  
**Domain**: Block Management Domain

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 미디어 파일 업로드
```gherkin
Given 사용자가 media 속성을 선택했다
When 사용자가 파일을 드래그 앤 드롭한다
Then 파일 크기와 타입이 검증된다
And Supabase Storage에 파일이 업로드된다
And Public URL이 생성되어 속성에 저장된다
```

### 시나리오 2: 파일 업로드 진행률 표시
```gherkin
Given 사용자가 파일을 업로드 중이다
When 업로드가 진행된다
Then 진행률 바가 표시된다
And 현재 처리 단계가 안내된다
```

### 시나리오 3: 미디어 파일 삭제
```gherkin
Given 사용자가 업로드된 미디어 파일을 선택했다
When 사용자가 삭제 버튼을 클릭한다
Then properties에서 URL이 제거된다
And Supabase Storage 파일은 보존된다
```

### 시나리오 4: 파일 크기 및 타입 검증
```gherkin
Given 사용자가 파일을 선택했다
When 파일 크기가 제한을 초과하거나 지원되지 않는 타입이다
Then 업로드가 차단된다
And 적절한 오류 메시지가 표시된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md), [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md), [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md)

#### Backend Implementation
- [ ] MediaURL Value Object 구현
- [ ] 파일 업로드 검증 로직
- [ ] Commands 정의 (UploadMedia, DeleteMediaFile)
- [ ] Events 정의 (MediaUploaded, MediaFileDeleted)
- [ ] 파일 크기/MIME 타입 검증

#### Database
- [ ] 미디어 관련 JSONB 인덱스 최적화

#### Server Actions
- [ ] manageMediaAction (미디어 관리)
- [ ] uploadMediaAction (파일 업로드)
- [ ] deleteMediaAction (파일 삭제)

#### Frontend
- [ ] MediaProperty 컴포넌트
- [ ] 파일 드래그 앤 드롭 UI
- [ ] 업로드 진행률 표시
- [ ] 파일 미리보기 기능
- [ ] 파일 삭제 UI

---

### Supabase Storage (통합)
**참조 문서**: Supabase Storage API

#### Backend Implementation
- [ ] Supabase Storage 클라이언트 설정
- [ ] 파일 업로드 로직
- [ ] Public URL 생성
- [ ] 파일 삭제 로직 (선택적)
- [ ] 워크스페이스별 버킷 분리

#### Frontend
- [ ] Supabase Storage 연동
- [ ] 파일 업로드 진행률 추적
- [ ] 에러 처리 및 재시도

---

### 도메인 간 통합
- [ ] Block Management ↔ Supabase Storage (파일 업로드)
- [ ] 파일 업로드 권한 검증
- [ ] 에러 처리 및 롤백
- [ ] 파일 보안 검증

---

### Testing & Quality
- [ ] Unit Tests (파일 검증 로직)
- [ ] Integration Tests (Supabase Storage 연동)
- [ ] E2E Tests (미디어 업로드 전체 플로우)
- [ ] 성능 테스트 (10MB 파일 30초 이내 업로드)

## 🎯 Definition of Done

### 기능 완료
- [ ] 모든 시나리오가 정상 동작함
- [ ] 미디어 파일 업로드 기능 완성
- [ ] 파일 업로드 진행률 표시 완성
- [ ] 파일 삭제 기능 완성
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
**현재**: 65% 완료 (MediaURL VO + Image/PDF 블록 업로드 & 뷰어 UI 통합, 서버 액션/권한 검증 진행 전)

### ✅ 완료된 구현 (2025-10-24 기준)
- **Value Objects**: MediaURL 완전 구현 (URL 검증, 파일 타입 검증, 파일 크기 제한)
- **Frontend Blocks**: Image/PDF 블록에서 Supabase 업로드·진행률·미리보기 UI 통합, 캡션 및 페이지 네비게이션 제공
- **Testing**: MediaURL Value Object 단위 테스트 완전 구현

### ❌ 미구현 사항
- **Server Actions**: manageMediaAction, uploadMediaAction, deleteMediaAction 미구현
- **Supabase Storage 연동**: 서버 액션 기반 파일 업로드/삭제, Workspace 권한 검증, 세션 기반 Supabase 클라이언트 미구현
- **Frontend Components**: MediaInput 컴포넌트 미구현 (PropertyInput에 통합 가능)
- **삭제 흐름**: 파일 삭제 UI 및 properties ↔ Storage 연동 미구현
- **Testing**: Integration Tests, E2E Tests 미구현

## 🔗 의존성
- **선행 Story**: BM-004 (속성 값 관리)
- **후행 Story**: BM-006 (블록 툴 실행)
- **도메인 의존성**: Block Management Domain ↔ Supabase Storage

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [Process Model](../../../event-domain-design/domains/block-management-domain/02-process-model.md) - Scenario 3
- [Software Design](../../../event-domain-design/domains/block-management-domain/03-software-design.md) - MediaURL
- [Testing Strategy](../../../event-domain-design/domains/block-management-domain/05-testing-strategy.md) - Scenario 3 테스트 전략
- [Technical Specification](../../../event-domain-design/domains/block-management-domain/04-technical-specification.md) - 구현 가이드
- [Database Schema](../../../event-domain-design/domains/block-management-domain/04-db-schema.md) - properties JSONB
- [Frontend Specification](../../../event-domain-design/domains/block-management-domain/04-frontend-specification.md) - MediaProperty 컴포넌트

### Agile Planning
- [Epic 문서](../../epics/epic-001-block-management.md)
