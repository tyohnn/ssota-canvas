# User Flow: Block Management Domain

## 🎯 개요

**도메인**: Block Management Domain  
**작성자**: UX/UI 디자이너 + 기획자  
**작성일**: 2025-10-22  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `04-technical-specification.md`

---

### 문서 목적

이 문서는 Block Management Domain의 사용자 여정을 정의합니다.  
Process Model의 비즈니스 프로세스를 기반으로 실제 화면 흐름과 사용자 인터랙션을 상세히 설명합니다.

**범위**:
- 블록 생성 및 관리 사용자 화면 흐름 정의
- 블록 타입 선택 UI 컴포넌트 및 인터랙션 명세
- 블록 편집 및 삭제 UI 정의
- 권한별 UI 차이 정의
- 에러 처리 및 피드백 방법

**제외 사항** (Frontend Specification에서 다룸):
- React 컴포넌트 구현 상세
- 상태 관리 방법 (Block State ↔ DB)
- Server Actions 연동

---

## 📍 Scenario 0: Canvas Management 연동 (블록 생성 흐름)

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 0 in `02-process-model.md`
- **사용자 목표**: 새로운 블록을 생성하고 편집하여 콘텐츠를 작성하고 싶어함
- **주요 제약**: 블록 타입별 검증, 워크스페이스 권한 확인, 블록 타입별 기본 속성 설정

---

### Screen 1: 블록 타입 선택 다이얼로그

**화면 구성**:
- **도구바**: 플러스(+) 버튼
- **블록 타입 선택 다이얼로그**: 모달 형태로 표시
- **배경 오버레이**: 클릭 시 다이얼로그 닫기

**UI 컴포넌트**:
- **플러스 버튼** (Canvas 도구바):
  - 클릭 시 블록 타입 선택 다이얼로그 표시
  - 워크스페이스 권한에 따른 활성화/비활성화 상태
- **블록 타입 선택 다이얼로그**:
  - 카테고리별 블록 타입 목록 (youtube, python, markdown, image, file, link, shape, page_mention, latex, github_pr, react_component)
  - 각 타입에 아이콘과 이름 표시
  - 블록 타입별 설명 텍스트
  - 검색 기능 (타입별 검색)
  - 취소/선택 버튼
- **블록 타입 카드**:
  - 타입 아이콘, 이름, 설명
  - 호버 시 하이라이트 효과
  - 선택 가능 상태 표시

**권한별 UI 차이**:
- **워크스페이스 관리자**:
  - 모든 블록 타입 생성 가능
  - 모든 옵션 활성화
  
- **워크스페이스 편집자**:
  - 일부 블록 타입만 생성 가능 (권한에 따라 필터링)
  - 제한된 옵션 표시
  
- **워크스페이스 뷰어**:
  - 플러스 버튼 비활성화
  - "읽기 전용 모드" 툴팁 표시

**인터랙션**:
- 플러스 버튼 클릭 → 블록 타입 선택 다이얼로그 표시
- 블록 타입 카드 클릭 → 타입 선택, 다이얼로그 닫기, Shadow Block 모드 진입
- ESC 키 또는 배경 클릭 → 다이얼로그 닫기, 선택 취소
- 검색 입력 → 타입 목록 필터링

**화면 전환**:
- **조건**: 블록 타입 선택 완료
- **전환**: Screen 1 → Screen 2 (Shadow Block 모드)
- **전환 방식**: 다이얼로그 닫기, 마우스 커서를 따라다니는 반투명 블록 표시

---

### Screen 2: Shadow Block 모드 (마우스 포인터 추적)

**화면 구성**:
- **캔버스**: 블록 생성을 위한 작업 영역
- **Shadow Block**: 마우스 커서를 따라다니는 반투명 블록
- **안내 메시지**: "클릭하여 블록 생성 • ESC로 취소"

**UI 컴포넌트**:
- **Shadow Block**:
  - 반투명 배경 (opacity: 30%)
  - 파란색 점선 테두리
  - 블록 타입 아이콘과 이름 표시
  - 블록 타입별 기본 크기 (예: youtube 400x225, image 300x200)
  - 십자형(+) 커서 표시
- **안내 텍스트**:
  - Shadow Block 하단에 표시
  - "클릭하여 블록 생성 • ESC로 취소"

**블록 타입별 Shadow Block 크기**:
- **Basic**: 200x150
- **Youtube**: 400x225
- **Image**: 300x200
- **Shape (Square/Circle)**: 150x150
- **Map**: 350x250

**인터랙션**:
- 마우스 이동 → Shadow Block이 마우스 커서 중앙에 위치하며 따라다님
- 캔버스 클릭 → Skeleton Block 생성 및 Canvas 마운트
- ESC 키 → Shadow Block 모드 취소, 기본 모드로 복귀

**화면 전환** (실제 구현 기준):
- **조건**: 캔버스 클릭하여 블록 생성
- **전환**: Screen 2 → Screen 3 (Skeleton Block 생성)
- **전환 방식**: 
  - `useCanvasBlockLifecycle.createAndMountBlock()` 호출
  - Optimistic Update: React Flow Store에 즉시 추가 (`addNodes`)
  - Server Action: `createAndMountBlockAction` 백그라운드 실행
  - 성공 시: Completed Block으로 전환 (이미 추가됨)
  - 실패 시: 롤백 (`deleteElements`)

---

### Screen 3: Skeleton Block 생성 및 Editor Panel

**화면 구성**:
- **Skeleton Block**: 캔버스에 마운트된 빈 블록
- **Editor Panel**: 우측에서 슬라이드 인으로 표시되는 편집 패널
- **Block Toolbar**: 블록 위에 표시되는 툴바

**UI 컴포넌트**:
- **Skeleton Block** (BaseNode 기반):
  - 블록 타입별 기본 크기
  - 빈 상태 표시 (아이콘 + "Empty" 또는 "Add content" 메시지)
  - 공통 스타일: 테두리, 그림자, 라운드 코너
  - 호버 시: 회색 링 + 크기 확대 (scale 1.02) + 살짝 회전 (0.5deg)
  - 선택 시: 파란색 링 (ring-2) + 그림자 강화
  - Resizer: 모서리에 리사이저 핸들 표시
  - Handle: 좌측(Target)과 우측(Source) 엣지 연결 포인트
- **Block Toolbar** (NodeToolbar):
  - 블록 선택 시 상단에 표시
  - 공통 버튼: 더보기 (···) 메뉴
  - 블록 타입별 빠른 편집 버튼 (예: Youtube의 URL 입력, Image의 파일 업로드)
  - 드래그 중에는 숨김
- **Editor Panel** (우측 슬라이드 인, Notion 스타일):
  - 반투명 배경 (background/70) + backdrop-blur
  - 너비: 화면의 45%
  - 높이: 화면의 90%
  - 슬라이드 애니메이션 (300ms, ease-out)
  - 닫기 버튼 (ChevronsRight 아이콘)

**Editor Panel 구성**:
- **헤더 영역**:
  - 닫기 버튼
  - 확장 버튼
  - 공유 버튼
  - 더보기 버튼
- **타이틀 영역**:
  - 블록 타이틀 입력 필드 (인라인 편집)
  - 블록 ID 표시 (읽기 전용)
- **Style Section** (접을 수 있음):
  - 블록 스타일 속성 (크기, 색상, 테두리 등)
  - 타입별 동적 필드 렌더링
- **Property Section** (접을 수 있음):
  - 블록 속성 목록
  - 타입별 기본 속성 (예: Youtube URL, Image Source)
  - 커스텀 속성 목록

**블록 타입별 Skeleton 표시**:
- **Youtube**: 빈 비디오 프레임 + "Add Youtube URL" 메시지
- **Image**: 빈 이미지 프레임 + "Upload Image" 메시지
- **Python**: 빈 코드 에디터 + "Write Python Code" 메시지
- **Markdown**: 빈 텍스트 영역 + "Write Markdown" 메시지

**인터랙션**:
- Skeleton Block 클릭 → 블록 선택, Editor Panel 자동 열림
- Editor Panel에서 속성 입력 → 실시간 블록 업데이트 (낙관적 업데이트)
- Toolbar 빠른 편집 버튼 클릭 → 해당 속성 즉시 편집 가능
- Resizer 드래그 → 블록 크기 조정
- Handle 드래그 → 다른 블록과 엣지 연결

**화면 전환**:
- **조건**: 블록 타입별 기본 속성 입력 완료
- **전환**: Screen 3 → Screen 4 (Completed Block 렌더링)
- **전환 방식**: Skeleton Block이 Completed Block으로 전환

---

### Screen 4: Completed Block 렌더링

**화면 구성**:
- **Completed Block**: 블록 타입별 렌더링이 완료된 블록
- **Editor Panel**: 편집을 위한 패널 (필요시 열림)
- **Block Toolbar**: 블록 선택 시 표시

**UI 컴포넌트**:
- **Completed Block** (BaseNode 기반):
  - 블록 타입별 완전한 렌더링
  - Youtube: 실제 동영상 임베드
  - Image: 업로드된 이미지 표시
  - Python: 코드 하이라이팅 및 실행 버튼
  - Markdown: 렌더링된 마크다운 콘텐츠
  - 공통 스타일 유지 (호버, 선택 시 효과)
  - Resizer 및 Handle 유지

**인터랙션** (실제 구현 기준):
- 블록 클릭 → 블록 선택, Editor Panel 열림 (Canvas Mode: `block-editing`, 재편집 가능)
- 블록 더블 클릭 → 블록 타입별 인라인 편집 모드 (선택적, 현재 미구현)
- Toolbar 버튼 → 블록 타입별 액션 실행 (예: Youtube 재생, Python 코드 실행)
- Resizer → 블록 크기 조정 (Canvas Management Domain: `updateBlockSizeAction`)
- Handle → 엣지 연결/편집 (Canvas Management Domain 처리)

**다음 액션**:
- 블록 편집 계속 → Editor Panel에서 속성 수정
- 다른 블록 생성 → 플러스 버튼 클릭
- 블록 삭제 → Toolbar 더보기 메뉴에서 삭제

---

### 에러 처리

**블록 생성 실패**:
- **UI 반응**: 에러 Toast 메시지 표시, 생성 중인 블록 롤백
- **메시지**: "블록 생성에 실패했습니다: [구체적 오류 메시지]"
- **다음 액션**: 사용자가 다시 시도 가능

**타입 변경 실패**:
- **UI 반응**: 타입 변경 취소, 기존 타입으로 복원
- **메시지**: "해당 타입으로 변경할 수 없습니다: [메타데이터 호환성 오류]"

**권한 부족**:
- **UI 반응**: 블록 타입 선택 비활성화, 권한 안내 툴팁
- **메시지**: "이 블록 타입을 생성할 권한이 없습니다"

**메타데이터 검증 실패**:
- **UI 반응**: 실시간 오류 표시, 저장 버튼 비활성화
- **메시지**: "입력한 메타데이터 형식이 올바르지 않습니다"

---

## 📍 Scenario 1: Custom Properties 관리

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 1 in `02-process-model.md`
- **사용자 목표**: 블록에 커스텀 속성을 추가하여 더 많은 정보를 관리하고 싶어함
- **주요 제약**: 속성 개수 제한 (최대 50개), 속성 이름 중복 방지, 타입별 설정 옵션
- **핵심 패턴**: PropertyInput 컴포넌트로 타입별 동적 렌더링, useBlockPropertyUpdate Hook 공유

---

### Screen 1: Editor Panel에서 커스텀 속성 추가

**화면 구성**:
- **Editor Panel**: 우측 슬라이드 패널 (이미 열린 상태)
- **Property Section**: 속성 목록 영역
- **속성 추가 버튼**: Property Section 헤더

**UI 컴포넌트**:
- **Property Section 헤더**:
  - "Properties" 제목
  - "+ 속성 추가" 버튼 (Plus 아이콘)
  - 속성 개수 표시 (현재/최대 50개)
  - 제한 도달 시 버튼 비활성화
- **속성 목록**:
  - 기존 속성 카드 형태로 표시
  - 각 속성: 아이콘 + 라벨 + 값 입력 필드
  - 3-column grid: [아이콘+라벨 (140px)] [값 입력 (flex-1)] [더보기 버튼]
- **속성 추가 인라인 폼**:
  - 속성 이름 입력 필드 (Enter로 제출, ESC로 취소)
  - 자동 포커스
  - 제출 시 속성 타입 선택 단계로 이동

**타입별 속성 아이콘** (PropertyInput 패턴):
- Text: Type 아이콘
- Select: List 아이콘
- Multi-select: CheckSquare 아이콘
- Status: Star 아이콘
- Datetime: Calendar 아이콘
- Media: FileText 아이콘
- Profile: User 아이콘
- Email: Mail 아이콘
- Phone: Phone 아이콘

**인터랙션**:
- "+ 속성 추가" 버튼 클릭 → 인라인 입력 필드 표시
- 속성 이름 입력 + Enter → 속성 타입 선택 다이얼로그 표시
- ESC 키 → 입력 취소, 폼 닫기
- 외부 클릭 → 입력 취소

**화면 전환**:
- **조건**: 속성 이름 입력 완료
- **전환**: Screen 1 → Screen 2 (속성 타입 선택)
- **전환 방식**: 타입 선택 다이얼로그 표시

---

### Screen 2: 속성 라벨 클릭으로 상세 편집 Popover

**화면 구성**:
- **Popover**: 속성 라벨 우측에 표시되는 팝오버
- **Field Popover 내용**: 속성 타입에 따라 다른 UI

**UI 컴포넌트** (레거시 패턴 기반):
- **Generic Field Popover** (text, url, email, phone, datetime, media, profile):
  - Label 입력 필드 (자동 저장)
  - Separator
  - Duplicate 버튼 (Copy 아이콘)
  - Delete 버튼 (Trash2 아이콘, 빨간색)
  
- **Select-Like Field Popover** (select, multi-select):
  - Label 입력 필드 (자동 저장)
  - Separator
  - Options 섹션:
    - 옵션 목록 (Badge 형태)
    - 각 옵션 클릭 → 옵션 편집 Popover (중첩)
    - "+ 옵션 추가" 버튼
  - Separator
  - Duplicate / Delete 버튼
  
- **Status Field Popover**:
  - Label 입력 필드 (자동 저장)
  - Separator
  - Status Groups 섹션:
    - 진행전 / 진행중 / 완료 그룹
    - 각 그룹별 옵션 목록
    - 옵션 추가/편집/삭제
  - Separator
  - Duplicate / Delete 버튼

**Option Edit Popover** (중첩 Popover):
- Option Label 입력 필드
- Color 선택 섹션:
  - 색상 옵션 버튼 목록 (gray, red, orange, yellow, green, blue, purple, pink)
  - 각 버튼: 색상 프리뷰 사각형 + 라벨
  - 선택된 색상에 Check 아이콘
- Separator
- Duplicate / Delete 버튼

**인터랙션**:
- 속성 라벨 클릭 → Field Popover 표시
- Label 입력 → 자동 저장 (useEffect로 디바운스)
- Select-Like: 옵션 클릭 → Option Edit Popover 표시 (중첩)
- "+ 옵션 추가" 클릭 → 입력 필드 표시, Enter로 제출
- Color 버튼 클릭 → 색상 자동 저장
- Duplicate 클릭 → 속성/옵션 복제
- Delete 클릭 → 속성/옵션 삭제

**Popover 위치**:
- side="right", align="center" (속성 라벨 우측에 표시)

**화면 전환**:
- **조건**: 속성 편집 완료
- **전환**: Popover 닫기
- **전환 방식**: 외부 클릭 또는 ESC 키

---

### Screen 3: 속성 값 입력 (PropertyInput 동적 렌더링)

**화면 구성**:
- **Property Section**: 속성 목록
- **각 속성 행**: 3-column grid 레이아웃

**UI 컴포넌트** (PropertyInput 패턴):
- **Text Property**:
  - Input 필드
  - 실시간 자동 저장 (useBlockPropertyUpdate)
  
- **Select Property**:
  - Dropdown 메뉴
  - 옵션 목록 (Badge로 표시)
  - 선택 시 자동 저장
  
- **Multi-select Property**:
  - Multi-select Dropdown 메뉴
  - 선택된 옵션들 (Badge로 표시, X 버튼으로 개별 삭제)
  - 옵션 선택/해제 시 자동 저장
  - 선택된 옵션 개수 표시 (예: "3개 선택됨")
  
- **Status Property**:
  - Status Badge 버튼
  - 클릭 시 Dropdown (그룹별 옵션)
  - 선택 시 자동 저장
  
- **Datetime Property**:
  - Date Picker (Calendar 컴포넌트)
  - 시간 옵션 있을 시 Time Picker
  - 종료일 옵션 있을 시 End Date Picker
  
- **Media Property**:
  - File Upload 영역
  - 드래그 앤 드롭 지원
  - 업로드된 파일 미리보기
  - 삭제 버튼
  
- **Profile Property**:
  - 워크스페이스 멤버 선택 Dropdown
  - 프로필 이미지 + 이름 표시
  - Multi-select 가능

**useNodeFieldUpdate Hook** (공통 업데이트 로직):
- 노드 타입 감지 (regular-block / component-instance / component-definition)
- formData / nodeUI 필드 구분
- optimistic 업데이트 + DB 동기화
- 에러 처리 및 롤백

**인터랙션** (실제 구현 기준):
- 값 입력 → useBlockPropertyUpdate로 자동 저장 (`updateProperty` 메서드)
- 파일 업로드 → 현재 미구현 (MediaURL VO만 구현, Server Action 없음)
- 프로필 선택 → 현재 미구현 (멤버 검증 로직 미구현)

**화면 전환**:
- **조건**: 값 입력 완료
- **전환**: 실시간 업데이트 (화면 전환 없음)
- **전환 방식**: 낙관적 업데이트


---

### 에러 처리

**속성 개수 제한 초과**:
- **UI 반응**: 속성 추가 버튼 비활성화, 제한 안내
- **메시지**: "최대 50개의 속성만 추가할 수 있습니다"

**속성 이름 중복**:
- **UI 반응**: 실시간 검증 오류 표시, 저장 버튼 비활성화
- **메시지**: "이미 존재하는 속성 이름입니다"

**타입 변경 호환성 문제**:
- **UI 반응**: 호환성 경고 표시, 값 변환 옵션 제공
- **메시지**: "기존 값이 새 타입과 호환되지 않습니다"

---

## 📍 Scenario 2: Property Values 관리

> **참고**: Scenario 1의 Screen 3에서 이미 PropertyInput 컴포넌트로 속성 값 입력을 다루고 있으므로, 이 시나리오는 특별한 케이스만 추가로 정의합니다.

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 2 in `02-process-model.md`
- **사용자 목표**: 속성에 실제 값을 입력하여 정보를 저장하고 싶어함
- **주요 제약**: 타입별 값 검증, 프로필 속성 멤버 검증, 편집시각 자동 업데이트
- **핵심 패턴**: PropertyInput 컴포넌트가 모든 타입별 입력 처리

---

### Screen 1: 속성 값 실시간 자동 저장

**화면 구성**:
- **Editor Panel**: 우측 슬라이드 패널 (이미 열린 상태)
- **Property Section**: 속성 목록 영역
- **속성 값 입력**: 각 속성별 동적 입력 필드

**UI 컴포넌트**:
- **속성 목록**:
  - 기존 속성들이 3-column grid로 표시
  - 각 속성: 아이콘 + 라벨 + 값 입력 필드
  - 값이 설정된 속성과 미설정 속성 구분 표시
- **속성별 입력 필드** (PropertyInput 패턴):
  - **Text Property**: Input 필드, 실시간 자동 저장
  - **Select Property**: Dropdown 메뉴, 옵션 목록 (Badge로 표시)
  - **Multi-select Property**: Multi-select Dropdown 메뉴, 선택된 옵션들 (Badge로 표시, X 버튼으로 개별 삭제), 선택된 옵션 개수 표시
  - **Status Property**: Status Badge 버튼, 클릭 시 Dropdown (그룹별 옵션)
  - **Datetime Property**: Date Picker (Calendar), 시간 옵션 시 Time Picker, 종료일 옵션 시 End Date Picker
  - **Media Property**: File Upload 영역, 드래그 앤 드롭 지원, 업로드된 파일 미리보기, 삭제 버튼
  - **Profile Property**: 워크스페이스 멤버 선택 Dropdown, 프로필 이미지 + 이름 표시, Multi-select 가능
- **실시간 검증 표시**:
  - 유효성 검증 메시지 (실시간)
  - 오류 시 빨간색 강조 표시
  - 성공 시 초록색 체크 표시

**권한별 UI 차이**:
- **블록 소유자/관리자**:
  - 모든 속성 값 편집 가능
  - 모든 속성 타입 지원
  - 모든 고급 옵션 사용 가능
  
- **블록 편집자**:
  - 공개 속성만 편집 가능
  - 제한된 속성 타입만 지원
  - 기본 옵션만 사용 가능
  
- **뷰어**:
  - 모든 속성 읽기 전용
  - 편집 버튼 숨김
  - 값만 표시

**인터랙션** (실제 구현 기준):
- 값 입력 → useBlockPropertyUpdate로 즉시 저장 (디바운스 없음, `updatePropertyImmediate` 사용)
- Optimistic 업데이트 → 화면 즉시 갱신 (`updateNode` 사용)
- 백그라운드 DB 동기화 → 성공/실패 처리 (`updateBlockPropertyAction` 호출)
- 에러 시 → 롤백 및 에러 메시지 표시
- 파일 업로드 → 현재 미구현 (Server Action 없음)
- 프로필 선택 → 현재 미구현 (멤버 검증 로직 미구현)

**화면 전환**:
- **조건**: 값 입력 완료
- **전환**: 실시간 업데이트 (화면 전환 없음)
- **전환 방식**: 낙관적 업데이트

---

### Screen 2: 특별한 속성 타입 처리

**화면 구성**:
- **Profile 속성**: 워크스페이스 멤버 검증 과정
- **Media 속성**: 파일 업로드 및 처리 과정
- **Datetime 속성**: 날짜/시간 설정 과정

**UI 컴포넌트**:
- **Profile 속성 처리**:
  - 멤버 검색 드롭다운
  - 워크스페이스 멤버 목록 표시
  - 멤버 검증 상태 표시 (로딩, 성공, 실패)
  - 멤버 선택 시 프로필 이미지 + 이름 표시
- **Media 속성 처리**:
  - 파일 드래그 앤 드롭 영역
  - 파일 크기 및 타입 검증
  - 업로드 진행률 표시
  - 업로드된 파일 미리보기
  - Public URL 생성 및 표시
- **Datetime 속성 처리**:
  - 날짜 선택기 (Calendar 컴포넌트)
  - 시간 옵션 토글 (있을 시)
  - 종료일 옵션 토글 (있을 시)
  - ISO 8601 형식으로 직렬화

**인터랙션**:
- Profile: 멤버 검색 → 검증 → 선택 → 저장 (현재 미구현 - 멤버 검증 로직 없음)
- Media: 파일 선택 → 업로드 → URL 생성 → 저장 (현재 미구현 - Server Action 및 Storage 연동 없음)
- Datetime: 날짜/시간 선택 → ISO 형식 변환 → 저장 (부분 구현 - useBlockPropertyUpdate 사용 가능)

**화면 전환**:
- **조건**: 특별한 속성 타입 처리 완료
- **전환**: 실시간 업데이트 (화면 전환 없음)
- **전환 방식**: 낙관적 업데이트

---

### 에러 처리

**값 형식 오류**:
- **UI 반응**: 실시간 오류 표시, 저장 버튼 비활성화
- **메시지**: "입력한 값 형식이 올바르지 않습니다"

**프로필 속성 멤버 오류**:
- **UI 반응**: 멤버 검증 실패 표시
- **메시지**: "선택한 멤버가 워크스페이스에 존재하지 않습니다"

**저장 실패**:
- **UI 반응**: 원본 값 유지, 에러 메시지 표시
- **메시지**: "값 저장에 실패했습니다: [구체적 오류]"

---

## 📍 Scenario 3: Media Upload 처리

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 3 in `02-process-model.md`
- **사용자 목표**: 블록에 이미지나 파일을 첨부하여 시각적 정보를 추가하고 싶어함
- **주요 제약**: 파일 크기 제한 (이미지 10MB, 파일 50MB), MIME 타입 검증, Supabase Storage 연동
- **핵심 패턴**: Editor Panel의 Media Property에서 파일 업로드 처리

---

### Screen 1: Media Property에서 파일 업로드

**화면 구성**:
- **Editor Panel**: 우측 슬라이드 패널 (이미 열린 상태)
- **Media Property**: Media 타입 속성의 파일 업로드 영역
- **파일 정보**: 선택된 파일의 정보 표시

**UI 컴포넌트**:
- **Media Property Input**:
  - 파일 드래그 앤 드롭 영역 (border-dashed, 호버 시 하이라이트)
  - "파일을 끌어다 놓거나 클릭하여 선택" 안내 텍스트
  - 지원 파일 형식 안내 (이미지: jpg, png, gif, webp / 파일: pdf, doc, docx, txt, zip 등)
  - 파일 크기 제한 안내 (이미지 10MB, 파일 50MB)
- **파일 선택 버튼**:
  - "파일 선택" 버튼 (기본)
  - "이미지 선택" 버튼 (이미지 전용)
  - 파일 타입별 필터링 (accept 속성)
- **파일 정보 표시** (파일 선택 후):
  - 파일명, 크기, 타입 표시
  - 파일 미리보기 (이미지의 경우 썸네일)
  - 파일 크기 제한 상태 표시 (초과 시 경고)
- **업로드 옵션** (선택적):
  - 파일 설명 입력 필드
  - 이미지 압축 옵션 토글
  - Public/Private 접근 권한 선택

**권한별 UI 차이**:
- **블록 소유자/관리자**:
  - 모든 파일 타입 업로드 가능
  - 모든 업로드 옵션 사용 가능
  - Public/Private 권한 설정 가능
  
- **블록 편집자**:
  - 제한된 파일 타입만 업로드 가능
  - 기본 업로드 옵션만 사용 가능
  - Public 권한만 설정 가능
  
- **뷰어**:
  - 업로드 영역 숨김
  - 기존 미디어 파일만 읽기 전용으로 표시

**인터랙션**:
- 파일 드래그 앤 드롭 → 파일 정보 표시 및 검증
- 파일 선택 버튼 클릭 → 파일 선택 다이얼로그 열기
- 파일 크기 초과 → 경고 메시지 표시, 업로드 차단
- 지원되지 않는 파일 타입 → 오류 메시지 표시
- 유효한 파일 선택 → 자동 업로드 시작

**화면 전환**:
- **조건**: 유효한 파일 선택 완료
- **전환**: Screen 1 → Screen 2 (업로드 진행)
- **전환 방식**: 업로드 진행 상태 표시

---

### Screen 2: Supabase Storage 업로드 진행

**화면 구성**:
- **업로드 진행률**: Supabase Storage 업로드 상황 시각화
- **상태 메시지**: 현재 처리 단계 안내
- **취소 옵션**: 업로드 중단 (가능한 경우)

**UI 컴포넌트**:
- **진행률 바**:
  - 0-100% 진행률 표시 (CircularProgress 또는 LinearProgress)
  - 애니메이션 효과 (부드러운 전환)
  - 현재 진행률 퍼센트 표시
- **상태 메시지** (단계별):
  - "파일을 업로드하는 중..." (0-30%)
  - "파일을 검증하는 중..." (30-60%)
  - "URL을 생성하는 중..." (60-90%)
  - "속성에 저장하는 중..." (90-100%)
- **취소 버튼**:
  - 업로드 중단 버튼 (가능한 경우)
  - 중단 시 파일 삭제 확인 다이얼로그
- **파일 정보** (업로드 중):
  - 파일명, 크기, 타입 유지 표시
  - 업로드 속도 표시 (MB/s)
  - 예상 완료 시간 표시

**인터랙션**:
- 업로드 시작 → 진행률 바 애니메이션 시작
- 진행률 업데이트 → 상태 메시지 변경
- 취소 버튼 클릭 → 업로드 중단 확인 다이얼로그
- 업로드 완료 → Screen 3으로 전환

**화면 전환**:
- **조건**: Supabase Storage 업로드 완료
- **전환**: Screen 2 → Screen 3 (업로드 완료)
- **전환 방식**: 성공 메시지 표시, 미디어 파일 표시

---

### Screen 3: 업로드 완료 및 URL 저장

**화면 구성**:
- **성공 피드백**: 업로드 완료 알림
- **미디어 파일 표시**: 업로드된 파일 미리보기
- **Public URL**: Supabase Storage에서 생성된 Public URL
- **속성 저장**: Media Property에 URL 자동 저장

**UI 컴포넌트**:
- **성공 Toast**:
  - "파일이 성공적으로 업로드되었습니다"
  - 파일명과 크기 표시
  - Public URL 생성 완료 표시
- **미디어 미리보기**:
  - **이미지**: 썸네일 표시 (200x200px, rounded)
  - **파일**: 파일 아이콘과 이름 표시
  - Public URL 링크 (클릭 시 새 탭에서 열기)
- **파일 정보**:
  - 파일명, 크기, 타입
  - 업로드 시각 (현재 시간)
  - Public URL (복사 가능, 클립보드 복사 버튼)
- **속성 저장 상태** (현재 미구현):
  - Media Property에 URL 자동 저장 완료 표시 (미구현)
  - useBlockPropertyUpdate를 통한 자동 저장 (미구현 - Server Action 없음)
  - 저장 완료 체크 아이콘 (미구현)

**인터랙션**:
- 토스트 자동 사라짐 → 정상 화면으로 복귀
- 미디어 미리보기 클릭 → 원본 파일 보기 (새 탭)
- URL 복사 버튼 클릭 → 클립보드에 URL 복사
- 파일 삭제 버튼 → 미디어 파일 삭제 확인 (Storage에서 삭제)

**화면 전환**:
- **조건**: Media Property에 URL 저장 완료
- **전환**: 실시간 업데이트 (화면 전환 없음)
- **전환 방식**: 낙관적 업데이트

---

### Screen 4: 미디어 파일 삭제 (선택적)

**화면 구성**:
- **삭제 확인**: 미디어 파일 삭제 확인 다이얼로그
- **삭제 처리**: Storage에서 파일 삭제 및 속성에서 URL 제거
- **삭제 완료**: 삭제 완료 피드백

**UI 컴포넌트**:
- **삭제 확인 다이얼로그**:
  - "미디어 파일을 삭제하시겠습니까?" 메시지
  - 파일 정보 표시 (파일명, 크기)
  - "삭제" / "취소" 버튼
- **삭제 처리 상태**:
  - 삭제 진행 인디케이터
  - "파일을 삭제하는 중..." 메시지
- **삭제 완료 피드백**:
  - "미디어 파일이 삭제되었습니다" Toast
  - Media Property에서 URL 제거 완료
  - 빈 상태로 복원

**인터랙션**:
- 삭제 버튼 클릭 → 삭제 확인 다이얼로그 표시
- 삭제 확인 → Storage에서 파일 삭제 + 속성에서 URL 제거
- 삭제 완료 → 성공 피드백 표시

**화면 전환**:
- **조건**: 삭제 완료
- **전환**: 실시간 업데이트 (화면 전환 없음)
- **전환 방식**: 낙관적 업데이트

---

### 에러 처리

**파일 크기 초과**:
- **UI 반응**: 업로드 차단, 크기 제한 안내
- **메시지**: "파일 크기가 제한을 초과합니다 (이미지: 10MB, 파일: 50MB)"
- **다음 액션**: 파일 크기 축소 후 재업로드 안내

**지원되지 않는 파일 타입**:
- **UI 반응**: 파일 선택 취소, 타입 안내
- **메시지**: "지원되지 않는 파일 형식입니다. 지원 형식: jpg, png, gif, webp, pdf, doc, txt"
- **다음 액션**: 지원되는 형식으로 변환 후 재업로드 안내

**Supabase Storage 업로드 실패**:
- **UI 반응**: 원본 상태 복원, 에러 메시지 표시
- **메시지**: "파일 업로드에 실패했습니다: [구체적 오류]"
- **다음 액션**: 재시도 버튼 제공

**네트워크 오류**:
- **UI 반응**: 재시도 옵션 제공
- **메시지**: "네트워크 연결을 확인하고 다시 시도해주세요"
- **다음 액션**: 재시도 버튼, 오프라인 상태 표시

**속성 저장 실패**:
- **UI 반응**: 파일은 업로드되었지만 속성 저장 실패
- **메시지**: "파일은 업로드되었지만 속성에 저장하지 못했습니다"
- **다음 액션**: 수동으로 URL 복사하여 속성에 입력 안내

---

## 📍 Scenario 4: Block Tools 실행

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 4 in `02-process-model.md`
- **사용자 목표**: 블록 타입별 특화 기능을 실행하여 추가 정보를 생성하고 싶어함
- **주요 제약**: 툴 타입 검증, 실행 권한 확인, 결과 파싱 및 새 블록 생성
- **핵심 패턴**: Block Toolbar에서 툴 실행, Block Management Domain에서 처리, Canvas Management에 결과 전달

---

### Screen 1: Block Toolbar에서 툴 선택

**화면 구성**:
- **Block Toolbar**: 블록 선택 시 상단에 표시되는 툴바
- **툴 메뉴**: 블록 타입별 사용 가능한 툴 목록
- **툴 설명**: 각 툴의 기능과 결과 설명

**UI 컴포넌트**:
- **Block Toolbar** (NodeToolbar):
  - 공통 버튼: 더보기 (···) 메뉴
  - 블록 타입별 툴 버튼들
  - 툴 실행 권한 상태 표시
- **블록 타입별 툴 버튼**:
  - **Youtube 블록**: "댓글 가져오기", "스크립트 가져오기", "썸네일 다운로드"
  - **Python 블록**: "코드 실행", "의존성 설치", "결과 분석"
  - **Image 블록**: "이미지 분석", "OCR 텍스트 추출", "색상 팔레트 생성"
  - **Markdown 블록**: "링크 미리보기", "이미지 최적화", "문법 검사"
  - **GitHub PR 블록**: "PR 상태 확인", "리뷰어 할당", "자동 머지"
- **툴 설명 툴팁**:
  - 툴 기능 설명
  - 예상 실행 시간 (예: "약 5-10초")
  - 결과물 예시 (예: "댓글 50개 → 50개 블록 생성")
- **권한 표시**:
  - 툴 실행 권한 상태 (활성화/비활성화)
  - 권한 부족 시 안내 메시지 툴팁

**권한별 UI 차이**:
- **블록 소유자/관리자**:
  - 모든 툴 실행 가능
  - 모든 툴 옵션 활성화
  - 고급 툴 사용 가능
  
- **블록 편집자**:
  - 제한된 툴만 실행 가능
  - 기본 툴 옵션만 사용 가능
  - 고급 툴은 비활성화
  
- **뷰어**:
  - 툴 실행 버튼 숨김
  - 툴 설명만 읽기 전용으로 표시

**인터랙션**:
- 툴 버튼 클릭 → 툴 실행 확인 다이얼로그 표시
- 툴 설명 호버 → 상세 정보 툴팁 표시
- 실행 확인 → Screen 2로 전환
- 취소 → 툴 선택 화면 유지

**화면 전환**:
- **조건**: 툴 실행 확인
- **전환**: Screen 1 → Screen 2 (툴 실행 진행)
- **전환 방식**: 실행 진행 상태 표시

---

### Screen 2: 툴 실행 진행률

**화면 구성**:
- **진행률 표시**: 툴 실행 진행 상황 시각화
- **상태 메시지**: 현재 처리 단계 안내
- **결과 미리보기**: 실행 결과 일부 표시 (가능한 경우)

**UI 컴포넌트**:
- **진행률 바**:
  - 0-100% 진행률 표시 (CircularProgress)
  - 툴별 예상 실행 시간 표시 (예: "예상 5-10초")
  - 현재 진행률 퍼센트 표시
- **상태 메시지** (단계별):
  - "툴을 실행하는 중..." (0-20%)
  - "데이터를 수집하는 중..." (20-50%)
  - "결과를 처리하는 중..." (50-80%)
  - "블록을 생성하는 중..." (80-100%)
- **결과 미리보기**:
  - 실행 중인 툴의 중간 결과 표시
  - 생성될 블록 수 예상 (예: "댓글 50개 → 50개 블록 생성 예정")
  - 처리된 데이터 양 표시 (예: "처리된 댓글: 25/50")
- **취소 버튼**:
  - 툴 실행 중단 버튼 (가능한 경우)
  - 중단 시 진행 중인 작업 정리

**인터랙션** (실제 구현 기준):
- 툴 실행 시작 → `useBlockToolExecution.executeTool()` 호출, 진행률 바 애니메이션 시작
- 진행률 업데이트 → `isExecuting`, `executionProgress` 상태 변경, 상태 메시지 변경
- 중간 결과 표시 → 결과 미리보기 업데이트 (현재 부분 구현)
- 취소 버튼 클릭 → 툴 실행 중단 확인 (현재 미구현 - 진행률 표시만 가능)
- 실행 완료 → Screen 3으로 전환 (`executeBlockToolAction` 완료 후, `addNodes`로 새 블록 추가)

**화면 전환**:
- **조건**: 툴 실행 완료
- **전환**: Screen 2 → Screen 3 (실행 결과 표시)
- **전환 방식**: 결과 표시, 성공 메시지

---

### Screen 3: 실행 결과 및 새 블록 생성

**화면 구성**:
- **성공 피드백**: 툴 실행 완료 알림
- **생성된 블록**: 툴 실행 결과로 생성된 새 블록들
- **Canvas 연동**: 새 블록들을 Canvas에 마운트
- **결과 상세**: 실행 결과의 상세 정보

**UI 컴포넌트**:
- **성공 Toast**:
  - "툴이 성공적으로 실행되었습니다"
  - 생성된 블록 수 표시 (예: "50개의 댓글 블록이 생성되었습니다")
  - Canvas에 추가 완료 표시
- **생성된 블록 목록**:
  - 새로 생성된 블록들의 카드 형태 표시
  - 블록 타입, 내용 미리보기 (예: "댓글: '정말 유용한 영상이네요!'")
  - 블록별 상세 정보 (작성자, 작성시간, 좋아요 수 등)
  - 개별 블록 편집/삭제 버튼
- **Canvas 연동 상태**:
  - 새 블록들이 Canvas에 자동 마운트됨
  - 기존 블록과의 연결 관계 표시 (엣지)
  - 블록 배치 및 크기 자동 조정
- **실행 결과 상세**:
  - 툴 실행 로그 (시작시간, 완료시간, 처리된 데이터 수)
  - 처리된 데이터 통계 (성공/실패 개수)
  - 생성된 블록 타입별 분류
  - 실행 시간 정보

**인터랙션** (실제 구현 기준):
- 토스트 자동 사라짐 → 정상 화면으로 복귀
- 블록 카드 클릭 → 블록 상세 정보 표시 (Editor Panel 열림, Canvas Mode: `block-editing`)
- 블록 편집 → 개별 블록 속성 수정 (useBlockPropertyUpdate 사용)
- 블록 삭제 → 개별 블록 삭제 확인 (Canvas Management Domain: `softDeleteBlockMountAction`)
- 결과 상세 보기 → 실행 로그 및 통계 표시 (현재 부분 구현)

**화면 전환**:
- **조건**: Canvas에 새 블록 마운트 완료
- **전환**: 실시간 업데이트 (화면 전환 없음)
- **전환 방식**: 낙관적 업데이트

---

### Screen 4: AI 자동 툴 실행 (선택적)

**화면 구성**:
- **AI 툴 실행**: AI가 자동으로 툴을 실행하는 과정
- **AI 추천**: AI가 추천하는 툴 실행 옵션
- **자동 실행 결과**: AI가 생성한 결과물

**UI 컴포넌트**:
- **AI 툴 실행 알림**:
  - "AI가 자동으로 툴을 실행하고 있습니다" 메시지
  - AI 실행 중 인디케이터
  - 예상 완료 시간 표시
- **AI 추천 옵션**:
  - AI가 추천하는 추가 툴 실행 옵션
  - "이 영상의 댓글을 분석해보시겠습니까?" 같은 제안
  - AI 추천 툴 실행 버튼
- **자동 실행 결과**:
  - AI가 자동으로 생성한 블록들
  - AI 분석 결과 (감정 분석, 키워드 추출 등)
  - AI 생성 콘텐츠 표시

**인터랙션**:
- AI 툴 실행 시작 → 자동 진행률 표시
- AI 추천 옵션 클릭 → 추가 툴 실행
- AI 결과 확인 → 생성된 블록들 검토
- AI 결과 수정 → 필요시 블록 편집

**화면 전환**:
- **조건**: AI 툴 실행 완료
- **전환**: Screen 4 → Screen 3 (결과 표시)
- **전환 방식**: AI 결과와 함께 표시

---

### 에러 처리

**툴 실행 권한 부족**:
- **UI 반응**: 툴 버튼 비활성화, 권한 안내
- **메시지**: "이 툴을 실행할 권한이 없습니다"
- **다음 액션**: 권한 요청 또는 다른 툴 사용 안내

**툴 실행 실패**:
- **UI 반응**: 원본 상태 유지, 에러 메시지 표시
- **메시지**: "툴 실행에 실패했습니다: [구체적 오류]"
- **다음 액션**: 재시도 버튼 제공, 오류 로그 표시

**실행 타임아웃**:
- **UI 반응**: 실행 중단, 타임아웃 안내
- **메시지**: "툴 실행 시간이 초과되었습니다 (30초 제한)"
- **다음 액션**: 더 작은 데이터로 재시도 안내

**결과 파싱 실패**:
- **UI 반응**: 부분 결과만 표시, 경고 메시지
- **메시지**: "일부 결과를 처리할 수 없습니다 (성공: 45/50)"
- **다음 액션**: 성공한 결과만 표시, 실패한 부분 재처리 옵션

**Canvas 마운트 실패**:
- **UI 반응**: 블록은 생성되었지만 Canvas 마운트 실패
- **메시지**: "블록은 생성되었지만 Canvas에 추가하지 못했습니다"
- **다음 액션**: 수동으로 Canvas에 추가하는 버튼 제공

**AI 툴 실행 실패**:
- **UI 반응**: AI 실행 중단, 에러 메시지 표시
- **메시지**: "AI 툴 실행에 실패했습니다: [구체적 오류]"
- **다음 액션**: 수동 툴 실행으로 대체 안내

---

## 📱 반응형 고려사항

### 데스크톱 (> 1024px)
- **레이아웃**: 
  - Editor Panel: 우측 45% 너비 슬라이드 패널
  - Block Toolbar: 블록 상단에 고정 표시
  - Shadow Block: 마우스 커서를 정확히 추적
  - 모달 다이얼로그: 중앙 정렬, 최적화된 크기
- **인터랙션**: 
  - 마우스 호버 효과 지원 (블록 호버, 버튼 호버)
  - 키보드 단축키 지원 (ESC, Enter, Tab 등)
  - 드래그 앤 드롭 인터페이스 (파일 업로드, 블록 이동)
  - 복잡한 PropertyInput 필드 지원
- **특이사항**: 
  - 복잡한 속성 편집 (Popover, 중첩 메뉴)
  - 다중 블록 선택 및 일괄 작업
  - 고급 툴 실행 옵션

### 태블릿 (768px ~ 1024px)
- **레이아웃**: 
  - Editor Panel: 우측 50% 너비로 확장
  - Block Toolbar: 터치 최적화된 크기
  - Shadow Block: 터치 친화적 크기 조정
  - 블록 타입 선택: 그리드 뷰 (2x2, 3x2)
- **인터랙션**: 
  - 터치 최적화된 버튼 크기 (최소 44px)
  - 스와이프 제스처 지원 (Editor Panel 닫기)
  - 롱프레스 컨텍스트 메뉴
- **특이사항**: 
  - PropertyInput 필드 단순화
  - Popover 대신 모달 사용
  - 툴 실행 옵션 간소화

### 모바일 (< 768px)
- **레이아웃**: 
  - Editor Panel: 전체 화면 모달로 변경
  - Block Toolbar: 하단 시트 형태
  - Shadow Block: 터치 최적화된 크기
  - 블록 타입 선택: 세로 스크롤 리스트
- **인터랙션**: 
  - 터치 친화적 인터페이스
  - 스와이프 제스처 (Editor Panel 닫기)
  - 롱프레스 컨텍스트 메뉴
- **특이사항**: 
  - PropertyInput을 단계별 위저드로 변경
  - Popover 대신 전체 화면 모달
  - 툴 실행을 간소화된 버튼으로
  - 백 버튼과 명확한 네비게이션

---

## 🔗 다음 단계

### Frontend Specification
이 User Flow를 기반으로 프론트엔드 개발자는 다음 작업을 수행합니다:

1. **React 컴포넌트 설계**: 
   - **Shadow Block**: `SkeletonBlock.tsx` (마우스 추적)
   - **블록 타입별 Node**: `YoutubeBlockNode.tsx`, `ImageBlockNode.tsx` 등
   - **Editor Panel**: `EditorPanel.tsx` (우측 슬라이드 패널)
   - **PropertyInput**: 타입별 동적 렌더링 컴포넌트
   - **Field Popover**: 속성 편집 팝오버 (Generic, Select-Like, Status)
   - **Block Toolbar**: 블록별 툴 실행 버튼

2. **Custom Hooks 설계** (실제 구현 기준): 
   - `useBlockPropertyUpdate`: 블록 속성 업데이트 통합 처리 (useNodeFieldUpdate 패턴)
   - `useSchemaFieldEditor`: 속성 스키마 편집 (라벨 저장, 속성 삭제, 옵션 커밋)
   - `use-canvas-mode`: Shadow Block 모드 관리
   - `use-canvas-block-lifecycle`: 블록 생명주기 관리
   - `useBlockToolExecution`: 블록 툴 실행 로직 (진행률 표시 포함)

3. **상태 관리**: 
   - 블록 상태별 구분 (Shadow → Skeleton → Completed)
   - Editor Panel 열림/닫힘 상태
   - 속성 편집 상태 (Popover, 중첩 메뉴)
   - 툴 실행 진행 상태

4. **Server Actions 연동** (실제 구현 기준): 
   - `createAndMountBlockAction`: 블록 생성 및 Canvas 마운팅 통합 (Canvas Management Domain)
   - `updateBlockPropertyAction`: 블록 속성 업데이트 (properties.xxx 경로만)
   - `updateBlockTitleAction`: 블록 제목 업데이트
   - `createCustomPropertyAction`, `updateCustomPropertyAction`: 커스텀 속성 관리
   - `executeBlockToolAction`: 블록 툴 실행
   - 참고: `manageMediaAction`은 현재 미구현 (MediaURL VO만 구현)

5. **Canvas Management 연동**: 
   - 블록 생성 시 Canvas 마운트
   - 툴 실행 결과를 Canvas에 전달
   - 권한 상태 공유

**참조**: `04-frontend-specification.md`

---

## 📋 문서 변경 이력

### v1.0 (2025-10-22)
- 초안 작성
- Process Model 기반으로 5개 시나리오 화면 흐름 정의
- 블록 생성 (Shadow → Skeleton → Completed), 속성 관리, 미디어 업로드, 툴 실행 UI 정의
- 권한별 UI 차이 및 반응형 고려사항 포함
- 레거시 코드 패턴 반영 (PropertyInput, Popover, useNodeFieldUpdate)

---

## 📚 참조 자료

### Process Model
- [Scenario 0 in Process Model](./02-process-model.md#scenario-0-canvas-management-연동)
- [Scenario 1 in Process Model](./02-process-model.md#scenario-1-custom-properties-관리)
- [Scenario 2 in Process Model](./02-process-model.md#scenario-2-property-values-관리)
- [Scenario 3 in Process Model](./02-process-model.md#scenario-3-media-upload-처리)
- [Scenario 4 in Process Model](./02-process-model.md#scenario-4-block-tools-실행)

### Canvas Management Domain 연동
- **블록 생성**: Canvas에서 Shadow Block → Skeleton Block → Completed Block 흐름
- **권한 연동**: 워크스페이스 멤버십 기반 권한 체계 공유
- **Editor Panel**: Notion 스타일 우측 슬라이드 패널
- **Block Toolbar**: 블록별 툴 실행 버튼

### 레거시 코드 패턴
- **PropertyInput**: 타입별 동적 렌더링 컴포넌트
- **Field Popover**: 속성 편집 팝오버 (Generic, Select-Like, Status)
- **useBlockPropertyUpdate**: 모든 속성 업데이트 통합 처리 (실제 구현 기준)
- **useSchemaFieldEditor**: 속성 스키마 편집

### 디자인 시스템
- 일관된 블록 스타일 (BaseNode 기반)
- 권한 기반 UI 상태 표시 (활성화/비활성화)
- 에러 처리 및 피드백 메시지 표준화
- 반응형 디자인 (데스크톱/태블릿/모바일)

---

*이 User Flow를 기반으로 직관적이고 효율적인 블록 관리 경험을 제공하는 프론트엔드를 구현할 수 있습니다! 🎨*

---

## 📚 참조 자료

### Process Model
- [Scenario 0 in Process Model](./02-process-model.md#scenario-0-canvas-management-연동)
- [Scenario 1 in Process Model](./02-process-model.md#scenario-1-custom-properties-관리)
- [Scenario 2 in Process Model](./02-process-model.md#scenario-2-property-values-관리)
- [Scenario 3 in Process Model](./02-process-model.md#scenario-3-media-upload-처리)
- [Scenario 4 in Process Model](./02-process-model.md#scenario-4-block-tools-실행)

### Canvas Management Domain 연동
- **블록 타입 선택**: Canvas에서 사용하는 블록 타입과 동일한 UI 컴포넌트
- **권한 연동**: 워크스페이스 멤버십 기반 권한 체계 공유
- **메타데이터 스키마**: Canvas 렌더링에 필요한 블록 속성 정의

### 디자인 시스템
- 일관된 모달 다이얼로그 디자인
- 권한 기반 UI 상태 표시 (활성화/비활성화)
- 에러 처리 및 피드백 메시지 표준화

---

*이 User Flow를 기반으로 직관적이고 효율적인 블록 관리 경험을 제공하는 프론트엔드를 구현할 수 있습니다! 🎨*