# Sprint 029: Spatial Context SDK - Core 패키지 구현

## 🎯 Sprint 개요
**목표**: 2주 동안 Spatial Context SDK의 Core 패키지를 구현하여 4가지 컨텍스트 모듈이 독립적으로 동작하도록 한다

**기간**: 2026-02-03 ~ 2026-02-17 (2주)  
**팀**: 개발팀  
**용량**: 120시간 (3명 × 10일 × 4시간)

## 📋 Sprint 목표

Sprint 028에서 분석한 내용을 바탕으로 **실제 Core 패키지 구현**:
1. 패키지 구조 및 빌드 시스템 셋업
2. 공통 타입 및 인터페이스 구현
3. Focus Context 모듈 구현
4. Semantic Context 모듈 구현
5. Work Context 모듈 구현
6. Action Context 모듈 구현
7. Context Composer (조합기) 구현

## 📋 포함 Story (예정)

> 📌 Story 상세는 Sprint 028 완료 후 분석 결과를 바탕으로 정의 예정

### Story E017-006: 패키지 구조 및 타입 시스템 구현 (3pts)
**목표**: spatial-context-core 패키지 셋업 및 공통 타입 정의
**예상 완료일**: 2026-02-05

**예상 작업:**
- [ ] packages/spatial-context-core 디렉토리 생성
- [ ] package.json, tsconfig.json 설정
- [ ] 공통 타입 정의 (Block, Edge, Graph 등)
- [ ] 각 컨텍스트 모듈 인터페이스 정의
- [ ] 빌드 및 테스트 환경 구성

---

### Story E017-007: Focus Context 모듈 구현 (3pts)
**목표**: 초점 맥락 기능 구현 - 선택 블록, 연결 블록, 근접 블록 탐색
**예상 완료일**: 2026-02-07

**예상 작업:**
- [ ] FocusContextProvider 클래스 구현
- [ ] 선택 블록 정보 추출 로직
- [ ] 엣지 기반 인접 블록 탐색 (BFS/DFS)
- [ ] 거리 기반 근접 블록 탐색 (유클리드 거리)
- [ ] 단위 테스트 작성

---

### Story E017-008: Semantic Context 모듈 구현 (5pts)
**목표**: 의미 맥락 기능 구현 - 벡터 검색, BM25, 하이브리드 검색
**예상 완료일**: 2026-02-11

**예상 작업:**
- [ ] SemanticContextProvider 클래스 구현
- [ ] EmbeddingProvider 인터페이스 정의 (플러그인 패턴)
- [ ] 인메모리 벡터 인덱스 구현 (hnswlib 또는 직접 구현)
- [ ] BM25 검색 구현 (lunr.js 또는 직접 구현)
- [ ] 하이브리드 검색 결합 로직
- [ ] 단위 테스트 작성

---

### Story E017-009: Work Context 모듈 구현 (3pts)
**목표**: 작업 맥락 기능 구현 - 이벤트 추적, 히스토리 관리
**예상 완료일**: 2026-02-13

**예상 작업:**
- [ ] WorkContextProvider 클래스 구현
- [ ] CanvasEvent 타입 및 이벤트 기록 로직
- [ ] 이벤트 저장소 (인메모리 + 옵셔널 영구 저장)
- [ ] 시간/타입 기반 필터링
- [ ] 이벤트 구독 시스템 (Observer 패턴)
- [ ] 단위 테스트 작성

---

### Story E017-010: Action Context 모듈 구현 (3pts)
**목표**: 액션 맥락 기능 구현 - 액션 정의, 등록, 실행
**예상 완료일**: 2026-02-14

**예상 작업:**
- [ ] ActionContextProvider 클래스 구현
- [ ] ActionDefinition 및 ActionSchema 타입
- [ ] 액션 레지스트리 시스템
- [ ] 조건부 가용성 판단 로직
- [ ] LLM Tool 변환 유틸리티 (OpenAI, Anthropic 형식)
- [ ] 단위 테스트 작성

---

### Story E017-011: Context Composer 구현 (3pts)
**목표**: 여러 컨텍스트를 조합하여 통합 컨텍스트 생성
**예상 완료일**: 2026-02-17

**예상 작업:**
- [ ] SpatialContext 메인 클래스 구현
- [ ] compose() 메서드 - 여러 컨텍스트 병합
- [ ] toPrompt() 메서드 - LLM 프롬프트 생성
- [ ] toTools() 메서드 - LLM Tool 정의 생성
- [ ] 통합 테스트 작성
- [ ] 기본 문서화

**총 Story Points**: 20pts (예상)

## 📅 Sprint 일정

### Week 1 (2026-02-03 ~ 2026-02-07)
- **월요일**: Sprint 시작, Story E017-006 착수 (패키지 셋업)
- **화요일**: Story E017-006 완료
- **수요일**: Story E017-007 착수 (Focus Context)
- **목요일**: Story E017-007 진행
- **금요일**: Story E017-007 완료, Story E017-008 착수

### Week 2 (2026-02-10 ~ 2026-02-17)
- **월요일**: Story E017-008 진행 (Semantic Context)
- **화요일**: Story E017-008 완료
- **수요일**: Story E017-009 착수 및 완료 (Work Context)
- **목요일**: Story E017-010 착수 및 완료 (Action Context)
- **금요일**: Story E017-011 착수 및 완료 (Composer), Sprint 마무리

## 🔗 의존성 및 리스크

### 의존성
- **선행 Sprint**: Sprint 028 (코드 분석 및 README 완료 필수)
- **외부 의존성**: 
  - 임베딩 API (OpenAI, Voyage AI 등) - Semantic Context용
  - 벡터 검색 라이브러리 (옵션)
  - BM25 라이브러리 (옵션)

### 리스크
- **추상화 리스크**: SSOTA 코드에서 범용 로직 추출 시 예상보다 복잡할 수 있음
  - **대응**: 최소 기능 집합(MVP) 우선 구현, 점진적 확장
- **성능 리스크**: 벡터 검색 성능이 대규모 그래프에서 저하될 수 있음
  - **대응**: 인메모리 인덱스 최적화, 필요 시 외부 벡터 DB 연동
- **임베딩 의존성**: 외부 임베딩 API 의존으로 테스트 어려움
  - **대응**: Mock Provider 구현, 로컬 테스트용 간단한 임베딩

## 🎯 완료 기준

### 기능적 완료
- [ ] 4가지 컨텍스트 모듈이 독립적으로 동작
- [ ] SpatialContext 메인 클래스로 통합 사용 가능
- [ ] 기본 LLM 프롬프트/Tool 생성 기능

### 기술적 완료
- [ ] packages/spatial-context-core 패키지 빌드 성공
- [ ] TypeScript 컴파일 성공 (strict mode)
- [ ] 단위 테스트 커버리지 70% 이상
- [ ] 트리 셰이킹 가능한 모듈 구조

### 품질 완료
- [ ] 코드 리뷰 완료
- [ ] 기본 API 문서 작성
- [ ] 사용 예시 코드 포함

## 📦 예상 패키지 구조

```
packages/spatial-context-core/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts                    # 메인 진입점
│   ├── spatial-context.ts          # SpatialContext 클래스
│   │
│   ├── types/                      # 공통 타입
│   │   ├── index.ts
│   │   ├── block.ts
│   │   ├── edge.ts
│   │   ├── graph.ts
│   │   └── context.ts
│   │
│   ├── focus/                      # Focus Context
│   │   ├── index.ts
│   │   ├── focus-context-provider.ts
│   │   ├── graph-traversal.ts      # BFS/DFS 탐색
│   │   └── proximity-search.ts     # 거리 기반 검색
│   │
│   ├── semantic/                   # Semantic Context
│   │   ├── index.ts
│   │   ├── semantic-context-provider.ts
│   │   ├── embedding-provider.ts   # 플러그인 인터페이스
│   │   ├── vector-index.ts         # 벡터 인덱스
│   │   └── bm25.ts                 # BM25 검색
│   │
│   ├── work/                       # Work Context
│   │   ├── index.ts
│   │   ├── work-context-provider.ts
│   │   ├── event-store.ts          # 이벤트 저장소
│   │   └── event-filter.ts         # 이벤트 필터
│   │
│   ├── action/                     # Action Context
│   │   ├── index.ts
│   │   ├── action-context-provider.ts
│   │   ├── action-registry.ts      # 액션 레지스트리
│   │   └── llm-tools.ts            # LLM Tool 변환
│   │
│   ├── composer/                   # Context Composer
│   │   ├── index.ts
│   │   └── context-composer.ts
│   │
│   └── llm/                        # LLM 통합 유틸리티
│       ├── index.ts
│       ├── prompt-generator.ts
│       └── tool-converter.ts
│
└── src/__tests__/                  # 테스트
    ├── focus/
    ├── semantic/
    ├── work/
    ├── action/
    └── integration/
```

## 📊 진행 상황 추적

### 일일 체크포인트
- [ ] **월요일**: 패키지 셋업 시작
- [ ] **화요일**: 타입 시스템 완료
- [ ] **수요일**: Focus Context 시작
- [ ] **목요일**: Focus Context 진행
- [ ] **금요일**: Focus Context 완료

### 품질 지표
- **테스트 커버리지**: 목표 70%
- **빌드 상태**: ✅/❌
- **타입 안정성**: strict mode 통과 여부

## 📁 관련 문서
- [Epic-017 문서](../epics/epic-017-spatial-context-sdk.md)
- [Sprint 028: 코드 분석 및 README](./sprint-028-spatial-context-analysis.md)
- [Spatial Context README](../../open-source/spatial-context/README.md)

## 📝 Sprint 시작 전 체크리스트

Sprint 028 완료 후 확인 필요:
- [ ] 코드 분석 문서 검토 완료
- [ ] 추상화 설계 확정
- [ ] 인터페이스 정의 확정
- [ ] 외부 의존성 결정 (벡터 검색, BM25 라이브러리)
- [ ] Story 상세 정의 및 포인트 조정
