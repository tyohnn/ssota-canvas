# 쏘타 MVP Subdomain 정의 (수정본)

## Domain: Visual Collaboration Platform (시각적 협업 플랫폼)

---

## 🔥 Core Domain (핵심 경쟁력)

### 1. Visual Canvas Domain
**비즈니스 가치**: 쏘타의 핵심 차별화 요소 - 무한 캔버스에서의 자유로운 시각적 작업

**포함 이벤트**:
- 블럭이 생성되었다 (Block Created)
- 블럭이 페이지에 마운트되었다 (Block Mounted to Page)
- 블럭이 이동되었다 (Block Moved)
- 블럭의 페이지별 위치가 변경되었다 (Block Position Changed on Page)
- 블럭의 페이지별 크기가 변경되었다 (Block Size Changed on Page)
- 블럭의 페이지별 Z순서가 변경되었다 (Block Z-Order Changed on Page)
- 블럭이 정렬되었다 (Block Aligned)
- 블럭이 스냅되었다 (Block Snapped)
- 엣지가 생성되었다 (Edge Created)
- 엣지가 삭제되었다 (Edge Deleted)
- 엣지가 재연결되었다 (Edge Reconnected)
- 엣지 레이블이 변경되었다 (Edge Label Changed)
- 캔버스가 열렸다 (Canvas Opened)
- 캔버스 뷰가 저장되었다 (Canvas View Saved)
- **블럭 콘텐츠가 수정되었다 (Block Content Edited)**
- **텍스트 정렬이 변경되었다 (Text Alignment Changed)**
- **텍스트 리치스타일이 토글되었다 (Text Rich Style Toggled)**
- **텍스트 색상이 변경되었다 (Text Color Changed)**
- **도형 종류가 변경되었다 (Shape Type Changed)**
- **도형 색상이 변경되었다 (Shape Color Changed)**

### 2. Component System Domain  
**비즈니스 가치**: 재사용 가능한 컴포넌트를 통한 생산성 향상

**포함 이벤트**:
- 컴포넌트 블럭이 정의되었다 (Component Block Defined)
- 블럭이 컴포넌트 블럭으로 변환되었다 (Block Converted to Component)
- 인스턴스 블럭이 생성되었다 (Instance Block Created)
- 인스턴스 블럭이 컴포넌트와 동기화되었다 (Instance Block Synced with Component)
- 인스턴스 블럭의 속성이 오버라이드되었다 (Instance Property Overridden)
- 인스턴스 블럭 속성이 리셋되었다 (Instance Property Reset)
- 컴포넌트 엣지가 정의되었다 (Component Edge Defined)
- 컴포넌트 블럭 스타일이 속성값과 연동되었다 (Component Style Linked to Property Value)
- 스타일-속성 연동 규칙이 생성되었다 (Style–Property Link Rule Created)
- 비인스턴스 블럭이 컴포넌트로 승격되었다 (Non-Instance Block Promoted to Component)

### 3. Smart Properties Domain
**비즈니스 가치**: 유연한 커스텀 속성 시스템으로 다양한 use case 지원

**포함 이벤트**:
- 커스텀 속성이 추가되었다 (Custom Property Added)
- 커스텀 속성 타입이 변경되었다 (Custom Property Type Changed)
- 커스텀 속성 값이 설정되었다 (Custom Property Value Set)
- 커스텀 선택형 옵션이 추가되었다 (Custom Select Option Added)
- 영역 블럭의 속성값이 하위 블럭에 적용되었다 (Region Property Applied to Children)
- 기본 속성이 정의되었다 (Default Property Defined)
- 스타일 속성이 정의되었다 (Style Property Defined)

### 4. Data Organization Domain
**비즈니스 가치**: 블럭 데이터를 테이블/칸반/달력 등 다양한 관점에서 조회/관리 - 쏘타의 핵심 차별화 요소

**포함 이벤트**:
- 테이블 뷰가 생성되었다 (Table View Created)
- 테이블 셀이 수정되었다 (Table Cell Edited → Instance Property Value Updated)
- 테이블 필터 조건이 설정되었다 (Table Filter Added)
- 테이블 정렬 조건이 추가되었다 (Table Sort Added)
- 테이블 뷰 연결 속성이 정의되었다 (Table Relation Property Defined)
- 칸반 뷰가 생성되었다 (Kanban View Created)
- 인스턴스 블럭의 칸반 열 위치가 변경되었다 (Instance Moved in Kanban)
- 칸반 하위 그룹화가 정의되었다 (Kanban Subgroup Defined)
- 달력 뷰가 생성되었다 (Calendar View Created)
- 타임라인 뷰가 생성되었다 (Timeline View Created)

### 5. AI Enhancement Domain
**비즈니스 가치**: AI를 통한 지능적 캔버스 조작 및 자동화 - 차세대 협업 도구의 핵심

**포함 이벤트**:
- AI 조작 세션이 시작되었다 (AI Control Session Started)
- AI가 블럭을 추가했다 (AI Added Block)
- AI가 엣지를 연결했다 (AI Connected Edge)
- AI가 블럭의 스타일 속성을 수정했다 (AI Modified Style Properties)
- AI가 커스텀 속성을 정의했다 (AI Defined Custom Property)
- AI가 컴포넌트 블럭을 정의했다 (AI Defined Component Block)
- 워크스페이스에 커스텀 에이전트가 정의되었다 (Custom Agent Defined in Workspace)
- 블럭에서 사용 가능한 AI 툴이 정의되었다 (Block AI Tool Defined)
- 시맨틱 서치로 블럭이 검색되었다 (Block Semantic Search Performed)

---

## 💎 Supporting Domain (핵심 지원)

### 6. Workspace Structure Domain
**비즈니스 가치**: 작업 공간의 체계적인 관리

**포함 이벤트**:
- 워크스페이스가 생성되었다 (Workspace Created)
- 페이지가 생성되었다 (Page Created)
- 페이지명이 변경되었다 (Page Title Changed)
- 페이지의 부모가 변경되었다 (Page Parent Changed)
- 페이지가 삭제되었다 (Page Deleted)
- 페이지가 복구되었다 (Page Restored)
- 보기 형식이 추가되었다 (View Added)
- 페이지 보기 형식이 변경되었다 (Page View Type Changed)

### 7. Template Management Domain
**비즈니스 가치**: 재사용 가능한 템플릿을 통한 빠른 시작

**포함 이벤트**:
- 워크스페이스가 템플릿으로 등록되었다 (Workspace Template Registered)
- 템플릿에서 워크스페이스가 생성되었다 (Workspace Created from Template)
- 페이지가 템플릿으로 등록되었다 (Page Template Registered)
- 템플릿에서 페이지가 생성되었다 (Page Created from Template)

---

## 📦 Generic Domain (일반 기능)

### 8. Collaboration & Access Control Domain
**비즈니스 가치**: 필수적이지만 차별화 요소는 아닌 표준 기능

**포함 이벤트**:
- 유저가 조직에 가입되었다 (Organization Created for User)
- 조직에 유저가 초대되었다 (User Invited to Organization)
- 워크스페이스에 유저 권한이 설정되었다 (Workspace Permission Set)
- 페이지에 공유 옵션이 설정되었다 (Page Share Option Set)
- 페이지가 복제되었다 (Page Duplicated)
- 페이지 공유 옵션에서 복제가 허용되었다 (Page Duplicate Allowed)
- 페이지 공유 옵션에서 모두 보기가 설정되었다 (Page Public View Enabled)

### 9. History & Version Control Domain
**비즈니스 가치**: 작업 이력 관리 및 실행 취소

**포함 이벤트**:
- 작업이 되돌려졌다 (Action Undone)
- 작업이 다시 실행되었다 (Action Redone)
- 스냅샷이 생성되었다 (Snapshot Created)

### 10. External Integration Domain
**비즈니스 가치**: 외부 도구와의 연동

**포함 이벤트**:
- 페이지 데이터가 Cypher 쿼리로 변환되었다 (Page Data Exported as Cypher)
- Cypher 쿼리가 MCP를 통해 외부 앱에 제공되었다 (Cypher Exposed via MCP)
- 페이지 데이터가 Cursor IDLE에 저장되었다 (Page Data Stored to Cursor IDLE)
- 플러그인 노드가 등록되었다 (Plugin Node Registered)
- 플러그인 노드가 iframe 기반으로 렌더링되었다 (Plugin Node Rendered via iFrame)

---

## 주요 변경 사항 (2차 수정)

### 1. **Content Editing을 Visual Canvas Domain으로 통합**
- 블럭의 기본 편집 기능(텍스트, 도형 스타일링)은 캔버스의 핵심 기능
- 별도 도메인이 아닌 Visual Canvas의 일부로 포함

### 2. **Core Domain 확장**
- **Data Organization Domain**: Supporting → Core로 승격
  - 단순 CRUD가 아닌 쏘타의 핵심 차별화 기능
  - 캔버스와 데이터 뷰의 결합이 쏘타의 독특한 가치
- **AI Enhancement Domain**: Supporting → Core로 승격
  - AI 기반 캔버스 조작은 미래 경쟁력의 핵심
  - 단순 보조가 아닌 차별화 요소

### 3. **도메인 우선순위 재정렬**
```
Core Domain (5개):
1. Visual Canvas - 시각적 편집의 모든 것
2. Component System - 재사용성
3. Smart Properties - 확장성
4. Data Organization - 데이터 관점 전환
5. AI Enhancement - 지능형 자동화

Supporting Domain (2개):
6. Workspace Structure - 공간 관리
7. Template Management - 빠른 시작

Generic Domain (3개):
8. Collaboration & Access Control
9. History & Version Control
10. External Integration
```

---

## MVP Process Modeling 우선순위

### Phase 1 (필수):
1. **Visual Canvas Domain** - 기본 캔버스 조작과 블럭 편집
2. **Smart Properties Domain** - 속성 시스템 (다른 도메인의 기반)

### Phase 2 (차별화):
3. **Data Organization Domain** - 테이블/칸반 뷰
4. **Component System Domain** - 컴포넌트와 인스턴스

### Phase 3 (혁신):
5. **AI Enhancement Domain** - AI 캔버스 조작

이렇게 단계적으로 진행하면 기본 기능부터 차별화 기능까지 체계적으로 구축할 수 있습니다.