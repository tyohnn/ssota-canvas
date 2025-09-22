# Visual Canvas Domain - Process Model

## 🎯 Process Modeling Overview
Visual Canvas Domain의 핵심 프로세스를 Command → Policy → System → Event 패턴으로 정의

---

## 📍 Process 1: 블럭 생성 및 배치

### Scenario: 사용자가 텍스트 블럭을 생성하여 캔버스에 배치

```
👤 사용자: "텍스트 블럭을 추가하고 싶어"
```

**Command**: 텍스트 블럭 생성 (Create Text Block)
- 위치: (x, y)
- 페이지: currentPageId
- 초기 텍스트: "텍스트 입력"

**Read Model** (필요 정보):
- 현재 페이지 ID
- 캔버스 뷰포트 정보
- 마우스 클릭 위치
- 사용 가능한 블럭 타입 목록

**Policy**: 블럭 생성 시 페이지 마운트 필수
- "블럭이 생성되면 반드시 현재 페이지에 마운트한다"
- "초기 크기는 블럭 타입의 기본값을 적용한다"
- "텍스트 블럭의 사이징 규칙은 '너비만 조정'이다"

**System**: Block Manager

**Events**:
1. 텍스트 블럭이 생성되었다 (Text Block Created)
2. 블럭이 페이지에 마운트되었다 (Block Mounted to Page)
3. 블럭의 기본 속성이 설정되었다 (Block Default Property Set)

---

## 📍 Process 2: 블럭 이동 및 정렬

### Scenario: 사용자가 블럭을 드래그하여 이동시키고 스냅 가이드 활용

```
👤 사용자: "이 블럭을 저기로 옮기고 싶어"
```

**Command**: 블럭 이동 (Move Block)
- blockId: targetBlock
- newPosition: (x, y)
- pageId: currentPageId

**Read Model**:
- 블럭의 현재 위치
- 페이지 내 다른 블럭들의 위치
- 스냅 임계값 설정 (예: 5px)
- 그리드 설정

**Policy**: 스마트 가이드 자동 활성화
- "블럭이 이동 중일 때 근처 블럭과의 정렬선을 표시한다"
- "임계값 내에 있으면 자동 스냅한다"
- "거리 측정값을 실시간 표시한다"

**System**: Canvas Renderer

**Events**:
1. 블럭 드래그가 시작되었다 (Block Drag Started)
2. 스냅 가이드라인이 표시되었다 (Snap Guidelines Shown)
3. 블럭이 가이드라인에 스냅되었다 (Block Snapped to Guideline)
4. 블럭 간 거리가 표시되었다 (Distance Between Blocks Shown)
5. 블럭의 페이지별 위치가 확정되었다 (Block Position Confirmed on Page)

---

## 📍 Process 3: 블럭 타입 변경

### Scenario: 텍스트 블럭을 유튜브 블럭으로 변경

```
👤 사용자: "이 텍스트 블럭을 유튜브 블럭으로 바꾸고 싶어"
```

**Command**: 블럭 타입 변경 (Change Block Type)
- blockId: targetBlock
- newType: "youtube"
- youtubeUrl: "https://youtube.com/..."

**Read Model**:
- 현재 블럭 타입 및 속성
- 대상 블럭 타입의 필수 속성
- 사이징 규칙 매핑

**Policy**: 속성 보존 및 필터링
- "기존 속성은 모두 보존하되 새 타입에서 사용하지 않는 속성은 렌더링에서 제외"
- "새 타입의 필수 기본 속성을 요구"
- "사이징 규칙을 새 타입에 맞게 변경 (너비만 → 고정 비율)"

**System**: Block Type Manager

**Events**:
1. 블럭 타입이 변경되었다 (Block Type Changed)
2. 블럭의 기본 속성이 설정되었다 (Block Default Property Set)
3. 블럭의 사이징 규칙이 적용되었다 (Block Sizing Rule Applied)
4. 유튜브 미리보기가 로드되었다 (YouTube Preview Loaded)

---

## 📍 Process 4: 다중 블럭 선택 및 그룹화

### Scenario: 여러 블럭을 선택하여 그룹으로 만들기

```
👤 사용자: "이 블럭들을 하나로 묶어서 같이 움직이고 싶어"
```

**Command**: 블럭 그룹화 (Group Blocks)
- blockIds: [block1, block2, block3]
- pageId: currentPageId

**Read Model**:
- 선택된 블럭들의 목록
- 각 블럭의 위치 및 크기
- 블럭들의 Z-Order

**Policy**: 그룹 생성 규칙
- "서로 다른 타입의 블럭도 그룹화 가능"
- "그룹의 Z-Order는 포함된 블럭 중 최상위 값 + 1"
- "그룹 내 블럭의 상대 위치 유지"

**System**: Group Manager

**Events**:
1. 여러 블럭이 다중 선택되었다 (Multiple Blocks Selected)
2. 블럭들이 그룹으로 묶였다 (Blocks Grouped)
3. 그룹의 경계가 계산되었다 (Group Bounds Calculated)

---

## 📍 Process 5: 블럭 복사 및 붙여넣기

### Scenario: 블럭을 다른 페이지로 복사/붙여넣기

```
👤 사용자: "이 블럭을 다른 페이지에서도 쓰고 싶어"
```

**Command**: 블럭 붙여넣기 (Paste Block)
- blockId: copiedBlock
- targetPageId: newPageId
- position: (x, y)

**Read Model**:
- 복사된 블럭 정보
- 대상 페이지 정보
- 붙여넣기 위치

**Policy**: 페이지 간 블럭 공유
- "붙여넣기는 새 블럭 생성이 아닌 기존 블럭의 추가 마운트"
- "엣지는 복사되지 않음"
- "위치는 대상 페이지에서 독립적으로 설정"

**System**: Block Manager

**Events**:
1. 블럭이 복사되었다 (Block Copied)
2. 블럭이 다른 페이지에 추가로 마운트되었다 (Block Mounted to Additional Page)
3. 블럭의 페이지별 위치가 설정되었다 (Block Position Set on Page)

---

## 📍 Process 6: 엣지 연결

### Scenario: 두 블럭을 엣지로 연결

```
👤 사용자: "이 두 블럭을 화살표로 연결하고 싶어"
```

**Command**: 엣지 생성 (Create Edge)
- sourceBlockId: block1
- targetBlockId: block2
- pageId: currentPageId
- label: "관계"

**Read Model**:
- 소스 블럭 위치 및 경계
- 타겟 블럭 위치 및 경계
- 기존 엣지 목록

**Policy**: 엣지 연결 규칙
- "self-loop 불가 (sourceId ≠ targetId)"
- "같은 블럭 쌍 사이 다중 엣지 허용"
- "엣지는 페이지별로 독립적"
- "블럭 삭제 시 연결된 엣지도 자동 삭제"

**System**: Edge Manager

**Events**:
1. 엣지가 생성되었다 (Edge Created)
2. 엣지 레이블이 설정되었다 (Edge Label Set)
3. 엣지 경로가 계산되었다 (Edge Path Calculated)

---

## 📍 Process 7: 뷰포트 제어

### Scenario: 캔버스 줌인/아웃 및 패닝

```
👤 사용자: "전체 다이어그램을 한눈에 보고 싶어"
```

**Command**: 화면에 맞추기 (Fit to Screen)
- pageId: currentPageId

**Read Model**:
- 페이지의 모든 블럭 위치 및 크기
- 현재 뷰포트 크기
- 최소/최대 줌 레벨

**Policy**: 뷰포트 자동 조정
- "모든 블럭이 보이도록 줌 레벨 계산"
- "여백 20px 확보"
- "최소 줌 10%, 최대 줌 500%"

**System**: Viewport Controller

**Events**:
1. 캔버스가 화면에 맞춰졌다 (Canvas Fit to Screen)
2. 줌 레벨이 조정되었다 (Zoom Level Adjusted)
3. 뷰포트가 중앙 정렬되었다 (Viewport Centered)

---

## 💡 핵심 Policy 정리

### 블럭 관련
1. **생성 즉시 마운트**: 모든 블럭은 생성과 동시에 페이지에 마운트
2. **속성 보존**: 타입 변경 시에도 기존 속성 데이터 유지
3. **페이지별 독립성**: 위치, 크기, 엣지는 페이지마다 독립 관리

### 상호작용 관련
4. **스마트 가이드**: 이동/정렬 시 자동 가이드 제공
5. **다중 선택**: Shift/Ctrl 키로 선택 추가/제거
6. **그룹 유연성**: 다른 타입 블럭도 그룹화 가능

### 데이터 일관성
7. **캐스케이드 삭제**: 블럭 삭제 시 엣지 자동 처리
8. **휴지통 개념**: 실제 삭제가 아닌 소프트 삭제
9. **다중 엣지**: 같은 블럭 쌍 사이 여러 연결 허용

---

## 🔧 기술 권장사항

### 코드 블럭 신택스 하이라이팅 지원 언어
- **필수**: JavaScript, TypeScript, Python, Java, SQL, HTML/CSS
- **권장**: Go, Rust, C++, Ruby, PHP, Swift, Kotlin
- **라이브러리**: Prism.js 또는 highlight.js

### LaTeX 렌더링 라이브러리
- **추천**: KaTeX (성능 우수, 클라이언트 렌더링)
- **대안**: MathJax (호환성 우수)

### 실시간 미리보기
- **유튜브**: YouTube IFrame API
- **트위터**: Twitter Embed API
- **캐싱**: 미리보기 데이터 캐싱으로 성능 최적화

---

## 🚀 Next Steps

이제 Visual Canvas Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환
2. **Bounded Context 식별**: 언어 경계 확인
3. **Integration Points**: 다른 도메인과의 연결점 정의