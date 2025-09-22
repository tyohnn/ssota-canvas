# Visual Canvas Domain - Event Storming 정리

## 📊 Domain Overview
**비즈니스 가치**: 무한 캔버스에서의 자유로운 시각적 작업 - 쏘타의 핵심 차별화 요소

## 📝 핵심 개념 정리

### 블럭의 3가지 속성 체계
1. **기본 속성 (Default Properties)**
   - 블럭 타입별 필수 속성
   - 예: 유튜브 URL, 이미지 경로, 지도 좌표
   - 수정 불가, 블럭 타입에 종속

2. **스타일 속성 (Style Properties)**
   - 블럭 타입별 시각적 속성
   - 예: 색상, 폰트, 테두리, 정렬
   - 블럭 타입마다 다른 세트

3. **커스텀 속성 (Custom Properties)**
   - 사용자 정의 속성 (Smart Properties Domain에서 관리)
   - 모든 블럭 타입에 추가 가능
   - 데이터 정형화의 핵심

### 블럭 타입별 사이징 규칙
- **너비만 조정**: 텍스트, 마크다운 블럭
- **너비/높이 모두**: 도형, iframe 블럭
- **고정 비율**: 이미지, 영상, 유튜브 블럭
- **고정 크기**: 트위터 프리뷰 블럭

### 지원 블럭 타입 (확장 가능)
- 텍스트 블럭
- 도형 블럭 (사각형, 원, 다이아몬드 등)
- 이미지 블럭
- 영상 블럭
- URL 프리뷰 블럭
- 마크다운 블럭
- 웹 iframe 블럭
- 유튜브 블럭
- 트위터 프리뷰 블럭
- 지도 블럭
- LaTeX 수식 블럭
- 코드 블럭

---

## 🟠 Domain Events (시간 순서)

### 블럭 타입 및 속성 (Block Types & Properties)
- 블럭 타입이 선택되었다 (Block Type Selected)
  - *텍스트, 도형, 이미지, 영상, URL, 마크다운, iframe, 유튜브, 트위터, 지도, LaTeX, 코드 등*
- 블럭의 기본 속성이 설정되었다 (Block Default Property Set)
  - *예: 유튜브 URL, 이미지 소스, 지도 좌표 등*
- 블럭의 스타일 속성이 정의되었다 (Block Style Property Defined)
  - *블럭 타입별로 다른 스타일 속성 세트*
- 블럭의 사이징 규칙이 적용되었다 (Block Sizing Rule Applied)
  - *너비만, 너비/높이, 고정 비율 등*

### 블럭 생명주기 (Block Lifecycle)
- 특정 타입의 블럭이 생성되었다 (Typed Block Created)
- 블럭이 페이지에 마운트되었다 (Block Mounted to Page) 
  - *생성과 동시에 발생, 블럭은 항상 최소 한 페이지에 존재*
- 블럭의 타입이 변경되었다 (Block Type Changed)
  - *가능한 경우에만*
- 블럭이 다른 페이지에 추가로 마운트되었다 (Block Mounted to Additional Page)
- 블럭이 복사되었다 (Block Copied)
- 블럭이 붙여넣기되었다 (Block Pasted)
- 블럭이 삭제되었다 (Block Deleted) 
  - *휴지통으로 이동, 실제 삭제 아님*
- 블럭이 복구되었다 (Block Restored)

### 블럭 선택 (Block Selection)
- 블럭이 선택되었다 (Block Selected)
- 여러 블럭이 다중 선택되었다 (Multiple Blocks Selected)
- 블럭 선택이 해제되었다 (Block Selection Cleared)
- 모든 블럭이 선택되었다 (All Blocks Selected)

### 블럭 그룹화 (Block Grouping)
- 블럭들이 그룹으로 묶였다 (Blocks Grouped)
- 그룹이 해제되었다 (Group Ungrouped)
- 그룹이 선택되었다 (Group Selected)

### 블럭 위치 및 크기 (Block Transform)
- 블럭이 드래그 시작되었다 (Block Drag Started)
- 블럭이 이동 중이다 (Block Moving)
- 블럭의 페이지별 위치가 확정되었다 (Block Position Confirmed on Page)
- 블럭의 페이지별 크기가 변경되었다 (Block Size Changed on Page)
- 블럭의 페이지별 Z-Order가 변경되었다 (Block Z-Order Changed on Page)

### 블럭 정렬 (Block Alignment)
- 블럭들이 상단 정렬되었다 (Blocks Top-Aligned)
- 블럭들이 하단 정렬되었다 (Blocks Bottom-Aligned)
- 블럭들이 좌측 정렬되었다 (Blocks Left-Aligned)
- 블럭들이 우측 정렬되었다 (Blocks Right-Aligned)
- 블럭들이 수직 중앙 정렬되었다 (Blocks Vertically Centered)
- 블럭들이 수평 중앙 정렬되었다 (Blocks Horizontally Centered)
- 블럭들이 동일 간격으로 분포되었다 (Blocks Distributed Evenly)
- 블럭들이 그리드 정렬되었다 (Blocks Grid-Aligned)

### 스마트 가이드 (Smart Guides)
- 스냅 가이드라인이 표시되었다 (Snap Guidelines Shown)
- 블럭이 가이드라인에 스냅되었다 (Block Snapped to Guideline)
- 블럭 간 거리가 표시되었다 (Distance Between Blocks Shown)
- 블럭이 그리드에 스냅되었다 (Block Snapped to Grid)

### 블럭 속성 편집 (Block Property Editing)
- 블럭의 기본 속성이 수정되었다 (Block Default Property Modified)
  - *유튜브 URL 변경, 이미지 소스 변경, 지도 좌표 변경 등*
- 블럭의 스타일 속성이 수정되었다 (Block Style Property Modified)
  - *블럭 타입별 허용된 스타일만 수정 가능*
- 텍스트 블럭의 정렬이 변경되었다 (Text Block Alignment Changed)
- 텍스트 블럭의 스타일이 적용되었다 (Text Block Style Applied) 
  - *bold, italic, underline 등*
- 텍스트 블럭의 색상이 변경되었다 (Text Block Color Changed)
- 도형 블럭의 타입이 변경되었다 (Shape Block Type Changed)
  - *사각형, 원, 다이아몬드 등*
- 도형 블럭의 색상이 변경되었다 (Shape Block Color Changed)
- 이미지 블럭의 크기 조정 모드가 변경되었다 (Image Block Resize Mode Changed)
  - *contain, cover, fill 등*
- 코드 블럭의 언어가 설정되었다 (Code Block Language Set)
- LaTeX 블럭의 수식이 편집되었다 (LaTeX Block Formula Edited)

### 엣지 관리 (Edge Management)
- 엣지가 생성되었다 (Edge Created)
  - *특정 페이지에서만 존재*
- 엣지가 삭제되었다 (Edge Deleted)
  - *연결된 블럭 삭제 시 자동 처리*
- 엣지가 재연결되었다 (Edge Reconnected)
- 엣지 레이블이 변경되었다 (Edge Label Changed)
- 엣지 스타일이 변경되었다 (Edge Style Changed)

### 캔버스 뷰포트 (Canvas Viewport)
- 캔버스가 줌인되었다 (Canvas Zoomed In)
- 캔버스가 줌아웃되었다 (Canvas Zoomed Out)
- 캔버스가 100%로 리셋되었다 (Canvas Zoom Reset to 100%)
- 캔버스가 화면에 맞춰졌다 (Canvas Fit to Screen)
- 캔버스가 패닝되었다 (Canvas Panned)
- 캔버스가 특정 블럭으로 포커스되었다 (Canvas Focused on Block)

### 페이지 뷰 관리 (Page View Management)
- 캔버스 뷰가 열렸다 (Canvas View Opened)
  - *페이지의 기본 뷰*
- 페이지의 기본 뷰가 설정되었다 (Page Default View Set)

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **대량 블럭 렌더링 성능**
   - 문제: 1000개 이상 블럭 시 성능 저하
   - 영향: 사용자 경험 직접 저하

2. **Z-Order 일관성**
   - 문제: 그룹 선택 시 개별 블럭의 Z-Order 유지/변경 규칙 불명확
   - 영향: 예측 가능한 동작 필요

3. **엣지-블럭 동기화**
   - 문제: 블럭 삭제/복구 시 연결된 엣지 상태 관리 복잡
   - 영향: 데이터 일관성

### 우선순위: 중간
4. **페이지별 독립적 렌더링**
   - 문제: 같은 블럭이 여러 페이지에서 다른 위치/크기/엣지 관리
   - 영향: 상태 관리 복잡도 증가

5. **이벤트 과다 발생**
   - 문제: 드래그 중 수많은 "이동 중" 이벤트 발생
   - 영향: 이벤트 저장소 부담

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **스마트 가이드 시스템**
   - 기회: Figma 스타일의 정교한 정렬 도구
   - 구현: 거리 표시, 자동 스냅, 가이드라인

2. **효율적인 다중 선택**
   - 기회: Shift/Ctrl 키를 활용한 빠른 선택
   - 구현: 범위 선택, 선택 추가/제거

3. **직관적인 그룹 관리**
   - 기회: 그룹화로 복잡한 다이어그램 관리 단순화
   - 구현: Ctrl+G 그룹화, Ctrl+Shift+G 그룹 해제

### 향후 구현 (Post-MVP)
4. **스마트 레이아웃** *(메모)*
   - 자동 정렬 알고리즘
   - 일괄 재배치 기능

5. **제스처 기반 조작** *(메모)*
   - 단축키 커스터마이징
   - 마우스 제스처 지원

6. **고급 뷰포트 기능** *(메모)*
   - 미니맵
   - 뷰포트 북마크

---

## ❓ Process Modeling을 위한 추가 질문

### 1. 블럭 타입 변경 관련
- Q: 텍스트 블럭을 도형 블럭으로 변경 가능한가요?
- Q: 타입 변경 시 호환되지 않는 속성은 어떻게 처리되나요?
- Q: 어떤 타입 간 변경이 허용되나요?

### 2. 복사/붙여넣기 정책
- Q: 다른 페이지로 붙여넣기 시 새 블럭 생성인가요, 기존 블럭 마운트인가요?
- Q: 엣지도 함께 복사되나요?
- Q: 스타일 속성만 복사하는 기능도 있나요?

### 3. 그룹 동작 정책
- Q: 서로 다른 타입의 블럭들도 그룹화 가능한가요?
- Q: 그룹 내 블럭을 개별 이동 가능한가요?
- Q: 중첩 그룹(그룹 안의 그룹) 허용인가요?

### 4. 엣지 연결 규칙
- Q: 특정 블럭 타입은 엣지 연결 불가능한가요? (예: 트위터 프리뷰)
- Q: 자기 자신으로의 엣지(self-loop) 허용인가요?
- Q: 다중 엣지(같은 블럭 쌍 사이 여러 엣지) 허용인가요?

### 5. 블럭 타입별 특수 동작
- Q: 유튜브/트위터 블럭의 미리보기는 실시간인가요?
- Q: 코드 블럭의 신택스 하이라이팅 지원 언어는?
- Q: LaTeX 블럭의 렌더링은 클라이언트/서버 어디서?

---

## 📝 Process Model 준비 상태

Visual Canvas Domain의 핵심 이벤트들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션
2. **Policy** 정의: 비즈니스 규칙과 자동 반응
3. **Read Model** 명시: 각 작업에 필요한 정보
4. **System** 경계: 처리 담당 시스템 구분

준비되시면 Process Modeling으로 진행하시겠습니까?