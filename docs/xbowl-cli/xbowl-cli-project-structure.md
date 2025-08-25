# Xbowl CLI 프로젝트 구조

## 📁 CLI 프로젝트 폴더 구조

```
apps/xbowl-cli/
├── package.json                 # CLI 패키지 설정
├── tsconfig.json               # TypeScript 설정
├── tsup.config.ts              # 빌드 설정
├── README.md                   # CLI 문서
└── src/
    ├── index.ts                # CLI 진입점 (commander)
    ├── cli/                    # 사용자 인터페이스 레이어
    │   └── commands/
    │       ├── init.ts         # 초기화 명령
    │       ├── sync.ts         # 동기화 명령
    │       ├── status.ts       # 상태 확인 명령
    │       ├── pull.ts         # 원격 데이터 가져오기
    │       ├── collect.ts      # 산출물 수집
    │       ├── diff.ts         # 차이 분석
    │       ├── validate.ts     # 유효성 검사
    │       └── doctor.ts       # 진단 명령
    └── domain/                 # 비즈니스 로직 레이어
        ├── types.ts            # 타입 정의
        ├── constants.ts        # 상수 정의
        ├── fs.ts               # 파일 시스템 유틸리티
        ├── registry.ts         # 레지스트리 관리
        ├── convert.ts          # 블록 변환 엔진
        ├── scaffold.ts         # 폴더 구조 생성
        ├── status.ts           # 상태 관리
        ├── templates/          # 템플릿 시스템
        │   ├── engine.ts       # 템플릿 엔진
        │   ├── claude/
        │   │   ├── agent.md    # Sub-Agent 템플릿
        │   │   ├── command.md  # Slash Command 템플릿
        │   │   └── workflow.md # Workflow Agent 템플릿
        │   └── data/
        │       └── load-data.md # 데이터 로드 템플릿
        ├── sync/               # 동기화 시스템
        │   ├── pull.ts         # DB → 로컬 동기화
        │   ├── collect.ts      # 로컬 → DB 동기화
        │   ├── diff.ts         # 차이 분석
        │   └── validate.ts     # 유효성 검사
        └── utils/              # 유틸리티
            ├── crypto.ts       # 체크섬 계산
            ├── network.ts      # 네트워크 요청
            └── logger.ts       # 로깅
```

## 🎯 레이어 분리 원칙

### CLI 레이어 (src/cli/)

- **역할**: 사용자 인터페이스 및 명령어 처리
- **책임**:
  - Commander.js를 통한 명령어 파싱
  - 사용자 입력 검증
  - 출력 포맷팅 (chalk, ora)
  - 에러 처리 및 사용자 피드백

### Domain 레이어 (src/domain/)

- **역할**: 비즈니스 로직 및 데이터 처리
- **책임**:
  - 블록 변환 엔진
  - 파일 시스템 관리
  - 템플릿 시스템
  - 동기화 로직
  - 상태 관리

## 📋 명령어 구조

### 기본 명령어

```bash
xbowl init          # 프로젝트 초기화
xbowl pull          # 원격 데이터 가져오기
xbowl sync          # 로컬 파일 생성
xbowl status        # 상태 확인
xbowl collect       # 산출물 수집
xbowl diff          # 차이 분석
xbowl validate      # 유효성 검사
xbowl doctor        # 진단
```

### 명령어별 구현 책임

| 명령어     | CLI 레이어                    | Domain 레이어                    |
| ---------- | ----------------------------- | -------------------------------- |
| `init`     | 사용자 입력 처리, 진행률 표시 | `scaffold.ts` - 폴더 생성        |
| `pull`     | 네트워크 상태 표시, 에러 처리 | `sync/pull.ts` - DB 동기화       |
| `sync`     | 옵션 파싱, 결과 요약          | `convert.ts` - 파일 생성         |
| `status`   | 상태 표시 포맷팅              | `status.ts` - 상태 분석          |
| `collect`  | 진행률 표시, 결과 요약        | `sync/collect.ts` - 산출물 수집  |
| `diff`     | 차이 표시 포맷팅              | `sync/diff.ts` - 차이 분석       |
| `validate` | 검증 결과 표시                | `sync/validate.ts` - 유효성 검사 |
| `doctor`   | 진단 결과 표시                | `utils/` - 시스템 점검           |

## 🔧 템플릿 시스템

### 템플릿 구조

```
src/domain/templates/
├── engine.ts           # 템플릿 엔진 (Handlebars/Mustache)
├── claude/
│   ├── agent.md        # Sub-Agent 기본 템플릿
│   ├── command.md      # Slash Command 기본 템플릿
│   └── workflow.md     # Workflow Agent 템플릿
└── data/
    └── load-data.md    # 데이터 로드 명령 템플릿
```

### 템플릿 엔진 책임

- **변수 치환**: `{{slug}}`, `{{description}}` 등
- **조건부 렌더링**: `{{#if identity}}...{{/if}}`
- **반복 렌더링**: `{{#each requiredPhrases}}...{{/each}}`
- **필수 문구 삽입**: config.json의 requiredPhrases, securityWarnings

### 템플릿 예시

```markdown
---
name: { { slug } }
description: { { description } }
tools: Bash
---

{{role}}

{{#if identity}}
Identity: {{identity}}
{{/if}}

{{#each requiredPhrases}}
{{this}}
{{/each}}

{{#each securityWarnings}}
⚠️ {{this}}
{{/each}}
```

## 🔄 동기화 시스템

### Pull 시스템 (DB → 로컬)

```typescript
// src/domain/sync/pull.ts
export async function pullFromRemote(
  cwd: string,
  config: Config
): Promise<PullResult> {
  // 1. 네트워크 연결 확인
  // 2. 인증 토큰 검증
  // 3. DB에서 최신 블록 데이터 가져오기
  // 4. block-registry.json 업데이트
  // 5. state.json 업데이트
  // 6. diff 요약 반환
}
```

### Collect 시스템 (로컬 → DB)

```typescript
// src/domain/sync/collect.ts
export async function collectArtifacts(
  cwd: string,
  config: Config
): Promise<CollectResult> {
  // 1. .xbowl/artifacts/ 스캔
  // 2. Artifact Class 정의와 매칭
  // 3. 스키마 검증 (zod)
  // 4. DB에 업서트
  // 5. 결과 요약 반환
}
```

### Diff 시스템

```typescript
// src/domain/sync/diff.ts
export async function compareLocalRemote(
  cwd: string,
  config: Config
): Promise<DiffResult> {
  // 1. 로컬 block-registry.json vs 원격 DB 비교
  // 2. 생성된 파일 vs 예상 파일 비교
  // 3. 체크섬 불일치 검출
  // 4. 차이 요약 반환
}
```

## 📊 상태 관리

### State.json 구조

```typescript
interface State {
  lastSyncAt: string;
  fileMap: Record<string, FileState>;
  remote: RemoteState;
}

interface FileState {
  agentFile?: string;
  commandFile?: string;
  dataFile?: string;
  lastChecksum: string;
  lastGeneratedAt: string;
}
```

### Status 명령어 구현

```typescript
// src/domain/status.ts
export async function getStatus(cwd: string): Promise<StatusResult> {
  // 1. .xbowl/ 디렉토리 존재 확인
  // 2. .claude/ 디렉토리 존재 확인
  // 3. block-registry.json 로드
  // 4. 생성된 파일 개수 계산
  // 5. 불일치 검출
  // 6. 상태 요약 반환
}
```

## 🔧 유틸리티 시스템

### 암호화 유틸리티

```typescript
// src/domain/utils/crypto.ts
export function calculateChecksum(content: string): string;
export function verifyChecksum(content: string, expected: string): boolean;
```

### 네트워크 유틸리티

```typescript
// src/domain/utils/network.ts
export async function fetchWithAuth(
  url: string,
  token: string
): Promise<Response>;
export async function validateConnection(config: Config): Promise<boolean>;
```

### 로깅 유틸리티

```typescript
// src/domain/utils/logger.ts
export function logInfo(message: string): void;
export function logError(message: string, error?: Error): void;
export function logDebug(message: string): void;
```

## 🎨 CLI 사용자 경험

### 진행률 표시

```typescript
// src/cli/commands/sync.ts
const spinner = ora("Scanning registry").start();
try {
  // 작업 수행
  spinner.succeed("Sync complete");
} catch (err) {
  spinner.fail("Sync failed");
}
```

### 색상 출력

```typescript
import chalk from "chalk";

console.log(chalk.green("✓ Success"));
console.log(chalk.red("✗ Error"));
console.log(chalk.yellow("⚠ Warning"));
console.log(chalk.cyan("ℹ Info"));
```

### 에러 처리

```typescript
try {
  await performOperation();
} catch (err) {
  console.error(chalk.red("Error:"), err.message);
  process.exitCode = 1;
}
```

## 🚀 빌드 및 배포

### 개발 모드

```bash
pnpm -w dev --filter @xbowl/cli
```

### 빌드

```bash
pnpm -w build --filter @xbowl/cli
```

### 로컬 테스트

```bash
node apps/xbowl-cli/dist/index.js init
node apps/xbowl-cli/dist/index.js status
```

## 📝 확장 계획

### Phase 1: 기본 구조 ✅

- [x] CLI 레이어 분리
- [x] Domain 레이어 분리
- [x] 기본 명령어 구조

### Phase 2: 템플릿 시스템

- [ ] Handlebars/Mustache 엔진 통합
- [ ] 기본 템플릿 파일 생성
- [ ] 템플릿 변수 시스템

### Phase 3: 동기화 시스템

- [ ] Pull 명령 구현
- [ ] Collect 명령 구현
- [ ] Diff 명령 구현

### Phase 4: 고급 기능

- [ ] 워크플로우 오케스트레이션
- [ ] Artifact Class 관리
- [ ] CI/CD 통합

이 구조는 **관심사 분리**와 **확장성**을 고려하여 설계되었으며, 각 레이어가 명확한 책임을 가지도록 구성되어 있습니다.
