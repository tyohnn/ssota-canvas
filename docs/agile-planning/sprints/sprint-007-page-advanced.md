# Sprint 007: Page Advanced Features

## 🎯 Sprint 개요
**목표**: Page 드래그앤드롭 이동, 제목/아이콘 인라인 편집, 즐겨찾기 기능을 완성하여 Epic-001을 완료한다  
**기간**: 2025-12-22 ~ 2026-01-05 (2주)  
**팀**: 개발팀 2명 (Backend 1명, Full-stack 1명)  
**용량**: 80시간 (2명 × 10일 × 4시간)  
**Epic**: Epic-001 Core Platform Foundation  
**완료 상태**: 📋 계획 중

---

## 📋 포함 Story

### Story-004 (=Story-012): Page 생성 및 계층 구조 관리 ✅ (8 points)
**목표**: Workspace 멤버가 Page를 드래그앤드롭으로 이동하고 제목/아이콘을 편집  
**담당자**: Full-stack Developer  
**시작일**: 2025-10-12  
**완료일**: 2025-10-13  
**상태**: ✅ **완료** (1일 완료)

**실제 구현** (2025-10-13):
- ✅ @headless-tree/core 기반 드래그앤드롭 (dnd-kit 대신)
- ✅ movePageAction + reorderPagesAction 구현
- ✅ updatePageInfoAction 구현
- ✅ 제목 인라인 편집 (Input 전환)
- ✅ 순환 참조 방지 (재귀 CTE)
- ✅ Optimistic Update 완전 구현
- ✅ 헬퍼 함수 추출 (메모리 최적화)
- ✅ 87개 테스트 통과

### Story-013: 페이지 즐겨찾기 토글 (3 points)
**목표**: 자주 사용하는 페이지를 즐겨찾기에 추가  
**담당자**: Frontend Developer  
**시작일**: 2025-12-29 (Week 2)  
**예상 완료일**: 2026-01-02 (Week 2)  
**상태**: 📋 계획 중

**계획된 구현** (Week 2):
- Star 아이콘 토글
- togglePageFavoriteAction 구현
- Optimistic update
- 사이드바 즐겨찾기 섹션 업데이트
- 즐겨찾기 순서 관리

---

## 📅 Sprint 일정

### Week 1 (2025-12-22 ~ 2025-12-28)
- **월요일 (12-22)**: Sprint 킥오프, Story-012 드래그앤드롭 시작
- **화요일 (12-23)**: Story-012 @dnd-kit 통합
- **수요일 (12-24)**: Story-012 movePageAction 구현
- **목요일 (12-25)**: Story-012 인라인 편집 구현
- **금요일 (12-26)**: Story-012 완료, 테스트

### Week 2 (2025-12-29 ~ 2026-01-05)
- **월요일 (12-29)**: Story-013 시작 (즐겨찾기)
- **화요일 (12-30)**: Story-013 Backend 구현
- **수요일 (12-31)**: Story-013 Frontend 구현
- **목요일 (01-01)**: Story-013 Optimistic update
- **금요일 (01-02)**: Story-013 완료, 전체 통합 테스트
- **월요일 (01-05)**: Epic-001 회고 및 데모

---

## 🔗 의존성 및 리스크

### 의존성
**선행 Sprint**: 
- Sprint 001-005 ✅/🔄/📋
- Sprint 006 (Workspace Invitation & Page) 📋

**내부 의존성**: 
- Story-012 → Story-013 (Page 생성 완료)

**도메인 의존성**:
- Workspace Management Domain (Page 트리)

### 리스크 및 해결 방안
**기술적 리스크**: 
- @dnd-kit 러닝 커브 (High) → 공식 문서 및 예제 학습
- 드래그앤드롭 성능 이슈 (Medium) → 최적화 (useSensors)
- 순환 참조 방지 복잡도 (Medium) → 조상 조회 재귀 함수

**일정 리스크**: 
- 드래그앤드롭 구현 시간 예상 초과 (High) → 3일 할당
- 인라인 편집 UX 복잡도 (Medium) → 1일 할당

**리소스 리스크**: 
- Full-stack 개발자 집중 필요 (High) → Story-012 전담

---

## 🎯 완료 기준

### 기능적 완료 (Story-004: 완료 ✅)
- [x] 드래그앤드롭 Page 이동 정상 동작 ✅
- [x] 순환 참조 방지 정상 동작 ✅
- [x] 제목/아이콘 인라인 편집 정상 동작 ✅
- [x] Optimistic update 정상 동작 ✅
- [ ] 즐겨찾기 토글 정상 동작 (Story-013 대기)
- [ ] 사이드바 즐겨찾기 섹션 업데이트 (Story-013 대기)

### 기술적 완료 (Story-004: 완료 ✅)
- [x] 단위 테스트 커버리지 100% ✅
- [x] Integration 테스트 통과 (87개) ✅
- [ ] E2E 테스트 통과 (향후 구현)
- [x] 코드 리뷰 완료 ✅
- [x] 성능 요구사항 충족 (71% 코드 감소, 메모리 최적화) ✅

### 품질 완료 (Story-004: 완료 ✅)
- [x] RLS 정책 적용 ✅
- [x] 권한 검증 완료 ✅
- [x] Optimistic update 적용 ✅
- [x] 접근성 기준 충족 (키보드 드래그앤드롭 지원) ✅
- [ ] Epic-001 전체 기능 완료 (Story-013 남음)

---

## 🎉 Epic-001 완료 회고 (예정)

### Epic-001: Core Platform Foundation 요약
- **기간**: 2025-09-29 ~ 2026-01-05 (14주, 7 Sprints)
- **총 Story**: 13개
- **총 Points**: 57pts
- **완료율**: 100% (예정)

### 도메인별 성과
1. **User Management**: 사용자 인증, 프로필 생성, 기본 조직 생성 ✅
2. **Organization Management**: 조직 CRUD, 멤버 초대, 역할 관리 ✅
3. **Workspace Management**: Workspace/Page 관리, 네비게이션, 멤버 초대 ✅

### 기술적 성과
- ✅ Domain-Driven Design 적용 (3개 도메인)
- ✅ Layered Security Model (RLS + Application-level)
- ✅ Layered Authorization (Frontend UX + Backend 보안)
- ✅ 재귀 CTE 기반 Page 트리 조회
- ✅ @headless-tree/core 통합 및 마스터 (tree.rebuildTree)
- ✅ @headless-tree/core 드래그앤드롭 (dnd-kit 대신)
- ✅ Optimistic Update 패턴 완전 구현
- ✅ 헬퍼 함수 추출 (메모리 최적화, 71% 코드 감소)
- ✅ 187+ 테스트 작성 및 통과

---

## 📁 관련 문서
- [Epic-001: Core Platform Foundation](../epics/epic-001-user-management.md)
- [Workspace Management Stories](../stories/workspace-management/README.md)
- [Story-004: Page 생성 및 관리](../stories/workspace-management/story-004-page-hierarchy-management.md)
- [Story-005: 즐겨찾기](../stories/workspace-management/story-005-page-favorites.md)
- [Process Model](../../event-domain-design/domains/workspace-management-domain/02-process-model.md)
- [Software Design](../../event-domain-design/domains/workspace-management-domain/03-software-design.md)
- [Technical Specification](../../event-domain-design/domains/workspace-management-domain/05-technical-specification.md)

---

## 🚀 다음 Epic
**Epic-002**: Visual Canvas Domain (화이트보드 및 블록 시스템)  
**예정 기간**: 2026-01-05 ~ 2026-03-30 (12주)  
**예정 기능**: 캔버스, 블록 시스템, 실시간 협업

---

*Sprint 007을 통해 Epic-001 Core Platform Foundation을 성공적으로 완료할 예정입니다! 🎉*

**상태**: 📋 계획 중 (Sprint 006 완료 후 시작)

---

## 📊 Epic-001 전체 Sprint 요약

| Sprint | 기간 | Story | Points | 상태 |
|--------|------|-------|--------|------|
| Sprint 001 | Week 1-2 | Story 001-003 | 11 | ✅ 완료 |
| Sprint 002 | Week 3-4 | Story 004-006 | 7 | ✅ 완료 |
| Sprint 003 | Week 5-6 | Story 007-008 | 10 | ✅ 완료 |
| Sprint 004 | Week 7-8 | Story 009 | 5 | 🔄 95% |
| Sprint 005 | Week 9-10 | Story 010, 011 (일부) | 9 | 📋 계획 |
| Sprint 006 | Week 11-12 | Story 011 (완료), 012 (일부) | 8 | 📋 계획 |
| Sprint 007 | Week 13-14 | Story 012 (완료), 013 | 7 | 📋 계획 |

**총 기간**: 14주 (약 3.5개월)  
**총 Points**: 57pts  
**평균 Velocity**: 약 8 points/sprint

