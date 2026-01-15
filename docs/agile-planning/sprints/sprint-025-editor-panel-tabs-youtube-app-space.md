# Sprint 025: Editor Panel Dynamic Tabs & YouTube App Space

## 🎯 Sprint 개요
**목표**: 블록 타입별 동적 탭 시스템을 구축하고 YouTube App Space 도메인을 통해 스크립트 데이터를 효율적으로 관리하여 확장 가능한 에디터 패널과 데이터 재사용 시스템을 완성한다

**기간**: 2026-01-11 ~ 2026-01-24 (2주)  
**팀**: 개발팀  
**용량**: 80시간 (2명 × 10일 × 4시간)  
**Story Points**: 34pts

## 📋 포함 Story

### Story E015-001: 동적 에디터 탭 시스템 구축 (13pts)
**목표**: 블록 타입별로 에디터 패널에 커스텀 탭을 추가할 수 있는 시스템 구축 및 YouTube 블록에 Script/Note 탭 추가  
**담당자**: 시니어 개발자 + 주니어 개발자  
**예상 완료일**: 2026-01-17

### Story E015-002: YouTube App Space 도메인 구축 및 Script 탭 구현 (21pts)
**목표**: YouTube 데이터를 중앙에서 관리하는 시스템 구축 및 Script 탭에서 스크립트 표시 및 편집 기능 구현  
**담당자**: 시니어 개발자 + 주니어 개발자  
**예상 완료일**: 2026-01-24

## 📅 Sprint 일정

### Week 1 (2026-01-11 ~ 2026-01-17)

#### 월요일 (01-11)
- **E015-001 시작**: 동적 탭 시스템 설계
  - 탭 시스템 아키텍처 설계
  - YouTube 블록 탭 구성 설계

#### 화요일 (01-12)
- **E015-001**: 동적 탭 로딩 시스템 구현
  - 탭 설정 동적 로드 및 캐싱
  - 초기 번들 크기 최적화

#### 수요일 (01-13)
- **E015-001**: 탭 UI 컴포넌트 구현
  - 탭 전환 UI (배지 형태)
  - 탭 콘텐츠 표시

#### 목요일 (01-14)
- **E015-001**: Note 탭 리팩토링 및 통합
  - 기존 markdown content section을 Note 탭으로 변경
  - 에디터 패널에 탭 시스템 통합

#### 금요일 (01-15)
- **E015-001 완료 검증**
  - 탭 전환 테스트
  - 번들 크기 검증
  - 코드 리뷰
- **E015-002 시작**: YouTube 데이터 관리 시스템 설계
  - 데이터베이스 스키마 설계
  - 권한 정책 설계

---

### Week 2 (2026-01-18 ~ 2026-01-24)

#### 월요일 (01-18)
- **E015-002**: YouTube 데이터베이스 스키마 구현
  - 데이터베이스 마이그레이션 스크립트 작성
  - 권한 정책 적용
  - 성능 최적화를 위한 인덱스 추가

#### 화요일 (01-19)
- **E015-002**: YouTube 도메인 모델 및 저장소 구현
  - 도메인 모델 정의
  - 데이터 저장소 구현

#### 수요일 (01-20)
- **E015-002**: YouTube 비즈니스 로직 구현
  - YouTube 영상 생성/조회 기능
  - 스크립트 추출 기능
  - YouTube API 연동

#### 목요일 (01-21)
- **E015-002**: Server Actions 구현
  - YouTube 데이터 생성 액션
  - 스크립트 추출 액션
  - 스크립트 조회 액션
  - 권한 검증 로직 구현

#### 금요일 (01-22)
- **E015-002**: Script 탭 구현
  - Script 탭 컴포넌트 구현
  - 스크립트 표시 및 편집 UI
  - YouTube 블록 탭에 Script 탭 연결

#### 토요일 (01-23)
- **E015-002**: 통합 테스트 및 버그 수정
  - E2E 테스트 실행
  - 데이터 중복 제거 테스트
  - 권한 검증 테스트

#### 일요일 (01-24)
- **E015-002 완료 검증**
  - 모든 테스트 통과 확인
  - 코드 리뷰 완료
  - Sprint 회고

## 🔗 의존성 및 리스크

### 의존성
- **외부 의존성**: 
  - YouTube Data API (스크립트 추출)
  - Supabase (데이터베이스, RLS)
- **내부 의존성**: 
  - Epic-001 Block Management Domain (완료)
  - Workspace Management Domain (권한 관리)

### 리스크
- **기술적 리스크**: 
  - YouTube API 할당량 제한 가능성
    - **대응**: API 호출 최소화, 스크립트 재사용으로 중복 호출 방지
  - Dynamic Import 패턴의 복잡도
    - **대응**: action-prefetch.ts 패턴 참고, 단계적 구현
- **일정 리스크**: 
  - YouTube App Space 도메인 구축이 예상보다 복잡할 수 있음
    - **대응**: image-app-space 패턴 참고, 단계적 구현
  - 스크립트 추출 API 응답 시간이 예상보다 길 수 있음
    - **대응**: 비동기 처리, 로딩 상태 표시

## 🎯 완료 기준

### 기능적 완료
- [x] 동적 탭 시스템 정상 동작
- [x] YouTube 블록에 Script 탭과 Note 탭 표시
- [x] YouTube App Space 스키마 및 테이블 생성 완료
- [x] YouTube 데이터 생성, 조회, 스크립트 추출 기능 완료
- [x] Script 탭에서 스크립트 표시 및 편집 기능 완료
- [x] 권한 기반 접근 제어 정상 동작

### 기술적 완료
- [x] 단위 테스트 커버리지 80% 이상
- [x] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료
- [ ] 번들 크기 검증 완료 (초기 번들에 탭 config 미포함)
- [x] RLS 정책 적용 완료
- [x] 백엔드 패턴 준수 (SafeDTO → Command → Aggregate)

### 품질 완료
- [x] 탭 전환 성능: 100ms 이내
- [x] 스크립트 조회 성능: 500ms 이내
- [x] 데이터 중복 제거: 같은 영상 100개 블록 사용 시 1개만 저장
- [x] 보안 취약점 0개
- [x] 권한 검증 로직 정상 동작

## 📊 진행 상황 추적

### 일일 체크포인트
- [x] **Week 1 월요일**: E015-001 설계 완료
- [x] **Week 1 화요일**: 동적 탭 로딩 시스템 구현 완료
- [x] **Week 1 수요일**: 탭 UI 컴포넌트 구현 완료
- [x] **Week 1 목요일**: Note 탭 리팩토링 및 통합 완료
- [x] **Week 1 금요일**: E015-001 완료, E015-002 시작
- [x] **Week 2 월요일**: 데이터베이스 스키마 구현 완료
- [x] **Week 2 화요일**: 도메인 모델 및 저장소 구현 완료
- [x] **Week 2 수요일**: 비즈니스 로직 구현 완료
- [x] **Week 2 목요일**: Server Actions 구현 완료
- [x] **Week 2 금요일**: Script 탭 구현 완료
- [x] **Week 2 토요일**: 통합 테스트 완료
- [ ] **Week 2 일요일**: E015-002 완료, Sprint 회고

### 주간 체크포인트
- [x] **Week 1 종료**: E015-001 완료, E015-002 시작
- [ ] **Week 2 종료**: E015-002 완료, Sprint 완료

## 📝 구현 완료 내역

### 커밋 정보
- **59a98cf** (2026-01-14): `feat(block): implement youtube app space at backend / shared`
  - YouTube App Space 스키마 및 도메인 구조 구축
  - Entity, Value Objects, Commands, Events 정의
  - Repository 및 Service Functions 구현
  - Server Actions 및 Secure Action wrapper 구현
  
- **f15ddc6** (2026-01-15): `feat(block): implement youtube app space and youtube block at frontend`
  - 동적 탭 시스템 구현 (BlockEditorTabsRegistry)
  - YouTube 블록 탭 설정 및 Script Section 구현
  - Note Section 리팩토링
  - ContentArea 통합

### 주요 완료 항목
- ✅ 동적 탭 시스템 (Dynamic Import + Registry 패턴)
- ✅ YouTube App Space 도메인 전체 구조
- ✅ YouTube 스크립트 추출 및 관리 기능
- ✅ Script 탭 UI 및 기능 구현
- ✅ 권한 기반 접근 제어
- ✅ 데이터 중복 제거 (같은 영상 재사용)

### 남은 작업
- [ ] E2E 테스트 작성 및 실행
- [ ] 번들 크기 검증
- [ ] 코드 리뷰
- [ ] Sprint 회고

## 📁 관련 문서
- [Epic-015: Editor Panel Dynamic Tabs & YouTube App Space](../epics/epic-015-editor-panel-tabs-youtube-app-space.md)
- [Story E015-001: 동적 에디터 탭 시스템 구축](../stories/block-management/story-e015-001-dynamic-editor-tabs.md)
- [Story E015-002: YouTube App Space 도메인 구축 및 Script 탭 구현](../stories/youtube-app-space/story-e015-002-youtube-app-space-script-tab.md)
- [구현 계획](../../.cursor/plans/editor_panel_tab_system_77668b25.plan.md)
