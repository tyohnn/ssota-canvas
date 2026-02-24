# Source 관리 아키텍처

링크 기반 콘텐츠(YouTube, PDF, X, 스레드, 오디오 등)의 추출·요약을 어떻게 저장하고 블록과 연결할지에 대한 설계 문서이다. 논의 결과 **옵션 B(통합 Sources + 소스 기준 요약)** 로 정리했다.

---

## 1. 세 레이어 구분: App Space / Sources / Blocks

| 레이어 | 역할 | 비유 |
|--------|------|------|
| **App Space** | "그것이 **무엇인지**" — 도메인별 풍부한 데이터 | 도서관의 책 카탈로그 |
| **Sources** | "그것에서 **무엇을 추출했는지**" — 블록 시스템이 소비하는 추출 결과 | 그 책에서 뽑아낸 하이라이트·요약 노트 |
| **Blocks** | "유저가 **어떻게 조직하는지**" — 유저 워크스페이스의 파일 | 유저의 노트 파일 |

```
외부 세계 → App Space (콘텐츠 객체) → Sources (추출 캐시) → Blocks (유저 워크스페이스)
              "What it IS"            "What was EXTRACTED"     "How user ORGANIZES"
```

### 1.1 App Space

- **역할**: 도메인별 콘텐츠 웨어하우스. "그 콘텐츠가 무엇인지"를 풍부하게 표현.
- **예**: `youtube_app_space` (videos, channels), `pdf_app_space`, `x_app_space` 등.
- **저장하는 것**: 도메인 고유 메타데이터(채널, 조회수, 타임스탬프 있는 스크립트, 썸네일 등).
- **사용처**: 내부 분석·트렌드 앱, 도메인별 UI(자막 동기화, 채널 분석 등).
- **생명주기**: 도메인 단위로 독립. Sources와 분리되어 존재 가능.

채널·비디오 같은 **메타 엔티티는 각 App Space 스키마에서 따로 관리**한다. 추후 videos, channels 등을 범용적으로 검색·분석하는 내부 앱을 만들 때 이 레이어를 직접 쿼리한다.

### 1.2 Sources

- **역할**: 추출 캐시. **블록 시스템이 소비하는** "이 URL에서 뭘 뽑았는지"만 담는다.
- **저장하는 것**:
  - `url` (canonical, unique)
  - `source_type` (youtube | pdf | x | thread | audio | link)
  - `raw_content` (TEXT) — 검색·요약에 쓸 정규화된 텍스트
  - `metadata` (JSONB) — App Space 참조, 타입별 부가 정보
  - 추출 시각 등
- **사용처**: 블록 시스템, 요약 생성, 과금 추적(action_transactions).
- **생명주기**: URL 기준 deduplicated. 같은 URL은 하나의 source로 공유.

Sources는 **추출과 연관된 레이어**로 본다. App Space의 videos/document 등은 "콘텐츠 객체", Sources는 "그 객체에서 뽑아낸 것(텍스트·요약)"을 위한 캐시다.

### 1.3 Blocks

- **역할**: 유저 워크스페이스의 단위. 에이전틱 OS 관점에서 **블록 = OS의 파일**에 대응.
- **저장하는 것**: 블록 타입, 제목, 자체 콘텐츠(content_raw, content), 그리고 링크 기반 블록일 때 `source_id` (FK → sources.id).
- **사용처**: 캔버스, 페이지, 에이전트 컨텍스트.
- **생명주기**: 유저 소유. 같은 원본(source)을 여러 블록이 참조할 수 있다.

---

## 2. 옵션 B: 통합 Sources + 소스 기준 요약

### 2.1 선택 이유

- **요약의 단일진실**: 요약은 "정보 위주의 요약" 하나를 소스 단위로 둔다. 관점·템플릿을 여러 개 두면 복잡도와 선택지가 늘어난다.
- **관점/템플릿이 필요할 때**: 그 소스 블록을 기반으로 **다른 마크다운 블록**을 만들어서 파생시키면 된다. 소스의 요약 단일진실에서 빌드하는 구조.
- **다국어**: 소스당 요약은 **다국어**를 지원한다 (source_summaries에 language별 행).

### 2.2 데이터 모델 요약

```
sources
  ├── id, url (unique canonical), source_type
  ├── raw_content (TEXT)   — 검색·요약용 정규화 텍스트
  ├── metadata (JSONB)    — App Space 참조 등
  ├── content_language, extracted_at
  └── created_at, updated_at

source_summaries
  ├── source_id (FK), language
  ├── summary, keywords
  └── UNIQUE(source_id, language)

source_action_transactions (과금 추적)
  ├── org_id, source_id, action_type, language
  └── ...

blocks
  ├── ... 기존 필드
  └── source_id (FK → sources.id, nullable)
```

### 2.3 App Space와의 연결

- **Sources → App Space**: `sources.metadata`(JSONB)에 app space 식별자 저장. 예: `appSpace`, `appSpaceVideoId`, `videoSlug` 등. **Loose coupling** (FK 아님).
- **App Space**: Sources를 몰라도 됨. 내부 분석 앱은 App Space만 쿼리.
- **블록 시스템**: Sources만 보면 됨. App Space 스키마를 직접 알 필요 없음.

---

## 3. raw_content vs App Space 원본

- **App Space** (예: `youtube_app_space.videos.script`): 타임스탬프·구조를 유지한 **원본 형태**. 재생·자막 동기화 등 도메인 기능용.
- **Sources.raw_content** (TEXT): **검색·요약에 최적화된 플랫 텍스트**. 모든 소스 타입에 동일한 형태로 두어 블록 시스템이 일관되게 다룰 수 있게 한다.

목적이 다르므로 "같은 내용을 두 군데 둔다"고 보면 된다: App Space는 원본 보존, Sources는 추출 결과 캐시.

---

## 4. 과금·다국어·마이그레이션

- **다국어 요약**: `source_summaries`에서 (source_id, language) 단위로 관리.
- **과금**: `action_transactions`를 **sources와 함께** 처리. org + source + action_type + language 수준으로 추적.
- **마이그레이션**: 개발 단계에서는 점진적으로 이전하고, **배포 시점에는 한 번에** 전환한다.

---

## 5. 정리: 레이어별 책임

| 레이어 | 저장하는 것 | 누가 사용하는지 |
|--------|-------------|-----------------|
| **App Space** | 도메인 풍부 데이터 (타임스탬프 스크립트, 채널 통계 등) | 내부 분석 앱, 도메인별 UI |
| **Sources** | URL 기준 추출 캐시 (raw_content, 요약, 과금) | 블록 시스템, 요약·과금 플로우 |
| **Blocks** | 유저의 조직 단위 (source 참조, 자체 content) | 유저 워크스페이스, 캔버스 |

Sources는 "추출 결과의 캐시이자 블록 시스템의 인터페이스 레이어"이고, App Space는 그 뒤에서 도메인별 데이터를 독립적으로 관리하는 웨어하우스다.

---

## 6. 플랫폼 기능 vs AI 기능 (책임 분리)

| 구분 | 담당 레이어 | 예시 | 성격 |
|------|-------------|------|------|
| **플랫폼 기능** | **App Space** | 제목, 채널 정보, 썸네일, 조회수, 구조화 스크립트(타임스탬프 JSON) | "그 콘텐츠가 **무엇인지**" — 플랫폼(YouTube, PDF 등)이 제공하는 고유 데이터 |
| **AI/부가 기능** | **Sources (source-management)** | 추출(transcript → raw_content), 요약 생성, 검색·과금 플로우 | "플랫폼 위에 쌓는 **추가 기능**" — AI·추출·요약은 source 도메인 책임 |

- **App Space**: 플랫폼 정보 조회·저장만 담당. 제목·채널 정보 등은 해당 플랫폼 도메인(youtube-app-space 등)에서 API 호출 후 저장.
- **Source 도메인**: 모든 소스 타입에 대한 **추출 로직과 요약 로직**을 소유. source_type별 어댑터(YouTube, PDF, X 등)에서 실제 추출을 수행하고, 결과를 `sources.raw_content` / `source_summaries`에 저장.
- **연동**: Source 쪽에서 추출·요약을 완료한 뒤, App Space에 구조화 원본(예: `videos.script`)을 저장해야 할 때는 **Event/Policy(Application Use Case Policy)** 로 처리한다. Source 도메인이 이벤트를 발행하고, Policy에서 해당 App Space 도메인을 호출해 저장한다.
