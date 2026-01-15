# Story E015-001: 동적 에디터 탭 시스템 구축

## 🎯 Story 개요
**User Story**: As a 사용자 I want to 블록 타입별로 에디터 패널에 커스텀 탭을 사용할 수 있어야 so that 각 블록 타입에 맞는 특화된 편집 경험을 제공받을 수 있다

**Story Points**: 13pts  
**우선순위**: High  
**Epic**: Epic-015 Editor Panel Dynamic Tabs & YouTube App Space  
**Domain**: Block Management Domain

**Story ID 규칙**: `E015-001` (Epic-015의 첫 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: 동적 탭 시스템 구축
```gherkin
Given 개발자가 블록 타입별 탭을 정의하려고 한다
When 탭 설정 파일을 작성한다
Then 탭이 동적으로 로드된다
And 초기 번들에 탭 설정이 포함되지 않는다
And 탭 설정은 필요 시에만 로드되어 캐싱된다
```

### 시나리오 2: YouTube 블록 탭 표시
```gherkin
Given YouTube 블록이 선택되어 있다
When 에디터 패널이 열린다
Then Script 탭과 Note 탭이 배지 형태로 표시된다
And 기본 탭은 Script 탭이다
And 탭을 클릭하면 해당 탭의 콘텐츠가 표시된다
```

### 시나리오 3: Note 탭 리팩토링
```gherkin
Given 기존 markdown content section이 있다
When Note 탭으로 리팩토링한다
Then 기존 기능이 유지된다
And Note 탭 아래에 markdown editor가 표시된다
And Content Section으로 Script 탭과 Note 탭이 그룹화된다
```

### 시나리오 4: 탭 전환 및 상태 관리
```gherkin
Given 에디터 패널에 여러 탭이 있다
When 사용자가 탭을 전환한다
Then 선택된 탭이 하이라이트된다
And 탭 콘텐츠가 부드럽게 전환된다
And 탭 상태가 유지된다
```

## 📋 개발 Task (도메인별)

### Block Management Domain
**참조 문서**: 
- [구현 계획](../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
- [action-prefetch.ts](../../../../apps/web/src/domains/block-management/frontend/components/block/block-action-bar/action-prefetch.ts) (패턴 참고)

#### Frontend Implementation
- [x] 탭 시스템 타입 정의
  - 탭 인터페이스 및 설정 타입 정의
- [x] 동적 탭 로딩 시스템 구현
  - 탭 설정 동적 로드 및 캐싱
  - 초기 번들 크기 최적화
- [x] YouTube 블록 탭 설정
  - Script 탭, Note 탭 정의
  - 기본 탭: Script
- [x] 탭 UI 컴포넌트 구현
  - 탭 전환 UI (배지 형태)
  - 탭 콘텐츠 표시
- [x] Note 탭 리팩토링
  - 기존 markdown content section을 Note 탭으로 변경
  - 기존 기능 유지
- [x] 에디터 패널 통합
  - 탭 시스템을 에디터 패널에 통합
  - 탭이 없는 블록 타입은 기존 방식 유지

#### Testing & Quality
- [x] Unit Tests (Registry 로직, 탭 전환)
- [x] Integration Tests (탭 config 동적 로드)
- [ ] E2E Tests (YouTube 블록 탭 전환)
- [ ] 번들 크기 검증 (초기 번들에 config 미포함 확인)
- [x] (선택) Details hover 시 config prefetch 구현

## 🎯 Definition of Done

### 기능 완료
- [x] 동적 탭 시스템이 정상 동작함
- [x] YouTube 블록에 Script 탭과 Note 탭이 표시됨
- [x] 탭 전환이 부드럽게 동작함
- [x] Note 탭에서 기존 markdown 편집 기능이 유지됨

### 기술 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료
- [ ] 번들 크기 검증 완료 (초기 번들에 탭 config 미포함)

### 품질 완료
- [x] 탭 전환 성능: 100ms 이내
- [x] 접근성 기준 충족
- [x] 보안 취약점 0개

## 📊 진행 상황
**현재**: 95% 완료 (구현 완료, E2E 테스트 및 번들 검증 남음)

## 🔗 의존성
- **선행 Story**: 없음
- **후행 Story**: E015-002 (YouTube App Space 구축 후 Script 탭 연동)
- **도메인 의존성**: Block Management Domain (에디터 패널 구조)

## 📁 관련 문서

### Domain Documentation
**Block Management Domain**:
- [구현 계획](../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
- [action-prefetch.ts](../../../../apps/web/src/domains/block-management/frontend/components/block/block-action-bar/action-prefetch.ts) (패턴 참고)
- [toolbar-prefetch.ts](../../../../apps/web/src/domains/block-management/frontend/components/block/block-original-toolbar/toolbar-prefetch.ts) (패턴 참고)

### Agile Planning
- [Epic 문서](../../../epics/epic-015-editor-panel-tabs-youtube-app-space.md)
