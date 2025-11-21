# Event Storming: Image App Space Domain

## 🎯 개요

**도메인**: Image App Space  
**작성자**: 도메인전문가 + Product Owner  
**작성일**: 2025-11-19  
**버전**: v1.0

**다음 단계**: `02-process-model.md`

---

## 📊 Domain Overview

**비즈니스 가치**: 
Image App Space는 이미지 블록을 중심으로 한 창작 커뮤니티 플랫폼입니다. 사용자가 AI로 이미지를 생성하고, Unsplash에서 이미지를 검색하며, 다른 사용자들과 이미지를 공유하고 소통할 수 있는 공간을 제공합니다. Block Management Domain에서 이미지 블록의 생성/수정을 담당한다면, Image App Space는 **이미지 자산의 탐색, 커뮤니티 상호작용, 컬렉션 관리**를 담당합니다.

**다른 도메인과의 관계**:
- **Block Management Domain**: 이미지 블록 생성 시 Image App Space의 자산을 사용
- **User Management Domain**: 팔로우, 좋아요 등 소셜 기능에서 사용자 프로필 참조
- **Workspace Management Domain**: 이미지 자산의 공개 범위(workspace-private vs public) 결정

---

## 📝 핵심 개념 정리

### Unsplash Integration Strategy
- **Unsplash Photo**: Unsplash API를 통해 검색된 이미지는 `image_assets`에 **즉시 저장하지 않음**
- **북마크/좋아요 시 저장**: 사용자가 Unsplash 이미지를 북마크하거나 좋아요할 때만 `image_assets`에 저장
- **Sync Method**: REST API 호출 (검색/다운로드 트래킹)

### Image Asset Lifecycle
```
Creation Sources:
├── AI Generated (OpenAI/Google Imagen)
├── Unsplash (Community Interaction 시 저장)
└── User Upload (직접 업로드)

Visibility:
├── Private (Workspace-scoped)
└── Public (Community 공개)

States:
├── Active (사용 가능)
└── Deleted (Soft Delete)
```

### Image App Space Scope
- **Image Assets**: AI 생성, Unsplash, 사용자 업로드 이미지 통합 관리
- **Community Features**: 좋아요, 북마크, 팔로우, 조회수
- **Discovery**: 카테고리, 태그, 시맨틱 검색(프롬프트 기반)
- **Usage Tracking**: 어떤 블록에서 이미지가 사용되는지 추적

### Business Rules
- **Public Visibility**: 이미지를 public으로 설정해야 커뮤니티에 노출
- **Attribution**: Unsplash 이미지는 저작권 정보 필수 표시
- **Usage Tracking**: 이미지 사용 시 `use_count` 증가, 트래킹 레코드 생성
- **Soft Delete**: 이미지 삭제 시 30일 보관 후 영구 삭제

---

## 🟠 Domain Events (시간 순서)

### 이미지 생성 및 획득
- AI 이미지가 생성되었다 (AI Image Generated)
- AI 이미지가 Supabase Storage에 업로드되었다 (AI Image Uploaded to Storage)
- 이미지 자산이 생성되었다 (Image Asset Created)
- Unsplash 이미지가 검색되었다 (Unsplash Image Searched)
- Unsplash 이미지가 북마크되었다 (Unsplash Image Bookmarked)
- Unsplash 이미지 자산이 생성되었다 (Unsplash Image Asset Created)
- 사용자 이미지가 업로드되었다 (User Image Uploaded)

### 이미지 메타데이터 관리
- 이미지 제목이 설정되었다 (Image Title Set)
- 이미지 태그가 추가되었다 (Image Tags Added)
- 이미지 카테고리가 설정되었다 (Image Category Set)
- 프롬프트 임베딩이 생성되었다 (Prompt Embedding Generated)

### 공개 설정 및 권한
- 이미지가 Public으로 설정되었다 (Image Set to Public)
- 이미지가 Private으로 설정되었다 (Image Set to Private)
- 이미지 공개 범위가 변경되었다 (Image Visibility Changed)

### 커뮤니티 상호작용
- 이미지가 조회되었다 (Image Viewed)
- 이미지가 좋아요되었다 (Image Liked)
- 이미지 좋아요가 취소되었다 (Image Unliked)
- 이미지가 북마크되었다 (Image Bookmarked)
- 이미지 북마크가 제거되었다 (Image Unbookmarked)
- 사용자가 팔로우되었다 (User Followed)
- 사용자 팔로우가 취소되었다 (User Unfollowed)

### 이미지 사용 및 추적
- 이미지 사용 기록이 생성되었다 (Image Usage Recorded)
- 이미지 사용 횟수가 증가되었다 (Image Use Count Incremented)
- 블록이 삭제되어 이미지 사용이 제거되었다 (Image Usage Removed)

### 탐색 및 검색
- 카테고리별 이미지가 조회되었다 (Images Browsed by Category)
- 태그로 이미지가 검색되었다 (Images Searched by Tag)
- 프롬프트로 이미지가 검색되었다 (Images Searched by Prompt - Semantic)
- 팔로잉 사용자의 이미지가 조회되었다 (Following Users' Images Viewed)
- 인기 이미지가 조회되었다 (Trending Images Viewed)

### 삭제 및 복구
- 이미지가 소프트 삭제되었다 (Image Soft Deleted)
- 이미지가 복구되었다 (Image Restored)
- 이미지가 영구 삭제되었다 (Image Permanently Deleted)

---

## 🔵 Commands & Actors

### 주요 커맨드 목록

#### Scenario 1: AI 이미지 생성 및 공유
- **사용자가 프롬프트 입력하고 이미지 생성 요청하기** (User) → AI Image Generation Requested
- **AI 서비스가 이미지 생성하기** (AI Service) → AI Image Generated
- **시스템이 Storage에 업로드하기** (System) → AI Image Uploaded
- **시스템이 Image Asset 생성하기** (System) → Image Asset Created
- **사용자가 제목/태그 추가하기** (User) → Image Title Set, Image Tags Added
- **사용자가 Public으로 공유하기** (User) → Image Set to Public

#### Scenario 2: Unsplash 이미지 탐색 및 북마크
- **사용자가 Unsplash 검색하기** (User) → Unsplash Image Searched
- **사용자가 이미지 북마크하기** (User) → Unsplash Image Bookmarked
- **시스템이 Unsplash Image Asset 생성하기** (System) → Unsplash Image Asset Created

#### Scenario 3: 커뮤니티 피드 탐색
- **사용자가 인기 이미지 보기** (User) → Trending Images Viewed
- **시스템이 조회수 기록하기** (System) → Image Viewed
- **사용자가 이미지 좋아요하기** (User) → Image Liked
- **시스템이 좋아요 수 증가시키기** (System) → Like Count Incremented
- **사용자가 크리에이터 팔로우하기** (User) → User Followed

#### Scenario 4: 이미지 블록에 적용
- **사용자가 App Space에서 이미지 선택하기** (User) → Image Selected
- **시스템이 이미지를 블록에 적용하기** (System) → Image Applied to Block
- **시스템이 사용 기록 생성하기** (System) → Image Usage Recorded

#### Scenario 5: 팔로잉 피드
- **사용자가 팔로잉 피드 보기** (User) → Following Users' Images Viewed
- **사용자가 크리에이터 프로필 방문하기** (User) → Creator Profile Viewed
- **사용자가 카테고리 필터링하기** (User) → Images Browsed by Category

### 식별된 액터 분류

#### Primary Actors (직접 사용자)
- **Image Creator**: AI 생성 또는 업로드를 통해 이미지를 생성하는 사용자
- **Image Consumer**: App Space에서 이미지를 탐색하고 블록에 적용하는 사용자
- **Community Member**: 좋아요, 북마크, 팔로우 등 소셜 활동을 하는 사용자

#### System Actors (내부 시스템)
- **AI Generation Service**: OpenAI/Google Imagen을 통한 이미지 생성
- **Storage Service**: Supabase Storage에 이미지 업로드 및 관리
- **Analytics Service**: 조회수, 사용 횟수 등 통계 집계
- **Search Service**: 시맨틱 검색 (pgvector 기반)
- **Recommendation Service**: 인기 이미지, 추천 알고리즘

#### External Systems (외부 도메인/서비스)
- **Unsplash API**: 이미지 검색 및 메타데이터 제공
- **Block Management Domain**: 이미지 블록 생성 및 속성 업데이트
- **User Management Domain**: 사용자 프로필, 팔로우 관계

---

## 🟠 Bounded Context 정의

### Image Asset Management Context (Main Context)
**책임**: 이미지 자산의 생명주기 관리 (생성, 메타데이터, 저장, 삭제)

**핵심 언어**: Image Asset, AI Generation, Unsplash Integration, Storage, Metadata, Prompt, Tags, Category

**핵심 용어 및 개념**:
- **Image Asset**: AI 생성, Unsplash, 사용자 업로드를 통합한 이미지 자산
- **Asset Type**: 'ai-generated', 'unsplash', 'user-upload'
- **Prompt**: AI 이미지 생성 시 사용된 프롬프트 (시맨틱 검색에 사용)
- **Prompt Embedding**: OpenAI embedding API로 생성된 벡터 (pgvector)
- **Metadata**: AI(modelId, seed 등) 또는 Unsplash(authorName 등) 메타데이터
- **Visibility**: public(커뮤니티 공개) 또는 private(workspace 범위)

**포함 이벤트**:
- 이미지 생성 및 획득 (8개 이벤트)
- 이미지 메타데이터 관리 (5개 이벤트)
- 공개 설정 및 권한 (3개 이벤트)
- 삭제 및 복구 (3개 이벤트)

---

### Community Interaction Context
**책임**: 커뮤니티 소셜 기능 (좋아요, 북마크, 팔로우, 조회수)

**핵심 언어**: Like, Bookmark, Follow, View Count, Trending, Community Feed

**핵심 용어 및 개념**:
- **Like**: 이미지에 대한 좋아요 (사용자당 1회)
- **Bookmark**: 이미지 찜하기 (개인 컬렉션)
- **Follow**: 크리에이터 팔로우 관계
- **View**: 이미지 조회 (익명/로그인 사용자)
- **Trending Score**: `view_count + like_count * 2 + bookmark_count * 3`

**포함 이벤트**:
- 커뮤니티 상호작용 (7개 이벤트)

---

### Discovery & Search Context
**책임**: 이미지 탐색, 검색, 추천

**핵심 언어**: Category, Tag, Semantic Search, Trending, Following Feed, Recommendation

**핵심 용어 및 개념**:
- **Category**: art, photo, illustration, design 등 10개 카테고리
- **Tag**: 사용자가 추가한 태그 (배열)
- **Semantic Search**: 프롬프트 임베딩 기반 유사 이미지 검색
- **Following Feed**: 팔로우한 사용자의 최신 이미지
- **Trending**: 가중치 기반 인기 이미지 (최근 30일)

**포함 이벤트**:
- 탐색 및 검색 (5개 이벤트)

---

### Usage Tracking Context
**책임**: 이미지가 어디에 사용되는지 추적

**핵심 언어**: Usage Record, Block Application, Use Count, Reference

**핵심 용어 및 개념**:
- **Usage Record**: 이미지가 사용된 블록/페이지 정보
- **Use Count**: 이미지가 블록에 적용된 누적 횟수
- **Block Reference**: 이미지를 사용하는 블록 목록

**포함 이벤트**:
- 이미지 사용 및 추적 (4개 이벤트)

---

## 🔗 Context 간 관계 및 통합점

### Image Asset Management ↔ Community Interaction
- **연결점**: 이미지 자산 생성 후 커뮤니티 상호작용 가능
- **데이터 흐름**: 
  - `[Image Asset Created]` → `[Image Set to Public]` → `[Image Liked/Bookmarked]`
  - `[Image Liked]` → `[Like Count Incremented in Image Asset]`
- **통합 방식**: 동기적 DB 업데이트 (비정규화된 통계)

### Discovery & Search ↔ Image Asset Management
- **연결점**: 메타데이터 기반 검색 및 탐색
- **데이터 흐름**: 
  - `[Image Tags Added]` → `[Tag-based Search Available]`
  - `[Prompt Embedding Generated]` → `[Semantic Search Available]`
- **통합 방식**: 인덱스 기반 쿼리 (GIN, pgvector)

### Usage Tracking ↔ Block Management Domain (외부)
- **연결점**: 이미지를 블록에 적용할 때
- **데이터 흐름**: 
  - `[User selects image from App Space]` → `[Block properties updated]`
  - `[Block created/updated]` → `[Image Usage Recorded]`
- **통합 방식**: Server Action 호출 (동기)

### Image Asset Management → Unsplash API (외부 서비스)
- **연결점**: 이미지 검색 및 다운로드 트래킹
- **데이터 흐름**: 
  - `[User searches Unsplash]` → `[Unsplash API Call]` → `[Results returned]`
  - `[User bookmarks Unsplash image]` → `[Download tracking API call]`
- **통합 방식**: REST API 호출 (비동기)

### Community Interaction ↔ User Management Domain (외부)
- **연결점**: 팔로우 관계 및 프로필 정보
- **데이터 흐름**: 
  - `[User Followed]` → `[Follow relationship created]`
  - `[Following Feed Viewed]` → `[Query user_follows table]`
- **통합 방식**: FK 참조 (public.profiles)

---

## 🔴 Hotspots (문제점/병목)

### 우선순위: 높음
1. **Unsplash 이미지 저장 시점 모호성**
   - 문제: Unsplash 이미지를 언제 `image_assets`에 저장할지 명확하지 않음
   - 영향: 불필요한 저장 또는 누락된 메타데이터
   - 해결: "북마크/좋아요 시에만 저장" 정책 명확화 완료

2. **Prompt Embedding 생성 타이밍**
   - 문제: AI 이미지 생성 직후 즉시 생성 vs 비동기 큐
   - 영향: 이미지 생성 응답 시간 증가 가능
   - 해결: 초기에는 동기 생성, 성능 이슈 시 비동기로 변경

### 우선순위: 중간
3. **통계 비정규화 동기화**
   - 문제: `like_count`, `view_count` 등이 실제 테이블과 맞지 않을 수 있음
   - 영향: 정확도 저하
   - 해결: 트리거로 동기화

4. **대용량 이미지 검색 성능**
   - 문제: Public 이미지가 많아지면 검색 느려질 수 있음
   - 영향: 사용자 경험 저하
   - 해결: 적절한 인덱스 + 페이지네이션 + 캐싱

### 우선순위: 낮음
5. **Unsplash API Rate Limit**
   - 문제: Unsplash API 호출 제한 (5000/hour)
   - 영향: 대규모 사용 시 제한 도달
   - 해결: 캐싱 + 제한 알림

---

## 💡 Opportunities (개선 기회)

### 즉시 구현 (MVP 필수)
1. **간단한 탐색 UI**
   - 기회: 카테고리별 필터링만으로도 충분한 UX
   - 구현: 드롭다운 + 그리드 뷰

2. **기본 통계 표시**
   - 기회: 조회수, 좋아요 수만 보여줘도 참여 유도
   - 구현: 비정규화된 count 필드 표시

### 향후 구현 (Post-MVP)
3. **추천 알고리즘** *(메모)*
   - 팔로우한 사용자 기반 추천
   - 유사 프롬프트 기반 추천
   - 개인화된 카테고리 추천

4. **고급 컬렉션 기능** *(메모)*
   - 북마크를 폴더로 그룹화
   - 컬렉션 공유 및 협업

---

## ❓ Process Modeling을 위한 주요 질문들

### 1. AI 이미지 생성 프로세스
- Q: 이미지 생성 실패 시 재시도 로직은?
- Q: 동시에 여러 이미지 생성 요청 처리는?
- Q: Prompt embedding 생성 실패 시 fallback은?

### 2. Unsplash 통합 (핵심)
- Q: Unsplash 이미지 다운로드 트래킹 시점은 언제?
- Q: Unsplash API 실패 시 UX 처리는?
- Q: 저작권 정보 표시 규칙은?

### 3. 커뮤니티 피드 및 성능
- Q: 팔로잉 피드는 실시간 쿼리 vs 캐시?
- Q: Trending 알고리즘 업데이트 주기는?
- Q: 조회수 중복 방지 로직은? (같은 사용자의 반복 조회)

### 4. Block Management 통합
- Q: App Space에서 이미지 선택 → 블록 업데이트 플로우는?
- Q: 블록 삭제 시 image_assets도 삭제?
- Q: 블록에 적용된 이미지 변경 시 usage 업데이트는?

---

## 📝 Process Model 준비 상태

Image App Space Domain의 핵심 이벤트와 문제점들이 정리되었으므로, 다음 단계로:

1. **Command** 식별: 각 이벤트를 트리거하는 사용자 액션
2. **Policy** 정의: Unsplash 저장 규칙, Public 전환 제약사항
3. **Read Model** 명시: 피드 조회, 검색에 필요한 정보
4. **External System**: Unsplash API 호출, Block Management 연동

---

## 📋 Event Storming 워크샵 정보 (참고용)

**일시**: 2025-01-18 (문서 작성 세션)
**참가자**: 
- **도메인 전문가**: AI
- **Product Owner**: User (titanism)
- **시니어 개발자**: AI Assistant

**워크샵 결과물**:
- [x] 도메인 이벤트 목록 완성 (35+ 이벤트)
- [x] 커맨드 및 액터 식별 완료
- [x] Bounded Context 경계 정의 완료 (4개 Context)
- [x] 핵심 Hotspot 및 Opportunity 정리 완료
- [x] Process Modeling을 위한 질문 정리 완료

---

## 🔗 연관 도메인

### Block Management Domain과의 관계
- **연결점**: 이미지 블록 생성 및 속성 업데이트
- **이벤트 흐름**: Image App Space → Block Management
- **통합 방식**: Server Action 호출 (updateBlockProperties)

### User Management Domain과의 관계
- **연결점**: 팔로우, 좋아요 등 소셜 기능
- **이벤트 흐름**: User Management ← Image App Space
- **통합 방식**: FK 참조 (profiles 테이블)

### Workspace Management Domain과의 관계
- **연결점**: 이미지 공개 범위 (workspace-scoped)
- **이벤트 흐름**: Workspace Management → Image App Space
- **통합 방식**: FK 참조 (workspaces 테이블)

---

*이 Event Storming 문서는 Image App Space Domain의 Process Model 작성을 위한 기반 자료입니다.*

