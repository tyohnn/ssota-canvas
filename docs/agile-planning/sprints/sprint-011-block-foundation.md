# Sprint 011: Block Management Foundation

## 🎯 Sprint 개요
**목표**: 3주 동안 블록 생성 및 기본 관리 기능을 완성하여 사용자가 블록을 생성하고 기본 정보를 관리할 수 있도록 한다

**기간**: 2025-10-22 ~ 2025-11-14 (3주)  
**팀**: 개발팀 3명  
**용량**: 180시간 (3명 × 15일 × 4시간)

## 📋 포함 Story

### Story BM-001: 블록 생성 및 기본 관리 (13pts) ✅ 100% 완료
**목표**: Shadow Block → Skeleton Block → Completed Block 흐름 완성  
**담당자**: 시니어 개발자  
**예상 완료일**: 2025-10-29  
**현재 상태**: Domain Layer, Repository Layer, Service Layer, Server Actions, Frontend Components 모두 완전 구현 완료

### Story BM-002: 블록 편집 및 정보 관리 (8pts) ✅ 95% 완료
**목표**: 블록 기본 정보 편집 및 타입 변경 기능 완성  
**담당자**: 주니어 개발자  
**예상 완료일**: 2025-11-01  
**현재 상태**: Backend Domain, Database, Server Actions, Frontend Components 완전 구현, RLS 정책만 미완성

### Story BM-003: 커스텀 속성 관리 (21pts) ✅ 90% 완료
**목표**: 커스텀 속성 추가/편집/삭제 및 타입별 설정 기능 완성  
**담당자**: 시니어 개발자  
**예상 완료일**: 2025-11-07  
**현재 상태**: Value Objects, Backend Entity, Frontend Components 완전 구현, Server Actions만 미구현

### Story BM-004: 속성 값 관리 (13pts) → Sprint 012로 이동
**목표**: 속성 값 입력 및 타입별 검증 기능 완성  
**담당자**: 주니어 개발자  
**예상 완료일**: 2025-11-13 (Sprint 012에서)  
**현재 상태**: 기본 UI 구현, 백엔드 로직 미완성

### Story BM-005: 미디어 업로드 및 관리 (21pts) → Sprint 012로 이동
**목표**: 미디어 파일 업로드 및 Supabase Storage 연동 완성  
**담당자**: 시니어 개발자  
**예상 완료일**: 2025-11-20 (Sprint 012에서)  
**현재 상태**: 기본 UI 구조만 구현

### Story BM-006: 블록 툴 실행 (13pts) → Sprint 013으로 이동
**목표**: 블록 타입별 특화 기능 실행 및 결과 처리 완성  
**담당자**: 주니어 개발자  
**예상 완료일**: 2025-12-05 (Sprint 013에서)  
**현재 상태**: 기본 Hook 구조만 구현

## 📅 Sprint 일정 (TDD 기반 구현)

### Week 1: BM-001 완성 (TDD Phase 1-6)
- **월요일**: BM-001 Frontend 컴포넌트 TDD 구현 (Editor Panel, PropertyInput)
- **화요일**: BM-001 RLS 정책 TDD 구현 및 보안 강화
- **수요일**: BM-001 Canvas 연동 TDD 구현
- **목요일**: BM-002 블록 편집 기능 TDD 개발 시작
- **금요일**: BM-002 블록 타입 변경 기능 TDD 구현

### Week 2: BM-003 완성 (TDD Phase 1-6)
- **월요일**: BM-003 Value Objects TDD 구현 (PropertyType, PropertyOption, PropertyValidation)
- **화요일**: BM-003 Backend Logic TDD 구현 (속성 타입별 검증 로직)
- **수요일**: BM-003 Frontend Components TDD 구현 (Field Popover 중첩 구조)
- **목요일**: BM-003 선택형 속성 옵션 관리 TDD 구현
- **금요일**: BM-003 통합 테스트 및 버그 수정

### Week 3: BM-002 완성 및 품질 보장 (TDD Phase 1-6)
- **월요일**: BM-002 Backend Domain TDD 구현 (BlockAggregate 편집 로직, UpdateBlockCommand, BlockUpdatedEvent)
- **화요일**: BM-002 Database TDD 구현 (블록 업데이트 인덱스 최적화, updated_at 자동 갱신 트리거)
- **수요일**: BM-002 Server Actions TDD 구현 (updateBlockAction, changeBlockTypeAction)
- **목요일**: BM-002 Frontend TDD 구현 (Editor Panel, 블록 정보 편집 폼, 실시간 업데이트 기능)
- **금요일**: Sprint 011 완료 및 Sprint 012 준비

## 🔗 의존성 및 리스크

### 의존성
- **외부 의존성**: Canvas Management Domain, Supabase Auth
- **내부 의존성**: BM-001 → BM-002 → BM-003 순차 진행
- **도메인 연동**: Block Management ↔ Canvas Management
- **후속 Sprint 의존성**: Sprint 012 (BM-004, BM-005), Sprint 013 (BM-006)

### 리스크
- **기술적 리스크**: 
  - 블록 상태 전환 로직의 복잡성
  - RLS 정책 적용의 복잡성
  - Field Popover 중첩 구조의 복잡성
- **일정 리스크**: 
  - BM-003의 높은 복잡도 (21pts)
  - 3주 일정 내 완료 필요
- **리소스 리스크**: 
  - 시니어 개발자 1명이 BM-001, BM-003 담당
  - 주니어 개발자 1명이 BM-002 담당

## 🎯 완료 기준

### 기능적 완료
- [x] ✅ 블록 생성 흐름 정상 동작 (BM-001 100% 완료)
- [x] ✅ 블록 편집 기능 정상 동작 (BM-002 95% 완료)
- [x] ✅ 커스텀 속성 관리 UI 정상 동작 (BM-003 90% 완료, Frontend 완전 구현, Server Actions만 미구현)
- [x] ✅ 블록 상태 관리 시스템 완성 (스켈레톤/완성 상태 전환)
- [x] ✅ 에러 케이스 처리

### 기술적 완료
- [x] 단위 테스트 커버리지 85% 이상 (BM-001, BM-002, BM-003 완료)
- [x] TDD 기반 구현 완료 (Value Objects, Commands, Events, Aggregates)
- [x] 코드 리뷰 완료
- [x] 성능 요구사항 충족 (블록 생성 응답 시간 2초 이내)

### 품질 완료
- [ ] RLS 정책 적용 완료 (blocks 테이블)
- [ ] 권한 검증 로직 구현 완료
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황 추적

### 일일 체크포인트
- [x] **월요일**: BM-001 개발 환경 설정 및 기본 구조 구현
- [x] **화요일**: BM-001 블록 상태 전환 로직 구현
- [x] **수요일**: BM-001 Canvas 연동 및 렌더링 구현
- [x] **목요일**: BM-002 블록 편집 기능 구현
- [x] **금요일**: BM-002 블록 타입 변경 기능 구현

### 주간 체크포인트
- [x] **Week 1 종료**: BM-001, BM-002 완료
- [x] **Week 2 종료**: BM-003 완료 및 통합 테스트

## 📁 관련 문서
- [Epic 문서](../epics/epic-001-block-management.md)
- [Story BM-001](../stories/block-management/story-bm-001-block-creation.md)
- [Story BM-002](../stories/block-management/story-bm-002-block-editing.md)
- [Story BM-003](../stories/block-management/story-bm-003-custom-properties.md)
