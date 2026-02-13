# SSOTA App System Architecture

> 블록은 곧 앱이다.
> 캔버스는 곧 OS이다.
> 이 문서는 "블록 = 블록 타입의 인스턴스, 블록 타입 = 앱이 정의" 패러다임을 중심으로, SSOTA를 에이전트 네이티브 OS로 설계하기 위한 개념, 데이터 모델, 구현 계획을 정리한다.

---

## 목차

1. [핵심 통찰: 블록은 곧 앱이다](#1-핵심-통찰-블록은-곧-앱이다)
2. [에이전트 네이티브 OS](#2-에이전트-네이티브-os)
3. [MCP vs SSOTA 네이티브 Tool](#3-mcp-vs-ssota-네이티브-tool)
4. [블록 = MCP Tool Result의 물질화](#4-블록--mcp-tool-result의-물질화)
5. [개방형 블록 타입과 전용 블록 타입](#5-개방형-블록-타입과-전용-블록-타입)
6. [개념 정의](#6-개념-정의)
7. [데이터 모델 설계](#7-데이터-모델-설계)
8. [현재 상태에서의 변화](#8-현재-상태에서의-변화)
9. [구현 계획](#9-구현-계획)
10. [개념 관계도](#10-개념-관계도)

---

## 1. 핵심 통찰: 블록은 곧 앱이다

### 출발점

파일/데이터는 그 자체로 존재하지 않는다.

OS에서 파일은 그 자체로 존재하면서, 뷰어 앱을 통해서 접근이 가능하다. 파일은 데이터 덩어리이기 때문에, 이를 해석해줄 수 있는 뷰어가 필요하다.

SSOTA의 블록도 마찬가지다:

- **마크다운 블록** = 마크다운 편집기
- **이미지 블록** = 이미지 뷰어
- **유튜브 블록** = 유튜브 플레이어
- **코드 블록** = 코드 실행 환경

블록은 특정한 데이터를 담고 있기만 한 것이 아니라, 동시에 이를 조작할 수 있는 앱이다.

### 전통 OS와의 비교

| | 전통 OS | SSOTA (현재) | SSOTA (새 패러다임) |
|---|---|---|---|
| **데이터** | 파일 (수동적, 해석 불가) | Block (데이터 + 뷰어가 붙어있음) | Block = **앱의 인스턴스** |
| **해석기** | 앱 (별도 설치, 별도 실행) | 블록 타입별 하드코딩된 컴포넌트 | **App이 블록 타입을 정의** |
| **관계** | 파일 → 앱으로 "열기" | 블록이 곧 뷰어 | 앱이 블록의 청사진 |
| **확장** | 앱 설치 | block_type enum에 값 추가 (마이그레이션 필요) | **앱 설치 = 새 블록 타입 추가** |

### 패러다임 전환

```
기존 모델:
  Block = 데이터 컨테이너 (뷰어가 붙어있긴 함)
  App = 확장 단위 (커스텀 블록 + 도구). Block과 별개의 개념.

새 모델 (블록 = 앱 인스턴스):
  App = 블록 타입의 정의 (뷰어 + 도구 + 데이터 스키마)
  Block = App의 인스턴스 (특정 데이터가 채워진 앱)
```

기존 블록 타입도 "기본 앱"이 정의한 것이다:

| 기존 block_type enum | 새 모델에서의 앱 |
|---|---|
| `markdown` | SSOTA Markdown App |
| `youtube` | SSOTA YouTube App |
| `image` | SSOTA Image App |
| `python` | SSOTA Python App |
| `link` | SSOTA Link App |
| `github_pr`, `github_branch`, `github_commit` | SSOTA GitHub App (3개 블록 타입 정의) |
| `react_component` | SSOTA React App |
| `vercel_deployment` | SSOTA Vercel App |
| `pdf` | SSOTA PDF App |
| `text` | SSOTA Text App |
| `shape` | SSOTA Shape App |
| `audio` | SSOTA Audio App |
| `video` | SSOTA Video App |
| `file` | SSOTA File App |
| `latex` | SSOTA LaTeX App |
| `page_mention` | SSOTA Page Mention App |
| `group` | SSOTA Group App |

주목할 점: **하나의 앱이 여러 블록 타입을 정의할 수 있다.** GitHub 앱은 PR, Branch, Commit 3개의 블록 타입을 정의한다. 이것은 현재 모델에서 3개의 개별 enum 값이지만, 앱 모델에서는 하나의 앱 아래 3개의 블록 타입이 된다.

---

## 2. 에이전트 네이티브 OS

### SSOTA는 "AI를 위해 OS를 다시 설계한 것"이다

기존 AI + MCP 모델은 **"기존 OS 위에 AI를 얹은 것"**이다. 앱들은 독립적으로 실행되고, AI는 프로토콜을 통해 이들을 외부에서 조작한다.

SSOTA는 데이터와 도구가 통합되고, 관계가 시스템 레벨에서 관리되며, 에이전트에게 ambient context가 자동으로 제공된다.

### 전통 OS와의 대응 관계

```
전통 OS                          SSOTA (에이전트 네이티브 OS)
─────────                        ────────────────────────────
파일 시스템 (계층적 트리)          캔버스 (공간적 그래프)
파일                             블록 (= 앱 인스턴스: 데이터 + 뷰어 + 도구)
앱 (독립 프로세스)                앱 (블록 타입 정의 + 도구)
디렉토리                         페이지 / 워크스페이스
파이프 (|)                       엣지 (관계)
셸 (bash)                       메인 에이전트 (Sophie)
셸 스크립트                      Canvasdown DSL
프로세스                          서브 에이전트
IPC / 소켓                       공유 캔버스 컨텍스트
패키지 매니저                     앱 마켓
시스템 콜                        Tool (Global / Block / App)
퍼미션                           스코프 위계 (앱 < 페이지 < 워크스페이스)
```

### 핵심 패러다임 전환

**전통 OS**: 사용자가 명시적으로 앱을 실행하고, 파일을 열고, 작업을 수행한다.
- 사용자 → 앱 실행 → 파일 열기 → 작업 → 저장
- 앱 간 전환은 사용자의 책임

**에이전트 네이티브 OS**: 사용자가 의도를 말하면, 에이전트가 앱/데이터를 조합하여 작업을 수행한다.
- 사용자 → 의도 표현 → 에이전트가 도구/블록/앱 오케스트레이션 → 결과가 캔버스에 나타남
- 앱 간 조합은 에이전트의 책임

### SSOTA가 구조적으로 유리한 3가지 이유

**1. 작업의 결과물이 영구적으로 공간에 남는다**

Claude에서 작업하면 결과는 채팅 로그에 묻힌다. Cursor에서 작업하면 결과는 파일에 저장된다. SSOTA에서 작업하면 결과가 **캔버스 위에 공간적으로 배치**되고, **관계(엣지)가 보존**된다. 에이전트가 "과거에 했던 작업"을 시각적으로 탐색하고 재활용할 수 있다.

**2. 컨텍스트가 시스템에 의해 자동 관리된다**

전통 AI에서 컨텍스트는 프롬프트에 수동으로 넣어야 한다. SSOTA에서는 Context Layer가 viewport, 선택 블록, 이벤트 이력, 연결 관계를 자동으로 제공한다. 전통 OS에서 "현재 작업 디렉토리(cwd)"가 자동으로 셸에 제공되는 것의 극단적 확장판이다.

**3. 도구와 데이터의 경계가 없다**

MCP 모델에서 "도구"와 "데이터"는 분리되어 있다. SSOTA에서 블록은 **데이터이면서 동시에 도구**다. 유튜브 블록은 영상 데이터이면서, 동시에 타임이동/스크립트 추출이 가능한 도구다.

---

## 3. MCP vs SSOTA 네이티브 Tool

### MCP 모델 (Claude, Cursor 등)

```
[AI 에이전트]
    │
    ├── MCP Protocol ──→ [GitHub 서버] (독립 프로세스)
    ├── MCP Protocol ──→ [Slack 서버] (독립 프로세스)
    └── MCP Protocol ──→ [DB 서버] (독립 프로세스)

특징:
- 각 앱은 독립된 서버로 실행
- 프로토콜 경계를 넘어 데이터 직렬화/역직렬화
- 에이전트는 각 앱의 상태를 "모른다" — 명시적으로 물어봐야 알 수 있음
- 앱 간 관계가 없음
```

### SSOTA 모델

```
[AI 에이전트 (Sophie)]
    │
    ├── Context Layer (자동 제공)
    │   ├── viewport에 보이는 블록들의 메타데이터
    │   ├── 블록 간 엣지 (관계)
    │   ├── 선택된 블록
    │   └── 최근 이벤트
    │
    ├── Global Tools ──→ [캔버스 자체 조작]
    ├── Block Tools ──→ [블록 내부 조작] (같은 런타임)
    └── App Tools ──→ [앱 기능 실행] (같은 런타임)

특징:
- 모든 것이 같은 캔버스 위에 존재
- 에이전트는 별도로 물어보지 않아도 현재 상태를 "안다" (ambient context)
- 블록 간 관계가 엣지로 표현되어 그래프 탐색 가능
- 프로토콜 경계 없음 — 같은 런타임에서 직접 실행
```

### 결정적 차이: Ambient Context vs Explicit Query

**MCP**: 에이전트가 GitHub PR을 보고 Slack에 알림을 보내려면:
1. MCP로 GitHub에 "PR 목록 줘" 요청 (네트워크 왕복)
2. 결과 파싱 (컨텍스트 소모)
3. MCP로 Slack에 "메시지 보내줘" 요청 (네트워크 왕복)
4. 두 앱 사이의 관계는 에이전트의 머릿속에서만 존재

**SSOTA**: 에이전트가 유튜브 요약을 마크다운으로 정리하려면:
1. viewport에 유튜브 블록이 이미 보임 (ambient context, 비용 0)
2. executeBlockTool로 스크립트 추출 (같은 런타임, 지연 최소)
3. renderCanvasdown으로 마크다운 블록 생성 + 엣지 연결 (1회 호출)
4. 두 블록의 관계가 엣지로 영구 저장됨

### 비교표

| 차원 | MCP | SSOTA |
|---|---|---|
| **상태 인식** | 매번 명시적 질의 필요 | ambient context로 자동 인식 |
| **관계 파악** | 앱 간 관계 없음 | 엣지로 관계 그래프 존재 |
| **검색** | 앱별로 따로 검색 | grep/glob/semantic으로 전체 캔버스 통합 검색 |
| **비용** | 네트워크 왕복 + 직렬화 | 같은 런타임, 직렬화 없음 |
| **프롬프트 캐싱** | MCP 서버마다 도구 정의 달라져 prefix 깨짐 | 정적 디스패처 3개로 prefix 유지 |
| **조합 작업** | 앱 A의 결과를 앱 B에 수동 전달 | Canvasdown 한 번으로 다수 블록 생성 + 연결 |
| **외부 세계** | 외부 시스템과 연동에 강함 | 캔버스 밖은 API/MCP 필요 |
| **생태계** | 수많은 사전 구축된 서버 | 커뮤니티 앱 생태계 구축 필요 |

### 비유

- **MCP 모델** = 사람이 전화기로 각 부서에 하나씩 전화해서 업무를 처리하는 것
- **SSOTA 모델** = 모든 부서 사람들이 같은 화이트보드 앞에 서서, 화이트보드의 현재 상태를 보면서 협업하는 것

화이트보드(캔버스) 모델이 더 효율적인 이유는, **공유 상태**가 있기 때문이다.

### 비용 분석

**토큰 비용**: SSOTA가 유리
- 정적 디스패처 패턴으로 프롬프트 캐싱 유지 (비용 90% 절감)
- ambient context로 별도 질의 없이 상태 파악 (도구 호출 횟수 감소)
- Canvasdown으로 여러 작업을 1회 호출로 수행

**개발 비용**: SSOTA가 불리 (초기)
- 모든 것을 자체 구축해야 함. MCP는 이미 만들어진 서버를 가져다 쓸 수 있음
- 커뮤니티 앱 생태계가 활성화되면 이 격차가 줄어듦

---

## 4. 블록 = MCP Tool Result의 물질화

### 핵심 통찰

MCP의 도구 호출 결과와 SSOTA의 블록은 본질적으로 같은 데이터를 담고 있다. 차이는, MCP의 결과는 채팅 세션의 컨텍스트 윈도우에서만 존재하고 세션이 끝나면 사라지지만, **SSOTA의 블록은 캔버스 위에 영구적으로 남는다**는 것이다.

GitHub MCP의 `get_pr` 도구는 PR 데이터를 반환한다. SSOTA의 GitHub App이 만드는 `github_pr` 블록도 PR 데이터를 담고 있다. 하지만 블록은 단순한 데이터 반환이 아니라 **도구 호출 결과의 물질화(materialization)**이다.

### MCP 도구 호출은 휘발성이다

```
[세션 1] 랜딩페이지 리뉴얼 작업 (MCP 기반)
1. get_pr("renewal-v2") → PR 데이터 반환 (채팅 컨텍스트에 존재)
2. get_branch_diff("main...renewal-v2") → diff 반환
3. "파일 3개 수정 필요" → 작업 시작
4. ... 컨텍스트 가득 참 ...

[세션 2] 새 세션 시작
→ AI는 아무것도 모름
→ "이전 작업 이어서 해줘"
→ 사용자가 정리한 문서를 넣거나, 또다시:
  1. get_pr("renewal-v2")      ← 똑같은 호출 반복
  2. get_branch_diff(...)       ← 똑같은 호출 반복
  3. 이전 컨텍스트 재구축        ← 토큰 낭비
```

모든 MCP 도구 호출의 결과는 채팅 세션의 컨텍스트 윈도우에만 존재한다. 세션이 끝나면 사라진다. 새 세션에서 동일한 작업을 이어가려면 동일한 도구를 다시 호출해야 한다.

### SSOTA에서 블록은 영구적 작업 결과물이다

```
[세션 1] 랜딩페이지 리뉴얼 작업 (SSOTA 기반)
1. GitHub App의 Block Tool로 PR 조회 → github_pr 블록이 캔버스에 생성됨
2. diff 조회 → 마크다운 블록으로 정리됨
3. "파일 3개 수정 필요" → todo 블록 생성, PR 블록과 엣지로 연결
4. 2개 파일 수정 완료 → 블록에 체크 표시
5. ... 세션 종료 ...

[세션 2] 새 세션 시작
→ AI가 캔버스를 봄 (ambient context)
→ viewport에 이미 보임:
  - github_pr 블록 (PR #42, renewal-v2)
  - todo 블록 ("파일 3개 수정 → 2/3 완료")
  - 마크다운 블록 (diff 요약)
  - 이것들이 엣지로 연결되어 있음
→ "이어서 해줘" → AI가 즉시 맥락 파악: "3번째 파일만 남았네요"
```

### 물질화의 세 가지 차원

블록이 MCP 도구 호출 결과를 "물질화"한다는 것은 세 가지 차원의 변화를 의미한다.

#### 1. 영속성 (Persistence)

| MCP 도구 호출 | 캔버스 블록 |
|---|---|
| 세션 끝나면 사라짐 | 캔버스에 영구 저장 |
| 다음 세션에서 다시 호출 필요 | 이미 있으므로 호출 불필요 |
| 이전 결과와 현재 결과 비교 불가 | 블록에 스냅샷 + Block Tool로 갱신 → 변화 감지 가능 |

#### 2. 관계 (Relationship)

| MCP 도구 호출 | 캔버스 블록 |
|---|---|
| 호출 A와 호출 B 사이의 관계 없음 | 블록 A와 블록 B가 엣지로 연결 |
| "이 PR이 이 작업과 관련있다"는 AI 머릿속에만 존재 | 관계가 그래프로 영구 저장 |
| 관계를 재구축하려면 다시 추론 필요 | hop 검색으로 관계 탐색 가능 |

#### 3. 검색 가능성 (Searchability)

| MCP 도구 호출 | 캔버스 블록 |
|---|---|
| 지나간 채팅 로그에서 찾기 어려움 | grep/semantic/glob으로 통합 검색 |
| "지난번에 조회한 PR 뭐였지?" → 재호출 필요 | "PR" grep → 즉시 발견 |
| 여러 세션에 걸친 작업 이력 추적 불가 | 이벤트 로그 + 블록 이력으로 추적 가능 |

### "캔버스에 올라가는 데이터에만 유리하다"는 반론에 대한 반박

> "결국 캔버스에 올려놓은 데이터만 유리한 거 아닌가? MCP로 외부 시스템을 실시간으로 조회하는 것과는 다른 문제 아닌가?"

이에 대한 반박:

**1. 블록은 "캐시"이자 "작업 컨텍스트"이다**

블록은 단순히 데이터를 보여주는 것이 아니라, **"이 작업 흐름에서 이 데이터가 관련 있다"는 사실 자체를 기록**한다. MCP에서 `get_pr()`을 호출하면 PR 데이터를 얻지만, "이 PR이 랜딩페이지 리뉴얼 작업과 관련 있다"는 정보는 기록되지 않는다. 캔버스에서는 PR 블록이 리뉴얼 작업 마크다운 블록과 엣지로 연결되어 있으므로, 이 관계가 영구적으로 보존된다.

**2. 실시간 데이터도 "스냅샷 + 갱신" 패턴으로 처리된다**

PR 상태는 시간이 지나면 바뀐다. 하지만 블록이 있다면:
- 블록에 마지막 조회 시점의 데이터가 저장되어 있음 (스냅샷)
- 에이전트가 필요할 때 Block Tool로 최신 데이터를 갱신할 수 있음 (새로고침)
- 이전 상태와 현재 상태의 차이를 감지할 수 있음 ("PR이 머지됐네요!")

MCP에서는 이전 호출 결과와 현재 결과를 비교하려면, 이전 결과를 어딘가에 수동으로 저장해야 한다. 블록은 이것을 자연스럽게 해결한다.

**3. 블록의 존재 자체가 "이 데이터를 다시 가져올 필요 없다"는 신호이다**

에이전트가 "renewal-v2 PR 상태 확인해줘"라고 요청받았을 때:
- MCP: `get_pr("renewal-v2")` 호출 (네트워크 왕복, 토큰 소모)
- SSOTA: viewport에 PR 블록이 이미 있으면 → 즉시 참조 (비용 0). 최신 상태가 필요하면 그때만 Block Tool로 갱신.

**4. 외부 데이터도 캔버스에 올라오는 순간 "내부 데이터"가 된다**

MCP의 `get_pr()`이 반환하는 PR 데이터는 "외부 시스템의 데이터"이다. 하지만 이것이 `github_pr` 블록으로 캔버스에 올라오면, 이제 캔버스의 다른 모든 블록과 동일한 방식으로 검색/연결/참조가 가능하다. 외부 데이터를 블록으로 물질화하는 것은, **외부 세계의 데이터를 캔버스 OS의 시민(first-class citizen)으로 승격**시키는 것이다.

### 요약: 블록은 MCP Tool의 상위 호환이다

```
MCP Tool Result (휘발성):
  ├── 일회성 데이터 반환
  ├── 컨텍스트 윈도우에서만 존재
  ├── 세션 종료 시 소멸
  ├── 다른 결과와 관계 없음
  └── 검색 불가

SSOTA Block (물질화):
  ├── 영구적 데이터 저장 (+ Block Tool로 갱신 가능)
  ├── 캔버스에 공간적으로 배치
  ├── 세션이 바뀌어도 ambient context로 자동 제공
  ├── 엣지로 관계 그래프 구성
  ├── grep/semantic/hop으로 검색 가능
  └── 이벤트 이력으로 변화 추적 가능
```

SSOTA의 블록 시스템은 본질적으로 **"MCP의 모든 도구 호출 결과를 영구적으로 물질화하고, 관계 그래프로 연결하고, 에이전트에게 자동으로 컨텍스트를 제공하는 시스템"**이다.

---

## 5. 개방형 블록 타입과 전용 블록 타입

### 문제: "블록 = 앱 인스턴스"의 예외

"블록 = 앱 인스턴스" 모델에는 중요한 예외가 있다. 이미지 블록을 예로 들면:

- **이미지 생성 앱**이 만들 수도 있고
- **이미지 검색 앱**이 만들 수도 있고
- **스크린샷 앱**이 만들 수도 있고
- **사용자**가 직접 드래그앤드롭으로 올릴 수도 있다

이미지 블록이 "이미지 생성 앱의 인스턴스"인가? 아니다. 이미지 블록은 **어떤 특정 앱에 소속된 것이 아니라, 여러 앱이 공유하는 타입**이다.

반면, `quiz` 블록은 퀴즈 서비스 앱만 만들 수 있고, `github_pr` 블록은 GitHub 앱만 만들 수 있다.

### OS 파일 시스템에서의 비유

```
.jpg 파일은:
  - JPEG 표준이 "정의"한 것 (표준 포맷)
  - Photoshop이 "생산"할 수 있고
  - 카메라 앱이 "생산"할 수 있고
  - 웹 다운로더가 "생산"할 수 있고
  - 포토뷰어가 "열어볼" 수 있고
  - Lightroom이 "편집"할 수 있다

  .jpg 파일이 "Photoshop의 인스턴스"인가? 아니다.
  .jpg는 표준 포맷이고, Photoshop은 이 포맷을 다룰 수 있는 앱일 뿐이다.

.psd 파일은:
  - Photoshop이 "정의"한 것 (전용 포맷)
  - Photoshop만 온전히 열고 편집할 수 있다

  .psd 파일은 "Photoshop의 인스턴스"라고 할 수 있다.
```

### 해결: Definer / Producer / Consumer 역할 분리

"블록 = 앱 인스턴스"를 정확하게 수정하면:

> **블록은 "블록 타입"의 인스턴스이다.**
> **블록 타입은 "앱"이 정의(define)한다.**
> **블록을 생산(produce)하는 것은 정의자가 아닌 다른 앱일 수 있다.**

이것을 세 가지 역할로 분리한다:

| 역할 | 설명 | 예시 (image 블록) |
|------|------|---|
| **Type Definer** | 블록 타입의 스키마, 뷰어, 기본 Block Tool을 정의하는 앱 | SSOTA Image App (또는 시스템) |
| **Producer** | 이 블록 타입의 인스턴스를 생산할 수 있는 앱 | 이미지 생성 앱, 이미지 검색 앱, 스크린샷 앱, 사용자 업로드 |
| **Consumer** | 이 블록 타입의 인스턴스를 읽거나 편집할 수 있는 앱 | 이미지 편집 앱, 이미지 뷰어, 어떤 앱이든 이미지를 참조 가능 |

### 두 종류의 블록 타입

#### 개방형 블록 타입 (Open Block Type)

시스템(또는 기본 앱)이 정의하고, **여러 앱이 생산/소비할 수 있는** 블록 타입이다.

| 블록 타입 | Definer | Producers (생산 가능) |
|---|---|---|
| `image` | 시스템 (SSOTA Image App) | 이미지 생성 앱, 이미지 검색 앱, 스크린샷 앱, 사용자 업로드 |
| `markdown` | 시스템 (SSOTA Markdown App) | Research 서브에이전트, 어떤 앱이든 텍스트 결과를 마크다운으로 출력 가능, 사용자 직접 생성 |
| `link` | 시스템 (SSOTA Link App) | 어떤 앱이든 URL 결과를 링크 블록으로 생성 가능 |

개방형 타입은 OS의 표준 파일 포맷(.jpg, .pdf, .txt)과 같다. 누구나 만들 수 있고, 누구나 열 수 있다.

#### 전용 블록 타입 (Proprietary Block Type)

특정 앱이 정의하고, **해당 앱(또는 명시적으로 허용된 앱)만 생산할 수 있는** 블록 타입이다.

| 블록 타입 | Definer | Producers (생산 가능) |
|---|---|---|
| `quiz` | 퀴즈 서비스 App | 퀴즈 서비스 App만 |
| `yt_analytics` | Viewtrap 클론 App | Viewtrap 클론 App만 |
| `github_pr` | SSOTA GitHub App | SSOTA GitHub App만 |
| `github_branch` | SSOTA GitHub App | SSOTA GitHub App만 |

전용 타입은 OS의 전용 파일 포맷(.psd, .sketch, .fig)과 같다. 해당 앱만 만들 수 있고, 다른 앱은 제한적으로만 읽을 수 있다.

### 예시: 다양한 앱이 이미지 블록을 생산하는 흐름

```
[이미지 검색 앱]
  └── App Tool: "이미지 검색"
      └── Unsplash에서 이미지를 찾아서 → image 블록으로 캔버스에 배치
      └── 이 블록의 Definer는 SSOTA Image App
      └── Producer는 이미지 검색 앱

[AI 이미지 생성 앱]
  └── App Tool: "이미지 생성"
      └── 프롬프트로 이미지를 생성하여 → image 블록으로 캔버스에 배치
      └── 이 블록의 Definer는 SSOTA Image App
      └── Producer는 AI 이미지 생성 앱

[사용자 직접 업로드]
  └── 드래그앤드롭으로 이미지 파일 올림
      └── image 블록으로 캔버스에 배치
      └── Definer는 SSOTA Image App
      └── Producer는 없음 (사용자 직접)

세 경우 모두:
  - 동일한 image 블록 타입 (동일한 propertiesSchema, 동일한 뷰어)
  - 동일한 Block Tool 사용 가능 (이미지 편집, 배경 제거, 리사이즈 등)
  - 출처(Producer)만 다름
```

### 데이터 모델에 반영

#### AppDefinition에 producibleBlockTypes 추가

```typescript
interface AppDefinition {
  // ... 기존 필드 ...

  // 이 앱이 "정의"하는 블록 타입들 (Definer 역할)
  blockTypeDefinitions: BlockTypeDefinition[];

  // 이 앱이 "생산"할 수 있는 블록 타입들 (Producer 역할)
  // 자기가 정의하지 않은 개방형 타입도 포함 가능
  producibleBlockTypes: string[];  // 예: ["image", "markdown"]
}
```

#### BlockTypeDefinition에 openType 추가

```typescript
interface BlockTypeDefinition {
  // ... 기존 필드 ...

  // 이 블록 타입이 개방형인지 전용인지
  openType: boolean;
  // true: 다른 앱도 이 타입의 블록을 생산할 수 있음 (image, markdown, link 등)
  // false: definer 앱만 생산 가능 (quiz, github_pr 등)
}
```

#### blocks 테이블에 created_by_app_id 추가

```diff
 blocks:
   app_id: UUID              -- 이 블록 타입을 "정의"한 앱 (Definer)
   block_type: TEXT           -- 블록 타입 이름
+  created_by_app_id: UUID   -- 이 블록을 실제로 "생산"한 앱 (Producer, nullable)
                              -- null이면 사용자가 직접 생성
```

### 요약

```
개방형 타입 (Open Block Type):
  "JPEG 같은 표준 포맷"
  ├── 시스템(또는 기본 앱)이 정의
  ├── 누구나 생산 가능
  ├── 누구나 소비 가능
  └── 예: image, markdown, link, text

전용 타입 (Proprietary Block Type):
  "PSD 같은 전용 포맷"
  ├── 특정 앱이 정의
  ├── 해당 앱만 생산 가능
  ├── 다른 앱은 제한적 소비 (읽기만 가능)
  └── 예: quiz, yt_analytics, github_pr

앱의 세 가지 역할:
  Definer:  블록 타입을 정의 (스키마, 뷰어, Block Tool)
  Producer: 블록 인스턴스를 생산 (자기가 정의한 타입 + 개방형 타입)
  Consumer: 블록 인스턴스를 읽거나 편집
```

---

## 6. 개념 정의

### 6.1 App (앱)

#### 정의

App은 **블록 타입을 정의하는 청사진**이다. 하나의 앱은 하나 이상의 블록 타입을 정의하며, 각 블록 타입에 대한 UI(뷰어/에디터), 데이터 스키마(properties), AI 도구(Block Tool + App Tool)를 포함한다.

#### 구성 요소

| 요소 | 설명 |
|------|------|
| **Block Type Definitions** | 이 앱이 정의(define)하는 블록 타입들 (0개 이상). Definer 역할 |
| **Producible Block Types** | 이 앱이 생산(produce)할 수 있는 블록 타입들. 자기가 정의하지 않은 개방형 타입 포함 가능. Producer 역할 |
| **App Tools** | 블록과 무관하게 앱 수준에서 실행할 수 있는 도구 |
| **UI Renderer** | DOM에 렌더링되는 사용자 인터랙션 코드 |
| **Sub Agents** | (선택) 앱이 제공하는 데모 서브 에이전트 — 앱 Tool 활용 예시 패키지 (§6.9 참조) |

#### 앱 분류

| 분류 | 설명 | 예시 |
|------|------|------|
| **Built-in App** | SSOTA에 내장된 앱. 항상 사용 가능. | SSOTA Markdown, SSOTA YouTube, SSOTA Image 등 |
| **1st-party App** | SSOTA 팀이 제공하는 추가 앱. 설치 필요. | SSOTA Remotion, SSOTA 3D Renderer 등 |
| **Community App** | 커뮤니티가 바이브 코딩으로 만든 앱. 마켓에서 설치. | Viewtrap 클론, 퀴즈 서비스, 단어장 등 |

#### 예시

```
SSOTA YouTube App:
├── Block Type Definitions:
│   └── youtube (유튜브 블록)
│       ├── propertiesSchema: { url, youtubeTitle, youtubeThumbnail, ... }
│       ├── blockTools: [타임이동, 스크립트 추출, 요약 추출]
│       ├── isEditable: false (Read-Only)
│       └── sourceCapability: { sourceType: "youtube", extractable: true, summarizable: true }
├── App Tools:
│   └── (없음 — 블록 타입이 하나이므로 Block Tool로 충분)
└── UI Renderer: YoutubeBlockComponent

SSOTA GitHub App:
├── Block Type Definitions:
│   ├── github_pr (PR 블록)
│   │   ├── propertiesSchema: { prUrl, prTitle, prStatus, ... }
│   │   ├── blockTools: [PR 상세 조회, 리뷰 요약]
│   │   └── isEditable: false
│   ├── github_branch (브랜치 블록)
│   │   ├── propertiesSchema: { branchName, repoUrl, ... }
│   │   └── blockTools: [커밋 목록 조회]
│   └── github_commit (커밋 블록)
│       ├── propertiesSchema: { commitHash, message, ... }
│       └── blockTools: [diff 조회]
├── App Tools:
│   ├── createPR: PR 생성
│   └── searchRepos: 레포지토리 검색
└── UI Renderer: GithubBlockComponents

SSOTA Image App:
├── Block Type Definitions: (Definer 역할)
│   └── image (이미지 블록, openType: true ← 다른 앱도 생산 가능)
│       ├── propertiesSchema: { src, alt, width, height, aspectRatio, ... }
│       ├── blockTools: [이미지 편집, 배경 제거, 리사이즈]
│       └── isEditable: false
├── Producible Block Types: ["image"] (자기가 정의한 타입)
├── App Tools:
│   ├── imageGenerate: 프롬프트 기반 이미지 생성 → image 블록 생산
│   ├── promptSearch: 프롬프트 라이브러리에서 검색
│   └── promptSave: 프롬프트 라이브러리에 저장
└── UI Renderer: ImageBlockComponent

이미지 검색 앱 (커뮤니티 앱 예시):
├── Block Type Definitions: [] (자체 블록 타입 없음, Definer 아님)
├── Producible Block Types: ["image"] (개방형 타입인 image 블록을 생산)
├── App Tools:
│   └── searchImages: Unsplash/Pexels에서 이미지 검색 → image 블록 생산
└── UI Renderer: ImageSearchPanelComponent
```

### 6.2 Block (블록)

#### 정의

Block은 **블록 타입의 인스턴스**이다. 앱이 정의한 블록 타입에 따라 데이터가 채워지고, 캔버스 위에 배치된다. 블록을 생산(produce)하는 앱은 블록 타입을 정의(define)한 앱과 다를 수 있다 (개방형 블록 타입의 경우).

#### 구성 요소

| 요소 | 설명 |
|------|------|
| **appId** | 이 블록을 정의한 앱의 ID |
| **blockType** | 앱이 정의한 블록 타입 이름 |
| **title** | 블록 제목 |
| **properties** | 앱이 정의한 propertiesSchema에 따른 데이터 |
| **content** | 블록의 본문 콘텐츠 (마크다운, TipTap JSON 등) |
| **sourceId** | (선택) 외부 소스 연동 |

#### 블록이 캔버스에 존재한다는 것의 의미

블록은 단순한 데이터 덩어리가 아니다. 블록이 캔버스에 존재한다는 것은:

1. **데이터**가 있다 (properties, content)
2. 이 데이터를 해석하는 **뷰어/에디터**가 있다 (Type Definer 앱의 UI Renderer)
3. 이 데이터를 조작하는 **도구**가 있다 (Type Definer 앱의 Block Tools)
4. 에이전트가 이 도구를 사용할 수 있다 (executeBlockTool)
5. 블록은 MCP 도구 호출 결과의 **물질화**이기도 하다 — 영속성, 관계, 검색 가능성을 갖춘 영구적 작업 결과물

### 6.3 Block Type Definition (블록 타입 정의)

#### 정의

Block Type Definition은 앱이 선언하는 **블록 타입의 청사진**이다. 하나의 앱은 여러 블록 타입을 정의할 수 있다.

#### 구성 요소

| 요소 | 설명 |
|------|------|
| **typeName** | 블록 타입 식별자 (예: "youtube", "github_pr") |
| **displayName** | UI에 표시되는 이름 (예: "유튜브", "GitHub PR") |
| **icon** | 블록 타입 아이콘 |
| **propertiesSchema** | 이 블록 타입의 properties 데이터 스키마 (JSON Schema) |
| **blockTools** | 이 블록 타입 인스턴스에서 사용 가능한 Block Tool 목록 |
| **isEditable** | Read-Only vs Editable |
| **openType** | 개방형 여부. true면 다른 앱도 이 타입의 블록을 생산 가능 (image, markdown 등). false면 definer 앱만 생산 가능 (quiz, github_pr 등) |
| **defaultViewMode** | 기본 뷰 모드 |
| **supportedViewModes** | 지원하는 뷰 모드 목록 |
| **sourceCapability** | (선택) 외부 소스 연동 능력 |

#### Block Tool vs App Tool 구분

| | Block Tool | App Tool |
|---|---|---|
| **대상** | 특정 블록 인스턴스에 대해 동작 | 블록과 무관하게 앱 수준에서 동작 |
| **호출** | `executeBlockTool(blockMountId, toolName, params)` | `executeAppTool(appName, toolName, params)` |
| **예시** | 유튜브 블록의 "타임이동", 이미지 블록의 "배경 제거" | 이미지 앱의 "이미지 생성", GitHub 앱의 "PR 생성" |
| **필요 조건** | 해당 타입의 블록이 캔버스에 존재해야 함 | 앱이 설치되어 있으면 됨 |

### 6.4 Tool Definition (도구 정의)

#### 정의

Tool Definition은 에이전트가 사용할 수 있는 **능력의 선언적 정의**이다.

#### 4계층 구조

| 계층 | 스코프 | 정의 위치 | 설명 |
|------|--------|----------|------|
| **Global Tool** | 전역 | 시스템 코드 | 어디서든 사용 가능한 기본 도구 |
| **Block Tool** | 블록 인스턴스 | App의 BlockTypeDefinition | 블록 데이터를 조회/조작하는 도구 |
| **App Tool** | 앱 | App의 AppDefinition | 앱 수준에서 실행하는 도구 |
| **Sub Agent** | 위임 | Sub Agent Definition | 서브 에이전트도 Tool처럼 호출 가능 |

#### Tool Definition 형식

```typescript
interface ToolDefinition {
  name: string;                    // 도구 이름
  description: string;             // 도구 설명 (LLM이 참조)
  inputSchema: JSONSchema;         // 입력 파라미터 스키마
  executionSide: 'server' | 'client';  // 실행 위치
}
```

### 6.5 App Installation (앱 설치)

#### 정의

App Installation은 **어떤 앱이 어디에 설치되어 있는지**를 추적하는 모델이다.

#### 설치 스코프

| 스코프 | 설명 | 영향 범위 |
|--------|------|----------|
| **워크스페이스** | 워크스페이스 전체에서 사용 가능 | 모든 페이지에서 해당 앱의 블록 타입 사용 가능 |
| **페이지** | 해당 페이지에서만 사용 가능 | 해당 페이지에서만 블록 타입 사용 가능 |

#### Built-in App은 설치가 필요 없다

Built-in App (SSOTA Markdown, SSOTA YouTube 등)은 `app_installations` 레코드 없이 항상 사용 가능하다. 워크스페이스 생성 시 자동으로 활성화된다.

### 6.6 Block Context Action (블록 컨텍스트 액션)

#### 정의

Block Context Action은 **설치된 앱이 특정 블록 타입의 컨텍스트 메뉴에 액션을 주입하는 메커니즘**이다. 이를 통해 앱은 자기가 정의하지 않은 블록 타입에서도 App Tool을 트리거할 수 있다.

#### OS에서의 비유

```
macOS:
  .html 파일 우클릭 → "Open With..." → Chrome / Safari / Firefox
  설치된 앱에 따라 메뉴가 동적으로 변경됨

SSOTA:
  링크 블록 우클릭 → "쏘타 크롤로 사이트 매핑" / "SEO 분석하기" / ...
  설치된 앱에 따라 컨텍스트 메뉴가 동적으로 확장됨
```

#### 핵심 구조

```typescript
interface BlockContextAction {
  // 이 액션이 노출될 블록 타입
  targetBlockType: string;    // "link", "image" 등

  // UI 표시 정보
  label: string;              // "쏘타 크롤로 사이트 매핑"
  icon?: string;              // 아이콘

  // 실행할 App Tool
  appToolName: string;        // "mapSite"

  // 블록 데이터 → App Tool 파라미터 자동 매핑
  paramMapping: Record<string, string>;
  // 예: { url: "properties.url" }
  // → 링크 블록의 properties.url 값을 App Tool의 url 파라미터로 전달
}
```

#### AppDefinition에 반영

```typescript
interface AppDefinition {
  // ... 기존 필드 ...

  // 이 앱이 다른 블록 타입에 주입하는 컨텍스트 액션
  blockContextActions?: BlockContextAction[];
}
```

#### 예시

```
SSOTA Crawl App:
├── blockContextActions:
│   ├── { targetBlockType: "link", label: "쏘타 크롤로 사이트 매핑",
│   │     appToolName: "mapSite", paramMapping: { url: "properties.url" } }
│   ├── { targetBlockType: "link", label: "쏘타 크롤로 크롤링 시작",
│   │     appToolName: "crawlSite", paramMapping: { entryUrl: "properties.url" } }
│   └── { targetBlockType: "link", label: "쏘타 크롤로 일괄 스크래핑",
│         appToolName: "batchScrape", paramMapping: { urls: "properties.url" } }

SEO 분석 앱 (커뮤니티 앱 예시):
├── blockContextActions:
│   └── { targetBlockType: "link", label: "SEO 분석하기",
│         appToolName: "analyzeSEO", paramMapping: { url: "properties.url" } }
```

#### 실행 흐름

```
1. 유저가 링크 블록 우클릭
2. 시스템이 AppRegistry에서 targetBlockType === "link"인 모든 blockContextActions 수집
3. 컨텍스트 메뉴에 해당 액션들 표시 (앱 이름과 함께 그룹핑)
4. 유저가 "쏘타 크롤로 사이트 매핑" 클릭
5. paramMapping에 따라 블록 properties에서 파라미터 추출
6. executeAppTool(appName: "ssota-crawl", toolName: "mapSite", params: { url: "https://..." })
7. App Tool 실행 → 결과 블록 생성 + 원본 블록과 엣지 연결
```

#### 의의

Block Context Action은 **앱 생태계의 결합력**을 만들어낸다. 개별 앱이 독립적으로 동작하면서도, 다른 블록 타입과의 자연스러운 상호작용을 선언적으로 정의할 수 있다. 앱이 늘어날수록 각 블록 타입에서 할 수 있는 일이 자연스럽게 늘어나는 구조이다.

### 6.7 Tab Data = Properties 원칙

#### 정의

블록의 에디터 탭(Editor Tab)에 표시되는 모든 데이터는 **블록의 properties에 저장**한다. 별도의 저장소나 외부 참조 없이, 블록이 자기 데이터를 완전히 소유한다.

#### 배경

블록의 에디터 탭은 블록 데이터의 다양한 "뷰"를 제공한다. 예를 들어 링크 블록은 요약, 추출, 스크린샷, 이미지, 디자인, JSON 등의 탭을 가질 수 있다. 이 탭 데이터를 어디에 저장할 것인가에 대한 명확한 원칙이 필요하다.

#### 원칙: Properties에 직접 저장

```
properties: {
  // 기본 데이터 (블록 뷰 렌더링에 필요)
  url: "https://example.com",
  ogTitle: "Example",
  ogImage: "https://...",
  ogDescription: "...",

  // 탭 데이터 (에디터 탭에서 표시)
  tabs: {
    summary: {
      ko: "한국어 요약 내용...",
      en: "English summary..."
    },
    extract: {
      markdown: "# 추출된 마크다운 원문...",
      language: "ko"
    },
    screenshot: {
      url: "https://storage.ssota.com/screenshots/abc.png",
      capturedAt: "2026-02-13T..."
    },
    images: [
      { url: "https://...", alt: "...", width: 800, height: 600 },
      ...
    ],
    design: {
      colors: ["#fff", "#000"],
      fonts: ["Inter", "Pretendard"],
      metadata: { ... }
    },
    json: {
      schema: { ... },
      data: { ... }
    }
  }
}
```

#### 이유

1. **용량 우려 불필요**: 탭 데이터의 대부분은 텍스트(요약, 마크다운, JSON)이거나 URL 참조(스크린샷, 이미지)이다. 이미지 파일 자체가 properties에 들어가는 것이 아니라 URL만 저장하므로 용량 문제가 없다.

2. **단순성**: 블록 하나를 조회하면 모든 탭 데이터가 함께 온다. 별도의 join이나 추가 쿼리가 필요 없다.

3. **물질화 일관성**: 블록의 properties는 "이 블록이 알고 있는 모든 것"을 나타낸다. 탭 데이터도 블록의 지식이므로 properties에 있는 것이 자연스럽다.

4. **캔버스에 올리기**: 탭 데이터를 독립 블록으로 물질화할 때, properties에서 바로 꺼내서 새 블록의 properties/content에 넣으면 된다.

#### 자동 인덱싱과의 관계

블록이 생성될 때 자동으로 수행되는 인덱싱(추출, 요약 등)의 결과도 properties.tabs에 저장된다. 자동 인덱싱은 Source 도메인의 서비스가 실행하지만, 결과는 블록의 properties로 돌아온다.

```
[블록 생성 흐름]
1. 유저가 링크 블록 추가 (URL 입력)
2. Source 도메인에서 자동 인덱싱 실행:
   ├── firecrawl로 마크다운 추출 → properties.tabs.extract에 저장
   └── 추출 결과에서 요약 생성 → properties.tabs.summary에 저장
3. 블록 UI가 properties를 읽어 탭 렌더링

[Block Tool 실행 흐름]
1. 유저가 "스크린샷" Block Tool 실행
2. 동일한 서비스가 스크린샷 캡처
3. 결과를 properties.tabs.screenshot에 저장
4. 에디터 탭 UI 갱신
```

자동 인덱싱과 Block Tool은 **동일한 서비스를 공유**한다. 차이는 실행 시점뿐이다:
- 자동 인덱싱: 블록 생성 시 자동 실행
- Block Tool: 유저가 명시적으로 요청할 때 실행

### 6.8 Source Capability (소스 능력)

#### 현재 Source 도메인의 재해석

현재 `sources` 테이블은 블록과 별도의 도메인이다. "블록 = 앱 인스턴스" 관점에서 보면:

- **Source는 특정 앱들이 가진 capability**이다
- YouTube 앱은 "URL에서 콘텐츠를 추출하는 능력"이 있음
- PDF 앱도 마찬가지
- 마크다운 앱은 이 능력이 없음

```
현재:
  Block ──source_id──→ Source (별도 도메인)
  Source는 독립적 엔티티

새 관점:
  Block ──app_id──→ App
  App이 sourceCapability를 가지면 → Source 연동 가능
  Source는 App의 능력으로 인해 존재하는 것
```

Source 도메인 자체를 없앨 필요는 없다. 다만 "Source가 왜 존재하는가?"에 대한 답이 바뀐다:
- **현재**: "외부 콘텐츠를 관리하기 위해"
- **새 모델**: "특정 앱들이 sourceCapability를 갖고 있기 때문에"

### 6.9 App Sub Agent (앱 서브 에이전트)

#### 정의

App Sub Agent는 앱 제작자가 자기 앱의 App Tool을 조합하여 만든 **데모 서브 에이전트 패키지**이다. "이 앱의 Tool로 이런 자동화가 가능합니다"를 보여주는 예시이다.

#### 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **데모 패키지** | 앱 제작자가 제공하는 Tool 활용 예시. 앱 설치 시 함께 등록됨 |
| **자기 앱 Tool 중심** | 주로 자기 앱의 App Tool만 사용. 다른 앱 Tool 의존성은 가능하지만 최소화 |
| **오케스트레이션 레이어** | App Tool이 "단일 기능 실행"이라면, 서브 에이전트는 "여러 Tool을 LLM 판단으로 순차 조합"하는 상위 추상화 |
| **메인 에이전트가 호출** | 서브 에이전트는 항상 메인 에이전트(Sophie)에 의해 호출되거나, 유저가 직접 지정. 서브 에이전트끼리 재귀 호출하지 않음 |
| **유저 커스텀의 출발점** | 유저는 이 데모를 참고하여 자기만의 서브 에이전트를 만들 수 있음. 유저 커스텀은 여러 앱의 Tool을 자유롭게 조합 가능 |

#### App Tool vs Sub Agent vs 유저 커스텀 서브 에이전트

```
App Tool (단위 작업):
  "사이트 매핑해줘"
  → executeAppTool("ssota-crawl", "mapSite", { url: "..." })
  → 단일 기능, 결정적 실행

App Sub Agent (데모 워크플로우):
  "경쟁사 분석해줘"
  → callSubAgent("competitor-analysis", "competitor.com 분석")
  → 앱 제작자가 만든 예시. 자기 앱 Tool을 순차 조합
  → mapSite → crawlSite → summarize → canvasdown

유저 커스텀 서브 에이전트 (자유 조합):
  "투자 리서치해줘"
  → callSubAgent("investment-research", "삼성전자 분석")
  → 유저가 직접 만든 조합. 여러 앱의 Tool을 자유롭게 사용
  → 쏘타 크롤.batchScrape + 주식앱.getFinancials + ...
```

#### UI 경로 vs 에이전트 경로

서브 에이전트가 수행하는 작업은 앱 모달 UI에서 유저가 수동으로도 할 수 있다. 같은 결과에 도달하지만 경로가 다르다.

```
UI 경로 (인간을 위한 것):
  앱 모달 → URL 입력 → "매핑" 클릭 → 결과 확인 → "크롤링" 클릭 → 결과 확인 → "저장"

에이전트 경로 (자동화를 위한 것):
  유저: "분석해줘" → Sophie → callSubAgent → Tool 직접 호출 → 결과 캔버스에 배치

에이전트는 셸 스크립트처럼 Tool을 직접 호출한다.
UI를 조작하는 것이 아니라, Tool이라는 API를 직접 실행하는 것이다.
UI는 인간을 위한 인터페이스이고, Tool은 에이전트를 위한 인터페이스이다.
```

#### 호출 구조

```
[메인 에이전트 Sophie]
│
├── callSubAgent("competitor-analysis", task)
│   └── [경쟁사 분석 서브 에이전트]
│       ├── executeAppTool("ssota-crawl", "mapSite", ...)
│       ├── executeAppTool("ssota-crawl", "crawlSite", ...)
│       └── canvasdown(...)
│
└── 서브 에이전트의 결과를 받아서 후속 작업 진행

※ 서브 에이전트는 다른 서브 에이전트를 호출하지 않는다.
※ 추가 작업이 필요하면 결과를 메인에 반환하고, 메인이 판단하여 다른 도구를 호출한다.
```

---

## 7. 데이터 모델 설계

### 7.1 새로 필요한 모델

#### `app_definitions` — 앱의 청사진

```typescript
interface AppDefinition {
  id: string;                     // UUID
  name: string;                   // "SSOTA YouTube", "SSOTA GitHub", "퀴즈 서비스"
  slug: string;                   // "ssota-youtube", "ssota-github", "quiz-service"
  description: string;            // 앱 설명
  version: string;                // "1.0.0"
  author: string;                 // "ssota" | userId
  category: AppCategory;          // 'built-in' | 'first-party' | 'community'
  
  // 이 앱이 정의(define)하는 블록 타입들 — Definer 역할
  blockTypeDefinitions: BlockTypeDefinition[];
  
  // 이 앱이 생산(produce)할 수 있는 블록 타입들 — Producer 역할
  // 자기가 정의한 타입 + 다른 앱이 정의한 개방형(open) 타입 포함 가능
  producibleBlockTypes: string[];  // 예: ["image", "markdown"]
  
  // 이 앱이 제공하는 앱 레벨 도구들
  appTools: ToolDefinition[];
  
  // (Phase 5) 앱에 포함된 서브 에이전트
  subAgents?: SubAgentDefinition[];
  
  // 다른 블록 타입에 주입하는 컨텍스트 액션 (§6.6 참조)
  blockContextActions?: BlockContextAction[];
  
  // UI 렌더러 정보
  rendererInfo: {
    componentPath: string;        // 렌더링 컴포넌트 경로
    editorPath?: string;          // 에디터 컴포넌트 경로 (Editable인 경우)
  };
  
  // 메타데이터
  iconUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

type AppCategory = 'built-in' | 'first-party' | 'community';
```

#### `block_type_definitions` — 블록 타입의 청사진

```typescript
interface BlockTypeDefinition {
  id: string;                     // UUID
  appId: string;                  // FK → app_definitions.id
  typeName: string;               // "youtube", "github_pr" 등
  displayName: string;            // "유튜브", "GitHub PR"
  icon: string;                   // 아이콘 식별자
  
  // 데이터 스키마
  propertiesSchema: JSONSchema;   // 현재 YoutubeBlockProperties 같은 것의 선언적 표현
  defaultProperties: Record<string, unknown>;  // 기본값
  
  // Block Tools
  blockTools: ToolDefinition[];   // 이 블록 타입의 Block Tool
  
  // 뷰어/에디터 속성
  isEditable: boolean;
  defaultViewMode: BlockViewMode;
  supportedViewModes: BlockViewMode[];
  
  // 개방형 여부
  openType: boolean;  // true: 다른 앱도 이 타입의 블록을 생산 가능 (image, markdown 등)
                      // false: definer 앱만 생산 가능 (quiz, github_pr 등)
  
  // Source 연동 능력 (선택)
  sourceCapability?: {
    sourceType: string;           // "youtube", "pdf" 등
    extractable: boolean;         // 콘텐츠 추출 가능 여부
    summarizable: boolean;        // 요약 가능 여부
  };
}
```

#### `app_installations` — 앱 설치 상태

```typescript
interface AppInstallation {
  id: string;                     // UUID
  appId: string;                  // FK → app_definitions.id
  
  // 스코프
  scope: 'workspace' | 'page';
  scopeId: string;                // workspaceId 또는 pageId
  
  // 설치 상태
  installedAt: Date;
  installedBy: string;            // userId
  enabled: boolean;
  
  // 앱별 설정
  config?: Record<string, unknown>;
}
```

### 7.2 기존 모델의 변화

#### `blocks` 테이블 변경

```diff
 blocks:
   id: UUID
   workspace_id: UUID
-  block_type: enum (하드코딩 20개)   -- DB enum, 추가 시 마이그레이션 필요
+  block_type: TEXT                    -- 앱이 정의한 typeName 참조, 동적 확장 가능
+  app_id: UUID (FK → app_definitions.id)  -- 이 블록 타입을 "정의"한 앱 (Definer)
+  created_by_app_id: UUID (nullable, FK → app_definitions.id)  -- 이 블록을 "생산"한 앱 (Producer)
+                                      -- null이면 사용자 직접 생성 또는 시스템 생성
   title: TEXT
   properties: JSONB
   content: JSONB
   source_id: UUID (nullable)
   ...
```

핵심 변화:
1. `block_type`이 **enum → TEXT** (또는 FK)로 바뀜 → 새 블록 타입 추가 시 DB 마이그레이션 불필요
2. `app_id` 추가 → "이 블록 타입을 정의한 앱(Definer)"을 명시적으로 표현
3. `created_by_app_id` 추가 → "이 블록을 생산한 앱(Producer)"을 추적. 개방형 타입에서 어떤 앱이 만든 블록인지 구분
4. `properties`의 스키마 검증이 `BlockTypeDefinition.propertiesSchema`에서 동적으로 수행

#### `BlockPropertiesFactory`의 역할 변화

```
현재:
  BlockPropertiesFactory ← 하드코딩된 Map<blockType, factoryFn>
    factory.register('youtube', YoutubeBlockPropertiesVO.createDefault)
    factory.register('markdown', MarkdownBlockPropertiesVO.createDefault)
    ... 20개

새 모델:
  AppRegistry ← AppDefinition[]을 관리하는 레지스트리
    built-in apps → 코드에 정적 정의 (성능), BUT AppDefinition 인터페이스를 구현
    community apps → DB에서 동적 로딩
  
  BlockPropertiesFactory ← AppRegistry를 참조하여 동적으로 팩토리 함수 결정
    factory.createForBlockType(blockType) 
      → appRegistry.getApp(blockType) 
      → app.blockTypeDefinitions[blockType].propertiesSchema 
      → 스키마 기반 인스턴스 생성
```

Built-in 앱은 성능을 위해 여전히 코드에 정적 정의를 갖되, `AppDefinition` 인터페이스를 구현하는 형태가 된다.

### 7.3 전체 데이터 모델 관계도

```
┌───────────────────────────┐
│      app_definitions       │ ← 앱의 청사진 (built-in + community)
│  id, name, category        │
│  appTools[]                │
│  producibleBlockTypes[]    │ ← Producer 역할: 생산 가능한 블록 타입 목록
│  rendererInfo              │
├───────────────────────────┤
│  block_type_definitions    │ ← Definer 역할: 앱이 정의하는 블록 타입들 (1:N)
│  typeName                  │
│  propertiesSchema          │
│  blockTools[]              │
│  openType: boolean         │ ← true: 개방형 (다른 앱도 생산 가능)
│  sourceCapability?         │    false: 전용 (definer만 생산 가능)
└───────────┬───────────────┘
            │ defines
            │
┌───────────▼───────────────┐         ┌────────────────────┐
│         blocks             │ ────→  │     sources          │
│  app_id (FK)               │ source │  url, source_type    │
│  created_by_app_id (FK?)   │   _id  │  raw_content         │
│  block_type (TEXT)         │        │  source_summaries[]  │
│  properties (JSONB)        │        │  source_jobs[]       │
│  content (JSONB)           │        │                      │
└───────────┬───────────────┘         └────────────────────┘
            │ mount          app_id = Definer (이 블록 타입을 정의한 앱)
            │                created_by_app_id = Producer (이 블록을 생산한 앱, nullable)
┌───────────▼───────────────┐         ┌────────────────────┐
│       block_mounts         │         │  app_installations  │
│  page_id, block_id         │         │  app_id, scope      │
│  position, size            │         │  scope_id, enabled   │
│  view_mode, z_order        │         │  config              │
└───────────────────────────┘         └────────────────────┘
```

---

## 8. 현재 상태에서의 변화

### 8.1 현재 상태 요약

| 영역 | 현재 구현 |
|------|----------|
| 블록 타입 | `block_type` DB enum (20개 하드코딩) |
| Properties 스키마 | TypeScript `BlockPropertiesMap` + `BlockPropertiesFactory` |
| Properties VO | 타입별 VO 클래스 (예: `YoutubeBlockPropertiesVO`) |
| Block Tool | 코드에 산재 (유튜브 스크립트 추출, 요약 등) |
| App Tool | 존재하지 않음 |
| 앱 개념 | Sophie Agent Architecture에만 문서화, 코드에 미구현 |
| 소스 연동 | `sources` 별도 도메인, `blocks.source_id`로 연결 |

### 8.2 변경이 필요한 것

#### 반드시 바뀌어야 하는 것

| 변경 | 이유 |
|------|------|
| `AppDefinition` 인터페이스 정의 | 모든 후속 작업의 기반. 이것이 없으면 Block Tool, App Tool의 동적 디스패치가 불가 |
| `BlockTypeDefinition` 인터페이스 정의 | Block Tool을 선언적으로 관리하기 위해 필요 |
| `ToolDefinition` 인터페이스 정의 | 에이전트 시스템의 동적 디스패처가 참조할 도구 정의 |
| `AppRegistry` 구현 | built-in 앱을 등록하고 조회하는 레지스트리 |

#### 점진적으로 바꿀 수 있는 것

| 변경 | 시점 | 이유 |
|------|------|------|
| `blocks.app_id` 컬럼 추가 | 앱 프레임워크 구축 시 | built-in은 기본값으로 채움 |
| `block_type` enum → TEXT | 커스텀 블록 타입 수용 시 | 마이그레이션 필요, 기존 코드 영향 큼 |
| `app_installations` 테이블 | 앱 설치/관리 기능 구축 시 | Phase 3 이후 |
| Source → 앱 capability 재구조화 | 앱 시스템 안정화 후 | 개념적으로는 맞지만 현재 동작하는 코드에 영향 큼 |

#### 바꾸지 않아도 되는 것

| 유지 | 이유 |
|------|------|
| 기존 Properties VO 클래스들 | built-in 앱의 구현체로서 그대로 활용. `AppDefinition` 인터페이스를 구현하도록 래핑만 추가 |
| `sources` 테이블 구조 | Source 도메인은 그대로 유지. 앱의 capability로 "관점"만 바뀜 |
| `block_mounts` 구조 | 캔버스 배치 로직은 앱 시스템과 무관 |
| `BlockPropertiesFactory` | AppRegistry를 참조하도록 내부 구현만 변경, 외부 인터페이스 유지 |

---

## 9. 구현 계획

### 9.1 Phase 구조 개요

```
Phase A: 앱 정의 인터페이스                  ← AppDefinition, BlockTypeDefinition, ToolDefinition
  └─ 코드 레벨에서 "모든 블록 타입은 앱이 정의한 것"이라는 통일된 인터페이스 확립
  └─ DB 스키마 변경 없이, 기존 코드를 래핑하는 방식

Phase B: AppRegistry + Built-in App 등록     ← built-in 앱을 레지스트리에 등록
  └─ 기존 BlockPropertiesFactory를 AppRegistry 기반으로 전환
  └─ Block Tool을 선언적으로 관리

Phase C: 에이전트 시스템 연동                  ← Sophie Agent의 동적 디스패처와 연결
  └─ executeBlockTool, executeAppTool이 AppRegistry를 참조
  └─ 에이전트 컨텍스트에 앱 메타데이터 포함

Phase D: DB 스키마 확장                       ← blocks.app_id, block_type TEXT 전환
  └─ 마이그레이션으로 기존 데이터 업데이트
  └─ app_definitions, app_installations 테이블 생성

Phase E: 커뮤니티 앱 프레임워크               ← 동적 앱 로딩, 앱 마켓
  └─ 커뮤니티 앱 개발 서브 에이전트
  └─ 앱 배포/설치/관리 시스템
```

### 9.2 Phase A: 앱 정의 인터페이스

> 목표: DB 변경 없이, 코드 레벨에서 "모든 블록 타입은 앱이 정의한 것"이라는 인터페이스를 확립한다.

#### Step A-1. 핵심 인터페이스 정의

```
신규 파일:
├── domains/app-system/shared/
│   ├── interfaces/
│   │   ├── app-definition.interface.ts
│   │   │   └── IAppDefinition: { id, name, slug, description, category, blockTypeDefinitions, appTools, rendererInfo }
│   │   ├── block-type-definition.interface.ts
│   │   │   └── IBlockTypeDefinition: { typeName, displayName, propertiesSchema, blockTools, isEditable, sourceCapability }
│   │   └── tool-definition.interface.ts
│   │       └── IToolDefinition: { name, description, inputSchema, executionSide }
│   └── types/
│       └── app.types.ts
│           └── AppCategory, AppScope 등 타입 정의
```

**완료 조건**: 인터페이스만 정의. 기존 코드 변경 없음.

#### Step A-2. Built-in App 정의 파일 생성

기존의 하드코딩된 블록 타입들을 `IAppDefinition` 구현체로 래핑한다.

```
신규 파일:
├── domains/app-system/shared/apps/
│   ├── built-in/
│   │   ├── ssota-markdown.app.ts
│   │   │   └── SSotaMarkdownApp: IAppDefinition
│   │   ├── ssota-youtube.app.ts
│   │   │   └── SSotaYoutubeApp: IAppDefinition
│   │   ├── ssota-image.app.ts
│   │   │   └── SSotaImageApp: IAppDefinition
│   │   ├── ssota-github.app.ts
│   │   │   └── SSotaGithubApp: IAppDefinition (3개 블록 타입)
│   │   ├── ssota-python.app.ts
│   │   ├── ssota-link.app.ts
│   │   ├── ssota-pdf.app.ts
│   │   ├── ssota-text.app.ts
│   │   ├── ssota-shape.app.ts
│   │   ├── ssota-audio.app.ts
│   │   ├── ssota-video.app.ts
│   │   ├── ssota-file.app.ts
│   │   ├── ssota-latex.app.ts
│   │   ├── ssota-react.app.ts
│   │   ├── ssota-vercel.app.ts
│   │   ├── ssota-page-mention.app.ts
│   │   └── ssota-group.app.ts
│   └── index.ts
│       └── BUILT_IN_APPS: IAppDefinition[]
```

각 파일은 기존 Properties VO와 컴포넌트를 참조하되, `IAppDefinition` 형식으로 감싼다.

```typescript
// 예시: ssota-youtube.app.ts
export const SSotaYoutubeApp: IAppDefinition = {
  id: 'ssota-youtube',
  name: 'SSOTA YouTube',
  slug: 'ssota-youtube',
  description: '유튜브 영상을 캔버스에 배치하고 스크립트/요약을 추출하는 앱',
  category: 'built-in',
  blockTypeDefinitions: [
    {
      typeName: 'youtube',
      displayName: '유튜브',
      icon: 'youtube',
      propertiesSchema: { /* YoutubeBlockProperties를 JSON Schema로 변환 */ },
      blockTools: [
        { name: '타임이동', description: '영상의 특정 시간으로 이동', inputSchema: { time: 'string' }, executionSide: 'client' },
        { name: '스크립트 추출', description: '영상 스크립트를 추출', inputSchema: { language: 'string' }, executionSide: 'server' },
        { name: '요약 추출', description: '영상 내용을 요약', inputSchema: { language: 'string' }, executionSide: 'server' },
      ],
      isEditable: false,
      defaultViewMode: 'original',
      supportedViewModes: ['original', 'card', 'note'],
      sourceCapability: {
        sourceType: 'youtube',
        extractable: true,
        summarizable: true,
      },
    },
  ],
  appTools: [],
  rendererInfo: {
    componentPath: 'domains/block-management/frontend/components/block/block-type/youtube',
  },
};
```

**완료 조건**: 모든 기존 블록 타입이 `IAppDefinition`으로 선언됨. 기존 로직은 변경하지 않음.

### 9.3 Phase B: AppRegistry + Built-in App 등록

> 목표: AppRegistry를 구현하고, 기존 BlockPropertiesFactory가 이를 참조하도록 전환한다.

#### Step B-1. AppRegistry 구현

```
신규 파일:
├── domains/app-system/shared/
│   └── registry/
│       └── app-registry.ts
│           ├── AppRegistry (싱글턴)
│           │   ├── registerApp(app: IAppDefinition): void
│           │   ├── getApp(appId: string): IAppDefinition | undefined
│           │   ├── getAppByBlockType(typeName: string): IAppDefinition | undefined
│           │   ├── getBlockTypeDefinition(typeName: string): IBlockTypeDefinition | undefined
│           │   ├── getAllApps(): IAppDefinition[]
│           │   ├── getAllBlockTypes(): IBlockTypeDefinition[]
│           │   ├── getBlockToolsForType(typeName: string): IToolDefinition[]
│           │   └── getAppToolsForApp(appId: string): IToolDefinition[]
│           └── initialize(): void  ← BUILT_IN_APPS를 모두 등록
```

#### Step B-2. BlockPropertiesFactory 전환

```
변경 파일:
├── domains/block-management/shared/value-objects/block-properties/factory.ts
│   └── 내부적으로 AppRegistry를 참조하도록 변경
│   └── 외부 인터페이스(createForBlockType, createFromJSON 등)는 유지
│   └── 새 블록 타입은 AppRegistry.getBlockTypeDefinition()에서 propertiesSchema를 읽어 생성
```

**완료 조건**: `BlockPropertiesFactory`가 AppRegistry를 통해 블록 타입 정보를 조회. 기존 동작 완전 호환.

### 9.4 Phase C: 에이전트 시스템 연동

> 목표: Sophie Agent의 동적 디스패처가 AppRegistry를 참조하여 Block Tool, App Tool을 실행한다.

#### Step C-1. executeBlockTool 연동

```
변경 파일:
├── domains/ai-management/backend/services/tools/
│   └── executeBlockTool이 AppRegistry.getBlockToolsForType(blockType)를 참조
│   └── 블록의 blockType으로 사용 가능한 Block Tool 목록을 동적으로 결정
```

#### Step C-2. executeAppTool 연동

```
변경 파일:
├── domains/ai-management/backend/services/tools/
│   └── executeAppTool이 AppRegistry.getAppToolsForApp(appId)를 참조
│   └── 설치된 앱의 App Tool 목록을 동적으로 결정
```

#### Step C-3. 에이전트 컨텍스트에 앱 메타데이터 포함

```
변경 파일:
├── context-builder.ts
│   └── installedApps: AppRegistry에서 사용 가능한 앱 목록 (name, description, blockTypes, appTools 이름만)
├── prompt.ts
│   └── 앱 사용 규칙 추가
│       └── "설치된 앱의 Block Tool은 executeBlockTool로 실행하라"
│       └── "앱 레벨 도구는 executeAppTool로 실행하라"
│       └── "앱 상세 정보가 필요하면 get app으로 조회하라"
```

**완료 조건**: 에이전트가 "이 유튜브 블록에서 사용 가능한 도구가 뭐야?"라고 물으면, AppRegistry에서 Block Tool 목록을 동적으로 반환.

### 9.5 Phase D: DB 스키마 확장

> 목표: DB 레벨에서 앱 시스템을 지원한다.

#### Step D-1. app_definitions 테이블 생성

```sql
CREATE TABLE app_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '1.0.0',
  author TEXT NOT NULL DEFAULT 'ssota',
  category TEXT NOT NULL DEFAULT 'built-in',  -- 'built-in' | 'first-party' | 'community'
  
  block_type_definitions JSONB NOT NULL DEFAULT '[]',
  producible_block_types TEXT[] NOT NULL DEFAULT '{}',  -- Producer 역할: 이 앱이 생산 가능한 블록 타입 이름들
  app_tools JSONB NOT NULL DEFAULT '[]',
  renderer_info JSONB NOT NULL DEFAULT '{}',
  
  icon_url TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_app_definitions_slug ON app_definitions(slug);
```

#### Step D-2. app_installations 테이블 생성

```sql
CREATE TABLE app_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES app_definitions(id) ON DELETE CASCADE,
  
  scope TEXT NOT NULL,            -- 'workspace' | 'page'
  scope_id UUID NOT NULL,         -- workspaceId 또는 pageId
  
  installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}',
  
  UNIQUE(app_id, scope, scope_id)
);

CREATE INDEX idx_app_installations_scope ON app_installations(scope, scope_id) WHERE enabled = true;
```

#### Step D-3. blocks 테이블에 app_id, created_by_app_id 추가

```sql
-- 1. app_id 컬럼 추가 (Definer: 이 블록 타입을 정의한 앱)
ALTER TABLE blocks ADD COLUMN app_id UUID REFERENCES app_definitions(id) ON DELETE SET NULL;

-- 2. created_by_app_id 컬럼 추가 (Producer: 이 블록을 생산한 앱, nullable)
ALTER TABLE blocks ADD COLUMN created_by_app_id UUID REFERENCES app_definitions(id) ON DELETE SET NULL;

-- 3. 기존 블록에 built-in app_id 매핑
-- (block_type enum 값에 따라 해당 built-in app의 id를 설정)
-- (created_by_app_id는 기존 블록의 경우 null 또는 app_id와 동일하게 설정)

-- 4. (향후) block_type을 enum → TEXT로 전환
-- ALTER TABLE blocks ALTER COLUMN block_type TYPE TEXT;
```

**완료 조건**: DB에 앱 정의/설치 테이블이 존재하고, 기존 블록에 app_id가 매핑됨.

### 9.6 Phase E: 커뮤니티 앱 프레임워크

> 목표: 누구나 앱을 만들고 배포할 수 있는 생태계.

#### Step E-1. 커뮤니티 앱 개발 서브 에이전트

- 앱 스캐폴딩 생성
- 커스텀 블록 타입 정의 가이드
- App Tool / Block Tool 정의 가이드
- 앱 패키징 및 배포

#### Step E-2. 앱 마켓

- 앱 검색/탐색 UI
- 앱 설치/제거 (워크스페이스/페이지 단위)
- 앱 버전 관리
- 앱 리뷰/평점

#### Step E-3. 동적 앱 로딩

- community 앱의 UI 컴포넌트를 런타임에 로드
- sandboxed 실행 환경 (보안)
- 앱 간 의존성 관리

### 9.7 Sophie Agent Implementation Plan과의 관계

이 앱 시스템은 [Sophie Agent 구현 계획](../sophie-agent/sophie-implementation-plan.md)과 다음과 같이 연결된다:

| Sophie Phase | App System Phase | 연결 |
|---|---|---|
| **Phase 1**: 메인 에이전트 단독 | **Phase A-B**: 인터페이스 + 레지스트리 | Global Tool만 사용. AppRegistry는 내부 구조 정리용. |
| **Phase 2**: 기본 서브 에이전트 | **Phase C**: 에이전트 연동 | Block Tool을 AppRegistry에서 동적 조회. executeBlockTool 연동. |
| **Phase 3**: 기본 앱 연동 | **Phase C-D**: 에이전트 연동 + DB | App Tool 사용. executeAppTool 연동. app_definitions 테이블. |
| **Phase 4**: 커스텀 서브 에이전트 | - | 직접 관련 없음 |
| **Phase 5**: 커스텀 앱 | **Phase E**: 커뮤니티 앱 | 커뮤니티 앱 개발/배포 시스템 |

**권장 구현 순서**: Sophie Phase 1과 App Phase A를 병렬로 진행한다. Phase A는 DB 변경이 없고, 인터페이스 정의 + built-in 앱 선언만 하면 되므로 빠르게 완료 가능하다. 이것이 완료되면 Sophie Phase 2-3에서 자연스럽게 App Phase B-C와 합류한다.

---

## 10. 개념 관계도

### 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Main Agent (Sophie)                          │
│  Orchestration · Context Layer 기반 의사결정                          │
│                                                                     │
│  Context (동적)              Tools (정적 정의)                       │
│  ┌──────────────────┐       ┌──────────────┐  ┌─────────────────┐  │
│  │ viewport 블록     │       │ Global       │  │ 정적 디스패처    │  │
│  │  (앱 메타 포함)    │       │ (canvasdown, │  │                 │  │
│  │ 선택된 블록        │       │  webSearch,  │  │ · callSubAgent  │  │
│  │ 설치된 앱 목록     │       │  grep, ...)  │  │ · execBlockTool │  │
│  │ activeJobs        │       └──────────────┘  │ · execAppTool   │  │
│  │ recentEvents      │                         └────────┬────────┘  │
│  └──────────────────┘                                   │           │
└─────────────────────────────────────────────────────────┼───────────┘
                                                          │
                    ┌─────────────────────────────────────┼─────────┐
                    │                                     ▼         │
                    │    ┌─────────────────────────────┐            │
                    │    │         Sub Agent            │            │
                    │    │  Skills + Tools (제한)       │            │
                    │    └─────────────────────────────┘            │
                    └───────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        App Registry                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Built-in Apps (항상 사용 가능)                               │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │   │
│  │  │ SSOTA        │  │ SSOTA        │  │ SSOTA        │ ...  │   │
│  │  │ Markdown App │  │ YouTube App  │  │ GitHub App   │      │   │
│  │  │              │  │              │  │              │      │   │
│  │  │ BlockType:   │  │ BlockType:   │  │ BlockTypes:  │      │   │
│  │  │  markdown    │  │  youtube     │  │  github_pr   │      │   │
│  │  │              │  │              │  │  github_branch│     │   │
│  │  │ BlockTools:  │  │ BlockTools:  │  │  github_commit│     │   │
│  │  │  (없음)      │  │  타임이동    │  │              │      │   │
│  │  │              │  │  스크립트추출 │  │ AppTools:    │      │   │
│  │  │ Editable:    │  │  요약추출    │  │  PR 생성     │      │   │
│  │  │  true        │  │              │  │  레포 검색    │      │   │
│  │  │              │  │ Source:      │  │              │      │   │
│  │  │              │  │  youtube     │  │              │      │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Community Apps (설치 필요)                                   │   │
│  │                                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐                         │   │
│  │  │ 퀴즈 서비스   │  │ Viewtrap     │  ...                   │   │
│  │  │ App          │  │ 클론 App     │                         │   │
│  │  │              │  │              │                         │   │
│  │  │ BlockType:   │  │ BlockType:   │                         │   │
│  │  │  quiz        │  │  yt_analytics│                         │   │
│  │  └──────────────┘  └──────────────┘                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          Canvas                                     │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │  Block    │───→│  Block    │    │  Block    │    │  Block    │    │
│  │ (markdown)│    │ (youtube) │    │(github_pr)│    │ (image)  │    │
│  │ Definer:  │    │ Definer:  │    │ Definer:  │    │ Definer: │    │
│  │ Markdown  │    │ YouTube   │    │ GitHub    │    │ Image    │    │
│  │ App       │    │ App       │    │ App       │    │ App      │    │
│  │ openType  │    │ openType  │    │ 전용타입   │    │ openType │    │
│  │           │    │           │    │           │    │ Producer:│    │
│  │           │    │           │    │           │    │ 이미지검색│    │
│  │           │    │           │    │           │    │ App      │    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘     │
│                                                                     │
│  블록 = 블록 타입의 인스턴스. 데이터 + 뷰어 + 도구가 통합된 단위.       │
│  블록은 MCP 도구 호출 결과의 물질화(materialization).                   │
│  개방형 타입은 여러 앱이 생산 가능, 전용 타입은 definer만 생산 가능.      │
│  Canvasdown DSL로 생성/수정/연결/이동. 엣지로 블록 간 관계 표현.        │
└─────────────────────────────────────────────────────────────────────┘
```

### Tool 실행 흐름

```
사용자: "이 유튜브 영상 3분 20초로 이동해줘"

1. 메인 에이전트가 selectedBlockIds에서 유튜브 블록 확인
2. AppRegistry.getBlockToolsForType("youtube") → [타임이동, 스크립트추출, 요약추출]
3. executeBlockTool(blockMountId: "yt-abc", toolName: "타임이동", params: {time: "3:20"})
4. AppRegistry가 해당 Tool의 실행 로직을 찾아 실행

사용자: "이미지 하나 만들어줘"

1. 메인 에이전트가 installedApps에서 SSOTA Image App 확인
2. AppRegistry.getAppToolsForApp("ssota-image") → [이미지 생성, 프롬프트 검색, ...]
3. executeAppTool(appName: "SSOTA Image", toolName: "이미지 생성", params: {prompt: "..."})
4. AppRegistry가 해당 Tool의 실행 로직을 찾아 실행
5. 결과 이미지를 renderCanvasdown으로 캔버스에 배치
```

---

## 용어 요약 (Quick Reference)

| 용어 | 한줄 정의 |
|------|----------|
| **App** | 블록 타입을 정의하는 청사진. UI + Tools + 데이터 스키마를 포함 |
| **Block** | 블록 타입의 인스턴스. 캔버스 위에 배치된 데이터 + 뷰어 + 도구의 통합 단위 |
| **Block Type Definition** | 앱이 선언하는 블록 타입의 청사진 (properties 스키마, Block Tool, 뷰 모드 등) |
| **Block Tool** | 특정 블록 인스턴스에 대해 동작하는 도구 (예: 유튜브 타임이동) |
| **App Tool** | 블록과 무관하게 앱 수준에서 동작하는 도구 (예: 이미지 생성) |
| **Tool Definition** | 에이전트가 사용할 수 있는 능력의 선언적 정의 |
| **AppRegistry** | 모든 앱을 등록하고 조회하는 중앙 레지스트리 |
| **App Installation** | 앱의 설치 상태 (스코프: 워크스페이스 / 페이지) |
| **Source Capability** | 앱이 외부 콘텐츠를 추출/요약하는 능력 |
| **Built-in App** | SSOTA에 내장된 앱. 설치 없이 항상 사용 가능 |
| **Community App** | 커뮤니티가 만든 앱. 마켓에서 설치 필요 |
| **Ambient Context** | 에이전트에게 자동으로 제공되는 캔버스 상태 정보 |
| **에이전트 네이티브 OS** | AI 에이전트를 위해 설계된 OS. 데이터+도구 통합, 관계 그래프, ambient context |
| **물질화 (Materialization)** | MCP 도구 호출의 휘발성 결과를 블록으로 영구 저장하여 캔버스의 시민으로 승격시키는 것 |
| **개방형 블록 타입 (Open)** | 여러 앱이 생산할 수 있는 표준 블록 타입 (image, markdown, link 등) |
| **전용 블록 타입 (Proprietary)** | 특정 앱만 생산할 수 있는 전용 블록 타입 (quiz, github_pr 등) |
| **Type Definer** | 블록 타입의 스키마, 뷰어, Block Tool을 정의하는 앱 |
| **Producer** | 블록 인스턴스를 생산할 수 있는 앱 (Definer가 아닌 앱도 개방형 타입은 생산 가능) |
| **Consumer** | 블록 인스턴스를 읽거나 편집할 수 있는 앱 |
| **Block Context Action** | 설치된 앱이 다른 블록 타입의 컨텍스트 메뉴에 주입하는 액션. OS의 "Open With..." 메뉴와 유사 |
| **Tab Data = Properties** | 블록 에디터 탭의 모든 데이터는 블록의 properties에 저장한다는 원칙. 이미지 등은 URL 참조 |
| **App Sub Agent** | 앱 제작자가 자기 앱 Tool 활용 예시로 제공하는 데모 서브 에이전트 패키지 |
