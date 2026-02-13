# SSOTA Crawl App (쏘타 크롤) 기획안

> 쏘타 크롤은 Firecrawl을 기반으로 한 SSOTA 네이티브 1st-party 앱이다. 단일 URL 스크래핑부터 사이트 매핑, 대규모 크롤링까지, 웹 전체를 탐색하고 그 결과를 캔버스에 물질화하는 도구이다.

---

## 목차

1. [앱 개요](#1-앱-개요)
2. [핵심 설계 원칙](#2-핵심-설계-원칙)
3. [앱 모달 UI](#3-앱-모달-ui)
4. [App Tools](#4-app-tools)
5. [전용 블록 타입](#5-전용-블록-타입)
6. [사용 가능 개방형 블록](#6-사용-가능-개방형-블록)
7. [Block Context Actions](#7-block-context-actions)
8. [서브 에이전트](#8-서브-에이전트)
9. [물질화 흐름](#9-물질화-흐름)
10. [데이터 모델](#10-데이터-모델)
11. [유저 시나리오](#11-유저-시나리오)
12. [부록 A: RSC 사이트 처리](#appendix-rsc)

---

## 1. 앱 개요

| 항목 | 값 |
|------|-----|
| **앱 이름** | SSOTA Crawl (쏘타 크롤) |
| **슬러그** | `ssota-crawl` |
| **분류** | 1st-party (설치 필요) |
| **정의하는 전용 블록 타입** | `crawl_session`, `site_map` |
| **생산 가능한 개방형 블록** | `link`, `markdown`, `image`, `group` |
| **외부 의존성** | Firecrawl API |
| **역할** | Type Definer (전용 블록) + Producer (개방형 블록) |

### 링크 블록과의 차이

| | 링크 블록 (SSOTA Link App) | 쏘타 크롤 (SSOTA Crawl App) |
|---|---|---|
| **정체성** | 단일 URL의 물질화 | 웹 탐색 도구 |
| **범위** | 자기 자신 (1 URL) | 워크스페이스 전체 |
| **도구** | Block Tool (자기 데이터 조작) | App Tool (새 블록 생성, Job 관리) |
| **결과** | 탭에 데이터 저장 | 앱 모달에서 결과 관리 + 캔버스에 물질화 |
| **설치** | Built-in (항상 사용 가능) | 1st-party (설치 필요) |
| **전용 블록** | link (openType) | crawl_session, site_map (전용) |
| **대시보드** | 없음 (자기 데이터만) | 앱 모달에서 전체 작업 관리 |

---

## 2. 핵심 설계 원칙

### 2.1 앱 모달 = 앱의 메인 데이터 공간

쏘타 크롤은 앱 모달에서 작업을 시작하고, 결과를 먼저 앱 모달 내에서 확인한다. **모달은 작업 실행 후 닫히지 않는다.** 크롤링/매핑 결과는 모달 안에서 먼저 보여지고, 유저가 원하면 캔버스에 물질화한다.

```
앱 데이터 (모달 내)     ──물질화──→     캔버스 블록
(Primary, 앱이 관리)                    (Materialized, 캔버스의 시민)
```

이것은 Architecture.md의 물질화 개념과 동일하다:
- MCP 도구 호출의 결과가 채팅에서만 존재하다가 블록으로 물질화되듯
- 쏘타 크롤의 앱 데이터가 모달에서만 존재하다가 캔버스 블록으로 물질화된다

### 2.2 두 개의 데이터 레이어

```
[앱 데이터 레이어] — 앱 모달에서 관리
├── 크롤링 세션 목록
├── 각 세션의 결과 (스크래핑 데이터, 매핑 데이터, 크롤 결과)
├── 수집된 모든 URL 목록
└── 워크스페이스 전체 히스토리

[캔버스 데이터 레이어] — 물질화된 블록
├── crawl_session 블록 (크롤링 진행/결과 카드)
├── site_map 블록 (사이트맵 시각화)
├── link 블록들 (개별 URL)
├── markdown 블록들 (추출/요약 결과)
├── image 블록들 (추출 이미지)
└── group 블록 (결과 묶음)
```

앱 모달에서 "캔버스에 저장하기"를 실행하면, 앱 데이터가 캔버스 블록으로 물질화된다.

### 2.3 App Tool이 블록이 아닌 앱 데이터를 다루는 이유

크롤링은 장기 실행 작업(Job)이다. 이 작업은:
- 수십~수백 페이지를 처리한다
- 중간 결과가 계속 쌓인다
- 일시정지/재개/중단이 필요하다
- 완료 전에도 부분 결과를 확인해야 한다

이것을 개별 블록으로 바로 물질화하면 캔버스가 폭발한다. 앱 모달이 이 데이터를 버퍼링하고, 유저가 선택적으로 물질화하는 것이 올바른 패턴이다.

---

## 3. 앱 모달 UI

### 3.1 메인 화면

앱 모달을 열면 보이는 메인 대시보드.

```
┌────────────────────────────────────────────────────────┐
│  🕷️ 쏘타 크롤                                    [×]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🔗  URL 입력                              [▼ 옵션] │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  [스크래핑] [사이트 매핑] [크롤링]       ← 작업 선택     │
│                                                        │
├── 진행 중인 작업 ──────────────────────────────────────┤
│                                                        │
│  🟢 example.com 크롤링  ████████░░ 80% (45/56 페이지)  │
│     [일시정지] [결과보기] [캔버스에 저장]                 │
│                                                        │
│  ✅ blog.example.com 매핑 완료 (32 페이지 발견)          │
│     [결과보기] [캔버스에 저장]                           │
│                                                        │
├── 수집된 링크 ─────────────────────────────────────────┤
│                                                        │
│  이 워크스페이스에서 수집된 전체 URL (127개)              │
│                                                        │
│  🔗 https://example.com             [스크래핑] [열기]   │
│  🔗 https://example.com/about       [스크래핑] [열기]   │
│  🔗 https://example.com/products    [스크래핑] [열기]   │
│  ...                                                   │
│                                                        │
│  [CSV 내보내기] [JSON 내보내기]                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.2 단일 스크래핑 결과 화면

모달에서 URL을 입력하고 "스크래핑"을 실행하면, **모달이 닫히지 않고** 결과를 모달 내에서 표시한다.

```
┌────────────────────────────────────────────────────────┐
│  🕷️ 쏘타 크롤 > 스크래핑 결과                   [← 뒤로] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🔗 https://example.com/article                        │
│                                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │마크다운│ │ 요약  │ │스크린샷│ │ JSON │ │이미지 │       │
│  └──┬───┘ └──────┘ └──────┘ └──────┘ └──────┘       │
│     ▼                                                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ # Article Title                                   │  │
│  │                                                   │  │
│  │ Lorem ipsum dolor sit amet, consectetur           │  │
│  │ adipiscing elit. Sed do eiusmod tempor             │  │
│  │ incididunt ut labore et dolore magna aliqua.       │  │
│  │ ...                                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  옵션 선택:                                             │
│  ☑ 마크다운  ☑ 요약  ☐ 스크린샷  ☐ JSON  ☐ 이미지      │
│                                                        │
│  [캔버스에 저장하기]                                     │
│      → 링크 블록 생성 (선택한 옵션이 탭 데이터로 포함)    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.3 사이트 매핑 결과 화면

```
┌────────────────────────────────────────────────────────┐
│  🕷️ 쏘타 크롤 > 사이트 매핑 결과                [← 뒤로] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🔗 example.com (32 페이지 발견)                        │
│                                                        │
│  📁 /                                                  │
│  ├── 📄 /about                                         │
│  ├── 📁 /products                                      │
│  │   ├── 📄 /products/item-1                           │
│  │   ├── 📄 /products/item-2                           │
│  │   └── 📄 /products/item-3                           │
│  ├── 📁 /blog                                          │
│  │   ├── 📄 /blog/post-1                               │
│  │   ├── 📄 /blog/post-2                               │
│  │   └── 📄 /blog/post-3                               │
│  └── 📄 /contact                                       │
│                                                        │
│  [전체 선택] [선택 URL 크롤링 시작]                       │
│                                                        │
│  [캔버스에 저장하기]                                     │
│      → site_map 블록 생성 (사이트맵 시각화)              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 3.4 크롤링 결과 화면

```
┌────────────────────────────────────────────────────────┐
│  🕷️ 쏘타 크롤 > 크롤링 결과                     [← 뒤로] │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🔗 example.com 크롤링 ✅ 완료 (56 페이지)              │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ URL                    │ 상태  │ 요약    │ 선택  │  │
│  │────────────────────────┼───────┼────────┼──────│  │
│  │ /                      │ ✅    │ 보기   │ ☑    │  │
│  │ /about                 │ ✅    │ 보기   │ ☑    │  │
│  │ /products              │ ✅    │ 보기   │ ☐    │  │
│  │ /products/item-1       │ ✅    │ 보기   │ ☐    │  │
│  │ ...                    │       │        │      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  내보내기: [CSV] [JSON]                                 │
│                                                        │
│  캔버스에 저장하기:                                      │
│  [전체 → 링크 블록 묶음]                                 │
│  [선택한 항목만 → 링크 블록]                             │
│  [크롤 세션 카드 → crawl_session 블록]                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 4. App Tools

에이전트가 `executeAppTool`으로 호출할 수 있는 앱 수준 도구.

### 4.1 단일 스크래핑 (scrapeUrl)

```typescript
{
  name: "scrapeUrl",
  description: "단일 URL을 스크래핑하여 결과를 앱 데이터에 저장",
  inputSchema: {
    url: { type: "string", required: true },
    options: {
      type: "object",
      properties: {
        markdown: { type: "boolean", default: true },
        summary: { type: "boolean", default: true },
        screenshot: { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        jsonSchema: { type: "object" },
        images: { type: "boolean", default: false }
      }
    }
  },
  executionSide: "server"
}
```

- firecrawl의 scrape 엔드포인트 호출
- 결과는 앱 데이터에 저장 (모달에서 확인 가능)
- "캔버스에 저장"하면 link 블록으로 물질화 (선택한 옵션이 탭 데이터로 포함)

### 4.2 사이트 매핑 (mapSite)

```typescript
{
  name: "mapSite",
  description: "URL을 진입점으로 사이트 전체 URL을 매핑",
  inputSchema: {
    url: { type: "string", required: true },
    options: {
      type: "object",
      properties: {
        maxDepth: { type: "number", default: 3 },
        limit: { type: "number", default: 100 }
      }
    }
  },
  executionSide: "server"
}
```

- firecrawl의 map 엔드포인트 호출
- 결과 (URL 트리)는 앱 데이터에 저장
- "캔버스에 저장"하면 site_map 블록으로 물질화

### 4.3 크롤링 (crawlSite)

```typescript
{
  name: "crawlSite",
  description: "URL을 진입점으로 사이트 전체를 크롤링",
  inputSchema: {
    entryUrl: { type: "string", required: true },
    options: {
      type: "object",
      properties: {
        maxPages: { type: "number", default: 50 },
        maxDepth: { type: "number", default: 3 },
        includePatterns: { type: "array", items: { type: "string" } },
        excludePatterns: { type: "array", items: { type: "string" } }
      }
    }
  },
  executionSide: "server"
}
```

- firecrawl의 crawl 엔드포인트 호출 (장기 실행 Job)
- 진행 상황이 앱 모달에서 실시간 표시
- 완료 후 결과를 앱 모달에서 확인
- "캔버스에 저장"하면:
  - crawl_session 블록 생성 (크롤링 메타 정보)
  - 선택한 URL들이 link 블록으로 생성
  - 모든 블록이 엣지로 연결

### 4.4 일괄 스크래핑 (batchScrape)

```typescript
{
  name: "batchScrape",
  description: "복수 URL을 일괄 스크래핑",
  inputSchema: {
    urls: { type: "array", items: { type: "string" }, required: true },
    options: {
      type: "object",
      properties: {
        markdown: { type: "boolean", default: true },
        summary: { type: "boolean", default: true }
      }
    }
  },
  executionSide: "server"
}
```

- 매핑 결과에서 선택한 URL 목록을 한번에 스크래핑
- 결과는 앱 데이터에 저장
- "캔버스에 저장"하면 link 블록 묶음으로 물질화

### 4.5 결과 내보내기 (exportResults)

```typescript
{
  name: "exportResults",
  description: "크롤링/스크래핑 결과를 CSV 또는 JSON으로 내보내기",
  inputSchema: {
    sessionId: { type: "string", required: true },
    format: { type: "string", enum: ["csv", "json"], default: "json" }
  },
  executionSide: "server"
}
```

---

## 5. 전용 블록 타입

쏘타 크롤 앱만 정의하고 생산할 수 있는 전용(Proprietary) 블록 타입.

### 5.1 crawl_session 블록

크롤링 작업 전체를 나타내는 블록. 앱 데이터의 크롤 세션을 캔버스에 물질화한 것이다.

```
┌──────────────────────────────────────┐
│  🕷️ Crawl Session                    │
│                                      │
│  🔗 example.com                      │
│  상태: ✅ 완료                        │
│  페이지: 56개 크롤링됨                 │
│  시작: 2026-02-13 14:30              │
│  소요: 3분 42초                       │
│                                      │
│  ████████████████████ 100%           │
│                                      │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │결과 │ │내보내기│ │재실행│            │ ← Block Tool
│  └────┘ └────┘ └────┘              │
└──────────────────────────────────────┘
```

#### Properties 스키마

```typescript
interface CrawlSessionProperties {
  entryUrl: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  pagesFound: number;
  pagesCrawled: number;
  progress: number;          // 0-100
  startedAt: string;
  completedAt?: string;
  duration?: number;         // ms
  options: {
    maxPages: number;
    maxDepth: number;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
  // 앱 데이터의 세션 ID (모달에서 상세 결과 접근용)
  appSessionId: string;
}
```

#### Block Tools

| 도구 | 설명 |
|------|------|
| `viewResults` | 앱 모달에서 상세 결과 열기 |
| `exportResults` | CSV/JSON으로 내보내기 |
| `rerun` | 동일 옵션으로 크롤링 재실행 |
| `pause` | 진행 중인 크롤링 일시정지 |
| `resume` | 일시정지된 크롤링 재개 |
| `cancel` | 크롤링 중단 |

### 5.2 site_map 블록

사이트 URL 구조를 시각화하는 블록. 앱 데이터의 매핑 결과를 캔버스에 물질화한 것이다.

```
┌──────────────────────────────────────┐
│  🗺️ Site Map: example.com            │
│                                      │
│  📁 /                                │
│  ├── 📄 /about                       │
│  ├── 📁 /products (3)                │
│  │   ├── 📄 /products/item-1         │
│  │   ├── 📄 /products/item-2         │
│  │   └── 📄 /products/item-3         │
│  ├── 📁 /blog (3)                    │
│  └── 📄 /contact                     │
│                                      │
│  총 32 페이지 │ 최대 깊이 3           │
│                                      │
│  ┌────┐ ┌────────┐                  │
│  │트리뷰│ │선택 크롤│                  │ ← Block Tool
│  └────┘ └────────┘                  │
└──────────────────────────────────────┘
```

#### Properties 스키마

```typescript
interface SiteMapProperties {
  domain: string;
  entryUrl: string;
  totalPages: number;
  maxDepth: number;
  pages: Array<{
    url: string;
    path: string;
    depth: number;
    title?: string;
  }>;
  mappedAt: string;
  // 앱 데이터의 매핑 세션 ID
  appSessionId: string;
}
```

#### Block Tools

| 도구 | 설명 |
|------|------|
| `toggleView` | 트리뷰 / 리스트뷰 / 그래프뷰 전환 |
| `crawlSelected` | 선택한 URL들을 크롤링 시작 (App Tool 연동) |
| `refreshMap` | 사이트 매핑 재실행하여 갱신 |

---

## 6. 사용 가능 개방형 블록

쏘타 크롤이 Producer로서 생산할 수 있는 개방형(open) 블록 타입.

| 블록 타입 | 생산 시나리오 | 설명 |
|-----------|-------------|------|
| `link` | 스크래핑/크롤링 결과 URL | 각 URL이 link 블록으로 물질화. 스크래핑 데이터가 tabs에 포함 |
| `markdown` | 추출/요약 결과를 독립 텍스트로 | 긴 텍스트 결과를 별도 블록으로 물질화 |
| `image` | 추출된 이미지 | 페이지에서 추출한 이미지를 image 블록으로 물질화 |
| `group` | 결과 묶음 | 크롤링 결과 블록들을 그룹으로 묶어서 물질화 |

### Crawl App Space — 데이터 소유권

쏘타 크롤은 **모노레포 패키지로 관리되는 독립 앱**이며, 전용 DB 스키마(**crawl app space**)를 가진다. 워크스페이스별 세션·수집 URL·스크래핑 결과는 이 스키마에서 관리한다.

#### 설계 원칙

| 구분 | 소스 | 설명 |
|------|------|------|
| **수집된 전체 URL / 세션 목록** | Crawl App Space (전용 스키마) | 스크래핑·매핑·크롤링 세션과 그 결과 URL을 앱 전용 테이블에서 관리. 앱 모달의 "이 워크스페이스에서 수집된 전체 URL"은 여기서 조회 |
| **물질화된 블록** | 캔버스(blocks) | 유저가 "캔버스에 저장"한 것만 블록으로 존재. `created_by_app_id`는 **출처 메타데이터**용 (캔버스에서 "쏘타 크롤이 만든 블록" 필터링 등) |

블록 기반 조회(`created_by_app_id = ssota-crawl`)를 "수집된 전체 URL"의 소스로 쓰지 않는 이유:
- 물질화된 블록만 포함되므로, **아직 캔버스에 저장하지 않은 세션·URL**은 빠진다.
- 크롤 앱이 가진 데이터 전체를 담지 못한다.

따라서 **세션·URL 목록은 Crawl App Space가 단일 소스**이고, 블록은 물질화 결과만 추적한다.

#### created_by_app_id의 역할

쏘타 크롤이 생산한 블록에는 `created_by_app_id = ssota-crawl`을 기록한다. 이는 다음 용도로만 사용한다:
- 캔버스/에이전트에서 "이 블록을 만든 앱" 표시 또는 필터링
- 물질화 출처(provenance) 추적

"이 워크스페이스에서 수집된 전체 URL" 조회에는 사용하지 않는다.

---

## 7. Block Context Actions

쏘타 크롤이 다른 블록 타입의 컨텍스트 메뉴에 주입하는 액션 (Architecture.md §6.6 참조).

```typescript
const ssotaCrawlApp: AppDefinition = {
  // ...
  blockContextActions: [
    {
      targetBlockType: "link",
      label: "쏘타 크롤로 사이트 매핑",
      icon: "map",
      appToolName: "mapSite",
      paramMapping: { url: "properties.url" }
    },
    {
      targetBlockType: "link",
      label: "쏘타 크롤로 크롤링 시작",
      icon: "spider",
      appToolName: "crawlSite",
      paramMapping: { entryUrl: "properties.url" }
    },
    {
      targetBlockType: "link",
      label: "쏘타 크롤로 스크래핑",
      icon: "download",
      appToolName: "scrapeUrl",
      paramMapping: { url: "properties.url" }
    }
  ]
};
```

### 실행 흐름 (링크 블록에서 크롤링 시작)

```
1. 유저가 캔버스의 링크 블록 우클릭
2. 컨텍스트 메뉴에 "쏘타 크롤로 크롤링 시작" 표시
3. 클릭 → 앱 모달이 열림 (해당 URL이 입력된 상태)
4. 크롤링 옵션 설정 후 시작
5. 모달에서 진행 상황 실시간 확인
6. 완료 후 모달에서 결과 확인
7. "캔버스에 저장" → crawl_session 블록 + link 블록들 생성
8. 원본 링크 블록과 crawl_session 블록이 엣지로 연결
```

---

## 8. 서브 에이전트

### 8.1 앱 서브 에이전트의 성격

앱에 포함된 서브 에이전트는 **"이 앱의 Tool로 이런 것이 가능하다"를 보여주는 데모 패키지**이다. 앱 제작자가 자기 앱의 App Tool을 조합한 예시 워크플로우를 제공하는 것이지, 범용 에이전트가 아니다.

#### 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **데모 패키지** | 앱 제작자가 "우리 앱 Tool로 이런 자동화가 가능합니다"를 보여주는 예제 |
| **자기 앱 Tool 중심** | 주로 자기 앱의 App Tool만 사용. 다른 앱 Tool 의존성은 최소화 |
| **오케스트레이션 레이어** | 서브 에이전트는 App Tool의 상위 추상화. 여러 Tool을 LLM 판단으로 순차 조합 |
| **메인 에이전트가 호출** | 서브 에이전트는 항상 메인 에이전트(Sophie)에 의해 호출되거나, 유저가 직접 지정하여 호출. 서브 에이전트끼리 재귀 호출하지 않음 |
| **유저 커스텀의 출발점** | 유저는 이 데모를 보고 자기만의 서브 에이전트를 만들 수 있음. 여러 앱의 Tool을 자유롭게 조합 가능 |

#### UI 경로 vs 에이전트 경로

```
같은 결과에 도달하는 두 경로:

[UI 경로 — 인간을 위한 것]
유저가 앱 모달에서:
→ URL 입력 → "매핑" 클릭 → 결과 확인 → "크롤링" 클릭 → 결과 확인 → "저장"
→ 한 단계씩 확인하며 진행

[에이전트 경로 — 자동화를 위한 것]
유저: "competitor.com 분석해줘"
→ Sophie → callSubAgent("competitor-analysis", "competitor.com 분석")
→ 서브 에이전트가 mapSite → crawlSite → summarize → canvasdown 한번에 처리
→ 결과가 캔버스에 구조화 배치

에이전트는 셸 스크립트처럼 Tool을 직접 호출한다.
UI를 조작하는 것이 아니라, Tool이라는 API를 직접 실행하는 것이다.
```

### 8.2 쏘타 크롤 데모 서브 에이전트

쏘타 크롤 앱이 제공하는 데모 서브 에이전트 3종. 모두 쏘타 크롤의 App Tool(`mapSite`, `crawlSite`, `scrapeUrl`, `batchScrape`)을 중심으로 구성된다.

#### 경쟁사/시장 분석

```
이름: competitor-analysis
설명: 경쟁사 웹사이트를 분석하여 구조, 콘텐츠, 전략을 정리
사용 Tool: mapSite, crawlSite (쏘타 크롤 App Tool)

흐름:
1. 유저로부터 경쟁사 URL 입력
2. mapSite → 사이트 구조 파악
3. crawlSite → 주요 페이지 크롤링 (depth: 2)
4. 각 페이지 요약 생성
5. 분석 결과를 markdown 블록으로 정리
6. 캔버스에 구조화 배치:
   ├── site_map 블록 (사이트 구조)
   ├── markdown 블록 (분석 보고서)
   ├── link 블록들 (주요 페이지)
   └── 모든 블록이 엣지로 연결
```

#### 홈페이지 레퍼런스 찾기

```
이름: homepage-reference
설명: 특정 분야의 우수 홈페이지 레퍼런스를 찾고 분석
사용 Tool: scrapeUrl (쏘타 크롤 App Tool)

흐름:
1. 유저로부터 분야/키워드 입력
2. 웹 검색으로 관련 사이트 발견
3. 각 사이트를 scrapeUrl → 스크린샷 + 디자인 추출
4. 결과를 캔버스에 배치:
   ├── link 블록들 (각 레퍼런스 사이트, 스크린샷 포함)
   ├── markdown 블록 (비교 분석)
   └── group 블록으로 묶기
```

#### 뉴스 분석

```
이름: news-analysis
설명: 특정 주제(예: 주식 투자)에 대한 최신 뉴스를 크롤링하고 분석
사용 Tool: batchScrape (쏘타 크롤 App Tool)

흐름:
1. 유저로부터 키워드/주제 입력
2. 뉴스 사이트에서 관련 기사 검색
3. batchScrape → 기사 본문 추출
4. 각 기사 요약 + 전체 트렌드 분석
5. 결과를 캔버스에 배치:
   ├── link 블록들 (각 기사)
   ├── markdown 블록 (트렌드 분석 보고서)
   └── 시간순 정렬된 group 블록
```

### 8.3 유저 커스텀 서브 에이전트 예시

유저는 쏘타 크롤의 데모 서브 에이전트를 참고하여, 자기만의 서브 에이전트를 만들 수 있다. 여러 앱의 Tool을 자유롭게 조합하는 것은 유저의 영역이다.

```
유저가 만든 커스텀 서브 에이전트 예시:

이름: investment-research
설명: 특정 종목에 대한 종합 투자 리서치

이 서브 에이전트는 유저가 직접 조합:
├── 쏘타 크롤 App Tool: batchScrape (뉴스 기사 수집)
├── 쏘타 크롤 App Tool: scrapeUrl (기업 IR 페이지 스크래핑)
├── 주식 분석 앱 App Tool: getFinancials (재무 데이터 조회)  ← 다른 앱
├── 주식 분석 앱 App Tool: getChart (차트 생성)              ← 다른 앱
└── Global Tool: canvasdown (결과 배치)

→ 앱 제작자가 만드는 게 아니라 유저가 여러 앱을 조합하여 만드는 것
→ 이것이 서브 에이전트의 진정한 힘
```

---

## 9. 물질화 흐름

### 9.1 앱 데이터 → 캔버스 블록 물질화 패턴

```
[앱 모달에서 실행]
     │
     ▼
[Crawl App Space에 결과 저장]  ← 모달에서 바로 확인 가능 (워크스페이스별 세션·URL 단일 소스)
     │
     ▼  (유저가 "캔버스에 저장하기" 클릭)
     │
[물질화: 캔버스 블록 생성]
     │
     ├── 전용 블록: crawl_session, site_map
     │   └── appSessionId로 앱 데이터 참조 유지
     │
     └── 개방형 블록: link, markdown, image, group
         └── created_by_app_id = ssota-crawl (캔버스 출처 메타데이터용, §6 참조)
         └── 엣지로 관계 연결
```

### 9.2 물질화 옵션

| 작업 | 기본 물질화 | 선택적 물질화 |
|------|-----------|-------------|
| 단일 스크래핑 | link 블록 1개 (선택한 옵션이 탭 데이터로) | 마크다운/이미지를 독립 블록으로 |
| 사이트 매핑 | site_map 블록 1개 | 개별 URL을 link 블록으로 |
| 크롤링 | crawl_session 블록 1개 | 선택한 URL들을 link 블록으로, 그룹으로 묶기 |
| 일괄 스크래핑 | link 블록 N개 (group 블록으로 묶음) | 개별 결과를 독립 블록으로 |

### 9.3 물질화 시 엣지 연결

```
단일 스크래핑에서 물질화:
  [link 블록: example.com]

사이트 매핑에서 물질화:
  [site_map 블록: example.com]

크롤링에서 물질화 (전체):
  [crawl_session 블록] ──엣지──→ [link 블록: /]
                       ──엣지──→ [link 블록: /about]
                       ──엣지──→ [link 블록: /products]
                       ──엣지──→ [link 블록: /blog/post-1]
                       ...

링크 블록에서 크롤링 시작한 경우:
  [원본 link 블록: example.com] ──엣지──→ [crawl_session 블록]
                                          ──엣지──→ [link 블록: /about]
                                          ──엣지──→ ...
```

---

## 10. 데이터 모델

### 10.1 AppDefinition

```typescript
const SSotaCrawlApp: AppDefinition = {
  id: 'ssota-crawl',
  name: 'SSOTA Crawl',
  slug: 'ssota-crawl',
  description: 'Firecrawl 기반 웹 크롤링/스크래핑/매핑 도구. 웹 전체를 탐색하고 캔버스에 물질화합니다.',
  version: '1.0.0',
  author: 'ssota',
  category: 'first-party',

  blockTypeDefinitions: [
    // crawl_session 블록 타입 (§5.1)
    {
      typeName: 'crawl_session',
      displayName: '크롤 세션',
      icon: 'spider',
      propertiesSchema: { /* CrawlSessionProperties */ },
      blockTools: [
        { name: 'viewResults', description: '앱 모달에서 상세 결과 열기', inputSchema: {}, executionSide: 'client' },
        { name: 'exportResults', description: 'CSV/JSON으로 내보내기', inputSchema: { format: { type: 'string', enum: ['csv', 'json'] } }, executionSide: 'server' },
        { name: 'rerun', description: '동일 옵션으로 크롤링 재실행', inputSchema: {}, executionSide: 'server' },
        { name: 'pause', description: '크롤링 일시정지', inputSchema: {}, executionSide: 'server' },
        { name: 'resume', description: '크롤링 재개', inputSchema: {}, executionSide: 'server' },
        { name: 'cancel', description: '크롤링 중단', inputSchema: {}, executionSide: 'server' },
      ],
      isEditable: false,
      openType: false,  // 전용 블록 — 쏘타 크롤만 생산 가능
      defaultViewMode: 'card',
      supportedViewModes: ['card', 'compact'],
    },
    // site_map 블록 타입 (§5.2)
    {
      typeName: 'site_map',
      displayName: '사이트맵',
      icon: 'map',
      propertiesSchema: { /* SiteMapProperties */ },
      blockTools: [
        { name: 'toggleView', description: '트리뷰/리스트뷰/그래프뷰 전환', inputSchema: { view: { type: 'string', enum: ['tree', 'list', 'graph'] } }, executionSide: 'client' },
        { name: 'crawlSelected', description: '선택한 URL들을 크롤링 시작', inputSchema: { urls: { type: 'array', items: { type: 'string' } } }, executionSide: 'server' },
        { name: 'refreshMap', description: '사이트 매핑 재실행', inputSchema: {}, executionSide: 'server' },
      ],
      isEditable: false,
      openType: false,  // 전용 블록 — 쏘타 크롤만 생산 가능
      defaultViewMode: 'expanded',
      supportedViewModes: ['card', 'expanded'],
    },
  ],

  producibleBlockTypes: ['link', 'markdown', 'image', 'group'],

  appTools: [
    // §4 참조
    { name: 'scrapeUrl', description: '단일 URL 스크래핑', inputSchema: { /* ... */ }, executionSide: 'server' },
    { name: 'mapSite', description: '사이트 URL 매핑', inputSchema: { /* ... */ }, executionSide: 'server' },
    { name: 'crawlSite', description: '사이트 크롤링', inputSchema: { /* ... */ }, executionSide: 'server' },
    { name: 'batchScrape', description: '복수 URL 일괄 스크래핑', inputSchema: { /* ... */ }, executionSide: 'server' },
    { name: 'exportResults', description: '결과 내보내기', inputSchema: { /* ... */ }, executionSide: 'server' },
  ],

  subAgents: [
    { name: 'competitor-analysis', description: '경쟁사/시장 분석' },
    { name: 'homepage-reference', description: '홈페이지 레퍼런스 찾기' },
    { name: 'news-analysis', description: '뉴스 분석' },
  ],

  blockContextActions: [
    // §7 참조
    { targetBlockType: 'link', label: '쏘타 크롤로 사이트 매핑', appToolName: 'mapSite', paramMapping: { url: 'properties.url' } },
    { targetBlockType: 'link', label: '쏘타 크롤로 크롤링 시작', appToolName: 'crawlSite', paramMapping: { entryUrl: 'properties.url' } },
    { targetBlockType: 'link', label: '쏘타 크롤로 스크래핑', appToolName: 'scrapeUrl', paramMapping: { url: 'properties.url' } },
  ],

  rendererInfo: {
    componentPath: 'domains/app-system/frontend/components/crawl-app',
  },
};
```

### 10.2 Crawl App Space — 앱 전용 스키마

쏘타 크롤은 **모노레포 패키지로 관리되는 독립 앱**이며, 앱 레벨 데이터는 **전용 DB 스키마(Crawl App Space)**에 둔다. 워크스페이스별 세션·수집 URL·스크래핑 결과의 단일 소스는 이 스키마이다. 앱 모달의 "수집된 전체 URL", "진행 중인 작업" 등은 모두 여기서 조회한다.

```typescript
// Crawl App Space 내 크롤 세션 데이터 (앱 모달에서 관리)
interface CrawlSessionAppData {
  id: string;                          // 세션 ID
  appInstallationId: string;           // 설치된 앱 인스턴스
  workspaceId: string;
  
  entryUrl: string;
  type: 'scrape' | 'map' | 'crawl' | 'batch';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  
  // 작업 결과
  results: Array<{
    url: string;
    markdown?: string;
    summary?: string;
    screenshot?: string;
    images?: string[];
    json?: Record<string, unknown>;
    status: 'success' | 'failed';
  }>;
  
  // 매핑 결과 (type === 'map')
  siteMap?: Array<{
    url: string;
    path: string;
    depth: number;
    title?: string;
  }>;
  
  // 물질화 추적
  materializedBlockIds: string[];      // 캔버스에 물질화된 블록 ID들
  
  createdAt: string;
  updatedAt: string;
}
```

---

## 11. 유저 시나리오

### 시나리오 A: 앱 모달에서 직접 크롤링

```
1. 유저가 쏘타 크롤 앱 모달을 연다
2. URL 입력: https://competitor.com
3. "크롤링" 선택 → 옵션 설정 (최대 50페이지, 깊이 3)
4. "시작" 클릭
5. 모달에서 진행 상황 실시간 확인 (모달 닫히지 않음)
6. 완료 후 모달에서 결과 테이블 확인
7. 주요 페이지 10개 선택 → "캔버스에 저장하기"
8. 캔버스에:
   ├── crawl_session 블록 (크롤 메타 정보)
   ├── link 블록 10개 (선택한 페이지, 요약 탭 데이터 포함)
   └── 모든 블록이 crawl_session과 엣지로 연결
```

### 시나리오 B: 링크 블록에서 크롤링 시작

```
1. 캔버스에 이미 example.com 링크 블록이 있음
2. 우클릭 → "쏘타 크롤로 사이트 매핑" (Block Context Action)
3. 앱 모달이 열림 (URL 입력란에 example.com이 미리 채워짐)
4. "매핑 시작" 클릭
5. 모달에서 사이트맵 결과 확인 (32페이지 발견)
6. "캔버스에 저장하기" → site_map 블록 생성
7. site_map 블록이 원본 링크 블록과 엣지로 연결
8. site_map 블록에서 "선택 URL 크롤링" Block Tool → 크롤링 시작
```

### 시나리오 C: 에이전트를 통한 경쟁사 분석

```
1. 유저: "competitor.com 경쟁사 분석해줘"
2. 에이전트 Sophie:
   ├── 쏘타 크롤 앱이 설치되어 있음을 확인
   ├── 서브 에이전트 "competitor-analysis" 호출
   │   ├── executeAppTool("ssota-crawl", "mapSite", { url: "competitor.com" })
   │   ├── executeAppTool("ssota-crawl", "crawlSite", { entryUrl: "competitor.com", maxPages: 20 })
   │   ├── 각 페이지 요약 분석
   │   └── renderCanvasdown으로 결과 배치:
   │       ├── site_map 블록
   │       ├── link 블록들 (주요 페이지)
   │       ├── markdown 블록 (분석 보고서)
   │       └── 엣지로 모두 연결
   └── "competitor.com 분석이 완료되었습니다. 총 20개 페이지를 분석했고..."
```

---

## 부록 A: RSC(React Server Components) 사이트 처리 — Firecrawl 한계와 에이전틱 대안

<a name="appendix-rsc"></a>

### A.1 배경: Firecrawl의 출력 형태

쏘타 크롤은 현재 **Firecrawl API**만 사용한다. Firecrawl은 페이지를 렌더링/정제한 뒤 **마크다운, 요약, 스크린샷** 등을 반환하며, **원본(raw) HTML**은 제공하지 않는다.

이로 인해 다음과 같은 사이트는 Firecrawl만으로는 필요한 데이터를 얻기 어렵다.

### A.2 Next.js App Router와 RSC 페이로드

Next.js App Router는 **React Server Components(RSC)**를 사용하며, 서버는 초기 HTML 안에 `self.__next_f.push([1,"..."])` 형태의 스크립트를 넣어 직렬화된 데이터를 전달한다.

- 이 데이터는 **클라이언트 JS 실행 전**에 이미 HTML에 포함되어 있다.
- `push`의 두 번째 인자에는 JSON, 컴포넌트 트리, 메타데이터 등이 문자열로 들어 있다.
- 예: 이미지 프롬프트, 상세 설명 등이 `{"portrait_prompt": {...}}` 같은 인라인 JSON으로 포함될 수 있다.
- Firecrawl은 이 raw HTML을 반환하지 않으므로, **이런 인라인 데이터는 Firecrawl 결과에서 누락**된다.

### A.3 필요한 에이전틱 플로우

RSC/인라인 JSON이 필요한 사이트를 처리하려면 Firecrawl과 별도의 플로우가 필요하다.

```
[Firecrawl 플로우 — 현재]
  URL → Firecrawl API → 마크다운/요약/스크린샷 (raw HTML 없음)

[RSC 대응 플로우 — 제안]
  URL → (1) 타겟 판별 → (2) raw HTML fetch → (3) __next_f 추출 → (4) JSON/데이터 파싱
```

| 단계 | 설명 |
|------|------|
| **1. 타겟 판별** | Next.js/RSC 사용 여부 감지 (예: `__next_f`, `_next/static` 등 존재 여부) |
| **2. raw HTML fetch** | `requests`/`fetch`로 HTML 직접 요청 (Firecrawl 미사용) |
| **3. `__next_f` 추출** | `self.__next_f.push([1,"..."])` 패턴에서 payload 문자열 수집 |
| **4. 데이터 파싱** | 정규식/브라켓 매칭으로 JSON 후보 추출, 또는 LLM으로 스키마 기반 추출 |

### A.4 구현 방향

- **규칙 기반**: `{` 로 시작하는 JSON 후보를 찾아 파싱 시도 → `prompt`, `negative_prompt`, `composition`, `lighting` 등 키로 유효성 검사.
- **LLM 기반**: payload 텍스트를 청크로 나눠 LLM에 주입 → 정의한 JSON 스키마에 맞게 추출. (233 청크 기준 페이지당 약 $0.001–0.01 수준, Gemini 1.5 Flash / GPT-4o-mini 적합.)

### A.5 아키텍처상 위치

이 RSC 대응 플로우는 **쏘타 크롤의 서브 에이전트 또는 별도 파이프라인**으로 두는 것이 자연스럽다.

1. **판별기**: URL/도메인 또는 첫 fetch 결과로 RSC 필요 여부 판단.
2. **분기**: RSC로 판단되면 Firecrawl 대신 raw HTML 플로우 실행.
3. **결과 통합**: 추출한 데이터를 기존 Crawl App Space/물질화 흐름에 맞게 매핑.

Firecrawl은 “일반적인 페이지”에, RSC 플로우는 “인라인 데이터가 중요한 특수 사이트”에 각각 사용하는 이원화 구조를 전제로 한다.
