# SSOTA Link App 기획안

> SSOTA Link App은 단일 URL을 캔버스 위에 물질화하고, 해당 URL의 콘텐츠를 다양한 방식으로 추출/조회할 수 있는 Built-in App이다.

---

## 목차

1. [앱 개요](#1-앱-개요)
2. [블록 타입 정의](#2-블록-타입-정의)
3. [블록 UI](#3-블록-ui)
4. [에디터 탭 UI](#4-에디터-탭-ui)
5. [Block Tools](#5-block-tools)
6. [자동 인덱싱](#6-자동-인덱싱)
7. [캔버스에 올리기](#7-캔버스에-올리기)
8. [Properties 스키마](#8-properties-스키마)
9. [다른 앱과의 상호작용](#9-다른-앱과의-상호작용)

---

## 1. 앱 개요

| 항목 | 값 |
|------|-----|
| **앱 이름** | SSOTA Link App |
| **슬러그** | `ssota-link` |
| **분류** | Built-in (항상 사용 가능) |
| **정의하는 블록 타입** | `link` (openType: true) |
| **역할** | Type Definer + Producer |

### 핵심 철학

링크 블록은 **단일 URL의 물질화**이다. 하나의 URL에 대해 할 수 있는 모든 것을 블록 안에서 제공한다.

- 블록 뷰: 오픈그래프 카드로 URL을 시각화
- 에디터 탭: URL에서 추출한 다양한 데이터를 탭별로 정리
- Block Tool: URL에 대해 수행할 수 있는 작업 (스크래핑, 스크린샷 등)

**링크 블록은 "깊이"의 도구이다.** 하나의 URL을 깊이 파고든다. 여러 URL을 탐색하거나 사이트 전체를 크롤링하는 것은 쏘타 크롤 앱의 역할이다.

---

## 2. 블록 타입 정의

```
SSOTA Link App:
├── Block Type Definitions:
│   └── link (openType: true)
│       ├── propertiesSchema: §8 참조
│       ├── blockTools: §5 참조
│       ├── isEditable: false (properties는 UI 직접 편집 불가, properties·Block Tool로만 변경. 본문(content)은 항상 수정 가능.)
│       ├── defaultViewMode: 'card'
│       ├── supportedViewModes: ['card', 'compact', 'expanded']
│       └── sourceCapability:
│           ├── sourceType: "link"
│           ├── extractable: true
│           └── summarizable: true
├── Producible Block Types: ["link"]
├── App Tools: [] (없음 — Block Tool로 충분)
└── UI Renderer: LinkBlockComponent
```

### 개방형 블록 타입

`link`는 **개방형(open) 블록 타입**이다. 다른 앱도 link 블록을 생산할 수 있다:

| Producer 앱 | 시나리오 |
|---|---|
| 쏘타 크롤 앱 | 크롤링 결과로 발견된 URL마다 link 블록 생성 |
| 에이전트 (Sophie) | 웹 검색 결과를 link 블록으로 물질화 |
| 사용자 | URL 직접 입력 또는 브라우저에서 드래그 |

모든 link 블록은 동일한 propertiesSchema, Block Tool, UI를 공유한다. Producer만 다를 뿐이다.

---

## 3. 블록 UI

### 기본 뷰: 오픈그래프 카드

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │           OG Image               │ │
│ │         (og:image URL)           │ │
│ └──────────────────────────────────┘ │
│                                      │
│  OG Title                            │
│  og:description 텍스트 (최대 2줄)     │
│                                      │
│  🔗 example.com                      │
│                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │요약│ │캡처│ │이미지│ │JSON│  ...  │ ← 블록 하단 툴바
│  └────┘ └────┘ └────┘ └────┘       │
└──────────────────────────────────────┘
```

### 뷰 모드

| 모드 | 설명 |
|------|------|
| `card` (기본) | 오픈그래프 카드. OG 이미지 + 제목 + 설명 + 도메인 |
| `compact` | 도메인 아이콘 + 제목만 표시. 공간 절약형 |
| `expanded` | 카드 + 추출 탭 데이터 미리보기. 정보 밀도 높음 |

---

## 4. 에디터 탭 UI

링크 블록의 에디터(블록 클릭 시 열리는 사이드 패널)는 탭 기반으로 구성된다.

### 탭 구성

| 탭 | 채워지는 시점 | 설명 |
|----|-------------|------|
| **요약** | 자동 (블록 생성 시) | 언어별 요약. 한국어/영어 등 선택 가능 |
| **추출** | 자동 (블록 생성 시) | firecrawl로 추출한 마크다운 원문 |
| **스크린샷** | 온디맨드 (Block Tool) | 페이지 스크린샷 이미지 |
| **이미지** | 온디맨드 (Block Tool) | 페이지 내 전체 이미지 추출 및 갤러리 |
| **디자인** | 온디맨드 (Block Tool) | 메타데이터, 색상, 폰트 등 디자인 요소 |
| **JSON** | 온디맨드 (Block Tool) | 사용자 정의 스키마에 맞춘 구조화 데이터 추출 |

### 탭 활성화 규칙

- **자동 탭** (요약, 추출): 블록 생성 시 자동 인덱싱으로 데이터가 채워진다. 항상 활성 상태.
- **온디맨드 탭** (스크린샷, 이미지, 디자인, JSON): 유저가 Block Tool을 실행해야 데이터가 채워진다. 데이터가 없으면 비활성(또는 "아직 데이터 없음. 도구를 실행하세요" 안내 표시). 탭은 선택 가능

### 탭 데이터 저장 원칙

> **Tab Data = Properties** (Architecture.md §6.7 참조)

모든 탭 데이터는 블록의 `properties.tabs`에 저장된다. 이미지 등은 스토리지 URL 참조만 저장하므로 용량 문제가 없다.

---

## 5. Block Tools

블록 하단 툴바 및 에이전트가 `executeBlockTool`로 실행할 수 있는 도구 목록.

### 5.1 요약 (summarize)

```typescript
{
  name: "summarize",
  description: "URL 콘텐츠를 지정 언어로 요약",
  inputSchema: {
    language: { type: "string", enum: ["ko", "en", "ja", "zh"], default: "ko" }
  },
  executionSide: "server"
}
```

- 이미 추출된 마크다운(`properties.tabs.extract.markdown`)을 기반으로 요약 생성
- 결과: `properties.tabs.summary[language]`에 저장
- 여러 언어로 중복 실행 가능 (언어별로 누적)

### 5.2 스크린샷 (screenshot)

```typescript
{
  name: "screenshot",
  description: "URL 페이지의 스크린샷 캡처",
  inputSchema: {
    fullPage: { type: "boolean", default: false }
  },
  executionSide: "server"
}
```

- firecrawl의 스크린샷 기능 사용
- 결과 이미지를 스토리지에 업로드 후 URL을 `properties.tabs.screenshot`에 저장

### 5.3 이미지 추출 (extractImages)

```typescript
{
  name: "extractImages",
  description: "페이지 내 전체 이미지 URL 추출",
  inputSchema: {},
  executionSide: "server"
}
```

- firecrawl의 스크린샷 기능 사용
- 결과 이미지를 스토리지에 업로드 후 URL을 `properties.tabs.images[]`에 저장

### 5.4 디자인 추출 (extractDesign)

```typescript
{
  name: "extractDesign",
  description: "페이지의 디자인 메타데이터(색상, 폰트, 메타데이터) 추출",
  inputSchema: {},
  executionSide: "server"
}
```

- firecrawl의 스크린샷 기능 사용
- 결과 이미지를 스토리지에 업로드 후 URL을 `properties.tabs.design`에 저장

### 5.5 JSON 추출 (extractJSON)

```typescript
{
  name: "extractJSON",
  description: "사용자 정의 스키마에 맞춰 페이지 콘텐츠를 구조화 추출",
  inputSchema: {
    schema: { type: "object", description: "추출할 데이터의 JSON Schema" }
  },
  executionSide: "server"
}
```

- firecrawl의 structured extraction 기능 사용
- 결과: `properties.tabs.json`에 저장

---

## 6. 자동 인덱싱

### 실행 흐름

```
[링크 블록 생성]
     │
     ▼
[Source 도메인에서 자동 인덱싱 트리거]
     │
     ├── 1. firecrawl API로 마크다운 추출
     │   └── 결과 → properties.tabs.extract.markdown
     │
     └── 2. 추출된 마크다운으로 요약 생성 (쏘타 자체 요약 로직)
         └── 결과 → properties.tabs.summary.ko (기본 한국어)
```

### 실행 주체

- **Source 도메인**의 서비스가 자동 인덱싱을 수행한다
- Block Tool의 `summarize`, `extractMarkdown`과 **동일한 서비스**를 사용한다
- 차이는 실행 시점뿐:
  - 자동 인덱싱: 블록 생성 시 시스템이 자동 실행
  - Block Tool: 유저가 명시적으로 요청 시 실행 (또는 에이전트가 호출)

### Source 도메인과의 관계

```
블록 생성 → Source 도메인 인덱싱 서비스 호출
                │
                ├── firecrawl 추출 서비스 (공유)  ← Block Tool "scrape"와 동일
                └── 요약 생성 서비스 (공유)       ← Block Tool "summarize"와 동일
                │
                └── 결과를 블록 properties에 저장
```

---

## 7. 캔버스에 올리기

탭 데이터를 독립 블록으로 물질화하는 기능이다. 에디터 탭 UI의 각 탭에 "캔버스에 올리기" 버튼이 있다.

### 물질화 규칙

| 탭 | 생성되는 블록 타입 | 설명 |
|----|------------------|------|
| 요약 | `markdown` 블록 | 요약 텍스트가 content에 들어감 |
| 추출 | `markdown` 블록 | 추출된 마크다운 원문이 content에 들어감 |
| 스크린샷 | `image` 블록 | 스크린샷 URL이 properties.src에 들어감 |
| 이미지 (개별) | `image` 블록 | 선택한 이미지 URL이 properties.src에 들어감 |
| 이미지 (전체) | `group` 블록 (내부에 image 블록들) | 이미지 갤러리 그룹 |
| 디자인 | `design_preview` 블록 (디자인 시스템 뷰어 앱의 전용 블록) | 색상 팔레트, 폰트, 메타데이터를 시각적으로 표현. 해당 앱이 미설치 시 `markdown` 블록으로 폴백 |
| JSON | `markdown` 블록 (또는 코드 블록) | JSON 데이터를 코드 블록으로 표시 |

### 엣지 연결

물질화된 블록은 **원본 링크 블록과 자동으로 엣지가 연결**된다.

```
[link 블록: example.com] ──엣지──→ [markdown 블록: 요약]
                         ──엣지──→ [image 블록: 스크린샷]
                         ──엣지──→ [group 블록: 이미지 갤러리]
```

이를 통해:
- 물질화된 블록에서 원본 URL을 추적할 수 있음
- 원본 블록에서 파생된 모든 블록을 hop 검색으로 찾을 수 있음

---

## 8. Properties 스키마

```typescript
interface LinkBlockProperties {
  // 기본 데이터
  url: string;                        // 원본 URL
  ogTitle?: string;                   // og:title
  ogDescription?: string;             // og:description
  ogImage?: string;                   // og:image URL
  ogSiteName?: string;                // og:site_name
  favicon?: string;                   // 파비콘 URL
  domain: string;                     // 도메인 (example.com)

  // 탭 데이터 (Tab Data = Properties 원칙)
  tabs: {
    // 요약 탭 (자동 인덱싱 + Block Tool)
    summary?: {
      [language: string]: string;     // { "ko": "한국어 요약...", "en": "English summary..." }
    };

    // 추출 탭 (자동 인덱싱)
    extract?: {
      markdown: string;               // firecrawl로 추출한 마크다운 원문
      extractedAt: string;            // ISO 날짜
    };

    // 스크린샷 탭 (Block Tool)
    screenshot?: {
      url: string;                    // 스토리지 URL
      fullPage: boolean;
      capturedAt: string;             // ISO 날짜
    };

    // 이미지 탭 (Block Tool)
    images?: Array<{
      url: string;                    // 이미지 URL
      alt?: string;
      width?: number;
      height?: number;
    }>;

    // 디자인 탭 (Block Tool)
    design?: {
      colors: string[];               // 주요 색상 (hex)
      fonts: string[];                // 사용된 폰트
      metadata: Record<string, unknown>; // 기타 메타데이터
    };

    // JSON 탭 (Block Tool)
    json?: {
      schema: Record<string, unknown>;  // 사용자 정의 추출 스키마
      data: Record<string, unknown>;    // 추출된 데이터
      extractedAt: string;
    };
  };
}
```

---

## 9. 다른 앱과의 상호작용

### Block Context Action 수신

link는 개방형 블록 타입이므로, 설치된 앱들이 컨텍스트 메뉴에 액션을 주입할 수 있다 (Architecture.md §6.6 참조).

```
[링크 블록 컨텍스트 메뉴]
├── 기본 액션 (SSOTA Link App의 Block Tool)
│   ├── 요약
│   ├── 스크린샷
│   ├── 이미지 추출
│   ├── 디자인 추출
│   └── JSON 추출
│
├── 쏘타 크롤 앱 (설치된 경우, Block Context Action)
│   ├── "쏘타 크롤로 사이트 매핑"
│   ├── "쏘타 크롤로 크롤링 시작"
│   └── "쏘타 크롤로 일괄 스크래핑"
│
└── SEO 분석 앱 (설치된 경우, Block Context Action)
    └── "SEO 분석하기"
```

### Consumer로서의 다른 앱

link 블록의 properties 데이터는 다른 앱이 Consumer로서 읽을 수 있다:

- 쏘타 크롤: link 블록의 URL을 크롤링 진입점으로 사용
- SEO 앱: link 블록의 URL과 추출 데이터를 SEO 분석에 활용
- 에이전트 (Sophie): link 블록의 요약/추출 데이터를 ambient context로 참조

### 연관 앱: 디자인 시스템 뷰어 앱 (아이디어)

link 블록의 디자인 탭 데이터를 더 풍부하게 표현하기 위한 별도 앱. 전용 블록 `design_preview`를 정의한다.

```
디자인 시스템 뷰어 앱:
├── 전용 블록: design_preview (openType: false)
│   └── 색상 팔레트 시각화, 폰트 미리보기, 컴포넌트 스타일 등을 전용 UI로 표현
├── Block Context Action:
│   └── { targetBlockType: "link", label: "디자인 시스템 추출", appToolName: "extractDesignSystem" }
├── Producible Block Types: ["image", "markdown"]
└── 활용: 링크 블록 디자인 탭 → "캔버스에 올리기" 시 design_preview 블록으로 물질화
```
