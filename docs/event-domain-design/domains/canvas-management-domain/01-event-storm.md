# Event Storming: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 도메인전문가 + PM
**작성일**: 2025-10-18  
**버전**: v1.0 (완료)

**다음 단계**: `process-model.md`

---

## 📊 Domain Overview

**비즈니스 가치**: 쏘타의 핵심 차별화 요소 - 무한 캔버스에서의 자유로운 시각적 작업

**이 도메인이 다루는 영역**:
- 블럭 기본 조작 (생성, 수정, 삭제, 복구, 복제, 위치, 크기, z-order)
- 캔버스 공간 관리 (뷰포트: 줌/패닝/포커스)
- 관계 및 구조 (엣지, 블럭-페이지 마운팅)
- 시각적 편집 도구 (선택, 정렬, 스마트 가이드, 스냅)

**다른 도메인으로 분리된 영역**:
- Block Domain: 블럭 타입별 속성, 렌더링, 비즈니스 정책

---

## 📝 핵심 개념 정리

### External System Integration Strategy

#### 1. Workspace Management Domain (내부 도메인)
- **페이지 생명주기**: 페이지 생성/삭제 이벤트와 캔버스 초기화/정리 동기화
- **데이터 흐름**: Workspace Management → Canvas Management
- **Sync Method**: 동기적 서비스 주입 (Next.js 풀스택 환경)

#### 2. Block Domain (내부 도메인)
- **블럭 타입 관리**: 블럭 생성 시 타입 검증 및 기본값 설정
- **렌더링 위임**: 블럭 타입별 렌더링 컴포넌트는 Block Domain에서 관리
- **데이터 흐름**: Canvas Management ↔ Block Domain (양방향)
- **Sync Method**: 동기적 서비스 주입 (Next.js 풀스택 환경)

#### 3. React Flow (외부 라이브러리)
- **캔버스 렌더링 엔진**: 무한 캔버스, 줌/패닝, 엣지 렌더링
- **우리의 책임**: React Flow 인스턴스 관리, 노드/엣지 데이터 구조 관리
- **React Flow의 책임**: 실제 렌더링, 엣지 경로 계산, 기본 인터랙션
- **State of Truth 전략**:
  - **단기 SoT**: React Flow State (마운트 후 실시간 인터랙션)
  - **장기 SoT**: Database (새로고침 시 복원용, 주기적 동기화)

### Canvas Management 핵심 개념

#### 블럭-페이지 마운팅
```
하나의 블럭은 여러 페이지에 마운트될 수 있음
Block (전역)
├── Page A에서의 위치/크기/z-order
├── Page B에서의 위치/크기/z-order
└── Page C에서의 위치/크기/z-order
```

#### 엣지의 페이지 종속성
- 엣지는 특정 페이지에만 존재
- 같은 블럭 쌍이라도 페이지마다 다른 엣지 설정 가능
- 블럭 삭제 시 연결된 모든 엣지 자동 삭제

### 비즈니스 정책

#### 블럭 생명주기 정책
- 블럭 생성 시 반드시 하나 이상의 페이지에 마운트되어야 함
- 블럭 삭제는 Soft Delete (휴지통으로 이동)
- 블럭 복제 시 마운트 정보는 복제되지 않음 (새 위치에 생성)

#### Z-Order 정책
- 새로 생성된 블럭은 가장 위(최상위 z-order)에 배치
- 다중 선택 후 "앞으로 가져오기" 시 선택된 블럭들의 상대적 순서 유지

#### 스냅 정책
- 스냅 임계값: 5px 이내
- 가이드라인 우선순위: 중심선 > 가장자리
- 다중 블럭 이동 시 대표 블럭(첫 번째 선택) 기준으로 스냅

---

## 🟠 Domain Events (시간 순서)

### 1. 캔버스 초기화 (Canvas Initialization)

#### Backend Events
- 캔버스가 초기화되었다 (Canvas Initialized)
  - *페이지 접근 시 React Flow 인스턴스 생성 및 초기 데이터 로드*

### 2. 블럭 생명주기 (Block Lifecycle)

#### Frontend Events
- 블럭 생성 요청이 시작되었다 (Block Creation Request Started)
  - *도구바에서 블럭 타입 선택 → 캔버스 클릭*

#### Backend Events
- 블럭 생성이 요청되었다 (Block Creation Requested)
  - *Block Domain과 통신: 타입 검증, 기본값 설정*
- 블럭이 생성되었다 (Block Created)
  - *Block Domain에서 블럭 생성 완료 후*
- 블럭이 페이지에 마운트되었다 (Block Mounted to Page)
  - *초기 위치(x, y), 초기 크기(width, height), z-order 포함*

#### Frontend Events
- 블럭 복제 요청이 시작되었다 (Block Duplication Request Started)
  - *Ctrl+D 또는 복제 메뉴 클릭*

#### Backend Events
- 블럭이 복제되었다 (Block Duplicated)
- 복제된 블럭이 페이지에 마운트되었다 (Duplicated Block Mounted to Page)
  - *원본 블럭 근처 위치에 마운트*

#### Backend Events
- 블럭이 삭제되었다 (Block Deleted)
  - *Delete 키 또는 삭제 메뉴 클릭*
  - *실제로는 휴지통으로 이동 (Soft Delete)*
- 블럭이 복구되었다 (Block Restored)
  - *휴지통에서 복구*

### 3. 블럭 선택 (Block Selection)

#### Frontend Events
- 블럭이 선택되었다 (Block Selected)
  - *사용자가 블럭 클릭*
- 블럭이 다중 선택에 추가되었다 (Block Added to Selection)
  - *Shift/Ctrl + 클릭*
- 블럭이 다중 선택에서 제거되었다 (Block Removed from Selection)
  - *Ctrl + 클릭으로 토글*
- 영역 선택이 시작되었다 (Area Selection Started)
  - *빈 공간에서 드래그 시작*
- 여러 블럭이 선택되었다 (Multiple Blocks Selected)
  - *드래그 영역 내 블럭들 선택*
- 모든 블럭이 선택되었다 (All Blocks Selected)
  - *Ctrl+A*
- 선택이 해제되었다 (Selection Cleared)
  - *빈 공간 클릭 또는 Esc*

### 4. 블럭 변환 (Block Transform)

#### Frontend Events
- 블럭 드래그가 시작되었다 (Block Drag Started)
  - *블럭을 마우스로 클릭하여 드래그 시작*
- 블럭이 이동 중이다 (Block Moving)
  - *드래그 중 실시간 위치 업데이트*
  - *스냅 가이드 표시용*

#### Backend Events
- 블럭 위치가 확정되었다 (Block Position Confirmed)
  - *드래그 종료 시*
  - *DB 저장용 최종 위치*

#### Frontend Events
- 블럭 리사이즈가 시작되었다 (Block Resize Started)
  - *크기 조절 핸들 드래그 시작*
- 블럭 크기가 변경 중이다 (Block Resizing)
  - *리사이즈 중 실시간 크기 업데이트*

#### Backend Events
- 블럭 크기가 확정되었다 (Block Size Confirmed)
  - *리사이즈 종료 시*
  - *DB 저장용 최종 크기*

#### Backend Events
- 블럭 Z-Order가 변경되었다 (Block Z-Order Changed)
  - *앞으로 가져오기/뒤로 보내기*

### 5. 블럭 정렬 도구 (Alignment Tools)

#### Backend Events
- 블럭들이 상단 정렬되었다 (Blocks Aligned to Top)
- 블럭들이 하단 정렬되었다 (Blocks Aligned to Bottom)
- 블럭들이 좌측 정렬되었다 (Blocks Aligned to Left)
- 블럭들이 우측 정렬되었다 (Blocks Aligned to Right)
- 블럭들이 수평 중앙 정렬되었다 (Blocks Aligned to Horizontal Center)
- 블럭들이 수직 중앙 정렬되었다 (Blocks Aligned to Vertical Center)
- 블럭들이 수평으로 균등 분포되었다 (Blocks Distributed Horizontally)
  - *선택된 블럭들 사이 간격을 동일하게*
- 블럭들이 수직으로 균등 분포되었다 (Blocks Distributed Vertically)
  - *선택된 블럭들 사이 간격을 동일하게*
- 블럭들이 그리드 형태로 정렬되었다 (Blocks Arranged in Grid)
  - *자동으로 행/열 계산하여 배치*

### 6. 스마트 가이드 & 스냅 (Smart Guides & Snapping)

#### Frontend Events
- 스냅 가이드라인이 표시되었다 (Snap Guidelines Shown)
  - *블럭 드래그 중 다른 블럭과 정렬 가능할 때*
  - *다른 블럭의 가장자리/중심선 표시*
- 블럭이 가이드라인에 스냅되었다 (Block Snapped to Guideline)
  - *자동으로 위치 조정 (오차 5px 이내)*

### 7. 엣지 관리 (Edge Management)

#### Frontend Events
- 엣지 생성이 시작되었다 (Edge Creation Started)
  - *블럭의 연결 핸들을 드래그*
  - *소스 블럭 ID + 핸들 위치 기록*

#### Backend Events
- 엣지가 생성되었다 (Edge Created)
  - *다른 블럭의 핸들에 드롭*
  - *소스 블럭 → 타겟 블럭 연결 확정*
  - *특정 페이지에서만 존재*

#### Frontend Events
- 엣지가 선택되었다 (Edge Selected)
  - *엣지 클릭*

#### Backend Events
- 엣지 타입이 변경되었다 (Edge Type Changed)
  - *직선(straight), 곡선(bezier), 스텝(step), 스무스스텝(smoothstep) 등*

#### Frontend Events
- 엣지 재연결이 시작되었다 (Edge Reconnection Started)
  - *엣지의 끝점을 드래그하여 다른 블럭으로 변경*

#### Backend Events
- 엣지가 재연결되었다 (Edge Reconnected)
  - *소스 또는 타겟 블럭 변경*
- 엣지 레이블이 변경되었다 (Edge Label Changed)
  - *엣지 더블클릭하여 레이블 편집*
- 엣지 스타일이 변경되었다 (Edge Style Changed)
  - *색상, 두께, 화살표 스타일 등*
- 엣지가 삭제되었다 (Edge Deleted)
  - *엣지 선택 후 Delete*
- 연결된 엣지들이 삭제되었다 (Connected Edges Deleted)
  - *블럭 삭제 시 해당 블럭의 모든 엣지 자동 제거*

### 8. 캔버스 뷰포트 (Canvas Viewport)

#### Frontend Events
- 캔버스가 줌인되었다 (Canvas Zoomed In)
  - *마우스 휠 또는 줌 버튼*
  - *줌 레벨 증가 (최대 제한 있음)*
- 캔버스가 줌아웃되었다 (Canvas Zoomed Out)
  - *마우스 휠 또는 줌 버튼*
  - *줌 레벨 감소 (최소 제한 있음)*
- 캔버스가 패닝되었다 (Canvas Panned)
  - *마우스 드래그 또는 스페이스바 + 드래그*
  - *뷰포트 중심 좌표 변경*
- 캔버스가 특정 블럭으로 포커스되었다 (Canvas Focused on Block)
  - *블럭 더블클릭 또는 포커스 버튼*
  - *해당 블럭이 화면 중앙에 오도록 이동 + 적절한 줌*
  - *React Flow가 애니메이션 처리*
- 캔버스가 화면에 맞춰졌다 (Canvas Fit to Screen)
  - *"화면에 맞추기" 버튼 클릭*
  - *모든 블럭이 보이도록 자동 줌/패닝*
  - *React Flow가 애니메이션 처리*
- 캔버스 줌이 100%로 리셋되었다 (Canvas Zoom Reset to 100%)
  - *"100%로 리셋" 버튼 클릭*
- 미니맵이 표시되었다 (Minimap Shown)
  - *미니맵 토글 버튼*
- 미니맵이 숨겨졌다 (Minimap Hidden)
  - *미니맵 토글 버튼*

#### Backend Events
- 캔버스 뷰가 저장되었다 (Canvas View Saved)
  - *페이지를 떠날 때 자동 저장*
  - *현재 줌 레벨 + 뷰포트 중심 좌표 저장*
  - *페이지별로 저장 (재진입 시 복원용)*
- 캔버스 뷰가 복원되었다 (Canvas View Restored)
  - *페이지 진입 시 자동 복원*
  - *이전에 저장된 줌/패닝 상태로 복원*

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **실시간 이벤트 과다 발생**
   - 문제: "블럭이 이동 중" "블럭 크기 변경 중" 이벤트가 드래그 중 수십~수백 번 발생
   - 영향: 이벤트 저장소 부담, 성능 저하
   - 해결: Throttling 또는 최종 확정 시점에만 저장

2. **블럭-엣지 동기화**
   - 문제: 블럭 삭제 시 연결된 엣지들의 일괄 처리 복잡도
   - 영향: 데이터 일관성 문제 가능성
   - 해결: 트랜잭션 단위로 처리, 롤백 메커니즘 필요

3. **React Flow와 DB 상태 동기화**
   - 문제: React Flow State(단기 SoT)와 DB(장기 SoT) 간 동기화 시점 결정
   - 영향: 동기화가 늦으면 데이터 손실, 너무 빈번하면 성능 저하
   - 해결: 적절한 동기화 전략 필요 (Debounce, 명시적 저장, React Flow 훅 활용)

### 우선순위: 중간
4. **Cross-Domain 동기화**
   - 문제: Workspace Management Domain의 페이지 삭제와 Canvas 정리 동기화
   - 영향: 페이지 삭제 시 캔버스 데이터 정리 누락 가능성
   - 해결: 동기적 서비스 주입으로 페이지 삭제 시 Canvas 서비스 직접 호출

5. **대량 블럭 렌더링 성능**
   - 문제: 페이지에 1000개 이상 블럭 로드 시 초기 로딩 느림
   - 영향: 사용자 경험 저하
   - 해결: 가상화(Virtualization) 또는 레이지 로딩

### 우선순위: 낮음
6. **스냅 가이드 계산 비용**
   - 문제: 블럭 이동 시 모든 블럭과의 정렬 가능성 계산
   - 영향: 블럭 수가 많을 때 드래그 성능 저하 가능성
   - 해결: 공간 인덱싱(Spatial Indexing) 또는 가까운 블럭만 계산

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **스마트 가이드 시스템**
   - 기회: Figma 스타일의 정교한 정렬 도구로 UX 향상
   - 구현: 실시간 가이드라인 표시, 자동 스냅

2. **효율적인 다중 선택**
   - 기회: Shift/Ctrl 키를 활용한 빠른 선택으로 생산성 향상
   - 구현: 영역 선택, 선택 추가/제거, Ctrl+A 전체 선택

3. **직관적인 정렬 도구**
   - 기회: 복잡한 다이어그램을 빠르게 정리
   - 구현: 6방향 정렬, 균등 분포, 그리드 정렬

4. **유연한 엣지 시스템**
   - 기회: 다양한 다이어그램 스타일 지원
   - 구현: 여러 엣지 타입, 레이블, 스타일 커스터마이징

### 향후 구현 (Post-MVP)
5. **실시간 협업 커서** *(메모)*
   - 다른 사용자의 마우스 위치/선택 상태 실시간 표시
   - 충돌 방지 메커니즘

6. **고급 뷰포트 기능** *(메모)*
   - 미니맵
   - 뷰포트 북마크
   - 프레젠테이션 모드

7. **키보드 단축키 커스터마이징** *(메모)*
   - 사용자별 단축키 설정
   - 단축키 가이드 오버레이

---

## 🔵 Commands & Actors (커맨드 및 액터)

### Primary Actors (사용자)

#### 1. 일반 사용자 (User)
**실행 커맨드**:
- 블럭 생성/편집/삭제/복제
- 엣지 생성/편집/삭제
- 캔버스 네비게이션 (줌/패닝/포커스)
- 정렬 도구 사용
- 선택/다중 선택
- 뷰포트 조작

#### 2. 조직 관리자 (Organization Admin)
**실행 커맨드**:
- 일반 사용자와 동일한 권한
- (추가 권한은 Workspace Management Domain에서 관리)

### System Actors (시스템)

#### 3. Canvas Management System
**실행 커맨드**:
- 스냅 가이드 자동 계산 및 표시
- 블럭 삭제 시 연결된 엣지 자동 정리
- 뷰포트 자동 저장/복원
- React Flow State → DB 동기화

#### 4. Block Domain Service
**실행 커맨드**:
- 블럭 생성 요청 검증
- 블럭 타입별 기본값 제공
- 블럭 속성 검증

#### 5. Workspace Management Service
**실행 커맨드**:
- 페이지 생성 시 캔버스 초기화 트리거
- 페이지 삭제 시 캔버스 데이터 정리 트리거

#### 6. React Flow (외부 시스템)
**실행 책임**:
- 캔버스 렌더링
- 엣지 경로 자동 계산
- 줌/패닝 애니메이션 처리
- 드래그 인터랙션 기본 처리

### 주요 커맨드 매핑

| 이벤트 | 커맨드 | 액터 |
|--------|--------|------|
| 캔버스가 초기화되었다 | 페이지 열기 | User |
| 블럭이 생성되었다 | 블럭 생성하기 | User |
| 블럭이 이동 중이다 | 블럭 드래그하기 | User |
| 스냅 가이드라인이 표시되었다 | 스냅 가이드 계산하기 | Canvas System |
| 엣지가 생성되었다 | 엣지 생성하기 | User |
| 연결된 엣지들이 삭제되었다 | 블럭 삭제 시 엣지 정리하기 | Canvas System |
| 캔버스 뷰가 저장되었다 | 뷰 자동 저장하기 | Canvas System |

---

## 🟠 Bounded Context 정의

### Canvas Management Context (단일 Context)
**책임**: 무한 캔버스에서의 블럭/엣지 조작, 뷰포트 관리, 시각적 편집 도구 제공

**핵심 언어**: Canvas, Block, Edge, Mount, Transform, Snap, Viewport, Selection

**핵심 용어 및 개념**:
- **Canvas**: 무한 캔버스 공간 (페이지별)
- **Block**: 캔버스에 배치되는 콘텐츠 단위 (위치, 크기, z-order)
- **Edge**: 블럭 간 연결선 (페이지별로 존재)
- **Mount**: 블럭이 특정 페이지에 배치되는 관계
- **Transform**: 블럭의 위치/크기/z-order 변경
- **Snap**: 자동 정렬 기능 (가이드라인 표시)
- **Viewport**: 사용자가 보는 캔버스 영역 (줌, 패닝, 포커스)
- **Selection**: 선택된 블럭들의 임시 상태

**포함 이벤트**:
- 캔버스 초기화 (5개 이벤트)
- 블럭 생명주기 (7개 이벤트)
- 블럭 선택 (7개 이벤트)
- 블럭 변환 (7개 이벤트)
- 블럭 정렬 도구 (9개 이벤트)
- 스마트 가이드 & 스냅 (5개 이벤트)
- 엣지 관리 (9개 이벤트)
- 캔버스 뷰포트 (10개 이벤트)

---

## 🔗 Context 간 관계 및 통합점

### Canvas Management ↔ Workspace Management Domain
- **연결점**: 페이지 생명주기 이벤트와 캔버스 초기화/정리 동기화
- **데이터 흐름**: 
  - `[페이지가 생성됨]` → `[캔버스가 초기화됨]`
  - `[페이지가 삭제됨]` → `[캔버스 데이터가 정리됨]`
  - `[페이지 열기]` → `[페이지의 블럭/엣지 로드]`
- **통합 방식**: 동기적 서비스 주입 (Next.js Server Actions)

### Canvas Management ↔ Block Domain
- **연결점**: 블럭 생성 요청, 타입 검증, 렌더링 컴포넌트 제공
- **데이터 흐름**: 
  - `[블럭 생성 요청]` → `[Block Domain 타입 검증]` → `[블럭이 생성됨]`
  - `[블럭 타입 변경]` → `[Canvas 크기 재계산]`
  - `[블럭 렌더링]` ← `[Block Domain 컴포넌트 제공]`
- **통합 방식**: 동기적 서비스 주입 (양방향 협력)

### Canvas Management → React Flow (외부 라이브러리)
- **연결점**: 캔버스 렌더링, 인터랙션 처리, 엣지 경로 계산
- **데이터 흐름**: 
  - `[Canvas Block/Edge 데이터]` → `[ACL 변환]` → `[React Flow Node/Edge]`
  - `[React Flow 인터랙션]` → `[Canvas 이벤트 변환]` → `[DB 동기화]`
- **통합 방식**: Anti-Corruption Layer (ACL) 패턴
- **State of Truth**: React Flow State (단기) + Database (장기)

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. 블럭-페이지 마운팅 처리
- Q: 블럭이 마지막 남은 페이지에서 언마운트되면 어떻게 되나요?
- Q: 다른 페이지로 블럭을 복사할 때 새 블럭 생성인가요, 기존 블럭 마운트인가요?
- Q: 마운트 정보는 언제 DB에 저장되나요? (실시간 vs 확정 시)

### 2. 복사/붙여넣기 정책
- Q: 다른 페이지로 붙여넣기 시 위치 계산은 어떻게 되나요?
- Q: 엣지도 함께 복사되나요?
- Q: 외부 애플리케이션에서 붙여넣기 시 어떤 형식으로 변환되나요?

### 3. 엣지 연결 규칙
- Q: 특정 블럭 타입은 엣지 연결이 불가능한가요?
- Q: 자기 자신으로의 엣지(self-loop) 허용인가요?
- Q: 같은 블럭 쌍 사이에 여러 엣지 허용인가요?
- Q: 양방향 엣지와 단방향 엣지를 구분하나요?

### 4. React Flow 통합
- Q: React Flow의 상태를 우리가 완전히 제어하나요, 아니면 React Flow가 제어하나요?
- Q: React Flow의 Undo/Redo를 사용하나요, 우리가 직접 구현하나요?
- Q: React Flow 업데이트 시 마이그레이션 전략은?

### 5. 성능 최적화
- Q: 블럭 1000개 이상일 때 가상화를 적용하나요?
- Q: 드래그 중 이벤트 throttle 간격은? (예: 16ms, 100ms)
- Q: 페이지 로드 시 블럭/엣지를 한 번에 로드하나요, 청크로 나눠서 로드하나요?

---

## 📝 Process Model 준비 상태

Canvas Management Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션 (블럭 생성, 엣지 연결 등)
2. **Policy** 정의: React Flow State와 DB 동기화, 블럭 삭제 시 엣지 자동 제거, 스냅 가이드 규칙
3. **Read Model** 명시: 캔버스 블럭 목록 조회, 엣지 목록 조회, 뷰포트 상태
4. **External System**: React Flow ACL, Block Domain 서비스 호출

Process Modeling으로 진행하시겠습니까?

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 2025년 10월 18일 (온라인)
**참가자**: 
- **도메인 전문가**: PM (Canvas Management 구조 정책)
- **PM**: AI Assistant
- **기획자**: AI Assistant
- **시니어 개발자**: AI Assistant

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성 (59개 이벤트 식별)
- [x] 커맨드 및 액터 식별 완료
- [x] Bounded Context 경계 정의 완료 (단일 Context)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### Workspace Management Domain과의 관계
- **연결점**: 페이지 생명주기와 캔버스 초기화/정리 동기화
- **데이터 흐름**: Workspace Management → Canvas Management (페이지 생성/삭제 커맨드)
- **통합 방식**: 
  - 동기적 서비스 주입: `[페이지가 생성됨]` → `[캔버스 초기화]`
  - Server Action에서 Canvas 서비스 직접 호출

### Block Domain과의 관계
- **연결점**: 블럭 생성 요청, 타입 검증, 렌더링 컴포넌트 제공
- **데이터 흐름**: Canvas Management ↔ Block Domain (양방향)
- **통합 방식**: 
  - 동기적 서비스 주입: 블럭 생성 시 Block 서비스 호출
  - Block Domain이 렌더링 컴포넌트 제공

### React Flow (외부 라이브러리)와의 관계
- **연결점**: 캔버스 렌더링, 인터랙션 처리, 엣지 경로 계산
- **데이터 흐름**: Canvas Management → React Flow (ACL)
- **통합 방식**: 
  - Anti-Corruption Layer 패턴으로 데이터 변환
  - React Flow State (단기 SoT) + DB (장기 SoT)

---

*이 Event Storming 문서는 Canvas Management Domain의 Process Model 작성을 위한 기반 자료입니다.*
