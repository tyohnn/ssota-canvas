# User Flow: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: UX/UI 디자이너 + 기획자  
**작성일**: 2025-11-19  
**버전**: v1.0

**Process Model 참조**: `02-process-model.md`  
**다음 단계**: `05-frontend-specification.md`

---

### 문서 목적

이 문서는 Image App Space Domain의 사용자 여정을 정의합니다.  
Process Model의 비즈니스 프로세스를 기반으로 실제 화면 흐름과 사용자 인터랙션을 상세히 설명합니다.

**범위**:
- 사용자 화면 흐름 정의
- UI 컴포넌트 및 인터랙션 명세
- 권한별 UI 차이 정의
- 에러 처리 및 피드백 방법

**제외 사항** (Frontend Specification에서 다룸):
- React 컴포넌트 구현 상세
- 상태 관리 방법 (TanStack Query)
- Server Actions 연동 코드

---

## 🎨 전체 UI 구조

### Dialog 레이아웃 (Full Screen Modal)

```
┌─────────────────────────────────────────────────────┐
│ Image Space Dialog (95vw x 90vh)                    │
├─────────────────────────────────────────────────────┤
│ [Header]                                          [X]│
│  Title | Top Menu: [Explore] [Editor] [Community]  │
├─────────────────────────────────────────────────────┤
│ [Explore Tab Menu] (Explore 모드일 때만)             │
│  Unsplash | Ssota | AI Prompt | Workspace           │
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              [Content Area]                         │
│                                                     │
│              (탭별 컨텐츠 영역)                       │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Top Menu 구조
- **Explore**: 이미지 탐색 (Unsplash, Ssota, AI, Workspace)
- **Editor**: 이미지 편집 (향후 구현)
- **Community**: 커뮤니티 피드 (Ranking, Trending)

---

## 📍 Scenario 1: Unsplash 이미지 탐색 및 선택

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 2 in `02-process-model.md`
- **사용자 목표**: Unsplash에서 고품질 이미지를 검색하고 블록에 적용
- **주요 제약**: 인증된 사용자만 접근, Rate Limit (5000/hour)

---

### Screen 1: Image Space Dialog 열기

**화면 구성**:
- 트리거: Toolbar의 "Explore" 버튼 클릭
- Full-screen Dialog (95vw x 90vh)
- 기본 탭: Unsplash

**UI 컴포넌트**:
- **Dialog Container**:
  - 크기: 95vw x 90vh
  - 위치: 화면 중앙
  - 배경: Backdrop (dimmed)
  - 닫기: X 버튼 또는 ESC 키

- **Header**:
  - 제목: "Image Space"
  - Top Menu: Explore (기본 선택), Editor, Community
  - 닫기 버튼

- **Explore Tab Menu**:
  - Unsplash (기본 선택)
  - Ssota
  - AI Prompt
  - Workspace Library

**인터랙션**:
- Dialog 열림 → Unsplash 탭 자동 포커스
- 검색바에 커서 자동 포커스

**화면 전환**:
- **조건**: Dialog 열림
- **전환**: Toolbar → Image Space Dialog (Unsplash 탭)
- **전환 방식**: Modal 표시 (fade-in 애니메이션)

---

### Screen 2: Unsplash 이미지 검색

**화면 구성**:
- 검색바 (상단)
- 이미지 그리드 (스크롤 가능)
- 페이지네이션 또는 무한 스크롤

**UI 컴포넌트**:
- **검색바**:
  - Placeholder: "Search Unsplash images..."
  - 검색 아이콘
  - Clear 버튼 (입력 시)

- **이미지 그리드**:
  - 반응형 그리드 (3-5열, 화면 크기에 따라)
  - 각 이미지 카드:
    - 썸네일 이미지
    - Hover: 작가명, 좋아요 수 표시
    - 클릭: 이미지 선택

- **로딩 상태**:
  - Skeleton 그리드 (검색 중)
  - Spinner (추가 로드 중)

- **Empty State**:
  - 아이콘 + 메시지
  - "검색 결과가 없습니다"

**인터랙션**:
- 검색어 입력 → 자동 검색 (debounce 500ms)
- 이미지 카드 호버 → 작가 정보 표시
- 이미지 카드 클릭 → Screen 3 (이미지 상세/적용)
- 스크롤 하단 도달 → 다음 페이지 로드

**에러 처리**:
- Rate Limit 초과: Toast "Rate limit exceeded. Please try again later."
- API 실패: Toast "Failed to load images. Please try again."

---

### Screen 3: 이미지 선택 및 블록 적용

**화면 구성**:
- 선택된 이미지 미리보기 (크게)
- 이미지 메타데이터
- Apply 버튼
- Cancel 버튼

**UI 컴포넌트**:
- **이미지 미리보기**:
  - 큰 썸네일 (최대 500px)
  - 작가 정보 (이름, 프로필 링크)
  - 이미지 크기 정보

- **Apply 버튼**:
  - Primary 버튼
  - 텍스트: "Apply to Block"
  - 비활성화 조건: 로딩 중

- **Cancel 버튼**:
  - Secondary 버튼
  - Screen 2로 돌아가기

**인터랙션**:
- Apply 버튼 클릭 → 블록에 이미지 적용
- 적용 중 → 버튼 disabled + 로딩 인디케이터
- 적용 완료 → Dialog 닫힘 + Toast "Image applied successfully"
- 적용 실패 → Toast "Failed to apply image" + Dialog 유지

---

## 📍 Scenario 2: AI 이미지 생성

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 1 in `02-process-model.md`
- **사용자 목표**: 프롬프트를 입력해 AI 이미지 생성 후 블록에 적용
- **주요 제약**: Workspace 멤버만 생성 가능

---

### Screen 1: AI Prompt 탭 선택

**화면 구성**:
- Top Menu에서 "Explore" 선택
- Explore Tab Menu에서 "AI Prompt" 선택

**UI 컴포넌트**:
- **AI Prompt 탭 컨텐츠**:
  - 프롬프트 입력 필드 (textarea)
  - 모델 선택 드롭다운
  - 고급 옵션 (Accordion, 접힌 상태)
  - Generate 버튼

- **프롬프트 입력**:
  - Placeholder: "Describe the image you want to create..."
  - 최소 높이: 120px
  - 자동 높이 조절 (최대 300px)

- **모델 선택**:
  - 옵션: OpenAI (gpt-image-1), Google (gemini-2.5-flash-image)
  - 기본값: OpenAI
  - Badge: 모델 특징 표시

- **고급 옵션** (Accordion):
  - Output Count: 1-4 (슬라이더)
  - Aspect Ratio: 1:1, 16:9 등 (버튼 그룹)
  - Seed: 정수 입력 (선택사항)

**인터랙션**:
- 프롬프트 입력 → Generate 버튼 활성화
- Generate 버튼 클릭 → Screen 2 (생성 중)
- 프롬프트 비어있음 → Generate 버튼 비활성화

---

### Screen 2: AI 이미지 생성 중

**화면 구성**:
- 생성 진행 상태 표시
- 프롬프트 표시
- Cancel 버튼 (선택사항)

**UI 컴포넌트**:
- **Progress Indicator**:
  - Spinner 또는 Progress Bar
  - 상태 메시지: "Generating images..."
  - 예상 시간: "This may take 10-30 seconds"

- **프롬프트 미리보기**:
  - 입력한 프롬프트 표시
  - 선택한 모델 표시

**인터랙션**:
- 생성 완료 → Screen 3 (결과 표시)
- 생성 실패 → 에러 메시지 표시 + Screen 1로 돌아가기

**에러 처리**:
- API 실패: "Failed to generate image. Please try again."
- Timeout: "Generation timed out. Please try again with a simpler prompt."

---

### Screen 3: 생성된 이미지 결과

**화면 구성**:
- 생성된 이미지 그리드 (1-4개)
- 각 이미지 선택 가능
- 프롬프트 정보 표시

**UI 컴포넌트**:
- **이미지 그리드**:
  - 생성된 이미지들 (1-4개)
  - 선택 표시 (border 하이라이트)
  - 클릭으로 선택

- **이미지 메타데이터**:
  - 프롬프트
  - 모델명
  - 크기 정보

- **액션 버튼**:
  - Apply: 선택한 이미지 적용
  - Regenerate: 다시 생성
  - Cancel: 취소

**인터랙션**:
- 이미지 클릭 → 선택 상태 toggle
- Apply 버튼 클릭 → 블록에 적용 + Dialog 닫힘
- Regenerate → Screen 1로 (프롬프트 유지)

---

## 📍 Scenario 3: 커뮤니티 피드 탐색

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 3 in `02-process-model.md`
- **사용자 목표**: 다른 사용자가 공유한 인기 이미지 탐색
- **주요 제약**: Public 이미지만 표시

---

### Screen 1: Community 탭 선택

**화면 구성**:
- Top Menu에서 "Community" 선택
- 기본 탭: Trending

**UI 컴포넌트**:
- **Community Tab Menu**:
  - Ranking (인기순)
  - Trending (최신 인기순)

- **필터 옵션**:
  - 정렬: Trending, Recent, Most Viewed
  - 카테고리 필터 (드롭다운)

- **이미지 그리드**:
  - 반응형 그리드
  - 각 카드:
    - 이미지 썸네일
    - 크리에이터 아바타 + 이름
    - 통계: 👁️ views, ❤️ likes, 🔖 bookmarks
    - 좋아요 버튼 (하트 아이콘)
    - 북마크 버튼 (북마크 아이콘)

**인터랙션**:
- 정렬 옵션 변경 → 피드 재정렬
- 카테고리 필터 → 필터링된 결과
- 이미지 클릭 → Screen 2 (상세 보기)
- 좋아요 버튼 클릭 → 좋아요 toggle (즉시 반영)
- 북마크 버튼 클릭 → 북마크 toggle
- 크리에이터 이름/아바타 클릭 → 크리에이터 프로필 (향후)

**로딩 상태**:
- Skeleton 그리드 (초기 로드)
- 무한 스크롤 Spinner (추가 로드)

---

### Screen 2: 이미지 상세 보기

**화면 구성**:
- 큰 이미지 미리보기
- 이미지 메타데이터
- 커뮤니티 상호작용 (좋아요, 북마크)
- Apply 버튼

**UI 컴포넌트**:
- **이미지 미리보기**:
  - 큰 이미지 (최대 800px)
  - Zoom 기능 (선택사항)

- **메타데이터 패널**:
  - 제목
  - 설명
  - 태그 (칩 형태)
  - 카테고리 배지
  - 생성 일시

- **크리에이터 정보**:
  - 아바타 + 이름
  - 팔로우 버튼
  - 팔로워 수

- **통계 및 액션**:
  - 조회수, 좋아요 수, 북마크 수
  - 좋아요 버튼 (토글)
  - 북마크 버튼 (토글)
  - Apply to Block 버튼

**권한별 UI 차이**:
- **본인 이미지**:
  - 편집 버튼 표시 (메타데이터 수정)
  - 공개 설정 토글 표시

- **타인 이미지**:
  - 편집 버튼 숨김
  - 좋아요/북마크만 표시

**인터랙션**:
- 좋아요 버튼 클릭 → 좋아요 count 즉시 증가/감소
- 팔로우 버튼 클릭 → "Following" 상태 변경
- Apply 버튼 클릭 → 블록에 적용 + Dialog 닫힘
- 편집 버튼 클릭 → Screen 3 (메타데이터 편집)
- Back 버튼 → Screen 1 (피드)

---

### Screen 3: 이미지 메타데이터 편집 (본인만)

**화면 구성**:
- 편집 폼 (Modal 또는 Drawer)
- 저장/취소 버튼

**UI 컴포넌트**:
- **편집 폼**:
  - 제목 입력 (text input)
  - 설명 입력 (textarea)
  - 태그 입력 (tag input, 최대 10개)
  - 카테고리 선택 (select)
  - 공개 설정 토글 (public/private)

- **공개 설정 토글**:
  - Switch 컴포넌트
  - Public 선택 시 제목/카테고리 필수 표시
  - 레이블: "Share to Community"

**검증**:
- Public 선택 & 제목 없음 → "Title is required for public images" 에러
- Public 선택 & 카테고리 없음 → "Category is required" 에러
- 태그 10개 초과 → "Maximum 10 tags allowed" 에러

**인터랙션**:
- 저장 버튼 클릭 → 메타데이터 업데이트 + Screen 2로 돌아가기
- 취소 버튼 → 변경 취소 + Screen 2로

**성공 시**:
- Toast: "Image updated successfully"
- Screen 2로 돌아가기 (업데이트된 정보 반영)

**실패 시**:
- Toast: 에러 메시지
- 폼 유지 (재시도 가능)

---

## 📍 Scenario 4: 팔로잉 피드 조회

### 비즈니스 컨텍스트

- **Process Model 참조**: Scenario 5 in `02-process-model.md`
- **사용자 목표**: 팔로우한 크리에이터의 최신 이미지 확인
- **주요 제약**: 팔로우한 사용자의 public 이미지만

---

### Screen 1: Following 피드

**화면 구성**:
- Top Menu에서 "Community" 선택
- 탭에서 "Following" 선택 (향후 추가)
- 타임라인 레이아웃

**UI 컴포넌트**:
- **타임라인 아이템**:
  - 크리에이터 정보 (아바타 + 이름 + 시간)
  - 이미지
  - 메타데이터 (제목, 태그)
  - 좋아요/북마크 버튼
  - Apply 버튼

- **Empty State** (팔로우 없음):
  - 아이콘 + 메시지: "Follow creators to see their latest images"
  - 추천 크리에이터 목록
  - Follow 버튼

**인터랙션**:
- 무한 스크롤 → 이전 이미지 로드
- 이미지 클릭 → 상세 보기
- 좋아요/북마크 → 즉시 toggle
- Apply 버튼 → 블록에 적용

---

## 📍 Scenario 5: 이미지 북마크 관리

### 비즈니스 컨텍스트

- **사용자 목표**: 북마크한 이미지를 모아서 관리
- **주요 제약**: 본인 북마크만 조회 가능

---

### Screen 1: 북마크 컬렉션

**화면 구성**:
- Workspace Library 탭 또는 별도 "Bookmarks" 탭
- 북마크한 이미지 그리드

**UI 컴포넌트**:
- **북마크 이미지 그리드**:
  - 북마크한 순서대로 표시
  - 각 카드:
    - 이미지 썸네일
    - 북마크 제거 버튼
    - Apply 버튼

- **Empty State**:
  - "No bookmarked images yet"
  - "Explore" 탭으로 이동 버튼

**인터랙션**:
- 북마크 제거 버튼 → 즉시 제거 (확인 없음)
- Apply 버튼 → 블록에 적용

---

## 🎨 공통 UI 패턴

### 이미지 카드 컴포넌트

**구조**:
```
┌────────────────────┐
│                    │
│   [Image]          │
│                    │
├────────────────────┤
│ [Avatar] Name      │
│ 👁️ 123 ❤️ 45      │
│ [❤️] [🔖] [Apply]  │
└────────────────────┘
```

**상호작용**:
- Hover: 메타데이터 오버레이 표시
- 클릭: 상세 보기 또는 선택
- 좋아요/북마크 버튼: 즉시 toggle (애니메이션)

### 로딩 상태

**Skeleton**:
- 이미지 그리드: Skeleton 카드 (4-8개)
- 메타데이터: Skeleton 텍스트 라인

**Spinner**:
- 무한 스크롤: 하단 Spinner
- 버튼 로딩: 버튼 내 Spinner

### 에러 표시

**Toast**:
- 성공: 체크 아이콘 + 녹색
- 실패: X 아이콘 + 빨간색
- 경고: 느낌표 아이콘 + 노란색
- Duration: 3초 (자동 닫힘)

**Inline Error**:
- 폼 필드 하단에 에러 메시지
- 빨간색 테두리 + 텍스트

---

## 📱 반응형 고려사항

### 데스크톱 (> 1024px)
- **Image Space Dialog**: 95vw x 90vh
- **이미지 그리드**: 5열
- **Sidebar**: 고정 표시 (향후)

### 태블릿 (768px ~ 1024px)
- **Image Space Dialog**: 95vw x 90vh
- **이미지 그리드**: 3-4열
- **터치 영역**: 최소 44px

### 모바일 (< 768px)
- **Image Space Dialog**: 100vw x 100vh (Full Screen)
- **이미지 그리드**: 2열
- **탭 메뉴**: 스크롤 가능
- **하단 버튼**: Sticky

---

## 🎯 핵심 인터랙션 패턴

### 1. Toggle 패턴 (좋아요, 북마크, 팔로우)
- 클릭 시 즉시 UI 반영 (Optimistic Update)
- 서버 응답 실패 시 롤백
- 애니메이션: Scale + Fade

### 2. 무한 스크롤
- 스크롤 하단 500px 전 → 다음 페이지 로드
- 로딩 중 Spinner 표시
- 더 이상 데이터 없음 → "No more images" 메시지

### 3. 검색 Debounce
- 입력 후 500ms 대기 → API 호출
- 입력 중 이전 요청 취소
- 로딩 상태 표시

### 4. 이미지 Lazy Loading
- Intersection Observer 사용
- Viewport에 진입 시 로드
- Placeholder: Blurhash 또는 Skeleton

---

## ✅ 접근성 고려사항

### 키보드 내비게이션
- Tab: 다음 요소로 이동
- Shift + Tab: 이전 요소로 이동
- Enter/Space: 버튼 클릭
- ESC: Dialog 닫기

### Screen Reader
- 이미지 alt 텍스트 필수
- 버튼 aria-label 명확히
- 로딩 상태 aria-live 공지

### Focus Management
- Dialog 열림 → 첫 번째 입력 필드에 포커스
- Modal 내 Focus Trap
- Dialog 닫힘 → 원래 트리거로 포커스 복귀

---

## 🚀 구현 우선순위

### MVP (필수)
1. ✅ Unsplash 탐색 및 선택
2. ⏳ AI 이미지 생성 (진행 중)
3. ⏳ Community 피드 (기본 구조만)
4. ✅ 블록 적용

### Post-MVP
5. ⏳ 팔로잉 피드
6. ⏳ 북마크 관리
7. ⏳ 메타데이터 편집
8. ⏳ 크리에이터 프로필

---

*이 User Flow 문서는 Image App Space Domain의 Frontend Specification 작성을 위한 기반 자료입니다.*

