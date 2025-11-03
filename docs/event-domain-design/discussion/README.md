# Discussion 문서

이 폴더는 프로젝트의 아키텍처, 패턴, 전략에 대한 논의 문서들을 주제별로 분류한 디렉토리입니다.

## 📁 폴더 구조

### 🏗️ architecture-conventions/
**아키텍처 및 코드 컨벤션**

- `server-side-ddd-conventions.md` - 서버 사이드 DDD 컨벤션 가이드
- `data-flow-conventions.md` - 데이터 흐름 코드 컨벤션 가이드
- `data-flow-conventions-feedback.md` - 데이터 흐름 컨벤션 피드백
- `architecture-investment-analysis.md` - 아키텍처 초기 투자 전략 평가
- `repository-discussion.md` - Repository 패턴 논의

### 🔄 event-patterns/
**이벤트 기반 개발 패턴**

- `event-pattern-without-event-bus.md` - Event Bus 없이 이벤트 패턴 구현
- `domain-events-analysis.md` - 도메인 이벤트 분석
- `event-flow-discussion.md` - 이벤트 플로우 논의

### 🎨 frontend-architecture/
**프론트엔드 아키텍처**

- `react-flow-with-ddd-architecture.md` - React Flow와 DDD 아키텍처 통합
- `live-collaboration-discussion.md` - 실시간 협업 기능 논의

### 🤖 ai-automation/
**AI 자동화 패턴**

- `ai-automation-patterns-discussion.md` - AI 자동화를 위한 개발 패턴 설계

### ⚡ performance-optimization/
**성능 최적화**

- `performance-optimization-caching-strategy.md` - 성능 최적화 및 캐싱 전략

### 📋 project-strategy/
**프로젝트 전략**

- `roadmap.md` - 프로젝트 로드맵
- `opensource-monorepo.md` - 오픈소스 모노레포 전략

### 🧩 block-definitions/
**블록 타입 정의**

다양한 블록 타입의 상세 정의 문서입니다. 각 블록의 기능, UI, 속성, 툴바 아이템, 블록 툴 등을 정의합니다.

**기본 콘텐츠 블록**:
- `01-text-block.md` - 텍스트 블록 (참조 기준)
- `02-markdown-block.md` - 마크다운 블록
- `03-shape-block.md` - 도형 블록

**미디어 블록**:
- `04-image-block.md` - 이미지 블록
- `05-video-block.md` - 비디오 블록
- `06-youtube-block.md` - 유튜브 블록

**프리뷰/링크 블록**:
- `07-url-preview-block.md` - URL 프리뷰 블록
- `08-twitter-preview-block.md` - 트위터 프리뷰 블록

**개발 도구 블록**:
- `09-code-block.md` - 코드 블록
- `10-vercel-deployment-block.md` - Vercel 배포 상태 블록
- `11-github-pr-block.md` - 깃헙 PR 블록
- `12-db-schema-block.md` - DB Schema 블록

**디자인 도구 블록**:
- `13-shadcn-registry-block.md` - Shadcn Registry 블록
- `14-design-theme-block.md` - Design Theme 블록

**기타 블록**:
- `15-pdf-viewer-block.md` - PDF 뷰어 블록
- `16-circuit-js-block.md` - Circuit JS 블록

---

## 📚 문서 읽기 순서 (권장)

### 초기 학습자
1. `architecture-conventions/server-side-ddd-conventions.md` - 기본 DDD 컨벤션
2. `architecture-conventions/data-flow-conventions.md` - 데이터 흐름 이해
3. `event-patterns/event-pattern-without-event-bus.md` - 이벤트 패턴 이해

### 개발자
1. `architecture-conventions/data-flow-conventions.md` - 개발 가이드
2. `architecture-conventions/data-flow-conventions-feedback.md` - 개선 사항
3. `frontend-architecture/react-flow-with-ddd-architecture.md` - 프론트엔드 통합

### 아키텍트/리드
1. `architecture-conventions/architecture-investment-analysis.md` - 전략적 평가
2. `project-strategy/roadmap.md` - 로드맵
3. `ai-automation/ai-automation-patterns-discussion.md` - AI 활용 전략

### 블록 개발자
1. `block-definitions/01-text-block.md` - 텍스트 블록 (참조 기준)
2. `block-definitions/README.md` - 블록 정의 가이드
3. 필요한 블록 타입별 문서

---

## 🔄 문서 업데이트 규칙

1. **새 문서 작성 시**: 적절한 폴더에 배치
2. **피드백 문서**: 원본 문서와 같은 폴더에 `-feedback.md` 접미사
3. **문서 수정 시**: 최종 업데이트 날짜 갱신
4. **README 업데이트**: 폴더 구조 변경 시 이 파일도 함께 업데이트

---

**최종 업데이트**: 2025-11-03

**최근 추가**: 2025-11-03 - Block Definitions 폴더 추가 (16개 블록 타입 정의)

