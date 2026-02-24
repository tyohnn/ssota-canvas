# SSOTA Image Space App 기획안

> SSOTA Image(Image Space)는 이미지·프롬프트 라이브러리, 이미지 생성, 이미지/프롬프트 검색, 이미지 편집을 하나의 앱으로 제공하는 1st-party 앱이다. 커뮤니티(추천·팔로우)와 캔버스 물질화를 지원한다.

---

## 목차

1. [앱 개요](#1-앱-개요)
2. [핵심 설계 원칙](#2-핵심-설계-원칙)
3. [기능 모듈](#3-기능-모듈)
4. [앱 모달 UI](#4-앱-모달-ui)
5. [전용 블록 타입: prompt_library_card](#5-전용-블록-타입-prompt_library_card)
6. [개방형 블록: image](#6-개방형-블록-image)
7. [App Tools](#7-app-tools)
8. [Block Context Actions](#8-block-context-actions)
9. [Image Space — 데이터 소유권](#9-image-space--데이터-소유권)
10. [물질화 흐름](#10-물질화-흐름)
11. [데이터 모델](#11-데이터-모델)
12. [유저 시나리오](#12-유저-시나리오)

---

## 1. 앱 개요

| 항목 | 값 |
|------|-----|
| **앱 이름** | SSOTA Image (Image Space) |
| **슬러그** | `ssota-image` |
| **분류** | 1st-party (설치 필요) |
| **설치 단위** | 워크스페이스 (기본) |
| **정의하는 블록 타입** | `image` (openType: true), `prompt_library_card` (openType: false) |
| **생산 가능한 블록** | `image`, `prompt_library_card` |
| **역할** | Type Definer (image + 전용 블록) + Producer |

### 한 앱에 묶이는 기능

이미지 생성과 프롬프트 라이브러리는 분리하기 어려운 영역이므로, 다음 기능을 **한 앱(Image Space)** 에서 제공한다. 구현은 모듈/탭으로 나누어 확장성을 확보한다.

| 모듈 | 설명 |
|------|------|
| **라이브러리** | 프롬프트+이미지 그리드, 추천·팔로우, 캔버스에 올리기, "이 프롬프트로 생성" |
| **생성** | 프롬프트 입력 → 이미지 생성 → 결과를 라이브러리 저장 옵션 / 캔버스에 올리기 |
| **검색** | 이미지 검색, 프롬프트 검색 → 결과를 라이브러리·캔버스로 |
| **편집** | 이미지 블록에 대한 배경 제거, 리사이즈 등 (Block Tool 또는 앱 내 편집) |

---

## 2. 핵심 설계 원칙

### 2.1 Image Space = 앱의 단일 데이터 공간

앱이 다루는 모든 데이터(라이브러리 엔트리, 추천, 팔로우, 생성 히스토리 등)는 **Image Space 전용 DB 스키마**에서 관리한다. 캔버스 블록은 "캔버스에 올리기"로 **물질화된 결과만** 가지며, "내가 저장한 프롬프트 전체", "팔로우한 제작자 작품" 같은 목록은 블록이 아니라 Image Space에서 조회한다.

### 2.2 추천·팔로우는 앱 전체·유저 기준

추천(좋아요)과 팔로우는 **워크스페이스와 무관**하게 **앱 전체 단위**이며 **유저(계정)** 가 기준이다. 같은 유저가 어떤 워크스페이스에서 앱을 쓰든, 추천·팔로우 데이터는 동일하다.

### 2.3 구현은 모듈로 분리

제품은 "SSOTA Image 한 앱"이지만, 코드/패키지는 라이브러리·생성·검색·편집 등 **모듈별로 분리**하여 유지보수와 단계적 롤아웃이 가능하도록 한다.

---

## 3. 기능 모듈

### 3.1 라이브러리

- 프롬프트 + 결과 이미지를 **메인 소리(masonry) 그리드**로 표시
- 엔트리별: 추천(좋아요), "캔버스에 올리기", "이 프롬프트로 생성", 프롬프트 복사
- 제작자(유저) 단위 **팔로우**
- **캔버스에 올리기** 시: `prompt_library_card` 블록 또는 `image` 블록으로 물질화 선택 가능

### 3.2 생성

- 프롬프트 입력 → 이미지 생성 API 호출 → 결과 표시
- 결과를 라이브러리에 저장(업로드) 옵션, 또는 캔버스에 바로 올리기
- 생성된 이미지는 `image` 블록으로 물질화, `created_by_app_id = ssota-image`

### 3.3 검색

- **이미지 검색**: 시각/키워드 기반 검색 → 결과를 라이브러리·캔버스로
- **프롬프트 검색**: 텍스트 검색 → 동일

### 3.4 편집

- 이미지 블록에 대한 **Block Tool**: 배경 제거, 리사이즈 등
- 또는 앱 모달 내 "편집" 플로우에서 이미지 수정 후 캔버스/라이브러리로 저장

---

## 4. 앱 모달 UI

### 4.1 메인 구조 (탭/섹션)

```
┌────────────────────────────────────────────────────────┐
│  🖼️ SSOTA Image                                 [×]   │
├────────────────────────────────────────────────────────┤
│  [라이브러리] [생성] [검색] [편집]     ← 상단 탭        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  (선택된 탭에 따른 메인 영역)                            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 4.2 라이브러리 탭

- **그리드**: 프롬프트+이미지 카드 메인 소리 배치
- **필터**: 추천순, 최신순, 팔로우한 제작자만 등
- **카드 액션**: 추천, 캔버스에 올리기, 이 프롬프트로 생성, 프롬프트 복사
- **업로드**: "라이브러리에 업로드" (이미지+프롬프트 입력)

### 4.3 생성 탭

- 프롬프트 입력란, 옵션(스타일·비율 등)
- "생성" → 결과 미리보기 → "라이브러리에 저장" / "캔버스에 올리기"

### 4.4 검색 탭

- 이미지 검색 / 프롬프트 검색 전환
- 검색 결과 그리드 → 라이브러리 저장 또는 캔버스에 올리기

### 4.5 편집 탭 (또는 이미지 블록 Block Tool)

- 배경 제거, 리사이즈, 크롭 등
- 결과를 image 블록으로 갱신 또는 새 image 블록으로 캔버스에 추가

---

## 5. 전용 블록 타입: prompt_library_card

프롬프트와 이미지를 한 덩어리로 다루기 위한 **전용 블록 타입**이다. SSOTA Image 앱만 정의·생산한다.

### 5.1 블록 뷰

- 카드 형태: 이미지 + 프롬프트 요약(또는 툴팁)
- 썸네일 클릭 시 확대 또는 에디터 열기

### 5.2 에디터 탭

- **프롬프트 탭**: 전체 프롬프트 텍스트 표시, 복사 버튼
- (선택) **정보 탭**: 제작자, 업로드일, 추천 수 등

### 5.3 Block Tools

| 도구 | 설명 |
|------|------|
| `copyPrompt` | 프롬프트 클립보드 복사 |
| `generateWithPrompt` | 이 프롬프트로 이미지 생성 (앱 생성 플로우 호출) |
| `extractAsImage` | 이미지만 추출하여 `image` 블록으로 물질화 (카드 → 이미지 블록) |

### 5.4 Properties 스키마 (요약)

```typescript
interface PromptLibraryCardProperties {
  prompt: string;              // 전체 프롬프트 텍스트
  imageUrl: string;            // 이미지 URL
  authorUserId?: string;       // 제작자 (표시용)
  authorDisplayName?: string;
  libraryEntryId: string;      // Image Space 엔트리 ID (참조)
  recommendedCount?: number;   // 추천 수 (스냅샷)
  createdAt: string;            // 업로드일
}
```

---

## 6. 개방형 블록: image

SSOTA Image 앱은 **image 블록 타입의 Definer**이다 (Architecture.md). 동시에 이 앱이 **생성·라이브러리·검색 결과**를 image 블록으로 물질화할 때 Producer가 된다.

- **캔버스에 올리기(이미지만)**: 라이브러리 엔트리 또는 생성 결과 → `image` 블록 생성, `created_by_app_id = ssota-image`
- **image 블록의 Block Tool**: 이미지 편집, 배경 제거, 리사이즈 등 (기존 Image App 정의 유지)

---

## 7. App Tools

에이전트가 `executeAppTool`로 호출할 수 있는 앱 수준 도구.

| App Tool | 설명 |
|----------|------|
| `imageGenerate` | 프롬프트로 이미지 생성 → image 블록 또는 라이브러리 엔트리로 저장 |
| `promptSearch` | 프롬프트 텍스트 검색 → 결과 목록 반환 또는 캔버스에 배치 |
| `imageSearch` | 이미지 검색(키워드/시각) → 결과 목록 반환 또는 캔버스에 배치 |
| `saveToLibrary` | 이미지 URL + 프롬프트를 라이브러리 엔트리로 저장 (Block Context Action에서 사용) |
| `getLibraryEntry` | 라이브러리 엔트리 조회 (에이전트용) |

---

## 8. Block Context Actions

다른 블록 타입의 컨텍스트 메뉴에 주입하는 액션.

### 8.1 이미지 블록 → "프롬프트 라이브러리에 업로드"

```typescript
{
  targetBlockType: "image",
  label: "프롬프트 라이브러리에 업로드",
  icon: "upload",
  appToolName: "saveToLibrary",
  paramMapping: {
    imageUrl: "properties.src",
    prompt: "properties.caption"  // 또는 content 중 프롬프트 필드
  }
}
```

- 유저가 이미지 블록 우클릭 → "프롬프트 라이브러리에 업로드" 선택
- 앱 모달 또는 인라인 폼에서 프롬프트 입력 후 저장
- Image Space에 엔트리 생성 (이미지 URL + 프롬프트, 업로더 = 현재 유저)

---

## 9. Image Space — 데이터 소유권

### 9.1 Image Space 스키마 (앱 전용)

- **라이브러리 엔트리**: prompt, imageUrl, authorUserId, createdAt, updatedAt
- **추천**: 엔트리별 좋아요 (유저 ID ↔ 엔트리 ID), 앱 전체·유저 기준
- **팔로우**: 유저 ↔ 제작자(유저), 앱 전체·유저 기준
- **컬렉션/저장 목록**: (선택) 유저별 "저장한 엔트리" 목록

### 9.2 블록과의 관계

| 구분 | 소스 | 설명 |
|------|------|------|
| **라이브러리 목록, 추천·팔로우** | Image Space 스키마 | 앱 모달의 그리드·필터는 전부 여기서 조회 |
| **물질화된 블록** | 캔버스(blocks) | "캔버스에 올리기"한 것만. `created_by_app_id`는 출처 메타데이터용 |

블록 기반 조회만으로는 "아직 캔버스에 올리지 않은" 라이브러리 엔트리를 담을 수 없으므로, **전체 목록·추천·팔로우는 Image Space가 단일 소스**이다.

---

## 10. 물질화 흐름

### 10.1 라이브러리 → 캔버스

```
[라이브러리 탭에서 엔트리 선택]
     │
     ▼  "캔버스에 올리기" 선택
     │
     ├── [prompt_library_card로 올리기]
     │   └── 전용 블록 생성 (프롬프트 탭으로 프롬프트 확인 가능)
     │
     └── [이미지만 올리기]
         └── image 블록 생성, created_by_app_id = ssota-image
```

### 10.2 생성 결과 → 캔버스 / 라이브러리

```
[생성 탭에서 이미지 생성]
     │
     ▼  "캔버스에 올리기" 또는 "라이브러리에 저장"
     │
     ├── 캔버스에 올리기 → image 블록 생성
     └── 라이브러리에 저장 → Image Space 엔트리 생성 (이후 그리드에서 캔버스에 올리기 가능)
```

### 10.3 이미지 블록 → 라이브러리

```
[캔버스의 image 블록 우클릭]
     │
     ▼  "프롬프트 라이브러리에 업로드" (Block Context Action)
     │
     ▼  프롬프트 입력 (모달/인라인)
     │
     ▼  saveToLibrary App Tool 실행
     │
     └── Image Space에 엔트리 생성 (imageUrl + prompt, 현재 유저가 제작자)
```

---

## 11. 데이터 모델

### 11.1 AppDefinition (요약)

```typescript
const SSotaImageSpaceApp: AppDefinition = {
  id: 'ssota-image',
  name: 'SSOTA Image',
  slug: 'ssota-image',
  description: '이미지·프롬프트 라이브러리, 생성, 검색, 편집을 하나의 Image Space에서 제공',
  category: 'first-party',

  blockTypeDefinitions: [
    // image (openType: true) — 기존 Definer 역할 유지
    { typeName: 'image', displayName: '이미지', openType: true, ... },
    // prompt_library_card (openType: false) — 전용
    {
      typeName: 'prompt_library_card',
      displayName: '프롬프트 라이브러리 카드',
      openType: false,
      blockTools: ['copyPrompt', 'generateWithPrompt', 'extractAsImage'],
      ...
    },
  ],

  producibleBlockTypes: ['image', 'prompt_library_card'],

  appTools: [
    { name: 'imageGenerate', ... },
    { name: 'promptSearch', ... },
    { name: 'imageSearch', ... },
    { name: 'saveToLibrary', ... },
    { name: 'getLibraryEntry', ... },
  ],

  blockContextActions: [
    {
      targetBlockType: 'image',
      label: '프롬프트 라이브러리에 업로드',
      appToolName: 'saveToLibrary',
      paramMapping: { imageUrl: 'properties.src', prompt: 'properties.caption' },
    },
  ],

  rendererInfo: { componentPath: '...' },
};
```

### 11.2 Image Space 스키마 (엔트리·추천·팔로우)

- **library_entries**: id, workspaceId(?), authorUserId, prompt, imageUrl, createdAt, updatedAt
- **entry_recommendations**: userId, entryId (앱 전체·유저 기준)
- **follows**: followerUserId, followeeUserId (앱 전체·유저 기준)

(워크스페이스는 "이 워크스페이스에서 앱 사용" 권한에만 쓰고, 추천·팔로우 데이터는 워크스페이스와 무관하게 유저 단위로 관리.)

---

## 12. 유저 시나리오

### 시나리오 A: 라이브러리에서 캔버스에 올리기

1. SSOTA Image 앱 모달 → 라이브러리 탭
2. 그리드에서 카드 선택 → "캔버스에 올리기" → prompt_library_card 또는 image 선택
3. 캔버스에 해당 블록 생성, 엣지 연결(선택)

### 시나리오 B: 생성 후 라이브러리 저장

1. 생성 탭에서 프롬프트 입력 → 생성
2. "라이브러리에 저장" 선택 → 프롬프트/메타 확인 후 저장
3. 라이브러리 탭 그리드에 노출, 이후 캔버스에 올리기 가능

### 시나리오 C: 이미지 블록을 라이브러리에 업로드

1. 캔버스의 image 블록 우클릭 → "프롬프트 라이브러리에 업로드"
2. 프롬프트 입력 (및 선택 메타) → 저장
3. Image Space에 엔트리 생성, 라이브러리 그리드에 표시

### 시나리오 D: 에이전트가 프롬프트로 이미지 생성

1. 유저: "고양이 wearing a hat 이미지 만들어줘"
2. Sophie → executeAppTool("ssota-image", "imageGenerate", { prompt: "..." })
3. 결과 image 블록을 캔버스에 배치

---

## 참고

- 앱 시스템 전반: [Architecture.md](./Architecture.md)
- Block Context Action: Architecture.md §6.6
- Tab Data = Properties: Architecture.md §6.7
- Crawl App 데이터 소유권 패턴: [SSOTA-Crawl-App.md](./SSOTA-Crawl-App.md) §6
