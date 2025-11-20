# Process Model: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 도메인전문가 + 시니어개발자  
**작성일**: 2025-11-19  
**버전**: v1.0

**Event Storming 참조**: `01-event-storm.md`  
**다음 단계**: `03-software-design.md` (Backend), `03-user-flow.md` (Frontend)

---

## 🎯 Process Modeling Overview

Image App Space Domain의 핵심 프로세스를 실제 상호작용 순서에 따라 정의합니다.

### 📝 작성 원칙 (하이브리드 접근법)

#### ✅ 항상 작성해야 할 내용 (비즈니스 프로세스)
- 비즈니스 정책 및 규칙
- 권한 기반 필터링 로직
- 시스템 처리 흐름
- 데이터 검증 규칙
- 외부 시스템 통합

#### ✅ 선택적으로 작성 가능 (최소 UX 힌트)
- `*UI Hint:` 형태로 Frontend 팀을 위한 최소 힌트 제공
- 예시: `*UI Hint: 옵션 선택 UI*`, `*UI Hint: 확인 다이얼로그*`

#### ❌ 작성 금지 (UI 과도 종속)
- 버튼 위치, 색상, 크기
- 애니메이션, 트랜지션 효과
- 구체적인 컴포넌트 이름

> **참고**: 구체적인 UI/UX 설계는 `03-user-flow.md`에서 진행합니다.

### 🔄 시퀀스 기반 상호작용 순서
각 시나리오는 여러 시퀀스로 구성되며, 이벤트에 의해 다음 시퀀스가 트리거됩니다:

**Event** → **Policy** → **Read Model** → **Command** → **System** → **Event** → **Policy** → ...

---

## 🟪 External Systems

### External System: Unsplash API
Image App Space는 Unsplash를 이미지 검색 및 자산 제공 시스템으로 사용합니다:
- **역할**: 고품질 이미지 검색 및 다운로드 제공
- **SSOT**: Unsplash가 이미지 메타데이터의 Single Source of Truth
- **통합**: REST API 호출 (검색, 다운로드 트래킹)
- **Rate Limit**: 5000 requests/hour (Production), 50 requests/hour (Demo/Dev)

### External System: OpenAI API (Image Generation)
- **역할**: AI 이미지 생성 (DALL-E 3)
- **SSOT**: OpenAI가 생성된 이미지의 원본
- **통합**: AI SDK를 통한 API 호출
- **Cost**: 이미지당 과금

### External System: Google Imagen API
- **역할**: AI 이미지 생성 (Gemini 2.5 Flash Image)
- **SSOT**: Google이 생성된 이미지의 원본
- **통합**: AI SDK를 통한 API 호출
- **Cost**: 이미지당 과금

### External Domain: Block Management Domain
- **역할**: 이미지 블록 생성 및 속성 업데이트
- **연결점**: Image App Space에서 선택한 이미지를 블록에 적용
- **통합**: Server Action 호출 (updateBlockProperties)

### External Domain: User Management Domain
- **역할**: 사용자 프로필 및 인증 정보 제공
- **연결점**: 팔로우, 좋아요 등 소셜 기능
- **통합**: FK 참조 (public.profiles)

---

## 📍 Scenario 1: AI 이미지 생성 및 저장

### Sequence 1: 사용자가 프롬프트로 AI 이미지 생성

**Trigger Event**: Image App Space 대화상자 열림

```
👤 사용자: "프롬프트를 입력해서 AI로 이미지를 생성하고 싶어"
```

**Policy**: 
- "Whenever Image App Space 대화상자 열림, then always 프롬프트 입력 폼 표시하기"
- "Whenever 사용자가 프롬프트 입력, then 생성 버튼 활성화하기"

**Read Model** (시스템에서 사용자에게 제공하는 정보):
- 프롬프트 입력 필드
- 모델 선택 옵션 (OpenAI, Google)
- 고급 옵션 (aspectRatio, count, seed 등)
- 생성 버튼
- *UI Hint: 프롬프트 입력 폼*

**Command**: AI 이미지 생성 요청 (GenerateImageCommand)
- prompt: 사용자 입력 텍스트
- modelId: 'openai/gpt-image-1' | 'google/gemini-2.5-flash-image'
- negativePrompt?: 선택사항
- outputCount: 1-4
- aspectRatio?: '1:1' | '16:9' 등
- seed?: 정수값

**System**: Image Generation Service
- 비즈니스 로직: 
  - workspace 멤버 권한 검증
  - 프롬프트 필수 입력 검증
  - 모델별 파라미터 검증 (aspectRatio, outputCount 범위)
  - 출력 개수 제한 (모델별 maxOutputs)
- AI API 호출: OpenAI 또는 Google API 호출 (AI SDK)
- Storage 업로드: 생성된 이미지를 Supabase Storage에 업로드
- Embedding 생성: 프롬프트를 OpenAI embedding API로 벡터화 (1536차원)

**Events**:
1. AI 이미지가 생성되었다 (AI Image Generated)
2. AI 이미지가 Supabase Storage에 업로드되었다 (AI Image Uploaded)
3. 프롬프트 임베딩이 생성되었다 (Prompt Embedding Generated)

### Sequence 2: 생성된 이미지를 Image Asset으로 저장

**Trigger Event**: AI 이미지가 업로드되었다

**Policy**: Image Asset 생성 규칙
- "Whenever AI 이미지가 업로드되었다, then always Image Asset 레코드 생성하기"
- "기본 visibility는 private (workspace-scoped)"
- "생성자는 created_by로 자동 설정"

**Command**: Image Asset 생성 (CreateImageAssetCommand)
- image_url: Supabase Storage URL
- asset_type: 'ai-generated'
- prompt: 원본 프롬프트
- metadata: { modelId, seed, aspectRatio, ... }
- workspace_id: 현재 workspace
- created_by: 현재 사용자

**System**: Image Asset Manager
- 비즈니스 로직: Image Asset 레코드 생성, 통계 초기화
- DB 저장: image_assets 테이블에 INSERT
- 초기 통계: view_count=0, like_count=0, bookmark_count=0, use_count=0

**Events**:
1. 이미지 자산이 생성되었다 (Image Asset Created)

---

## 📍 Scenario 2: Unsplash 이미지 탐색 및 북마크

### Sequence 1: 사용자가 Unsplash 이미지 검색

**Trigger Event**: Unsplash 탭 선택

```
👤 사용자: "Unsplash에서 고품질 이미지를 검색하고 싶어"
```

**Policy**: 
- "Whenever Unsplash 탭 선택됨, then always 검색바 포커스하기"
- "Whenever 검색 키워드 입력됨, then Unsplash API 호출하기"

**Read Model**:
- 검색 키워드 입력 필드
- Unsplash 이미지 그리드 (썸네일)
- 이미지 메타데이터 (작가명, 크기, 좋아요 수)
- 페이지네이션
- *UI Hint: 검색바 + 그리드 레이아웃*

**Command**: Unsplash 검색 (SearchUnsplashCommand)
- query: 검색 키워드
- page: 페이지 번호
- per_page: 페이지당 개수

**System**: Unsplash Integration Service
- 비즈니스 로직:
  - 인증된 사용자 권한 검증
  - Rate Limit 초과 시 경고 표시 (5000/hour)
  - 검색 결과는 즉시 표시, DB에는 저장하지 않음
- API 호출: Unsplash REST API 호출
- Rate Limit 관리: 호출 횟수 추적 및 제한
- 결과 변환: Unsplash API 응답 → 내부 ImageAsset 형식

**Events**:
1. Unsplash 이미지가 검색되었다 (Unsplash Images Searched)

### Sequence 2: 사용자가 Unsplash 이미지 북마크

**Trigger Event**: 사용자가 이미지 북마크 버튼 클릭

```
👤 사용자: "마음에 드는 Unsplash 이미지를 저장하고 싶어"
```

**Policy**: Unsplash 북마크 규칙
- "북마크 시 image_assets에 저장"
- "Unsplash 다운로드 트래킹 API 호출 필수"
- "저작권 정보 필수 저장"

**Command**: Unsplash 이미지 북마크 (BookmarkUnsplashImageCommand)
- unsplash_photo_id: Unsplash 이미지 ID
- image_url: Unsplash URL
- metadata: { authorName, authorUsername, authorLink, ... }

**System**: Unsplash Bookmark Service
- 비즈니스 로직: 중복 북마크 방지, 저작권 정보 검증
- Unsplash API: 다운로드 트래킹 API 호출
- DB 저장: image_assets + image_bookmarks 생성

**Events**:
1. Unsplash 이미지 자산이 생성되었다 (Unsplash Image Asset Created)
2. 이미지가 북마크되었다 (Image Bookmarked)

---

## 📍 Scenario 3: 커뮤니티 피드 탐색 및 상호작용

### Sequence 1: 사용자가 공개 이미지 피드 탐색

**Trigger Event**: 커뮤니티 탭 선택

```
👤 사용자: "다른 사람들이 공유한 이미지를 보고 싶어"
```

**Policy**: 
- "Whenever 커뮤니티 탭 선택됨, then always 인기 이미지 피드 로드하기"
- "Whenever 정렬 옵션 변경됨, then 피드 재정렬하기"

**Read Model**:
- 공개 이미지 그리드
- 정렬 옵션 (인기순, 최신순, 조회순)
- 카테고리 필터
- 이미지 메타데이터 (작가, 통계, 태그)
- *UI Hint: 그리드 레이아웃 + 필터*

**Command**: 커뮤니티 피드 조회 (BrowseCommunityFeedCommand)
- sort: 'trending' | 'recent' | 'views'
- category?: 카테고리 필터
- page: 페이지 번호

**System**: Community Feed Service
- 비즈니스 로직:
  - is_public=true인 이미지만 표시
  - 인기순 정렬: (view_count + like_count * 2 + bookmark_count * 3)
  - 최근 30일 이미지 우선 표시
  - is_deleted=false 필터링
- 쿼리 최적화: 인덱스 활용 (idx_image_assets_public), 페이지네이션
- 통계 계산: popularity score 실시간 계산
- 필터링: 카테고리, 날짜 범위

**Events**:
1. 커뮤니티 이미지가 조회되었다 (Community Images Viewed)

### Sequence 2: 사용자가 이미지 좋아요

**Trigger Event**: 이미지 카드의 좋아요 버튼 클릭

**Policy**: 
- "Whenever 좋아요 버튼 클릭됨, then 좋아요 추가하기"
- "Whenever 이미지가 좋아요됨, then always like_count 증가하기"

**Command**: 이미지 좋아요 (LikeImageCommand)
- image_asset_id: 대상 이미지
- user_id: 현재 사용자 (자동)

**System**: Like Manager
- 비즈니스 로직:
  - 사용자당 이미지 1개에 좋아요 1회만 가능 (중복 방지)
  - 본인 이미지도 좋아요 가능
  - 이미 좋아요한 경우 취소 처리
- DB 트랜잭션: 
  - image_likes INSERT/DELETE
  - image_assets.like_count UPDATE (trigger로 자동)

**Events**:
1. 이미지가 좋아요되었다 (Image Liked)
2. 좋아요 수가 증가되었다 (Like Count Incremented)

### Sequence 3: 사용자가 크리에이터 팔로우

**Trigger Event**: 크리에이터 프로필 또는 이미지의 팔로우 버튼 클릭

**Policy**: 
- "Whenever 팔로우 버튼 클릭됨, then 팔로우 관계 생성하기"
- "Whenever 사용자가 팔로우됨, then 팔로잉 피드에 즉시 반영하기"

**Command**: 사용자 팔로우 (FollowUserCommand)
- followee_id: 팔로우할 사용자
- follower_id: 현재 사용자 (자동)

**System**: Follow Manager
- 비즈니스 로직:
  - 자기 자신 팔로우 불가 (CHECK 제약)
  - 중복 팔로우 방지 (PK 제약)
  - 이미 팔로우한 경우 언팔로우 처리
- DB 저장: user_follows 테이블에 INSERT/DELETE

**Events**:
1. 사용자가 팔로우되었다 (User Followed)

---

## 📍 Scenario 4: 이미지를 블록에 적용

### Sequence 1: App Space에서 이미지 선택 및 블록 적용

**Trigger Event**: 이미지 선택 후 "Apply" 버튼 클릭

```
👤 사용자: "App Space에서 찾은 이미지를 내 블록에 적용하고 싶어"
```

**Policy**: 
- "Whenever 이미지 선택 후 Apply 버튼 클릭됨, then 블록에 이미지 적용하기"
- "Whenever 이미지가 블록에 적용됨, then always usage 기록 생성하기"
- "Whenever usage 기록 생성됨, then always use_count 증가하기"

**Read Model**:
- 선택된 이미지 미리보기
- 적용할 블록 선택 (현재 블록 또는 새 블록)
- Apply 버튼
- *UI Hint: 선택 패널*

**Command**: 이미지를 블록에 적용 (ApplyImageToBlockCommand)
- image_asset_id: 선택한 이미지
- block_id: 대상 블록
- page_id: 현재 페이지

**System**: Image Application Service → Block-Management - Block Property Service
- 비즈니스 로직:
  - 자신이 권한 있는 블록에만 적용 가능 (pages.created_by 검증)
  - Private 이미지도 자신의 블록에는 적용 가능
  - 블록-이미지 중복 적용 허용 (덮어쓰기)
- Block Management 호출: updateBlockProperties({ imageUrl })
- DB 업데이트: 
  - image_asset_usage 생성 (UPSERT)
  - use_count 증가 (trigger 자동)

**Events**:
1. 이미지 사용 기록이 생성되었다 (Image Usage Recorded)
2. 이미지 사용 횟수가 증가되었다 (Use Count Incremented)
3. 블록 속성이 업데이트되었다 (Block Properties Updated)

---

## 📍 Scenario 5: 팔로잉 피드 조회

### Sequence 1: 사용자가 팔로잉한 크리에이터의 최신 이미지 조회

**Trigger Event**: "Following" 탭 선택

```
👤 사용자: "내가 팔로우한 사람들이 만든 최신 이미지를 보고 싶어"
```

**Policy**: 
- "Whenever Following 탭 선택됨, then always 팔로잉 피드 로드하기"
- "If 팔로우가 없음, then 추천 크리에이터 표시하기"

**Read Model**:
- 팔로잉 사용자의 최신 이미지 피드
- 크리에이터 프로필 정보
- 이미지 생성 일시
- 좋아요/북마크 상태
- *UI Hint: 타임라인 레이아웃*

**Command**: 팔로잉 피드 조회 (BrowseFollowingFeedCommand)
- page: 페이지 번호
- per_page: 페이지당 개수

**System**: Following Feed Service
- 비즈니스 로직:
  - 팔로우한 사용자의 public 이미지만 표시
  - 최신순 정렬 (created_at DESC)
  - 팔로우가 0명이면 추천 크리에이터 로직 실행
- 쿼리 로직: user_follows JOIN image_assets
- 필터링: is_public=true, is_deleted=false, created_by IN (following_user_ids)

**Events**:
1. 팔로잉 사용자의 이미지가 조회되었다 (Following Users' Images Viewed)

---

## 📍 Scenario 6: 이미지 메타데이터 편집

### Sequence 1: 사용자가 자신의 이미지 메타데이터 수정

**Trigger Event**: 이미지 설정 버튼 클릭

```
👤 사용자: "내가 생성한 이미지에 제목과 태그를 추가하고 싶어"
```

**Policy**: 
- "Whenever 이미지 설정 버튼 클릭됨, then always 메타데이터 편집 폼 표시하기"
- "Whenever 메타데이터 저장 버튼 클릭됨, then 메타데이터 업데이트하기"

**Read Model**:
- 현재 메타데이터 (제목, 설명, 태그, 카테고리)
- 카테고리 선택 옵션
- 태그 입력 필드
- 저장 버튼
- *UI Hint: 편집 폼 또는 모달*

**Command**: 이미지 메타데이터 업데이트 (UpdateImageMetadataCommand)
- image_asset_id: 대상 이미지
- title?: 제목
- description?: 설명
- tags?: 태그 배열
- category?: 카테고리

**System**: Image Metadata Manager
- 비즈니스 로직:
  - created_by인 사용자만 편집 가능 (권한 검증)
  - 제목, 설명, 태그, 카테고리 수정 가능
  - 태그는 최대 10개까지 (배열 길이 검증)
  - 카테고리는 enum 값만 허용
- DB 업데이트: image_assets 테이블 UPDATE (title, description, tags, category)

**Events**:
1. 이미지 제목이 설정되었다 (Image Title Set)
2. 이미지 태그가 추가되었다 (Image Tags Added)
3. 이미지 카테고리가 설정되었다 (Image Category Set)

---

## 📍 Scenario 7: 이미지 공개 설정 변경

### Sequence 1: 사용자가 이미지를 커뮤니티에 공개

**Trigger Event**: 공개 설정 토글 클릭

```
👤 사용자: "내 이미지를 커뮤니티에 공유하고 싶어"
```

**Policy**: 
- "Whenever 공개 설정 토글 클릭됨, then 공개 상태 변경하기"
- "If Public으로 변경 시도 & 제목 없음, then 제목 입력 프롬프트 표시하기"
- "Whenever Private으로 변경됨, then immediately 커뮤니티 노출 중단하기"

**Read Model**:
- 현재 공개 상태 (public/private)
- 공개 설정 토글
- 필수 메타데이터 입력 프롬프트 (제목, 카테고리)
- *UI Hint: 토글 스위치*

**Command**: 이미지 공개 설정 변경 (ChangeImageVisibilityCommand)
- image_asset_id: 대상 이미지
- is_public: true/false
- title?: Public일 때 필수
- category?: Public일 때 필수

**System**: Image Visibility Manager
- 비즈니스 로직:
  - created_by인 사용자만 변경 가능 (권한 검증)
  - Public 변경 시 제목/카테고리 필수 검증
  - Private 변경 시 즉시 커뮤니티 피드에서 제외
- DB 업데이트: is_public 플래그 업데이트 (boolean)

**Events**:
1. 이미지가 Public으로 설정되었다 (Image Set to Public)
2. 이미지가 Private으로 설정되었다 (Image Set to Private)

---

## 💡 핵심 Policy 정리

### AI 이미지 생성 관련
1. **Workspace 권한**: workspace 멤버만 생성 가능
2. **자동 업로드**: 생성 즉시 Supabase Storage 업로드
3. **Embedding 생성**: 프롬프트 자동 벡터화

### Unsplash 통합 관련
4. **지연 저장**: 북마크/좋아요 시에만 image_assets 저장
5. **다운로드 트래킹**: Unsplash API 필수 호출
6. **저작권 표시**: 메타데이터에 작가 정보 필수 저장

### 커뮤니티 상호작용
7. **Public Only**: is_public=true만 커뮤니티 노출
8. **중복 방지**: 사용자당 좋아요/북마크 1회
9. **통계 비정규화**: 트리거로 실시간 동기화

### 이미지 적용 및 추적
10. **Usage Tracking**: 블록 적용 시 자동 기록
11. **Use Count**: 적용 횟수 누적
12. **권한 기반**: 자신의 블록에만 적용 가능

---

## 🔧 기술 권장사항

### AI 이미지 생성
- **Streaming**: 생성 진행률 실시간 표시 (가능하면)
- **Error Handling**: API 실패 시 명확한 에러 메시지
- **Cost Tracking**: 생성 횟수 및 비용 모니터링

### Unsplash API
- **Rate Limit 관리**: 호출 횟수 추적 및 제한
- **Caching**: 검색 결과 캐싱 (5분)
- **Retry Logic**: API 실패 시 재시도 (3회)

### 커뮤니티 피드
- **Pagination**: 무한 스크롤 또는 페이지네이션
- **Query Optimization**: 적절한 인덱스 활용
- **Image Optimization**: 썸네일 사용, lazy loading

### 검색 및 필터링
- **Full-text Search**: PostgreSQL GIN 인덱스 (tags)
- **Vector Search**: pgvector + OpenAI embeddings (Post-MVP)
- **Caching**: 인기 검색어 결과 캐싱

### 통계 동기화
- **Database Triggers**: INSERT/DELETE 시 자동 count 업데이트
```sql
CREATE TRIGGER update_like_count_trigger
AFTER INSERT OR DELETE ON image_likes
FOR EACH ROW
EXECUTE FUNCTION update_image_like_count();
```

---

## 🚀 Next Steps

이제 Image App Space Domain의 Process Model이 완성되었습니다.

다음 단계:
1. **Software Design**: System을 Aggregate로 전환
2. **Repository Pattern**: Image Asset, Community Interaction 레포지토리
3. **Service Layer**: 비즈니스 로직 구현
4. **API Endpoints**: Server Actions 정의

---

## 📝 Process Model 워크샵 정보 (참고용)

**일시**: 2025-11-19 (문서 작성 세션)
**참가자**: 
- **도메인 전문가**: AI
- **시니어 개발자**: AI Assistant
- **Product Owner**: User (titanism)

**워크샵 결과물**:
- [x] 7개 핵심 시나리오 정의
- [x] Event → Policy → Read Model → Command → System → Event 일관 적용
- [x] External System 통합점 명확히 정의 (Unsplash, OpenAI, Google)
- [x] 비즈니스 규칙 구체화
- [x] Software Design 준비 완료

---

*이 Process Model 문서는 Image App Space Domain의 Software Design 작성을 위한 기반 자료입니다.*

