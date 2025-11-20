# Cursor Prompt Structure Analysis

## Overview
Cursor 프롬프트는 AI 코딩 어시스턴트가 사용자와 페어 프로그래밍을 하는 것처럼 동작하도록 설계된 체계적인 시스템 프롬프트입니다.

## 핵심 철학
1. **자율성 (Autonomy)**: 문제가 완전히 해결될 때까지 계속 진행
2. **명확성 (Clarity)**: 사용자가 쉽게 스킵할 수 있도록 명확하게 작성
3. **효율성 (Efficiency)**: 병렬 툴 호출로 성능 최적화
4. **체계성 (Systematic)**: TODO 기반 작업 관리

---

## 프롬프트 구조 분석

### 1. 역할 정의 (Role Definition)
```
- Identity: AI coding assistant powered by GPT-5
- Context: Operating in Cursor IDE
- Mission: Pair programming with USER
```

**특징**:
- 명확한 정체성과 동작 환경
- 에이전트로서 완전 자율성 강조
- 컨텍스트 정보 자동 수신 (파일, 커서 위치, 편집 기록 등)

---

### 2. `<communication>` - 커뮤니케이션 규칙

**목적**: 사용자에게 읽기 쉬운 응답 제공

**주요 규칙**:
- ✅ 관련 섹션만 마크다운 포맷팅 (전체를 코드 블록으로 감싸지 않음)
- ✅ 파일/함수명은 백틱으로 포맷 (예: `app/components/Card.tsx`)
- ✅ 명확성과 스캔 가능성(skimmability) 최적화
- ✅ 코드 내부에 설명용 주석 금지
- ✅ "patch"가 아닌 "edit"으로 표현
- ✅ 가정하고 진행 (승인 기다리지 않음)

---

### 3. `<status_update_spec>` - 진행 상황 업데이트

**목적**: 사용자가 진행 상황을 실시간으로 파악

**주요 규칙**:
- 📝 1-3문장의 간단한 진행 노트
- 📝 연속적인 대화 스타일 (스토리텔링)
- 📝 시제 정확히 사용 (will/과거형/현재형)
- 📝 "Update:" 같은 헤딩 금지
- 📝 행동 선언 후 즉시 실행 (같은 턴에서)
- 📝 TODO 체크 후 진행 보고

**핵심 원칙**:
```
"Let me search for X" → [실제 검색 실행]
"I found X. Now I'll do Y" → [Y 실행]
"My edit introduced error. Let me fix" → [수정]
```

---

### 4. `<summary_spec>` - 요약

**목적**: 턴 종료 시 고수준 요약 제공

**주요 규칙**:
- 📊 변경사항 및 영향 요약
- 📊 간결한 불릿 포인트 또는 짧은 문단
- 📊 플랜 반복 금지
- 📊 필수적인 경우만 코드 펜스
- 📊 "Summary:" 헤딩 금지
- 📊 짧고 고신호 (high-signal)

---

### 5. `<completion_spec>` - 완료 규칙

**목적**: 모든 작업 완료 시 체크리스트 정리

**주요 규칙**:
- ✔️ TODO 리스트 모두 체크
- ✔️ TODO 리스트 닫기
- ✔️ `<summary_spec>`에 따른 요약

---

### 6. `<flow>` - 작업 흐름

**전체 프로세스**:
```
1. 새 목표 감지 → 간단한 탐색 (read-only)
2. 중대형 작업 → TODO 리스트 생성 / 간단한 작업 → 직접 실행
3. 툴 호출 전 → TODO 업데이트 + 상태 업데이트
4. 모든 작업 완료 → TODO 정리 + 요약
```

**강제 규칙**:
- Status update at: 시작, 툴 배치 전후, TODO 업데이트 후, 편집/빌드/테스트 전, 완료 후, 종료 전

---

### 7. `<tool_calling>` - 툴 호출 규칙

**목적**: 효율적이고 자율적인 툴 사용

**주요 규칙**:
- 🛠️ 제공된 툴만 사용, 스키마 엄격히 준수
- 🛠️ 병렬 툴 호출 최대화 (`<maximize_parallel_tool_calls>`)
- 🛠️ `codebase_search`로 코드 검색
- 🛠️ 의존성 없으면 병렬, 있으면 순차
- 🛠️ 툴 이름 언급 금지 (자연스럽게 행동 설명)
- 🛠️ 툴로 발견 가능하면 사용자에게 질문 금지
- 🛠️ 첫 툴 호출 전 간단한 진행 노트

**Gate 규칙**:
- 새 파일/코드 편집 전 → TODO 업데이트 (merge=true)
- 단계 성공 후 → TODO 상태 즉시 업데이트

---

### 8. `<context_understanding>` - 컨텍스트 이해

**목적**: 코드베이스를 효율적으로 탐색

**주요 규칙**:
- 🔍 Semantic search (`codebase_search`)가 주요 탐색 도구
- 🔍 **CRITICAL**: 넓고 고수준 쿼리로 시작 (예: "authentication flow")
- 🔍 다중 부분 질문을 집중된 하위 쿼리로 분할
- 🔍 **MANDATORY**: 다양한 표현으로 여러 번 검색
- 🔍 자신감 있을 때까지 계속 검색

---

### 9. `<maximize_parallel_tool_calls>` - 병렬 툴 호출 최적화

**목적**: 성능 최적화 (3-5배 빠름)

**주요 규칙**:
- ⚡ **CRITICAL**: 여러 작업 시 동시 실행 (`multi_tool_use.parallel`)
- ⚡ 한 번에 3-5개 툴 호출 (타임아웃 방지)
- ⚡ 정보 수집 시 미리 계획 후 모두 함께 실행
- ⚡ **DEFAULT TO PARALLEL**: 특별한 이유 없으면 병렬

**병렬 가능 케이스**:
- 다른 패턴 검색 (imports, usage, definitions)
- 여러 grep 검색
- 여러 파일 읽기 / 다른 디렉토리 검색
- `codebase_search` + `grep` 조합

---

### 10. `<grep_spec>` - 검색 규칙

**주요 규칙**:
- 🔎 **ALWAYS prefer** `codebase_search` (더 빠름)
- 🔎 `grep`은 정확한 문자열/심볼/패턴 검색에만 사용

---

### 11. `<making_code_changes>` - 코드 변경 규칙

**목적**: 즉시 실행 가능한 코드 작성

**주요 규칙**:
- 💻 코드를 사용자에게 출력 금지 (요청 시 제외)
- 💻 코드 편집 툴 사용
- 💻 필요한 import, 의존성, 엔드포인트 모두 추가
- 💻 새 코드베이스 → 의존성 관리 파일 + README
- 💻 웹앱 → 아름답고 현대적인 UI (UX 모범 사례)
- 💻 긴 해시/바이너리 코드 생성 금지
- 💻 `apply_patch` 사용 시: 5개 메시지 내에 `read_file`로 재확인 안 했으면 다시 읽기
- 💻 `<code_style>` 가이드라인 준수

---

### 12. `<code_style>` - 코드 스타일 가이드

**목적**: 명확하고 읽기 쉬운 코드 작성

**주요 규칙**:

#### Naming
- ❌ 짧은 변수명 금지 (1-2글자)
- ✅ 함수는 동사/동사구, 변수는 명사/명사구
- ✅ 주석 불필요할 정도로 설명적
- ✅ 약어보다 전체 단어
- 예시: `genYmdStr` → `generateDateString`

#### Static Typed Languages
- ✅ 함수 시그니처 및 공개 API 명시적 타입 지정
- ❌ 자명한 변수 타입 지정 금지
- ❌ `any` 같은 unsafe 타입 피하기

#### Control Flow
- ✅ Guard clauses / Early returns
- ✅ 에러 및 엣지 케이스 먼저 처리
- ❌ 불필요한 try/catch 피하기
- ❌ 의미 없는 에러 catch 금지
- ❌ 2-3 레벨 이상 깊은 중첩 피하기

#### Comments
- ❌ 자명한 코드에 주석 금지
- ✅ 복잡한 코드: "why" 설명 (not "how")
- ❌ 인라인 주석 금지
- ❌ TODO 주석 금지 (구현하기)

#### Formatting
- ✅ 기존 코드 스타일 매칭
- ✅ 원라이너/복잡한 삼항 연산자보다 멀티라인
- ✅ 긴 라인 wrap
- ❌ 관련 없는 코드 리포맷 금지

---

### 13. `<linter_errors>` - 린터 에러 처리

**주요 규칙**:
- 🐛 변경사항이 린터 에러 도입하지 않도록 확인
- 🐛 완료 시 `read_lints` 실행
- 🐛 린터 에러 발견 시 수정 (명확한 경우)
- 🐛 타입 안전성 타협 금지
- 🐛 같은 파일에 3번 이상 루프 금지 → 사용자에게 질문
- 🐛 TODO 항목으로 추적 금지

---

### 14. `<non_compliance>` - 규칙 위반 시 처리

**자체 수정 규칙**:
- 🔴 TODO 체크 없이 완료 주장 → 다음 턴 즉시 수정
- 🔴 상태 업데이트 없이 툴 사용 → 다음 턴 수정
- 🔴 테스트/빌드 없이 완료 보고 → 다음 턴 수정
- 🔴 **핵심**: 툴 호출 포함 턴 → 반드시 상위에 1개 이상 업데이트

---

### 15. `<citing_code>` - 코드 인용 규칙

**2가지 방법**:

#### METHOD 1: 코드베이스에 있는 코드
```
startLine:endLine:filepath
export const Todo = () => {
  return <div>Todo</div>;
};
```
- startLine, endLine, filepath 모두 필수
- 언어 태그 추가 금지
- 최소 1줄 코드 표시 필수

#### METHOD 2: 새로운 코드 (코드베이스에 없음)
```python
for i in range(10):
  print(i)
```
- 언어 태그만 추가
- 라인 번호 금지

**공통 규칙**:
- ❌ 라인 번호 포함 금지
- ❌ ``` 펜스 앞 들여쓰기 금지

---

### 16. `<inline_line_numbers>` - 라인 번호 처리

**규칙**:
- 수신한 코드 청크에 "Lxxx:LINE_CONTENT" 형태 포함 가능
- "Lxxx:" 접두사는 메타데이터로 취급 (코드 아님)

---

### 17. `<markdown_spec>` - 마크다운 규칙

**주요 규칙**:
- 📝 `###`, `##` 헤딩 사용 (# 금지 - 압도적)
- 📝 중요 정보는 **볼드**
- 📝 불릿 포인트는 `- ` 사용 (• 금지)
- 📝 불릿에 볼드 마크다운 pseudo-heading
- 📝 파일/클래스/함수는 백틱 (`app/components/Card.tsx`)
- 📝 URL: 베어 URL 금지, 백틱 또는 마크다운 링크
- 📝 수학 표현식: \( \) (inline), \[ \] (block)

---

### 18. `<todo_spec>` - TODO 관리 규칙

**목적**: 작업 추적 및 관리

**정의 규칙**:
- ✅ Atomic todo 항목 (≤14단어, 동사 주도, 명확한 결과)
- ✅ 고수준, 의미 있는, 비자명한 작업 (5분 이상 소요)
- ✅ 여러 파일에 걸친 변경 1개 작업으로 가능
- ❌ 여러 의미적으로 다른 단계를 1개로 합치지 않기
- ❌ 운영 작업 포함 금지 (서비스 작업용)
- ❌ 계획만 요청 시 TODO 생성 금지
- ✅ 구현 요청 시 텍스트 플랜 대신 TODO 리스트

**TODO 내용**:
- ✅ 간단, 명확, 짧음 (빠르게 파악 가능)
- ✅ 동사 및 액션 지향적
  - 예: "Add LRUCache interface to types.ts"
  - 예: "Create new widget on the landing page"
- ❌ 특정 타입, 변수명, 이벤트명 등 세부사항 포함 금지

---

## 프롬프트 설계 패턴 요약

### 1. 계층적 구조
```
Role Definition
├── Communication Rules
├── Work Management (status, summary, completion)
├── Workflow
├── Tool Execution
├── Code Quality (style, linter)
├── Self-Correction
└── Formatting Rules
```

### 2. 명시적 우선순위
- **CRITICAL**: 가장 중요한 규칙
- **MANDATORY**: 필수 규칙
- **ALWAYS**: 항상 준수
- **NEVER**: 절대 금지
- ✅ / ❌: 명확한 Do's and Don'ts

### 3. 예시 기반 학습
- Bad → Good 비교
- 실제 코드 예시
- 구체적인 시나리오

### 4. 자체 수정 메커니즘
- `<non_compliance>`: 규칙 위반 시 자동 수정
- 3번 시도 룰: 무한 루프 방지
- 다음 턴 수정 패턴

### 5. 성능 최적화 강조
- 병렬 툴 호출 강제
- 불필요한 왕복 최소화
- 사용자 경험 우선

---

## SSOTA에 적용 가능한 핵심 요소

### 1. 역할 정의
- Identity: Canvas Agent (not coding assistant)
- Context: SSOTA Canvas OS
- Mission: 블럭 조작 및 맥락 관리

### 2. 커뮤니케이션
- 한국어 응답 우선
- 블럭/캔버스 용어 정의
- 시각적 피드백 강조

### 3. 작업 흐름
- Context Assembly 단계 명시
- Short-term / Long-term Memory 활용
- Canvas Context 우선순위 (Selected > Nearby > Semantic)

### 4. 툴 호출
- 클라이언트 측 실행 명시
- 툴 조합 전략 (예: searchByKeyword → updateProperty)
- 실패 시 대안 제시

### 5. 블럭 조작 규칙
- 선택 블럭 우선 작업
- 위치 계산 (겹치지 않도록)
- 의미적 연결 (엣지) 적극 활용

### 6. 에러 처리
- 툴 실행 실패 시 LLM에 피드백
- 부분 실패 허용 (최소 컨텍스트로 진행)
- 권한 검증 에러 명확히 전달

### 7. TODO 관리
- 블럭 단위 작업 (not 파일)
- 캔버스 변경 사항 추적
- 다중 블럭 작업 그룹화

---

## Cursor와 SSOTA의 차이점

| 요소 | Cursor | SSOTA |
|------|--------|-------|
| **주요 작업** | 코드 편집 | 블럭 조작 |
| **컨텍스트** | 파일, 커서 위치, 편집 기록 | Short/Long-term Memory, Canvas Context |
| **툴** | read_file, apply_patch, grep | addBlock, connectBlocks, searchByKeyword |
| **산출물** | 코드 변경 | 캔버스 레이아웃 변경 |
| **에러 처리** | 린터 에러, 타입 체크 | 툴 실행 실패, 권한 에러 |
| **언어** | 영어 | 한국어 우선 |

---

## 결론

Cursor 프롬프트는 **체계적인 구조, 명시적 규칙, 자율적 실행, 성능 최적화**를 강조합니다.

SSOTA 프롬프트 작성 시:
1. ✅ 계층적 구조 차용 (역할 → 작업 → 툴 → 규칙)
2. ✅ 명시적 우선순위 (CRITICAL, MANDATORY)
3. ✅ 예시 기반 학습 (블럭 조작 시나리오)
4. ✅ 자체 수정 메커니즘
5. ✅ 성능 최적화 (병렬 툴 호출)
6. 🔄 Canvas/Block 용어로 대체
7. 🔄 한국어 응답 규칙 추가
8. 🔄 맥락 관리 강조 (SSOTA 철학)

