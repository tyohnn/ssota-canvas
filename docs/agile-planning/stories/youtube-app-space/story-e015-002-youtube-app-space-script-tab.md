# Story E015-002: YouTube App Space 도메인 구축 및 Script 탭 구현

## 🎯 Story 개요
**User Story**: As a 사용자 I want to YouTube 블록의 스크립트를 효율적으로 관리하고 Script 탭에서 편집할 수 있어야 so that 데이터 중복 없이 YouTube 스크립트를 재사용하고 편집할 수 있다

**Story Points**: 21pts  
**우선순위**: High  
**Epic**: Epic-015 Editor Panel Dynamic Tabs & YouTube App Space  
**Domain**: YouTube App Space Domain, Block Management Domain

**Story ID 규칙**: `E015-002` (Epic-015의 두 번째 Story)

## 📋 수용 기준 (Acceptance Criteria)

### 시나리오 1: YouTube App Space 스키마 구축
```gherkin
Given YouTube 데이터를 관리하려고 한다
When youtube-app-space 스키마를 생성한다
Then youtubes 테이블과 channels 테이블이 생성된다
And 스크립트는 JSONB 필드에 저장된다
And 썸네일은 YouTube CDN 링크를 사용한다
And RLS 정책이 적용되어 블록 소유자만 접근 가능하다
```

### 시나리오 2: YouTube 데이터 생성 및 조회
```gherkin
Given YouTube 영상 URL이 입력되었다
When createYoutubeAction을 호출한다
Then YouTube 메타데이터가 조회되어 저장된다
And 기존에 같은 videoId가 있으면 재사용한다
And 블록 properties에 youtubeId가 저장된다
```

### 시나리오 3: 스크립트 추출 및 저장
```gherkin
Given YouTube 영상이 생성되었다
When extractScriptAction을 호출한다
Then YouTube API로 스크립트가 추출된다
And 스크립트가 JSONB 형식으로 저장된다
And 같은 YouTube 영상은 스크립트를 재사용한다
```

### 시나리오 4: Script 탭에서 스크립트 표시
```gherkin
Given YouTube 블록이 선택되어 있다
When Script 탭을 클릭한다
Then YouTube 스크립트가 표시된다
And 스크립트가 없으면 추출 버튼이 표시된다
And 스크립트를 편집할 수 있다
```

### 시나리오 5: 권한 기반 접근 제어
```gherkin
Given 사용자가 YouTube 스크립트에 접근하려고 한다
When getYoutubeScriptAction을 호출한다
Then 사용자가 해당 YouTube를 가진 블록을 소유하는지 확인한다
And 권한이 없으면 접근이 거부된다
And 권한이 있으면 스크립트가 반환된다
```

## 📋 개발 Task (도메인별)

### YouTube App Space Domain
**참조 문서**: 
- [구현 계획](../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
- [백엔드 패턴 가이드](../../../../patterns/backend/server-side-ddd-conventions.md)
- [Image App Space 스키마](../../../../apps/web/src/db/schemas/image-app-space-schema.ts) (패턴 참고)

#### Database
- [x] YouTube 데이터 스키마 생성
- [x] YouTube 영상 정보 테이블 생성
  - 영상 ID, 제목, 설명, 채널 정보, 썸네일
  - 스크립트 데이터 저장 필드
  - 통계 정보 필드
- [x] 채널 정보 테이블 생성
  - 채널 ID, 이름, 설명
  - 구독자 수, 영상 수
- [x] 권한 정책 적용
  - 블록 소유자만 스크립트 접근 가능
  - 채널 정보는 공개 데이터
- [x] 성능 최적화를 위한 인덱스 추가

#### Backend Implementation
- [x] YouTube 도메인 모델 정의
  - YouTube 영상 및 채널 엔티티
  - 명령 및 이벤트 정의
- [x] YouTube 데이터 저장소 구현
  - YouTube 영상 조회, 생성, 업데이트 기능
  - 채널 정보 관리 기능
- [x] YouTube 비즈니스 로직 구현
  - YouTube 영상 생성 또는 조회 기능
  - 스크립트 추출 기능
  - 채널 정보 관리 기능
- [x] YouTube API 연동
  - YouTube 메타데이터 조회
  - 스크립트 추출

#### Server Actions
- [x] YouTube 데이터 생성 액션
  - YouTube 메타데이터 조회 및 저장
  - 권한 검증 포함
- [x] 스크립트 추출 액션
  - YouTube API로 스크립트 추출
  - 스크립트 저장
  - 권한 검증 포함
- [x] 스크립트 조회 액션
  - 스크립트 조회
  - 권한 검증 포함

---

### Block Management Domain
**참조 문서**: 
- [구현 계획](../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)

#### Backend Implementation
- [x] YouTube 블록 속성 업데이트
  - 스크립트 필드 제거
  - YouTube ID 참조 필드 추가

#### Frontend Implementation
- [x] Script 탭 컴포넌트 구현
  - 스크립트 조회 및 표시
  - 스크립트 편집 UI
  - 스크립트 추출 기능
- [x] Script 탭을 YouTube 블록 탭에 연결

---

### 도메인 간 통합
- [x] **YouTube App Space → Block Management 연동**
  - 블록 properties에 `youtubeId` 저장
  - YouTube 데이터 조회 시 블록 소유권 확인
- [x] **Block Management → YouTube App Space 연동**
  - Script 탭에서 YouTube 스크립트 표시
  - 스크립트 추출 버튼 클릭 시 `extractScriptAction` 호출

---

### Testing & Quality
- [x] Unit Tests (Repository, Service Functions)
- [x] Integration Tests (Server Actions, 권한 검증)
- [ ] E2E Tests (YouTube 생성 → 스크립트 추출 → Script 탭 표시)
- [x] 데이터 중복 제거 테스트 (같은 영상 100개 블록 사용 시 1개만 저장)
- [x] RLS 정책 테스트 (권한 없는 사용자 접근 차단)
- [x] JSONB 쿼리 성능 테스트

## 🎯 Definition of Done

### 기능 완료
- [x] YouTube App Space 스키마 및 테이블 생성 완료
- [x] YouTube 데이터 생성, 조회, 스크립트 추출 기능 완료
- [x] Script 탭에서 스크립트 표시 및 편집 기능 완료
- [x] 권한 기반 접근 제어 정상 동작
- [x] 데이터 중복 제거 정상 동작 (같은 영상 재사용)

### 기술 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료
- [x] 백엔드 패턴 준수
- [x] 권한 정책 적용 완료

### 품질 완료
- [x] 스크립트 조회 성능: 500ms 이내
- [x] 데이터 중복 제거: 같은 영상 100개 블록 사용 시 1개만 저장
- [x] 보안 취약점 0개
- [x] 권한 검증 로직 정상 동작

## 📊 진행 상황
**현재**: 95% 완료 (구현 완료, E2E 테스트 및 코드 리뷰 남음)

## 🔗 의존성
- **선행 Story**: E015-001 (동적 탭 시스템 구축 후 Script 탭 연동)
- **후행 Story**: 없음
- **도메인 의존성**: 
  - YouTube App Space Domain (신규 도메인)
  - Block Management Domain (블록 properties 업데이트)

## 📁 관련 문서

### Domain Documentation
**YouTube App Space Domain** (신규):
- [구현 계획](../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
- [백엔드 패턴 가이드](../../../../patterns/backend/server-side-ddd-conventions.md)
- [Image App Space 스키마](../../../../apps/web/src/db/schemas/image-app-space-schema.ts) (패턴 참고)

**Block Management Domain**:
- [구현 계획](../../../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)

### Agile Planning
- [Epic 문서](../../../epics/epic-015-editor-panel-tabs-youtube-app-space.md)
