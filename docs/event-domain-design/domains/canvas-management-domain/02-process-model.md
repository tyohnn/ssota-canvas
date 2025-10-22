# Process Model: Canvas Management Domain

## 🎯 개요

**도메인**: Canvas Management Domain  
**작성자**: 도메인전문가 + 시니어개발자  
**작성일**: 2025-10-20  
**버전**: v1.1

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), `03-user-flow.md` (Frontend)

---

## 🎯 Process Modeling Overview

Canvas Management Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의합니다.

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성해야 할 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙 (블럭 생명주기, Z-Order, 스냅 정책)
- 권한 기반 필터링 로직
- 시스템 처리 흐름 (React Flow State ↔ DB 동기화)
- 데이터 검증 규칙 (블럭 타입 검증, 엣지 연결 규칙)
- 외부 시스템 통합 (Workspace Management, Block Domain, React Flow)

#### ✅ 선택적으로 작성 가능 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 블럭 도구 바*`, `*UI Hint: 스냅 가이드라인 표시*`

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

### 🟪 External Systems

#### 1. Workspace Management Domain (내부 도메인)
- **역할**: 페이지 생명주기 관리 및 캔버스 초기화/정리 트리거
- **SSOT**: Workspace Management가 페이지 생성/삭제의 Single Source of Truth
- **통합**: 동기적 서비스 주입 (Next.js Server Actions)

#### 2. Block Management Domain (내부 도메인)
- **역할**: 블럭 생명주기 관리 (생성, 수정, 삭제), 블럭 타입별 메타데이터 스키마 검증
- **SSOT**: Block Management가 blocks 테이블의 Single Source of Truth
- **통합**: 
  - **블럭 생성**: Canvas Management → Block Management (createBlockAction 호출)
  - **블럭 조회**: Canvas Management → Block Management (DB JOIN으로 blocks 테이블 직접 조회)
  - **직접 DB JOIN**: Canvas에서 `block_mounts.block_id → blocks.id` 관계로 조회

#### 3. React Flow (외부 라이브러리)
- **역할**: 캔버스 렌더링, 인터랙션 처리, 엣지 경로 계산
- **SSOT**: React Flow State가 단기 SoT, Database가 장기 SoT
- **통합**: Anti-Corruption Layer (ACL) 패턴

---

## 📍 Scenario 0: 외부 도메인과의 동기화

### Sequence 1: 페이지 생성 시 캔버스 초기화

**Trigger Event**: Workspace Management에서 페이지 생성 완료

```
🔗 Workspace Management: "새 페이지가 생성되었어"
```

**Policy**: 
- "Whenever 페이지가 생성됨, then always 캔버스 초기화하기"
- "If 새 페이지임, then 빈 캔버스 상태로 초기화하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 빈 캔버스 영역
- 블럭 생성 도구 접근 가능 상태
- 뷰포트 초기 위치 표시

**Command**: 캔버스 초기화 처리
- 페이지 ID 정보
- 초기화 타입 (새 페이지 vs 기존 페이지)

**System**: Canvas Initialization Manager (Backend - Security Enforcement)
- 비즈니스 로직: 페이지별 캔버스 상태 초기화, 사용자 권한 확인
- 검증 로직: 페이지 접근 권한 확인, 캔버스 초기화 조건 검증
- 처리 로직: React Flow 인스턴스 생성, 초기 뷰포트 설정

**Events**:
1. 캔버스가 초기화되었다 (Canvas Initialized)
   - *페이지 접근 시 React Flow 인스턴스 생성 및 초기 데이터 로드*

### Sequence 2: 기존 페이지 로드 시 블럭/엣지 복원

**Trigger Event**: 캔버스가 초기화되었다

**Policy**: 
- "Whenever 캔버스 초기화됨, then always 페이지 데이터 로드하기"
- "If 기존 페이지임, then 블럭과 엣지 모두 로드하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 페이지별 블럭 목록 및 위치 정보
- 페이지별 엣지 목록 및 연결 정보
- 로딩 진행 상태

**Command**: 페이지 데이터 로드
- 페이지 ID
- 사용자 권한 정보

**System**: Canvas Data Manager (Backend - Security Enforcement)
- 비즈니스 로직: 페이지별 마운트된 블럭 조회, 엣지 관계 조회
- 검증 로직: 페이지 접근 권한 재확인
- 처리 로직: 블럭 마운트 정보 로드, 엣지 연결 정보 로드

**Events**:
1. 페이지의 블럭들이 로드되었다 (Page Blocks Loaded)
2. 페이지의 엣지들이 로드되었다 (Page Edges Loaded)

---

## 📍 Scenario 1: 블럭 생성 및 마운팅

### Sequence 1: 사용자가 새 블럭을 생성

**Trigger Event**: 사용자 블럭 생성 요청

```
👤 사용자: "도구바에서 블럭 타입을 선택하고 캔버스에 배치하고 싶어"
```

**Policy**: 
- "Whenever 블럭 생성 요청됨, then always Block Management Domain에서 블럭 생성하기"
- "Whenever 블럭 생성 완료됨, then always 페이지에 마운트하기"
- "새로 생성된 블럭은 가장 위(z-order 최상위)에 배치"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 사용 가능한 블럭 타입 목록 (Block Management Domain에서 조회)
- 캔버스 커서 위치 (마우스 좌표)
- 생성 진행 상태
- *UI Hint: 블럭 도구바 및 캔버스 커서*

**Command**: 블럭 생성 요청 (사용자가 입력하는 정보)
- 선택한 블럭 타입
- 캔버스 클릭 위치 (x, y 좌표)
- 워크스페이스 ID

**System**: Block Creation Manager
- **Frontend (UI Interaction)**: 블럭 도구바에서 타입 선택, 캔버스 클릭 위치 감지
- **Backend (Security Enforcement)**: Block Management Domain의 createBlockAction 호출
- 비즈니스 로직: 워크스페이스 접근 권한 확인, 블럭 타입 유효성 확인
- 처리 로직: Block Management Domain에 블럭 생성 요청, blocks 테이블에 저장

**Events**:
1. **Frontend**: 블럭 생성 요청이 시작되었다 (Block Creation Request Started)
2. **Backend**: 블럭 생성이 요청되었다 (Block Creation Requested)

**Policy**: "Whenever 블럭 생성 요청됨, then always Block Management Domain에서 blocks 테이블에 블럭 생성하기"

**External System**: Block Management Domain
- **호출**: `createBlockAction(workspaceId, blockType, initialMetadata)`
- **처리**: BlockAggregate.createBlock() → blocks 테이블에 저장
- **반환**: BlockDTO (생성된 블럭 정보)

**Events**: 블럭이 생성되었다 (Block Created in Block Management Domain)

### Sequence 2: 생성된 블럭을 페이지에 마운트

**Trigger Event**: 블럭이 생성되었다 (Block Management Domain에서 blocks 테이블에 저장 완료)

**Policy**: 
- "Whenever Block Management에서 블럭 생성 완료됨, then always Canvas Management에서 블럭 마운트하기"
- "블럭은 반드시 하나 이상의 페이지에 마운트되어야 함"
- "하나의 블럭은 여러 페이지에 마운트 가능하지만, 같은 페이지에는 한 번만 마운트 가능"
- "초기 위치는 클릭한 좌표, 초기 크기는 블럭 타입별 기본값"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- Block Management에서 생성된 블럭 정보 (BlockDTO)
- 마운트할 페이지 정보
- 마운트 위치 정보 (클릭한 좌표)

**Command**: 블럭 마운트 처리
- 생성된 블럭 ID (Block Management에서 반환)
- 페이지 ID
- 마운트 위치 (x, y)
- 초기 크기 (width, height)

**System**: Block Mounting Manager (Backend - Security Enforcement)
- 비즈니스 로직: block_mounts 테이블에 마운트 관계 생성, Z-Order 최상위 설정
- 검증 로직: 
  - 블럭 ID가 Block Management Domain의 blocks 테이블에 존재하는지 확인
  - 페이지 접근 권한 확인
  - 같은 블럭이 같은 페이지에 이미 마운트되지 않았는지 확인 (UNIQUE 제약조건)
- 처리 로직: 
  - block_mounts 테이블에 마운트 정보 저장
  - React Flow에 노드 추가 (블럭 정보는 DB JOIN으로 조회)

**Events**:
1. 블럭이 페이지에 마운트되었다 (Block Mounted to Page)

**데이터 흐름 정리**:
1. **Block Management Domain**: blocks 테이블에 블럭 생성
2. **Canvas Management Domain**: block_mounts 테이블에 마운트 관계 생성  
3. **렌더링**: Canvas에서 `block_mounts JOIN blocks` 쿼리로 블럭 정보 + 마운트 정보 조회

---

## 📍 Scenario 2: 블럭 변환 (이동, 리사이즈, Z-Order)

### Sequence 1: 블럭 드래그 이동

**Trigger Event**: 사용자가 블럭을 드래그 시작

```
👤 사용자: "블럭을 드래그해서 원하는 위치로 이동시키고 싶어"
```

**Policy**: 
- "Whenever 블럭 드래그 시작됨, then always 실시간 위치 업데이트하기"
- "드래그 중에는 스냅 가이드라인 표시하기"
- "드래그 종료 시에만 DB에 최종 위치 저장하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 드래그 중인 블럭의 실시간 위치
- 다른 블럭과의 스냅 가능한 가이드라인
- 드래그 중 상태 표시
- *UI Hint: 스냅 가이드라인 표시*

**Command**: 블럭 드래그 처리
- 드래그 중인 블럭 ID
- 실시간 마우스 위치 (x, y)
- 드래그 시작 위치 vs 현재 위치

**System**: Block Transform Manager
- **Frontend (Real-time Rendering)**: React Flow를 통한 실시간 위치 업데이트
- **Backend (Final Persistence)**: 드래그 종료 시 DB 저장

**Events**:
1. 블럭 드래그가 시작되었다 (Block Drag Started)
2. 블럭이 이동 중이다 (Block Moving)

### Sequence 2: 드래그 종료 및 위치 확정

**Trigger Event**: 사용자가 드래그 종료

**Policy**: 
- "Whenever 드래그 종료됨, then always 최종 위치를 DB에 저장하기"
- "스냅 임계값 5px 이내면 자동으로 정렬 포인트에 스냅하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 블럭의 최종 위치 정보
- 스냅 적용 여부 표시

**Command**: 블럭 위치 확정
- 블럭 ID
- 최종 위치 (x, y)
- 스냅 적용 여부

**System**: Block Transform Manager (Backend - Security Enforcement)
- 비즈니스 로직: 스냅 임계값 검사 (5px), 가이드라인 우선순위 적용
- 검증 로직: 유효한 좌표 범위 확인
- 처리 로직: 마운트 정보 업데이트, DB 저장, React Flow 상태 동기화

**Events**:
1. 블럭 위치가 확정되었다 (Block Position Confirmed)
2. 블럭이 가이드라인에 스냅되었다 (Block Snapped to Guideline) *스냅 적용 시*

### Sequence 3: 블럭 리사이즈

**Trigger Event**: 사용자가 블럭 리사이즈 시작

**Policy**: 
- "블럭 크기 변경 중에는 실시간 업데이트하기"
- "최소/최대 크기 제한 적용하기"
- "리사이즈 종료 시에만 DB에 저장하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 리사이즈 중인 블럭의 실시간 크기
- 최소/최대 크기 제한 표시
- *UI Hint: 리사이즈 핸들과 크기 표시*

**Command**: 블럭 리사이즈 처리
- 블럭 ID
- 리사이즈 방향 (가로, 세로, 대각선)
- 실시간 크기 (width, height)

**System**: Block Transform Manager
- **Frontend (Real-time Rendering)**: React Flow를 통한 실시간 크기 업데이트
- **Backend (Final Persistence)**: 리사이즈 종료 시 크기 제한 검사 후 DB 저장

**Events**:
1. 블럭 리사이즈가 시작되었다 (Block Resize Started)
2. 블럭 크기가 변경 중이다 (Block Resizing)
3. 블럭 크기가 확정되었다 (Block Size Confirmed)

---

## 📍 Scenario 3: 블럭 복제

### Sequence 1: 블럭 복제 요청

**Trigger Event**: 사용자가 블럭 복제 요청

```
👤 사용자: "기존 블럭을 복사해서 비슷한 블럭을 빠르게 만들고 싶어"
```

**Policy**: 
- "Whenever 블럭 복제 요청됨, then always Block Management Domain에서 새로운 블럭 생성하기"
- "복제된 블럭은 원본과 동일한 타입과 메타데이터를 가지지만 완전히 새로운 블럭 ID를 가짐"
- "복제된 블럭은 원본 근처 위치에 새로운 마운트로 생성하기"
- "복제 시 원본의 마운트 정보는 복제되지 않음 (새로운 마운트 관계만 생성)"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 복제될 블럭 정보 (타입, 속성 미리보기) - DB JOIN으로 조회
- 복제 진행 상태
- *UI Hint: 복제 옵션 및 미리보기*

**Command**: 블럭 복제 요청
- 복제할 블럭 ID
- 복제 위치 (원본 근처 vs 자유 위치)

**System**: Block Duplication Manager
- **Frontend (UI Interaction)**: Ctrl+D 또는 복제 메뉴 클릭 감지
- **Backend (Security Enforcement)**: Canvas Management Domain의 duplicateBlockAction 호출
- 비즈니스 로직: 
- 검증 로직: 
  - 원본 블럭이 blocks 테이블에 존재하는지 확인 (DB JOIN으로)
  - 페이지 접근 권한 확인
- 처리 로직: Block Management Domain에 블럭 복제 요청

**Events**:
1. **Frontend**: 블럭 복제 요청이 시작되었다 (Block Duplication Request Started)
2. **Backend**: 블럭 복제가 요청되었다 (Block Duplication Requested)

**External System**: Block Management Domain
- **호출**: `duplicateBlockAction(blockId)`
- **처리**: BlockAggregate.duplicateBlock() → blocks 테이블에 완전히 새로운 블럭 생성 (새로운 ID, 동일한 타입/메타데이터)
- **반환**: BlockDTO (새로 생성된 복제 블럭 정보)

**Events**: 블럭이 복제되었다 (Block Duplicated in Block Management Domain)

**Policy**: "Whenever Block Management에서 블럭 복제 완료됨, then always 복제된 블럭을 페이지에 마운트하기"

**Command**: 복제된 블럭 마운트 처리
- 복제된 블럭 ID (Block Management에서 반환)
- 페이지 ID
- 마운트 위치 (원본 근처 + 오프셋)

**System**: Block Mounting Manager (Backend - Security Enforcement)
- 비즈니스 로직: block_mounts 테이블에 복제된 블럭의 새로운 마운트 관계 생성, Z-Order 최상위 설정
- 검증 로직: 
  - 복제된 블럭 ID가 blocks 테이블에 존재하는지 확인
  - 같은 블럭이 같은 페이지에 중복 마운트되지 않았는지 확인
- 처리 로직: 
  - block_mounts 테이블에 새로운 마운트 정보 저장 (복제된 블럭 ID + 페이지 ID)
  - React Flow에 새 노드 추가

**Events**:
1. 복제된 블럭이 페이지에 마운트되었다 (Duplicated Block Mounted to Page)

**데이터 흐름 정리**:
1. **Canvas Management**: 원본 블럭 정보를 DB JOIN으로 조회
2. **Block Management Domain**: blocks 테이블에 완전히 새로운 블럭 생성 (새로운 블럭 ID)
3. **Canvas Management**: block_mounts 테이블에 새로운 마운트 관계 생성 (복제된 블럭 ID + 페이지 ID)

---

## 📍 Scenario 4: 블럭 선택 및 다중 선택

### Sequence 1: 단일 블럭 선택

**Trigger Event**: 사용자가 블럭 클릭

```
👤 사용자: "블럭을 클릭해서 선택하고 편집하고 싶어"
```

**Policy**: 
- "Whenever 블럭 클릭됨, then always 기존 선택 해제 후 새 블럭 선택하기"
- "선택된 블럭은 시각적 강조 표시하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 선택된 블럭 정보 (ID, 타입, 크기, 위치)
- 선택 상태 표시
- 편집 옵션 (삭제, 복제, 속성 편집)
- *UI Hint: 선택된 블럭의 테두리 강조*

**Command**: 블럭 선택 요청
- 클릭한 블럭 ID
- 마우스 위치 정보

**System**: Block Selection Manager
- **Frontend (Selection UI)**: 선택 상태 관리, 시각적 피드백 제공
- 비즈니스 로직: 이전 선택 해제, 새 블럭 선택 상태 업데이트

**Events**:
1. 블럭이 선택되었다 (Block Selected)
2. 선택이 해제되었다 (Selection Cleared) *이전 선택 해제 시*

### Sequence 2: 다중 블럭 선택

**Trigger Event**: 사용자가 Shift/Ctrl + 클릭 또는 영역 선택

```
👤 사용자: "여러 블럭을 한 번에 선택해서 정렬하거나 이동시키고 싶어"
```

**Policy**: 
- "Shift/Ctrl + 클릭 시 기존 선택에 추가/제거하기"
- "영역 선택 시 드래그 범위 내 모든 블럭 선택하기"
- "Ctrl+A로 모든 블럭 선택하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 선택된 블럭 목록
- 선택된 블럭 개수 표시
- 다중 선택 전용 도구 (정렬, 그룹 이동)
- *UI Hint: 다중 선택된 블럭들의 테두리*

**Command**: 다중 선택 처리
- 선택 방식 (Shift 추가, Ctrl 토글, 영역 선택, 전체 선택)
- 대상 블럭 ID들

**System**: Block Selection Manager
- **Frontend (Multi-selection UI)**: 다중 선택 상태 관리, 영역 선택 처리
- 비즈니스 로직: 선택 추가/제거 규칙 적용, 선택된 블럭 목록 업데이트

**Events**:
1. 블럭이 다중 선택에 추가되었다 (Block Added to Selection)
2. 여러 블럭이 선택되었다 (Multiple Blocks Selected)
3. 모든 블럭이 선택되었다 (All Blocks Selected)

---

## 📍 Scenario 5: 블럭 정렬 도구

### Sequence 1: 다중 선택된 블럭들 정렬

**Trigger Event**: 사용자가 정렬 도구 버튼 클릭

```
👤 사용자: "선택한 여러 블럭들을 정렬해서 깔끔하게 정리하고 싶어"
```

**Policy**: 
- "다중 선택된 블럭들만 정렬 가능"
- "정렬 기준은 대표 블럭(첫 번째 선택) 또는 그룹 전체 기준"
- "정렬 후 블럭들의 상대적 위치는 유지"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 선택된 블럭 목록
- 사용 가능한 정렬 옵션 (상단, 하단, 좌측, 우측, 중앙 정렬)
- 정렬 미리보기
- *UI Hint: 정렬 도구 패널*

**Command**: 블럭 정렬 요청
- 정렬 타입 (상단/하단/좌측/우측/수평중앙/수직중앙)
- 선택된 블럭 ID 목록

**System**: Block Alignment Manager (Backend - Security Enforcement)
- 비즈니스 로직: 선택된 블럭들의 위치 계산, 정렬 기준점 결정
- 검증 로직: 다중 선택 상태 확인, 정렬 가능성 검증
- 처리 로직: 새 위치 계산, 마운트 정보 일괄 업데이트, React Flow 상태 동기화

**Events**:
1. 블럭들이 상단 정렬되었다 (Blocks Aligned to Top)
2. 블럭들이 하단 정렬되었다 (Blocks Aligned to Bottom)
3. 블럭들이 좌측 정렬되었다 (Blocks Aligned to Left)
4. 블럭들이 우측 정렬되었다 (Blocks Aligned to Right)
5. 블럭들이 수평 중앙 정렬되었다 (Blocks Aligned to Horizontal Center)
6. 블럭들이 수직 중앙 정렬되었다 (Blocks Aligned to Vertical Center)

### Sequence 2: 블럭들 균등 분포

**Trigger Event**: 사용자가 균등 분포 도구 클릭

**Policy**: 
- "선택된 블럭들 사이의 간격을 동일하게 조정하기"
- "수평/수직 분포 모두 지원하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 선택된 블럭들의 간격 정보
- 분포 방향 옵션 (수평/수직)
- *UI Hint: 분포 설정 패널*

**Command**: 블럭 분포 요청
- 분포 방향 (수평/수직)
- 선택된 블럭 ID 목록

**System**: Block Distribution Manager (Backend - Security Enforcement)
- 비즈니스 로직: 블럭 간격 계산, 균등 분포 위치 계산
- 처리 로직: 위치 업데이트, React Flow 상태 동기화

**Events**:
1. 블럭들이 수평으로 균등 분포되었다 (Blocks Distributed Horizontally)
2. 블럭들이 수직으로 균등 분포되었다 (Blocks Distributed Vertically)

---

## 📍 Scenario 6: 스마트 가이드 & 스냅

### Sequence 1: 드래그 중 스냅 가이드 표시

**Trigger Event**: 사용자가 블럭을 드래그 중

```
👤 사용자: "블럭을 드래그할 때 다른 블럭들과 정렬되는 가이드라인을 보고 싶어"
```

**Policy**: 
- "드래그 중 다른 블럭과의 정렬 가능성 실시간 계산하기"
- "스냅 임계값 5px 이내에서만 가이드라인 표시하기"
- "우선순위: 중심선 > 가장자리"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 실시간 스냅 가이드라인
- 스냅 가능한 블럭 하이라이트
- *UI Hint: 스냅 가이드라인 표시*

**Command**: 블럭 드래그 중 위치 업데이트
- 드래그 중인 블럭 ID
- 현재 마우스 위치 (x, y)

**System**: Snap Guide Manager
- **Frontend (Real-time Calculation)**: 실시간 스냅 가이드 계산 및 표시
- 비즈니스 로직: 다른 블럭들과의 정렬 가능성 검사, 가이드라인 우선순위 적용

**Events**:
1. 스냅 가이드라인이 표시되었다 (Snap Guidelines Shown)

### Sequence 2: 스냅 적용 및 위치 확정

**Trigger Event**: 사용자가 드래그 종료하고 스냅 위치에 도달

**Policy**: 
- "스냅 임계값 내에서 드래그 종료 시 자동 스냅 적용하기"
- "스냅 적용 후 최종 위치를 DB에 저장하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 스냅 적용된 최종 위치
- 스냅된 블럭 정보

**Command**: 스냅 위치 확정
- 블럭 ID
- 스냅된 최종 위치 (x, y)
- 스냅 타입 (중심선/가장자리)

**System**: Block Transform Manager (Backend - Security Enforcement)
- 비즈니스 로직: 스냅 임계값 검증, 최종 위치 확정
- 처리 로직: 마운트 정보 업데이트, DB 저장

**Events**:
1. 블럭이 가이드라인에 스냅되었다 (Block Snapped to Guideline)

---

## 📍 Scenario 7: 엣지 생성 및 관리

### Sequence 1: 엣지 생성

**Trigger Event**: 사용자가 블럭 연결 핸들을 드래그

```
👤 사용자: "두 블럭을 연결해서 다이어그램을 만들고 싶어"
```

**Policy**: 
- "엣지는 특정 페이지에서만 존재하기"
- "같은 블럭 쌍이라도 페이지마다 다른 엣지 설정 가능하기"
- "자기 자신으로의 엣지(self-loop) 허용하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 연결 가능한 블럭들 표시
- 엣지 생성 중인 상태 표시
- 연결 핸들 위치
- *UI Hint: 연결 가능한 블럭 하이라이트*

**Command**: 엣지 생성 시작
- 소스 블럭 ID
- 연결 핸들 위치

**System**: Edge Creation Manager
- **Frontend (Real-time Interaction)**: 드래그 중 연결 가능한 블럭 표시
- 비즈니스 로직: 연결 유효성 검사, 페이지별 엣지 관리

**Events**:
1. **Frontend**: 엣지 생성이 시작되었다 (Edge Creation Started)

### Sequence 2: 엣지 연결 확정

**Trigger Event**: 사용자가 타겟 블럭의 핸들에 드롭

**Policy**: 
- "엣지 생성 완료 시 소스-타겟 블럭 연결 확정하기"
- "페이지별로 엣지 정보 저장하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 생성된 엣지 정보
- 연결된 블럭 쌍 정보

**Command**: 엣지 생성 확정
- 소스 블럭 ID
- 타겟 블럭 ID
- 페이지 ID

**System**: Edge Creation Manager (Backend - Security Enforcement)
- 비즈니스 로직: 엣지 연결 유효성 검증, 페이지별 엣지 저장
- 검증 로직: 블럭 존재 확인, 페이지 접근 권한 확인
- 처리 로직: 엣지 생성, React Flow에 엣지 추가

**Events**:
1. **Backend**: 엣지가 생성되었다 (Edge Created)

### Sequence 3: 엣지 편집 (타입, 레이블, 스타일)

**Trigger Event**: 사용자가 엣지를 선택하여 편집

**Policy**: 
- "엣지 타입 변경 가능 (직선, 곡선, 스텝, 스무스스텝)"
- "엣지 레이블 편집 가능"
- "엣지 스타일 변경 가능 (색상, 두께, 화살표)"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 선택된 엣지 정보
- 사용 가능한 엣지 타입 목록
- 스타일 옵션 (색상 팔레트, 두께 설정)
- *UI Hint: 엣지 편집 패널*

**Command**: 엣지 편집 요청
- 엣지 ID
- 변경할 속성 (타입, 레이블, 스타일)
- 새로운 값

**System**: Edge Management Manager (Backend - Security Enforcement)
- 비즈니스 로직: 엣지 속성 업데이트, React Flow 상태 동기화
- 검증 로직: 유효한 속성 값 확인
- 처리 로직: 엣지 정보 업데이트, DB 저장

**Events**:
1. 엣지 타입이 변경되었다 (Edge Type Changed)
2. 엣지 레이블이 변경되었다 (Edge Label Changed)
3. 엣지 스타일이 변경되었다 (Edge Style Changed)

---

## 📍 Scenario 8: 블럭 삭제 및 엣지 정리

### Sequence 1: 블럭 삭제 (Soft Delete)

**Trigger Event**: 사용자가 블럭 삭제 요청

```
👤 사용자: "더 이상 필요없는 블럭을 삭제하고 정리하고 싶어"
```

**Policy**: 
- "블럭 삭제는 Soft Delete (휴지통으로 이동)"
- "블럭 삭제 시 모든 페이지에서의 마운트 관계 해제 및 연결된 모든 엣지 자동 삭제"
- "Canvas Management에서 모든 마운트 해제 후 Block Management에서 Soft Delete 처리"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 삭제될 블럭 정보 (DB JOIN으로 조회)
- 해당 블럭이 마운트된 페이지 목록
- 연결된 엣지 개수 표시
- 삭제 확인 메시지
- *UI Hint: 삭제 확인 다이얼로그*

**Command**: 블럭 삭제 요청
- 삭제할 블럭 ID
- 삭제 확인

**System**: Block Deletion Manager (Backend - Security Enforcement)
- 비즈니스 로직: 
  1. Canvas Management: 
     - 해당 블럭과 연결된 모든 페이지의 엣지 일괄 삭제
     - block_mounts에서 해당 블럭 ID의 모든 마운트 관계 제거
  2. Block Management Domain: 블럭 Soft Delete 처리 (deleted_at 설정)
- 검증 로직: 
  - 블럭 존재 확인 (DB JOIN으로 blocks 테이블 확인)
  - 해당 블럭의 마운트 관계들 존재 확인
- 처리 로직: 
  - 트랜잭션으로 모든 페이지의 엣지 삭제 + 모든 마운트 해제
  - Block Management Domain에 deleteBlockAction 호출
  - React Flow에서 모든 관련 노드 제거

**Events**:
1. 모든 페이지에서 블럭 마운트가 해제되었다 (Block Mounts Removed from All Pages)
2. 연결된 엣지들이 삭제되었다 (Connected Edges Deleted)

**External System**: Block Management Domain
- **호출**: `deleteBlockAction(blockId)`
- **처리**: BlockAggregate.deleteBlock() → blocks 테이블에 deleted_at 설정 (Soft Delete)
- **반환**: 성공/실패 결과

**Events**: 블럭이 삭제되었다 (Block Deleted in Block Management Domain)

**데이터 흐름 정리**:
1. **Canvas Management**: 모든 페이지의 엣지 삭제 + block_mounts에서 해당 블럭의 모든 마운트 관계 제거
2. **Block Management Domain**: blocks 테이블에 deleted_at 설정 (Soft Delete)
3. **렌더링**: DB JOIN에서 deleted_at IS NULL 조건으로 삭제된 블럭 필터링

---

## 📍 Scenario 9: 캔버스 뷰포트 관리

### Sequence 1: 캔버스 줌 및 패닝

**Trigger Event**: 사용자가 마우스 휠 또는 드래그로 뷰포트 조작

```
👤 사용자: "캔버스를 확대/축소하고 이동해서 원하는 영역을 보고 싶어"
```

**Policy**: 
- "줌 레벨은 최소/최대 제한 있음"
- "뷰포트 변경 시 자동 저장하지 않음 (실시간 조작 중)"
- "페이지 이탈 시에만 뷰포트 상태 저장하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 현재 줌 레벨 표시
- 뷰포트 중심 좌표
- *UI Hint: 줌 컨트롤 및 미니맵*

**Command**: 뷰포트 조작
- 줌 방향 (in/out)
- 패닝 방향 (x, y)
- 조작 종료 시점

**System**: Viewport Manager
- **Frontend (Real-time Rendering)**: React Flow를 통한 줌/패닝 처리
- 비즈니스 로직: 줌 레벨 제한 적용, 뷰포트 상태 관리

**Events**:
1. **Frontend**: 캔버스가 줌인되었다 (Canvas Zoomed In)
2. **Frontend**: 캔버스가 줌아웃되었다 (Canvas Zoomed Out)
3. **Frontend**: 캔버스가 패닝되었다 (Canvas Panned)

### Sequence 2: 블럭 포커스 및 화면 맞춤

**Trigger Event**: 사용자가 블럭 더블클릭 또는 포커스 버튼 클릭

**Policy**: 
- "블럭 포커스 시 해당 블럭이 화면 중앙에 오도록 이동"
- "적절한 줌 레벨로 자동 조정"
- "React Flow 애니메이션 처리"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 포커스할 블럭 정보
- 포커스 진행 상태

**Command**: 블럭 포커스 요청
- 포커스할 블럭 ID

**System**: Viewport Manager
- **Frontend (Animation)**: React Flow 애니메이션을 통한 부드러운 이동
- 비즈니스 로직: 블럭 위치 계산, 적절한 줌 레벨 결정

**Events**:
1. **Frontend**: 캔버스가 특정 블럭으로 포커스되었다 (Canvas Focused on Block)

### Sequence 3: 뷰포트 상태 저장 및 복원

**Trigger Event**: 페이지 이탈 또는 재진입

**Policy**: 
- "페이지를 떠날 때 현재 뷰포트 상태 자동 저장하기"
- "페이지 재진입 시 이전 뷰포트 상태 복원하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 뷰포트 저장/복원 상태

**Command**: 뷰포트 상태 처리
- 페이지 ID
- 뷰포트 상태 (줌 레벨, 중심 좌표)
- 처리 유형 (저장/복원)

**System**: Viewport State Manager (Backend - Security Enforcement)
- 비즈니스 로직: 페이지별 뷰포트 상태 관리, 자동 저장/복원
- 처리 로직: 뷰포트 상태 저장, 복원 시 React Flow 적용

**Events**:
1. **Backend**: 캔버스 뷰가 저장되었다 (Canvas View Saved)
2. **Backend**: 캔버스 뷰가 복원되었다 (Canvas View Restored)

### Sequence 4: 미니맵 표시/숨김

**Trigger Event**: 사용자가 미니맵 토글 버튼 클릭

**Policy**: 
- "미니맵은 캔버스 전체 구조를 한눈에 볼 수 있도록 도움"
- "미니맵에서 클릭 시 해당 위치로 뷰포트 이동"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 미니맵 표시/숨김 상태
- 캔버스 전체 구조 미리보기
- *UI Hint: 미니맵 토글 버튼*

**Command**: 미니맵 토글
- 토글 상태 (표시/숨김)

**System**: Minimap Manager
- **Frontend (UI Toggle)**: 미니맵 표시/숨김 처리
- 비즈니스 로직: 미니맵 상태 관리, 클릭 시 뷰포트 이동

**Events**:
1. **Frontend**: 미니맵이 표시되었다 (Minimap Shown)
2. **Frontend**: 미니맵이 숨겨졌다 (Minimap Hidden)

---

## 💡 핵심 Policy 정리

### 블럭 생명주기 관련
1. **블럭 생성 순서**: Block Management Domain에서 blocks 테이블 생성 → Canvas Management에서 block_mounts 테이블
2. **블럭 복제**: 원본과 동일한 타입/메타데이터를 가진 완전히 새로운 블럭 생성 + 새로운 마운트 관계 생성
3. **블럭 마운팅**: 
   - 반드시 하나 이상의 페이지에 마운트되어야 함
   - 하나의 블럭은 여러 페이지에 마운트 가능
   - 같은 블럭이 같은 페이지에는 한 번만 마운트 가능 (UNIQUE 제약조건)
4. **Z-Order 정책**: 새 블럭은 최상위, 다중 선택 시 상대적 순서 유지
5. **Soft Delete**: Canvas에서 마운트 해제 → Block Management에서 deleted_at 설정

### 엣지 관리 관련
4. **페이지 종속성**: 엣지는 특정 페이지에서만 존재
5. **자동 정리**: 블럭 삭제 시 연결된 모든 엣지 자동 삭제
6. **다양한 타입**: 직선, 곡선, 스텝, 스무스스텝 지원

### 변환 및 스냅 관련
7. **실시간 업데이트**: 드래그/리사이즈 중에는 React Flow State로 실시간 처리
8. **최종 저장**: 드래그/리사이즈 종료 시에만 DB 저장
9. **스냅 정책**: 5px 임계값, 중심선 > 가장자리 우선순위

### 뷰포트 관련
10. **State of Truth**: React Flow State (단기) + Database (장기)
11. **자동 저장**: 페이지 이탈 시 뷰포트 상태 저장
12. **성능 최적화**: 드래그 중 이벤트 Throttling 적용

---

## 🔧 기술 권장사항

### React Flow 통합
- **Anti-Corruption Layer**: React Flow 데이터 구조와 도메인 모델 간 변환
- **State 동기화**: React Flow State ↔ Database 적절한 동기화 시점
- **Performance**: 대량 블럭 처리 시 가상화 또는 청크 로딩

### 실시간 이벤트 처리
- **Event Throttling**: 드래그/리사이즈 중 이벤트 발생 빈도 제한
- **Debouncing**: DB 저장 시 적절한 지연 시간 적용
- **Batch Processing**: 다중 블럭 변환 시 배치 처리

### 외부 도메인 통합
- **Block Management Domain 통합**: 
  - 블럭 생성/삭제 시 createBlockAction, deleteBlockAction 호출
  - 블럭 정보 조회 시 DB JOIN (`block_mounts JOIN blocks`) 활용
- **Workspace Management Domain 통합**: 동기적 서비스 주입을 통한 실시간 통신
- **권한 검증**: 페이지 및 블럭 접근 권한 일관성 유지 (RLS 정책 공유)
- **트랜잭션**: 블럭 삭제 시 엣지 정리 + 마운트 해제 + 블럭 Soft Delete의 원자성 보장

---

## 🗺️ Context Map

### Canvas Management ↔ Block Management 도메인 관계

```
┌─────────────────────────────────────────────────────────────┐
│                Canvas Management Context                    │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │   BlockMount    │    │      Edge       │               │
│  │   Aggregate     │    │    Aggregate    │               │
│  └─────────────────┘    └─────────────────┘               │
│           │                                              │
│           │ 1. Server Actions 통합                       │
│           ▼                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │     Block Management Integration Layer              │  │
│  │                                                     │  │
│  │  • createBlockAction(workspaceId, blockType)       │  │
│  │  • deleteBlockAction(blockId)                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                          │                                │
│                          │ 2. DB JOIN                    │
│                          ▼                                │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Database Layer                         │  │
│  │                                                     │  │
│  │  block_mounts JOIN blocks                           │  │
│  │  (Canvas 테이블)    (Block Management 테이블)       │  │
│  │                                                     │  │
│  │  관계 규칙:                                         │  │
│  │  • 1개 블럭 → 여러 페이지 마운트 가능                │  │
│  │  • 1개 페이지 → 같은 블럭 한 번만 마운트 가능       │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Partnership (Partnership)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Block Management Context                       │
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐               │
│  │    Block        │    │  BlockType,     │               │
│  │   Aggregate     │    │  Metadata, etc. │               │
│  └─────────────────┘    └─────────────────┘               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              blocks table (SSOT)                    │  │
│  │                                                     │  │
│  │  • 블럭 생명주기 관리 (생성, 수정, 삭제)            │  │
│  │  • 블럭 타입별 메타데이터 스키마 검증               │  │
│  │  • 워크스페이스별 격리 (RLS)                       │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**통합 패턴**: Partnership (동반자 관계)
- **Canvas → Block**: Server Actions를 통한 블럭 CRUD 호출
- **Block → Canvas**: DB JOIN을 통한 블럭 정보 직접 조회
- **공유 인프라**: 동일한 Database, RLS 정책, 워크스페이스 격리

---

## 🚀 Next Steps

이제 Canvas Management Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환 (Canvas, Block, Edge, Viewport Aggregate)
2. **Bounded Context 식별**: Canvas Management Context 경계 확인
3. **Integration Points**: Workspace Management, Block Domain과의 연결점 정의
4. **Anti-Corruption Layer**: React Flow ↔ Domain Model 변환 레이어 설계

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2025년 1월 17일 (온라인)
**참가자**: 
- **도메인 전문가**: AI Assistant
- **시니어 개발자**: AI Assistant
- **PM**: AI Assistant

**워크샵 결과물**:
- [x] 모든 핵심 사용자 여정이 시나리오로 정의됨 (9개 시나리오)
- [x] Event → Policy → Read Model → Command → System → Event 순서가 일관되게 적용됨
- [x] External System과의 통합점이 명확히 정의됨
- [x] 비즈니스 규칙(Policy)이 구체적으로 명시됨
- [x] Event 직후 Policy 삽입 패턴 적용됨
- [x] Event Storm의 주요 질문들이 시나리오로 반영됨
- [x] Software Design 작성을 위한 충분한 정보 확보

---

*이 Process Model 문서는 Canvas Management Domain의 Software Design 작성을 위한 기반 자료입니다.*
