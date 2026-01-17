# Epic-017: Spatial Context SDK 오픈소스화

## 🎯 Epic 개요
**Epic Goal**: AI 에이전트가 2D 캔버스에서 공간적 맥락을 이해하고 조작할 수 있도록, SSOTA에서 구현한 Spatial Context Engineering 기능을 독립적인 SDK로 추출하여 오픈소스로 공개한다

**기간**: 2026-01-20 ~ 2026-02-28 (6주)  
**Story Points**: 34pts (예상)  
**우선순위**: High  
**상태**: 계획 중

## 📊 비즈니스 가치

### 문제
AI 에이전트가 2D 캔버스 환경에서 효과적으로 작업하기 위해서는 공간적 맥락(Spatial Context)을 이해해야 한다. 현재 이러한 컨텍스트 엔지니어링 기법들이 SSOTA 프로젝트에 밀접하게 결합되어 있어:
- 다른 프로젝트에서 재사용이 어려움
- 기술의 가치가 외부에 알려지지 않음
- 커뮤니티 기여를 통한 발전 기회 상실

### 해결책
4가지 Spatial Context Engineering 기법을 독립적인 SDK로 추출:
1. **초점 맥락 (Focus Context)**: 현재 선택된 블록 기반 컨텍스트
2. **의미 맥락 (Semantic Context)**: 벡터 임베딩 기반 의미 검색
3. **작업 맥락 (Work Context)**: 캔버스 이벤트 히스토리 기반 컨텍스트
4. **액션 맥락 (Action Context)**: 사용 가능한 블록 액션 정보

### 기대 효과
- **기술 리더십**: Spatial Context Engineering 분야의 선도적 오픈소스 라이브러리
- **생태계 확장**: 다양한 캔버스 도구에서 AI 에이전트 통합 촉진
- **커�니티 성장**: 외부 기여를 통한 기능 개선 및 버그 수정
- **브랜드 인지도**: SSOTA Labs의 기술력 홍보

## 🎯 성공 기준

### 기능적 기준
- [ ] 4가지 컨텍스트 기법이 독립적으로 사용 가능
- [ ] 프레임워크 독립적인 Core 패키지 완성
- [ ] React Flow 어댑터 제공
- [ ] 종합적인 API 문서 및 예시 코드

### 성능 기준
- [ ] 1000개 노드에서 100ms 이내 컨텍스트 계산
- [ ] 메모리 사용량 최적화 (기존 대비 30% 감소)

### 품질 기준
- [ ] 테스트 커버리지 80% 이상
- [ ] TypeScript 타입 안정성 100%
- [ ] MIT 라이선스 준수

### 문서화 기준
- [ ] README.md 완성 (Why, Features, Quick Start, API)
- [ ] 각 컨텍스트 기법별 상세 문서
- [ ] 사용 예시 및 베스트 프랙티스

## 📋 포함 기능

### 핵심 기능 (Core)

#### 1. Focus Context (초점 맥락)
- 현재 선택된 블록 정보 추출
- 엣지로 연결된 인접 블록 탐색
- 거리 기반 근접 블록 탐색
- 블록 속성 및 내용 컨텍스트화

#### 2. Semantic Context (의미 맥락)
- Vector Embedding 기반 의미 검색
- BM25 알고리즘 텍스트 검색
- 하이브리드 검색 (벡터 + 키워드)
- 유저 발화와 의미적으로 가까운 블록 탐색

#### 3. Work Context (작업 맥락)
- 캔버스 이벤트 히스토리 추적
- 시간순 작업 이력 관리
- 관련 과거 이벤트 검색
- 세션 기반 컨텍스트 관리

#### 4. Action Context (액션 맥락)
- 사용 가능한 블록 액션 정의
- 액션 파라미터 스키마
- 조건부 액션 가용성
- 액션 실행 인터페이스

### 지원 기능
- 컨텍스트 조합 (Context Composition)
- 컨텍스트 우선순위 설정
- 컨텍스트 직렬화/역직렬화
- 디버깅 도구

### 통합 기능
- React Flow 어댑터
- LLM 프롬프트 생성 유틸리티
- MCP (Model Context Protocol) 호환 인터페이스

## 🚫 제외 범위
- SSOTA 특화 블록 타입 정의 (SSOTA 프로젝트에 유지)
- UI 컴포넌트 (렌더링은 사용자 책임)
- 백엔드 API 통합 (클라이언트 라이브러리만 제공)
- 실시간 동기화 기능 (별도 패키지로 분리)

## 🔗 의존성

### 선행 Epic
- ~~Epic-016: Canvasdown Package~~ ✅ 완료

### 후행 Epic
- Epic-018: Spatial Context SDK SSOTA 통합 (계획 필요)
- Epic-019: Streaming Context Generation (향후 계획)

### 외부 의존성
- Vector Embedding 라이브러리 (OpenAI, Voyage 등)
- BM25 검색 라이브러리
- dagre 레이아웃 엔진

## 🏗️ 기술적 고려사항

### 아키텍처
```
packages/
├── spatial-context-core/          # @spatial-context/core
│   ├── focus/                     # Focus Context 모듈
│   ├── semantic/                  # Semantic Context 모듈
│   ├── work/                      # Work Context 모듈
│   ├── action/                    # Action Context 모듈
│   ├── composer/                  # 컨텍스트 조합기
│   └── types/                     # 공통 타입 정의
│
├── spatial-context-react-flow/    # @spatial-context/react-flow
│   ├── adapters/                  # React Flow 어댑터
│   ├── hooks/                     # React 훅
│   └── providers/                 # Context Providers
│
└── examples/                      # 예시 애플리케이션
```

### 설계 원칙
- **프레임워크 독립성**: Core는 순수 TypeScript, 프레임워크 의존성 없음
- **트리 셰이킹**: 각 모듈 독립적 import 가능
- **점진적 도입**: 필요한 컨텍스트만 선택적 사용
- **타입 안정성**: 완전한 TypeScript 지원

### 성능
- Lazy evaluation으로 불필요한 계산 방지
- 결과 캐싱으로 중복 계산 제거
- 배치 처리로 여러 컨텍스트 동시 계산

## 📅 마일스톤

### Phase 1: 분석 및 문서화 (Sprint 028)
- 기존 코드 분석 및 추상화 포인트 식별
- README.md 및 핵심 문서 작성
- 패키지 구조 설계

### Phase 2: Core 패키지 구현 (Sprint 029-030)
- Focus Context 모듈 구현
- Semantic Context 모듈 구현
- Work Context 모듈 구현
- Action Context 모듈 구현

### Phase 3: 어댑터 및 통합 (Sprint 031)
- React Flow 어댑터 구현
- 예시 애플리케이션 완성
- 문서 완성 및 오픈소스 공개

## 🎯 완료 기준
- [ ] 모든 핵심 기능 완료
- [ ] 성공 기준 달성
- [ ] npm 패키지 배포
- [ ] GitHub 저장소 공개
- [ ] 문서 사이트 배포

## 📁 관련 문서
- [SSOTA AI 컨텍스트 엔지니어링 문서](../../ai-context/README.md)
- [Canvasdown Epic](./epic-016-canvasdown-package.md)
- [Sprint 028: 코드 분석 및 README](../sprints/sprint-028-spatial-context-analysis.md)

---

## 📋 Story 목록

### Sprint 028: 코드 분석 및 README 작성 (13pts)
| Story ID | 제목 | Points | 상태 |
|----------|------|--------|------|
| E017-001 | 기존 코드 분석 및 추상화 설계 | 5 | 계획됨 |
| E017-002 | Focus Context 분석 및 문서화 | 2 | 계획됨 |
| E017-003 | Semantic Context 분석 및 문서화 | 2 | 계획됨 |
| E017-004 | Work Context 분석 및 문서화 | 2 | 계획됨 |
| E017-005 | Action Context 분석 및 문서화 | 2 | 계획됨 |

### Sprint 029-030: Core 패키지 구현 (예상 15pts)
| Story ID | 제목 | Points | 상태 |
|----------|------|--------|------|
| E017-006 | 패키지 구조 및 타입 시스템 구현 | 3 | 계획됨 |
| E017-007 | Focus Context 모듈 구현 | 3 | 계획됨 |
| E017-008 | Semantic Context 모듈 구현 | 5 | 계획됨 |
| E017-009 | Work Context 모듈 구현 | 3 | 계획됨 |
| E017-010 | Action Context 모듈 구현 | 3 | 계획됨 |

### Sprint 031: 어댑터 및 통합 (예상 6pts)
| Story ID | 제목 | Points | 상태 |
|----------|------|--------|------|
| E017-011 | React Flow 어댑터 구현 | 3 | 계획됨 |
| E017-012 | 예시 앱 및 문서 완성 | 3 | 계획됨 |
