# Overall Development Roadmap

Event Storming → DDD → Technical Design → Agile Planning → Implementation 프로세스를 따라 개발합니다.

---

## 🔄 Development Process

```
1. Event Storming     : 비즈니스 도메인 탐색
2. DDD               : 도메인 모델 설계 (Aggregate, Entity, Value Object)
3. Technical Design  : DB 스키마, API 명세, 인프라 설계
4. Agile Planning    : Epic, Story, Sub-tasks 정의
5. Implementation    : 실제 코딩 및 테스트
```

---

## 🎯 전체 개발 순서

### Phase 0: Foundation Setup ⭐⭐
**기간**: 1 스프린트 (2주)  
**목표**: 프로젝트 기본 인프라, 도메인 이벤트 시스템, 에러 처리 및 로깅 시스템 구축

### Phase 1: Workspace Structure Domain Foundation ⭐
**기간**: 2 스프린트 (4주)  
**목표**: 워크스페이스, 페이지, 조직 관리 시스템 구현

### Phase 2: Visual Canvas Domain Foundation
**기간**: 2 스프린트 (4주)  
**목표**: 기본 블럭 시스템 및 캔버스 기능 구현 (Workspace Structure 기반)

### Phase 3: Component System Domain 
**기간**: 4 스프린트 (8주)  
**목표**: 컴포넌트 시스템 전체 기능 구현

### Phase 4: Integration & Advanced Features
**기간**: 2 스프린트 (4주)  
**목표**: 도메인 간 통합 및 고급 기능

---

## 📅 Phase별 Sprint Planning

### 🛠️ Phase 0: Foundation Setup (Sprint 0)

#### Sprint 0 (Week 1-2): Foundation & Infrastructure
**Goal**: 프로젝트 기본 인프라 및 아키텍처 시스템 구축  
**Story Points**: 20

**Stories**:
- Story EN-0.1: Project Foundation & Tech Stack Setup (8pts) ⭐
- Story EN-0.2: Domain Event System Implementation (6pts) ⭐  
- Story EN-0.3: Error Handling & Logging System (6pts) ⭐

**Deliverables**:
- [ ] Next.js 15 + TypeScript + Tailwind CSS 설정
- [ ] Supabase + Drizzle ORM + Clerk 통합
- [ ] 도메인 이벤트 시스템 구현
- [ ] 에러 처리 및 로깅 시스템 구현
- [ ] 기본 개발 환경 및 CI/CD 설정

### 🏢 Phase 1: Workspace Structure Domain (Sprint 1-2)

#### Sprint 1 (Week 3-4): Workspace Foundation
**Goal**: 기본 워크스페이스 및 조직 관리 시스템 구축  
**Story Points**: 16

**Stories**:
- Story WS-1.1: Organization Management (8pts) ⭐
- Story WS-1.2: Workspace Creation & Management (5pts) ⭐  
- Story WS-1.3: Clerk Integration Setup (3pts) ⭐

**Deliverables**:
- [ ] Organization Aggregate 구현
- [ ] Workspace Aggregate 구현
- [ ] Clerk Anti-Corruption Layer
- [ ] 데이터베이스 스키마 v1 (organizations, workspaces, pages)

#### Sprint 2 (Week 5-6): Page Structure & Permissions
**Goal**: 페이지 계층 구조 및 권한 관리 시스템 완성  
**Story Points**: 18

**Stories**:
- Story WS-2.1: Page Hierarchy Management (8pts) ⭐
- Story WS-2.2: Permission & Access Control (5pts) ⭐
- Story WS-2.3: Page Navigation & Movement (5pts) ⭐

**Deliverables**:
- [ ] PageHierarchy Aggregate 구현
- [ ] PageLifecycle Aggregate 구현
- [ ] 권한 체계 구현
- [ ] Workspace Structure Domain 완성

### 🚀 Phase 2: Visual Canvas Domain (Sprint 3-4)

#### Sprint 3 (Week 7-8): Visual Canvas Foundation
**Goal**: 기본 블럭 생성, 배치, 위치 관리 (Workspace Structure 기반)  
**Story Points**: 16

**Stories**:
- Story VC-1.1: Block Creation & Mounting (8pts) ⭐
- Story VC-1.2: Block Position Management (5pts) ⭐  
- Story VC-1.3: Canvas Initialization & Loading (3pts) ⭐

**Deliverables**:
- [ ] Block Aggregate 구현
- [ ] 기본 Repository 인터페이스 (Visual Canvas)
- [ ] 블럭 생성/배치 서버 액션
- [ ] Workspace Structure 통합

#### Sprint 4 (Week 9-10): Visual Canvas Advanced
**Goal**: 스마트 가이드, 콘텐츠 편집, 타입 시스템  
**Story Points**: 18

**Stories**:
- Story VC-2.1: Smart Guides & Snapping (8pts) ⭐
- Story VC-2.2: Block Content Editing (5pts) ⭐
- Story VC-2.3: Block Type System (5pts) ⭐

**Deliverables**:
- [ ] Canvas Aggregate 구현
- [ ] 스마트 가이드 시스템
- [ ] 블럭 타입 관리 시스템
- [ ] Visual Canvas Domain 완성

---

### 🔧 Phase 3: Component System Domain (Sprint 5-8)

#### Sprint 5 (Week 11-12): Component Foundation  
**Goal**: 기본 컴포넌트 생성 및 인스턴스 시스템 구축  
**Story Points**: 16

**Stories**:
- Story CS-1.1: Component Creation from Block (8pts) ⭐
- Story CS-1.2: Component Instance Creation (5pts) ⭐  
- Story CS-1.3: Component Basic Properties (3pts) ⭐

#### Sprint 6 (Week 13-14): Property Override System
**Goal**: 인스턴스별 커스터마이징 시스템 완성  
**Story Points**: 15

**Stories**:
- Story CS-2.1: Property Override Management (8pts) ⭐
- Story CS-2.2: Override Visual Indicators (4pts)
- Story CS-2.3: Property Reset Functionality (3pts)

#### Sprint 7 (Week 15-16): Component Synchronization
**Goal**: 대량 인스턴스 동기화 및 배치 처리  
**Story Points**: 13

**Stories**:
- Story CS-3.1: Batch Synchronization (8pts) ⭐
- Story CS-3.2: Progress Tracking (3pts)
- Story CS-3.3: Sync Failure Recovery (2pts)

#### Sprint 8 (Week 17-18): Component Lifecycle
**Goal**: 컴포넌트 생명주기 관리 및 안전 장치  
**Story Points**: 12

**Stories**:
- Story CS-4.1: Component Deletion Safety (5pts) ⭐
- Story CS-4.2: Individual Instance Detach (4pts)
- Story CS-4.3: Data Migration Tools (3pts)

---

### 🎨 Phase 4: Integration & Advanced (Sprint 9-10)

#### Sprint 9 (Week 19-20): Cross-Domain Integration
**Goal**: Workspace Structure ↔ Visual Canvas ↔ Component System 통합  
**Story Points**: 15

**Stories**:
- Story INT-1.1: Workspace-Canvas Integration (8pts) ⭐
- Story INT-1.2: Canvas-Component Integration (4pts)
- Story INT-1.3: Error Handling & Recovery (3pts)

#### Sprint 10 (Week 21-22): Advanced Features & Polish
**Goal**: 고급 기능 및 프로덕션 준비  
**Story Points**: 13

**Stories**:
- Story ADV-1.1: Style-Property Linking (8pts) ⭐
- Story ADV-1.2: Performance Optimization (3pts)
- Story ADV-1.3: Production Readiness (2pts)

---

## 🎯 Milestone 정의

### Milestone 0: Foundation Ready (Sprint 0)
**목표**: 완전한 프로젝트 기반 인프라 구축
- ✅ Next.js 15 + TypeScript + 전체 기술 스택 설정
- ✅ 도메인 이벤트 시스템 구현
- ✅ 에러 처리 및 로깅 시스템 구현

### Milestone 1: Workspace Structure Ready (Sprint 1-2)
**목표**: 완전한 워크스페이스 및 페이지 관리 시스템
- ✅ Organization 및 Workspace 관리
- ✅ Page 계층 구조 및 권한 시스템
- ✅ Clerk 통합 및 인증 시스템

### Milestone 2: Visual Canvas Ready (Sprint 3-4)
**목표**: Workspace Structure 기반 블럭 시스템 완성
- ✅ 블럭 생성, 배치, 이동, 편집
- ✅ 스마트 가이드 및 스냅 기능
- ✅ 다양한 블럭 타입 지원

### Milestone 3: Component System Ready (Sprint 5-8)  
**목표**: 완전한 컴포넌트 관리 시스템
- ✅ 컴포넌트 생성 및 인스턴스 관리
- ✅ 속성 오버라이드 시스템
- ✅ 대량 동기화 및 생명주기 관리

### Milestone 4: Integrated System (Sprint 9-10)
**목표**: 통합된 시각적 컴포넌트 플랫폼
- ✅ 도메인 간 seamless 통합
- ✅ 고급 기능 및 성능 최적화
- ✅ 프로덕션 배포 준비

---

## 📊 전체 Summary

| Phase | Domain | Story Points | Sprint | Duration |
|-------|--------|--------------|---------|----------|
| Phase 0 | Foundation | 20 | 0 | 2주 |
| Phase 1 | Workspace Structure | 34 | 1-2 | 4주 |
| Phase 2 | Visual Canvas | 34 | 3-4 | 4주 |
| Phase 3 | Component System | 56 | 5-8 | 8주 |
| Phase 4 | Integration | 28 | 9-10 | 4주 |

**Total**: 172 story points, 11 sprints, 22주

---

## 🚀 Getting Started

### 즉시 시작 가능한 작업들

1. **Sprint 0 시작 - Foundation Setup**
   ```bash
   cd refactor/
   # Next.js 15 프로젝트 생성
   # TypeScript + Tailwind CSS 설정
   # Supabase + Drizzle ORM 설정
   # Clerk 인증 설정
   # 도메인 이벤트 시스템 구현
   # 에러 처리 및 로깅 시스템 구현
   ```

2. **병렬 작업 가능**
   - 프로젝트 초기 설정 (백엔드 팀)
   - 도메인 이벤트 시스템 (아키텍처 팀)
   - 에러 처리 및 로깅 (인프라 팀)
   - UI 기반 설정 (프론트엔드 팀)

### 다음 액션 아이템
- [ ] **Sprint 0 시작**: Foundation Enabler Story EN-0.1 구현
- [ ] Next.js 15 + TypeScript 프로젝트 설정
- [ ] 도메인 이벤트 시스템 구현
- [ ] 에러 처리 및 로깅 시스템 구현
- [ ] 기본 인프라 및 개발 환경 설정

---

## 📁 문서 구조

```
docs/event-storming/agile-planning/
├── 00-development-roadmap.md        # 전체 로드맵 (이 파일)
├── 01-workspace-structure-epic.md   # Phase 1: Workspace Structure Epic & Stories  
├── 02-visual-canvas-epic.md         # Phase 2: Visual Canvas Epic & Stories
├── 03-component-system-epic.md      # Phase 3: Component System Epic & Stories
├── 04-integration-epic.md           # Phase 4: Integration Epic & Stories
└── stories/                         # 상세 Story 정의
    ├── foundation/                  # Phase 0: Foundation Enabler Stories
    │   └── sprint-0-stories.md      # Sprint 0 Foundation Stories
    ├── workspace-structure/         # Phase 1: WS 스토리들
    │   ├── sprint-1-stories.md      # Sprint 1 WS Stories
    │   └── sprint-2-stories.md      # Sprint 2 WS Stories
    ├── visual-canvas/               # Phase 2: VC 스토리들
    │   ├── sprint-3-stories.md      # Sprint 3 VC Stories
    │   └── sprint-4-stories.md      # Sprint 4 VC Stories
    ├── component-system/            # Phase 3: CS 스토리들
    │   ├── sprint-5-stories.md      # Sprint 5 CS Stories
    │   ├── sprint-6-stories.md      # Sprint 6 CS Stories
    │   ├── sprint-7-stories.md      # Sprint 7 CS Stories
    │   └── sprint-8-stories.md      # Sprint 8 CS Stories
    └── integration/                 # Phase 4: INT 스토리들
        ├── sprint-9-stories.md      # Sprint 9 Integration Stories
        └── sprint-10-stories.md     # Sprint 10 Advanced Stories
```
