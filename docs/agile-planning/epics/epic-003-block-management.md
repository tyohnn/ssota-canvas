# Epic-003: Block Management Domain

## 🎯 Epic 개요
**Epic Goal**: As a 사용자, I want to 블록을 생성하고 관리할 수 있어야 so that 콘텐츠를 체계적으로 구성하고 관리할 수 있다

**기간**: 2025-10-22 ~ 2025-12-06 (6주)  
**Story Points**: 89pts  
**완료된 Points**: 66.75pts (약 75% 완료)  
**우선순위**: High  
**현재 상태**: 🔄 진행 중 (Sprint 012, 013 진행 중)

## 📊 비즈니스 가치
**문제**: 사용자가 다양한 타입의 블록을 생성하고 관리할 수 있는 체계적인 시스템이 필요함
**해결책**: Canvas Management Domain과 연동되는 Block Management 시스템 구축
**기대 효과**: 사용자가 직관적으로 블록을 생성, 편집, 관리할 수 있는 완전한 블록 관리 경험 제공

## 🎯 성공 기준

### 기능적 기준
- [x] ✅ **블록 생성**: Shadow Block → Skeleton Block → Completed Block 흐름 완성 (BM-001: 100% 완료)
- [x] ✅ **커스텀 속성 관리**: 속성 추가/편집/삭제 기능 완성 (BM-003: 90% 완료 - Frontend 완전 구현, Server Actions만 미구현)
- [x] ✅ **속성 값 관리**: 타입별 동적 입력 및 자동 저장 기능 완성 (BM-004: 85% 완료 - Frontend 완전 구현, Workspace Management 연동만 미구현)
- [ ] **미디어 업로드**: Supabase Storage 연동 및 파일 관리 기능 완성 (BM-005: 40% 완료 - MediaURL VO만 구현, Server Actions 및 Storage 연동 미구현)
- [ ] **블록 툴 실행**: 블록 타입별 특화 기능 실행 및 결과 처리 완성 (BM-006: 60% 완료 - 사용자 툴 실행 완전 구현, AI 연동만 미구현)

### 성능 기준
- [x] ✅ **블록 생성 응답 시간**: 2초 이내 (BM-001 완료)
- [x] ✅ **속성 업데이트 응답 시간**: 1초 이내 (BM-004 완료)
- [ ] **미디어 업로드**: 10MB 이내 파일 30초 이내 업로드 (BM-005 미완성)
- [x] ✅ **툴 실행**: 30초 이내 완료 (BM-006 사용자 툴 실행 완료)

### 사용성 기준
- [x] ✅ **직관적인 블록 생성 흐름**: Shadow → Skeleton → Completed (BM-001 완료)
- [x] ✅ **Notion 스타일 Editor Panel 사용성**: (BM-001, BM-002 완료)
- [x] ✅ **타입별 동적 속성 입력 UI**: PropertyInput 컴포넌트 (BM-004 완료)
- [x] ✅ **실시간 자동 저장 기능**: useBlockPropertyUpdate Hook (BM-004 완료)

### 품질 기준
- [x] ✅ **단위 테스트 커버리지 85% 이상**: BM-001, BM-002, BM-003 완료
- [ ] **E2E 테스트 통과**: 부분 완료
- [ ] **RLS 정책 적용 완료**: blocks 테이블 RLS 정책 미완성 (BM-002에서 처리 예정)
- [ ] **보안 취약점 0개**: 보안 검증 필요

## 📋 포함 기능

### 핵심 기능
- **블록 생명주기 관리**: Shadow Block → Skeleton Block → Completed Block
- **커스텀 속성 시스템**: 속성 정의와 값 분리 저장
- **동적 속성 렌더링**: PropertyInput 컴포넌트로 타입별 UI
- **미디어 파일 관리**: Supabase Storage 연동
- **블록 툴 실행**: 타입별 특화 기능 실행

### 지원 기능
- **Editor Panel**: Notion 스타일 우측 슬라이드 패널
- **Field Popover**: 속성 편집을 위한 중첩 팝오버
- **Optimistic Update**: 즉각적인 UI 반응
- **쿠키 기반 영속성**: 선택 상태 유지

### 통합 기능
- **Canvas Management 연동**: 블록 생성 및 마운트
- **Workspace Management 연동**: 권한 기반 접근 제어
- **Supabase Storage 연동**: 미디어 파일 저장
- **Supabase Auth 연동**: 사용자 인증

## 🚫 제외 범위
- **블록 컴포넌트화**: 향후 Block Component Management Domain에서 처리
- **고급 블록 툴**: AI 기반 고급 툴은 별도 Epic에서 처리
- **블록 템플릿**: 블록 템플릿 기능은 별도 Epic에서 처리

## 🔗 의존성
**선행 Epic**: 없음 (최초 구현)  
**후행 Epic**: Block Component Management Domain Epic  
**외부 의존성**: Canvas Management Domain, Workspace Management Domain, Supabase Storage, Supabase Auth

## 🏗️ 기술적 고려사항

### 아키텍처
- **DDD 패턴**: Aggregate, Entity, Value Object, Command, Event
- **의존성 주입**: Service Layer를 통한 도메인 로직 분리
- **Result 패턴**: 함수형 에러 처리
- **DTO 직렬화**: Next.js Server Actions 호환성

### 성능
- **JSONB 인덱싱**: 속성 검색을 위한 GIN 인덱스
- **낙관적 업데이트**: 즉각적인 UI 반응
- **캐싱 전략**: 블록 목록 및 속성 캐싱

### 보안
- **RLS 정책**: 워크스페이스별 블록 접근 제어
- **파일 업로드 보안**: MIME 타입 검증 및 보안 스캔
- **권한 검증**: 블록 생성/편집/삭제 권한 확인

## 📅 마일스톤

### Sprint 011: Block Foundation (완료)
- **Week 1-2**: 블록 생성 및 기본 관리 기능 (Story BM-001, BM-002)
  - ✅ **BM-001**: 100% 완료 (블록 생성, 기본 관리)
  - ✅ **BM-002**: 95% 완료 (블록 편집, RLS 정책만 미완성)
  - ✅ **BM-003**: 90% 완료 (커스텀 속성 관리, Server Actions만 미구현)

### Sprint 012: Property Values & Media Management (진행 중)
- **Week 3-4**: 커스텀 속성 시스템 및 미디어 업로드 (Story BM-004, BM-005)
  - 🔄 **BM-004**: 85% 완료 (속성 값 관리, Workspace Management 연동만 미구현)
  - 🔄 **BM-005**: 40% 완료 (미디어 업로드, MediaURL VO만 구현, Server Actions 및 Storage 연동 미구현)

### Sprint 013: Block Tools & AI Integration (진행 중)
- **Week 5-6**: 블록 툴 실행 및 AI 연동 (Story BM-006)
  - 🔄 **BM-006**: 60% 완료 (사용자 툴 실행 완전 구현, AI 연동만 미구현)

## 📊 진행 상황 요약

**전체 진행률**: 약 75% 완료 (66.75pts / 89pts)

### Story별 완료 현황
| Story | Story Points | 완료율 | 완료된 Points | 상태 |
|-------|--------------|--------|--------------|------|
| BM-001 | 13pts | 100% | 13pts | ✅ 완료 |
| BM-002 | 8pts | 95% | 7.6pts | ✅ 거의 완료 (RLS 정책만 남음) |
| BM-003 | 21pts | 90% | 18.9pts | ✅ 거의 완료 (Server Actions만 남음) |
| BM-004 | 13pts | 85% | 11.05pts | 🔄 진행 중 (Workspace 연동 남음) |
| BM-005 | 21pts | 40% | 8.4pts | 🔄 진행 중 (Storage 연동 필요) |
| BM-006 | 13pts | 60% | 7.8pts | 🔄 진행 중 (AI 연동 필요) |
| **합계** | **89pts** | **75%** | **66.75pts** | |

### 완료된 핵심 기능
- ✅ **블록 생성 및 기본 관리**: Shadow Block → Skeleton Block → Completed Block 흐름 완전 구현
- ✅ **블록 편집**: Editor Panel, 블록 정보 편집, 실시간 업데이트 완전 구현
- ✅ **커스텀 속성 관리 UI**: Field Popover, 속성 정의 편집 UI 완전 구현
- ✅ **속성 값 입력**: PropertyInput 컴포넌트, 타입별 동적 입력, 자동 저장 완전 구현
- ✅ **블록 툴 실행 (사용자)**: 툴 실행, 진행률 표시, 결과 처리, 새 블록 생성 완전 구현

### 진행 중인 기능
- 🔄 **커스텀 속성 Server Actions**: createCustomPropertyAction, updateCustomPropertyAction 미구현
- 🔄 **미디어 업로드**: Supabase Storage 연동, 파일 업로드 Server Actions 미구현
- 🔄 **Workspace Management 연동**: 프로필 멤버 검증 등 외부 도메인 연동 필요
- 🔄 **AI 툴 실행**: AI 서비스 연동 필요

### 남은 작업
1. **BM-002**: RLS 정책 적용 (blocks 테이블)
2. **BM-003**: Server Actions 구현 (property.actions.ts)
3. **BM-004**: Workspace Management 연동 (프로필 멤버 검증)
4. **BM-005**: Supabase Storage 연동 및 파일 업로드 Server Actions
5. **BM-006**: AI 서비스 연동

## 🎯 완료 기준
- [x] ✅ **핵심 기능 대부분 완료**: 블록 생성, 편집, 속성 관리 UI 완전 구현
- [ ] **성공 기준 달성**: 미디어 업로드, AI 연동 필요
- [ ] **사용자 테스트 통과**: E2E 테스트 보완 필요
- [ ] **다음 Epic 준비 완료**: 남은 기능 완료 필요

## 📁 관련 문서
- [Process Model](../event-domain-design/domains/block-management-domain/02-process-model.md)
- [Software Design](../event-domain-design/domains/block-management-domain/03-software-design.md)
- [Technical Specification](../event-domain-design/domains/block-management-domain/04-technical-specification.md)
- [Frontend Specification](../event-domain-design/domains/block-management-domain/04-frontend-specification.md)
- [Testing Strategy](../event-domain-design/domains/block-management-domain/05-testing-strategy.md)
