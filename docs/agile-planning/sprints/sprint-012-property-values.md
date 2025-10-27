# Sprint 012: Property Values & Media Management

## 🎯 Sprint 개요
**목표**: 2주 동안 속성 값 관리 및 미디어 업로드 기능을 완성하여 사용자가 블록에 실제 데이터를 입력하고 미디어를 관리할 수 있도록 한다

**기간**: 2025-11-15 ~ 2025-11-28 (2주)  
**팀**: 개발팀 3명  
**용량**: 120시간 (3명 × 10일 × 4시간)

## 📋 포함 Story

### Story BM-004: 속성 값 관리 (13pts) 🔄 70% 완료
**목표**: 다양한 속성 타입별 값 입력 및 실시간 저장 기능 완성  
**담당자**: 주니어 개발자  
**예상 완료일**: 2025-11-22  
**현재 상태**: Frontend Hooks, PropertyInput 컴포넌트 완전 구현, 백엔드 검증 로직 구현 필요

### Story BM-005: 미디어 업로드 및 관리 (21pts) 🔄 30% 완료
**목표**: 미디어 파일 업로드, 진행률 표시, URL 저장, 소프트 삭제 기능 완성  
**담당자**: 시니어 개발자  
**예상 완료일**: 2025-11-28  
**현재 상태**: MediaURL Value Object, 기본 UI 구조 구현, Supabase Storage 연동 필요

## 📅 Sprint 일정

### Week 1: 속성 값 관리 완성
- **월요일**: BM-004 속성 값 관리 백엔드 로직 구현
- **화요일**: BM-004 Workspace Management 연동 구현
- **수요일**: BM-004 속성 값 검증 로직 구현
- **목요일**: BM-004 실시간 저장 및 자동 저장 기능 구현
- **금요일**: BM-004 통합 테스트 및 버그 수정

### Week 2: 미디어 업로드 완성
- **월요일**: BM-005 미디어 업로드 Supabase Storage 연동 구현
- **화요일**: BM-005 파일 업로드 검증 로직 구현
- **수요일**: BM-005 업로드 진행률 표시 및 드래그앤드롭 UI 구현
- **목요일**: BM-005 미디어 관리 및 소프트 삭제 구현
- **금요일**: 통합 테스트 및 성능 최적화

## 🔗 의존성 및 리스크

### 의존성
- **외부 의존성**: Supabase Storage, Supabase Auth, Workspace Management Domain
- **내부 의존성**: BM-004 → BM-005 순차 진행
- **이전 Sprint 의존성**: Sprint 011의 블록 생성 및 커스텀 속성 관리 기능
- **도메인 연동**: Block Management ↔ Workspace Management ↔ Supabase Storage

### 리스크
- **기술적 리스크**: 
  - 미디어 업로드 성능 및 에러 처리
  - Workspace Management 연동의 권한 검증 복잡성
  - Supabase Storage 연동의 복잡성
- **일정 리스크**: 
  - BM-005의 높은 복잡도 (21pts)
  - 2주 일정 내 완료 필요
- **외부 의존성 리스크**: 
  - Supabase Storage 서비스 장애
  - Workspace Management Domain 연동 지연

## 🎯 완료 기준

### 기능적 완료
- [ ] 모든 속성 타입별 값 입력 정상 동작 (BM-004)
- [ ] 실시간 저장 기능 정상 동작 (BM-004)
- [ ] 미디어 업로드 기능 정상 동작 (BM-005)
- [ ] 미디어 관리 기능 정상 동작 (BM-005)
- [ ] 에러 케이스 처리

### 기술적 완료
- [ ] 단위 테스트 커버리지 85% 이상
- [ ] E2E 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 성능 요구사항 충족 (업로드 속도, 동시성)

### 품질 완료
- [ ] 파일 업로드 보안 검증 완료
- [ ] 미디어 파일 형식 검증 완료
- [ ] Workspace Management 연동 권한 검증 완료
- [ ] 접근성 기준 충족
- [ ] 보안 취약점 0개

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **월요일**: BM-004 속성 값 관리 백엔드 로직 구현
- [ ] **화요일**: BM-004 Workspace Management 연동 구현
- [ ] **수요일**: BM-004 속성 값 검증 로직 구현
- [ ] **목요일**: BM-004 실시간 저장 및 자동 저장 기능 구현
- [ ] **금요일**: BM-004 통합 테스트 및 버그 수정

### 주간 체크포인트
- [ ] **Week 1 종료**: BM-004 완료
- [ ] **Week 2 종료**: BM-005 완료 및 통합 테스트

## 📁 관련 문서
- [Epic 문서](../epics/epic-001-block-management.md)
- [Story BM-004](../stories/block-management/story-bm-004-property-values.md)
- [Story BM-005](../stories/block-management/story-bm-005-media-upload.md)
