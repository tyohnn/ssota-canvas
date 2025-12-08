# Sprint 017: UI/UX Improvements

## 🎯 Sprint 개요
**목표**: UI/UX 개선 작업을 완성하여 사용자가 더 빠르고 직관적으로 작업할 수 있도록 한다

**기간**: 2025-12-04 ~ 2025-12-10 (1주)  
**팀**: 개발팀  
**용량**: 40시간 (2명 × 5일 × 4시간)  
**Story Points**: 13pts

## 📋 포함 Story

### Story E010-001: 이미지 블록 수정 (5pts)
**목표**: 이미지 블록을 간소화하여 핵심 기능만 유지  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-09

**구현 상세 (8개 항목)**:
1. 블록 액션 주석 처리
2. objectFit 항상 cover 고정 + 옵션 제거
3. 이미지 업로드 시 종횡비 맞춤 블록 크기 자동 설정
4. 종횡비 고정 리사이저 옵션 추가
5. alt 버튼 주석
6. 이미지 확대 버튼 주석
7. 블록 앱스페이스 버튼 주석
8. 캡션 보이기 주석

### Story E010-002: 엣지 핸들 숨기기 (1pt)
**목표**: 불필요한 엣지 핸들을 숨겨 UI 간소화  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-05

**구현 상세**:
- 기본 상태: 핸들 숨김
- 블록 경계 호버 시: 해당 방향 핸들 표시
- 연결 모드 시: 다른 블록 호버할 때 핸들 표시

### Story E010-003: 블록 추가 버튼 (1pt)
**목표**: 블록 주변 + 버튼으로 동일 블록 빠르게 추가  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-05

**구현 상세**:
- 블록 선택 시 상하좌우 경계 근처에 마우스 올리면 + 버튼 표시
- 클릭 시 해당 방향에 동일 타입/속성 블록 생성
- 블록 간 간격은 상수로 정의

### Story E010-004: 블록 액션 위치 (1pt)
**목표**: 블록 액션을 블록 아래쪽으로 이동  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-06

**구현 상세**:
- Position.Right → Position.Bottom

### Story E010-005: 에디터 패널/더보기 버튼 위치 (1pt)
**목표**: 에디터 패널 위치 확인  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-06

**구현 상세**:
- 현재 위치(우하단)가 적절함 → 유지

### Story E010-006: 호버 시 스케일 효과 제거 (1pt)
**목표**: 마우스 호버 시 블록 확대 효과 제거  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-05

**구현 상세**:
- 모든 블록에서 hover:scale-[1.02] 제거
- 그림자 효과는 유지

### Story E010-007: 캔버스 툴바 좌측 중앙 (1pt)
**목표**: 캔버스 툴바를 좌측 중앙으로 이동 + 수직 배치  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-06

**구현 상세**:
- top-center → left (좌측 중앙)
- 툴바 아이템 수직 배치 (flex-col)

### Story E010-008: 에디터 패널 크기 조정 (1pt)
**목표**: 에디터 패널의 높이/너비 확대 및 UI 개선  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-09

**구현 상세**:
- w-[43%] h-[85%] → w-[50%] h-[90%]

### Story E010-009: 블록 페이지 옮기기 (1pt)
**목표**: 블록을 다른 페이지로 이동하는 기능  
**담당자**: Frontend Developer  
**예상 완료일**: 2025-12-09

**구현 상세**:
- mount toolbar 더보기 메뉴에 "페이지 옮기기" 옵션 추가
- 클릭 시 페이지 검색 팝오버 표시
- 선택 시 블록을 해당 페이지로 이동

## 📅 Sprint 일정

### Week 1
- **수요일 (12-04)**: 
  - E010-002, E010-003, E010-006 시작 (작은 작업들)
  - E010-001 이미지 블록 분석 및 설계
- **목요일 (12-05)**: 
  - E010-002, E010-003, E010-006 완료
  - E010-001 이미지 블록 간소화 구현 시작
- **금요일 (12-06)**: 
  - E010-004, E010-005, E010-007 완료
  - E010-001 이미지 블록 간소화 계속
- **월요일 (12-09)**: 
  - E010-001 이미지 블록 간소화 완료
  - E010-008, E010-009 시작 및 완료
- **화요일 (12-10)**: 
  - 전체 통합 테스트 및 버그 수정
  - Sprint 회고

## 🔗 의존성 및 리스크

### 의존성
- **외부 의존성**: React Flow, UI Component Library
- **내부 의존성**: Epic-005 기본 블록 시스템 (완료 필요)

### 리스크
- **기술적 리스크**: UI 변경으로 인한 기존 기능 영향
  - **대응**: 충분한 테스트 및 점진적 배포
- **일정 리스크**: 여러 작은 작업의 누적 지연
  - **대응**: 일일 체크포인트로 진행 상황 모니터링

## 🎯 완료 기준

### 기능적 완료
- [ ] 이미지 블록 간소화 완료 (7개 항목)
- [ ] 모든 UI 요소 위치 변경 완료
- [ ] 호버 효과 제거 완료
- [ ] 블록 선택 후 페이지 이동 기능 완료

### 기술적 완료
- [ ] 단위 테스트 커버리지 75% 이상
- [ ] Integration Tests 통과
- [ ] E2E Tests 통과
- [ ] 코드 리뷰 완료

### 품질 완료
- [ ] 접근성 기준 충족
- [ ] 사용자 경험 개선 검증
- [ ] 보안 취약점 0개

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **수요일**: 작은 작업 3개 시작, 이미지 블록 분석 완료
- [ ] **목요일**: 작은 작업 3개 완료, 이미지 블록 구현 시작
- [ ] **금요일**: 위치 변경 작업 3개 완료, 이미지 블록 진행 중
- [ ] **월요일**: 이미지 블록 완료, 마지막 작업 2개 완료
- [ ] **화요일**: 모든 작업 완료, 통합 테스트 완료

## 📁 관련 문서
- [Epic-010: UI/UX Improvements](../epics/epic-010-ui-ux-improvements.md)
- [Story E010-001: 이미지 블록 수정](../stories/canvas-management/story-e010-001-image-block-simplification.md)
- [Story E010-002: 엣지 핸들 숨기기](../stories/canvas-management/story-e010-002-edge-handle-hiding.md)
- [Story E010-003: 블록 추가 숏컷](../stories/canvas-management/story-e010-003-block-add-shortcut.md)
- [Story E010-004: 블록 액션 위치](../stories/canvas-management/story-e010-004-block-action-position.md)
- [Story E010-005: 에디터 패널 위치](../stories/canvas-management/story-e010-005-editor-panel-position.md)
- [Story E010-006: 호버 회전 제거](../stories/canvas-management/story-e010-006-hover-rotation-removal.md)
- [Story E010-007: 툴바 위치](../stories/canvas-management/story-e010-007-toolbar-position.md)
- [Story E010-008: 에디터 패널 크기](../stories/canvas-management/story-e010-008-editor-panel-size.md)
- [Story E010-009: 블록 페이지 이동](../stories/canvas-management/story-e010-009-block-page-navigation.md)

