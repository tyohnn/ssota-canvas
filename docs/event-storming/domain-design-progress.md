# Domain Design Progress Tracker

Event Storming → DDD → Technical Design → Agile Planning 설계 진행 상황을 추적하는 문서입니다.

---

## 📊 Overall Progress Overview

| Domain | Event Storming | Process Model | Software Design | Technical Design | Agile Planning | Status |
|--------|---------------|---------------|-----------------|------------------|----------------|--------|
| **Visual Canvas** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | **완료** |
| **Component System** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | **완료** |
| **Workspace Structure** | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete | **완료** |
| **Smart Properties** | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **0%** |
| **Data Organization** | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **0%** |
| **AI Enhancement** | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **0%** |
| **Template Management** | ✅ Complete | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **25%** |
| **Collaboration & Access Control** | ✅ Complete | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **25%** |
| **History & Version Control** | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **0%** |
| **External Integration** | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | ❌ Pending | **0%** |

**전체 진행률: 55% (3/10 도메인 완료)**

---

## 🔥 Core Domain (핵심 경쟁력)

### 1. Visual Canvas Domain ✅ **완료**
**비즈니스 가치**: 쏘타의 핵심 차별화 요소 - 무한 캔버스에서의 자유로운 시각적 작업

#### 설계 진행 상황
- [x] **Event Storming**: `docs/event-storming/visual-canvas-domain/event-storm.md`
  - 핵심 이벤트 27개 정의
  - Hotspots 8개 식별 (React Flow 통합, 성능 최적화 등)
  - Opportunities 6개 발견 (Smart Guides, 실시간 협업 등)

- [x] **Process Model**: `docs/event-storming/visual-canvas-domain/process-model.md`
  - 8개 핵심 프로세스 정의 (Command → Policy → System → Event)
  - React Flow Library 통합 설계
  - External System 매핑 완료

- [x] **Software Design**: `docs/event-storming/visual-canvas-domain/software-design.md`
  - 4개 Aggregate 정의 (Canvas, Block, Edge, CanvasView)
  - Anti-Corruption Layer for React Flow 설계
  - Domain Events 및 Commands 명세

- [x] **Technical Design**:
  - [x] Database Schema: `docs/event-storming/visual-canvas-domain/technical-design/database-schema.md`
  - [x] API Specification: `docs/event-storming/visual-canvas-domain/technical-design/api-specification.md`
  - [x] Anti-Corruption Layer: `docs/event-storming/visual-canvas-domain/anti-corruption-layer.md`
  - [x] ACL Implementation Guide: `docs/event-storming/visual-canvas-domain/acl-implementation-guide.md`

- [x] **Agile Planning**: `docs/event-storming/agile-planning/01-visual-canvas-epic.md`
  - 3개 Epic 정의 (Foundation, Advanced Features, Integration)
  - 6개 Sprint Story 상세 설계
  - Sub-tasks 및 Definition of Done 포함

#### 주요 설계 결정사항
- **React Flow ACL**: 외부 라이브러리와 도메인 모델 분리
- **Optimistic UI**: 실시간 반응성을 위한 낙관적 업데이트
- **EventBus 제거**: Next.js Server Actions로 단순화

---

### 2. Component System Domain ✅ **완료**
**비즈니스 가치**: 재사용 가능한 컴포넌트를 통한 생산성 향상

#### 설계 진행 상황
- [x] **Event Storming**: `docs/event-storming/component-system-domain/event-storm.md`
  - 핵심 이벤트 15개 정의
  - 개별 인스턴스 분리 시나리오 추가
  - Hotspots 6개 식별 (인스턴스 분리 복잡성 등)

- [x] **Process Model**: `docs/event-storming/component-system-domain/process-model.md`
  - 7개 핵심 프로세스 정의
  - 컴포넌트 라이프사이클 관리
  - 인스턴스 분리 프로세스 포함

- [x] **Software Design**: `docs/event-storming/component-system-domain/software-design.md`
  - 3개 Aggregate 정의 (ComponentDefinition, ComponentLifecycle, ComponentInstance)
  - Visual Canvas 통합 이벤트 정의
  - EventBus 제거 완료

- [x] **Technical Design**:
  - [x] Database Schema: `docs/event-storming/component-system-domain/technical-design/database-schema.md`
  - [x] API Specification: `docs/event-storming/component-system-domain/technical-design/api-specification.md`

- [x] **Agile Planning**: `docs/event-storming/agile-planning/02-component-system-epic.md`
  - 3개 Epic 정의
  - 6개 Sprint Story 상세 설계
  - Sub-tasks 및 Definition of Done 포함

#### 주요 설계 결정사항
- **인스턴스 분리**: 컴포넌트 삭제 없이 개별 인스턴스 독립화
- **Property Override**: 인스턴스별 속성 오버라이드 시스템

---

### 3. Smart Properties Domain ❌ **대기 중**
**비즈니스 가치**: 유연한 커스텀 속성 시스템으로 다양한 use case 지원

#### 설계 진행 상황
- [ ] **Event Storming**: 미진행
- [ ] **Process Model**: 미진행
- [ ] **Software Design**: 미진행
- [ ] **Technical Design**: 미진행
- [ ] **Agile Planning**: 미진행

#### 우선순위
- **Phase 1 필수 도메인**: 다른 도메인의 기반이 되는 속성 시스템
- **다음 진행 예정**: Visual Canvas와 Component System 완료 후

---

### 4. Data Organization Domain ❌ **대기 중**
**비즈니스 가치**: 블럭 데이터를 테이블/칸반/달력 등 다양한 관점에서 조회/관리

#### 설계 진행 상황
- [ ] **Event Storming**: 미진행
- [ ] **Process Model**: 미진행
- [ ] **Software Design**: 미진행
- [ ] **Technical Design**: 미진행
- [ ] **Agile Planning**: 미진행

#### 우선순위
- **Phase 2 차별화 도메인**: 쏘타의 핵심 차별화 기능
- **Smart Properties 완료 후 진행 예정**

---

### 5. AI Enhancement Domain ❌ **대기 중**
**비즈니스 가치**: AI를 통한 지능적 캔버스 조작 및 자동화

#### 설계 진행 상황
- [ ] **Event Storming**: 미진행
- [ ] **Process Model**: 미진행
- [ ] **Software Design**: 미진행
- [ ] **Technical Design**: 미진행
- [ ] **Agile Planning**: 미진행

#### 우선순위
- **Phase 3 혁신 도메인**: 미래 경쟁력의 핵심
- **최종 단계에서 진행 예정**

---

## 💎 Supporting Domain (핵심 지원)

### 6. Workspace Structure Domain ✅ **완료**
**비즈니스 가치**: 작업 공간의 체계적인 관리

#### 설계 진행 상황
- [x] **Event Storming**: `docs/event-storming/workspace-structure-domain/event-storm.md`
  - 핵심 이벤트 25개 정의
  - Clerk 통합 전략 설계
  - Page Reference 로직 제거 (Visual Canvas로 이관)

- [x] **Process Model**: `docs/event-storming/workspace-structure-domain/process-model.md`
  - 7개 핵심 프로세스 정의
  - Clerk Webhook 처리 설계
  - Page 이동 시 권한 검증 로직

- [x] **Software Design**: `docs/event-storming/workspace-structure-domain/software-design.md`
  - 4개 Aggregate 정의 (Organization, Workspace, PageHierarchy, PageLifecycle)
  - Clerk Anti-Corruption Layer 설계
  - EventBus 제거 완료

- [x] **Technical Design**:
  - [x] Database Schema: `docs/event-storming/workspace-structure-domain/technical-design/database-schema.md`
  - [x] API Specification: `docs/event-storming/workspace-structure-domain/technical-design/api-specification.md`

- [x] **Agile Planning**: `docs/event-storming/agile-planning/01-workspace-structure-epic.md`
  - 2개 Sprint Story 상세 설계
  - Sub-tasks 및 Definition of Done 포함

#### 주요 설계 결정사항
- **Page Reference 단순화**: 복잡한 참조 관리 제거, Visual Canvas의 Page Block으로 처리
- **Clerk 완전 통합**: Organization/User 동기화 시스템
- **계층 구조 최적화**: Materialized Path 패턴, Hierarchy Cache

---

### 7. Template Management Domain 🟡 **25% 완료**
**비즈니스 가치**: 재사용 가능한 템플릿을 통한 빠른 시작

#### 설계 진행 상황
- [x] **Event Storming**: `docs/event-storming/template-management-domain/event-storm.md`
  - 기본 이벤트 8개 정의
  - Workspace Structure에서 분리 완료

- [ ] **Process Model**: ❌ **대기 중**
- [ ] **Software Design**: ❌ **대기 중**
- [ ] **Technical Design**: ❌ **대기 중**
- [ ] **Agile Planning**: ❌ **대기 중**

---

## 📦 Generic Domain (일반 기능)

### 8. Collaboration & Access Control Domain 🟡 **25% 완료**
**비즈니스 가치**: 필수적이지만 차별화 요소는 아닌 표준 기능

#### 설계 진행 상황
- [x] **Event Storming**: `docs/event-storming/collaboration-access-control-domain/event-storm.md`
  - 기본 이벤트 12개 정의
  - Workspace Structure에서 분리 완료

- [ ] **Process Model**: ❌ **대기 중**
- [ ] **Software Design**: ❌ **대기 중**
- [ ] **Technical Design**: ❌ **대기 중**
- [ ] **Agile Planning**: ❌ **대기 중**

---

### 9. History & Version Control Domain ❌ **대기 중**
**비즈니스 가치**: 작업 이력 관리 및 실행 취소

#### 설계 진행 상황
- [ ] **Event Storming**: 미진행
- [ ] **Process Model**: 미진행
- [ ] **Software Design**: 미진행
- [ ] **Technical Design**: 미진행
- [ ] **Agile Planning**: 미진행

---

### 10. External Integration Domain ❌ **대기 중**
**비즈니스 가치**: 외부 도구와의 연동

#### 설계 진행 상황
- [ ] **Event Storming**: 미진행
- [ ] **Process Model**: 미진행
- [ ] **Software Design**: 미진행
- [ ] **Technical Design**: 미진행
- [ ] **Agile Planning**: 미진행

---

## 🔄 Integration & Cross-Domain Design

### 완료된 통합 설계
- [x] **Visual Canvas ↔ Component System**: `docs/event-storming/integration/visual-canvas-component-integration.md`
  - 통합 이벤트 12개 정의
  - Anti-Corruption Layer 설계
  - Saga Pattern 및 Eventual Consistency 전략

### 대기 중인 통합 설계
- [ ] **Workspace Structure ↔ Visual Canvas**: Page Block Type 통합
- [ ] **Smart Properties ↔ All Domains**: 속성 시스템 통합
- [ ] **Data Organization ↔ Component System**: 인스턴스 데이터 뷰 통합

---

## 📋 Next Steps (우선순위)

### 즉시 진행 (Phase 1) - ✅ 완료
1. **Component System Technical Design** ✅ 완성
2. **Workspace Structure Agile Planning** ✅ 완성

### 단기 진행 (Phase 2)
3. **Smart Properties Domain** 전체 설계
4. **Template Management Domain** Process Model → Software Design

### 중기 진행 (Phase 3)
5. **Data Organization Domain** 전체 설계
6. **Collaboration & Access Control Domain** Process Model → Software Design

### 장기 진행 (Phase 4)
7. **AI Enhancement Domain** 전체 설계
8. **History & Version Control Domain** 전체 설계
9. **External Integration Domain** 전체 설계

---

## 📊 설계 품질 메트릭

### 완료된 도메인의 설계 품질
- **Visual Canvas**: ⭐⭐⭐⭐⭐ (완벽한 설계)
- **Component System**: ⭐⭐⭐⭐⭐ (완벽한 설계)
- **Workspace Structure**: ⭐⭐⭐⭐⭐ (완벽한 설계)

### 설계 일관성 체크
- [x] **EventBus 제거**: 모든 완료된 도메인에서 Next.js Server Actions 패턴 적용
- [x] **Anti-Corruption Layer**: 외부 시스템 통합 시 ACL 패턴 적용
- [x] **Domain Events**: EventBus 없이 직접 반환 패턴 일관성 유지
- [x] **Technical Design 구조**: Database Schema + API Specification 표준화

---

## 🎯 현재 상태 요약

**완전히 완료된 도메인**: 3개 (Visual Canvas, Component System, Workspace Structure)  
**25% 완료된 도메인**: 2개 (Template Management, Collaboration & Access Control)  
**미진행 도메인**: 5개 (Smart Properties, Data Organization, AI Enhancement, History, External Integration)

**다음 우선순위**: Sprint 0 Foundation Setup → Smart Properties 전체 설계 → Template Management Process Model
