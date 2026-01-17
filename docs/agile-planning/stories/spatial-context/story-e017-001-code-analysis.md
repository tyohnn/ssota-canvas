# Story E017-001: 기존 코드 분석 및 추상화 설계

## 📋 Story 개요
**Epic**: Epic-017: Spatial Context SDK 오픈소스화  
**Sprint**: Sprint 028  
**Story Points**: 5  
**담당자**: [할당 필요]  
**상태**: 계획됨

## 🎯 Story Goal
```
As a 개발자
I want to SSOTA 코드베이스에서 Spatial Context 관련 코드를 분석하고 추상화 설계를 완료하여
So that SDK로 추출 가능한 범용 모듈 구조를 정의할 수 있다
```

## 📝 Description
SSOTA 프로젝트에 구현된 4가지 Spatial Context Engineering 기법(초점 맥락, 의미 맥락, 작업 맥락, 액션 맥락)을 분석하여:
1. 각 기법의 핵심 로직 파악
2. SSOTA 특화 로직과 범용 로직 분리
3. SDK 패키지 구조 및 인터페이스 설계

## ✅ Acceptance Criteria

### AC1: 코드 분석 완료
- [ ] 4가지 컨텍스트 관련 코드 파일 위치 목록 작성
- [ ] 각 컨텍스트의 핵심 함수/클래스 식별
- [ ] 외부 의존성 목록 작성 (npm 패키지, API 등)
- [ ] SSOTA 특화 로직과 범용 로직 분류

### AC2: 추상화 설계 완료
- [ ] 공통 인터페이스 정의 (SpatialContext, ContextProvider 등)
- [ ] 각 컨텍스트 모듈의 public API 설계
- [ ] 설정 옵션 구조 정의
- [ ] 에러 처리 전략 수립

### AC3: 패키지 구조 설계 완료
- [ ] 모노레포 패키지 구조 확정
- [ ] 각 패키지의 책임 범위 정의
- [ ] 패키지 간 의존성 관계 다이어그램
- [ ] 빌드 및 배포 전략 수립

## 📦 Technical Details

### 분석 대상 영역 (예상)
```
apps/web/
├── src/
│   ├── features/ai/
│   │   ├── context/              # 컨텍스트 수집 로직
│   │   │   ├── focus-context/    # 초점 맥락
│   │   │   ├── semantic-context/ # 의미 맥락
│   │   │   ├── work-context/     # 작업 맥락
│   │   │   └── action-context/   # 액션 맥락
│   │   └── agents/               # AI 에이전트 통합
│   ├── features/canvas/
│   │   └── hooks/                # 캔버스 상태 관리
│   └── lib/
│       └── search/               # 검색 유틸리티
```

### 설계 산출물
```
docs/open-source/spatial-context/
├── analysis/
│   └── code-analysis.md          # 코드 분석 결과
├── architecture.md               # 패키지 구조 설계
└── interfaces.md                 # 핵심 인터페이스 정의
```

### 패키지 구조 (초안)
```
packages/
├── spatial-context-core/         # @spatial-context/core
│   ├── focus/                    # Focus Context
│   ├── semantic/                 # Semantic Context
│   ├── work/                     # Work Context
│   ├── action/                   # Action Context
│   ├── composer/                 # 컨텍스트 조합
│   └── types/                    # 공통 타입
│
└── spatial-context-react-flow/   # @spatial-context/react-flow
    ├── adapters/                 # React Flow 어댑터
    ├── hooks/                    # React 훅
    └── providers/                # Context Providers
```

## 🔗 Dependencies
- **선행**: 없음
- **후행**: E017-002 ~ E017-005 (각 컨텍스트 문서화)
- **블로커**: SSOTA 코드베이스 접근

## 🎯 Definition of Done
- [ ] 코드 분석 문서 작성 완료
- [ ] 추상화 설계 문서 작성 완료
- [ ] 패키지 구조 다이어그램 완성
- [ ] 핵심 인터페이스 초안 정의
- [ ] 팀 리뷰 및 피드백 반영

## 📝 Notes
- 개발 완료된 기능(Focus Context, Action Context) 우선 분석
- 진행 중인 기능(Semantic Context, Work Context)은 현재 상태 기준 분석
- 코드 소유자와의 인터뷰를 통해 의도 파악
