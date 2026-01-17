# Story E017-003: Semantic Context 분석 및 문서화

## 📋 Story 개요
**Epic**: Epic-017: Spatial Context SDK 오픈소스화  
**Sprint**: Sprint 028  
**Story Points**: 2  
**담당자**: [할당 필요]  
**상태**: ✅ 완료  
**완료 일자**: 2026-01-16  
**구현 상태**: 🚧 진행 중 (SSOTA)

## 🎯 Story Goal
```
As a 개발자
I want to Semantic Context(의미 맥락) 기능을 분석하고 문서화하여
So that SDK README에 포함할 내용과 구현 가이드를 작성할 수 있다
```

## 📝 Description
**의미 맥락(Semantic Context)**은 유저 발화/요청과 의미적으로 가까운 블록을 탐색하여 전달한다.

### 핵심 기능
1. **Vector Embedding 시맨틱 서치**: 의미적 유사도 기반 검색
2. **BM25 알고리즘**: 키워드 기반 텍스트 검색
3. **하이브리드 검색**: 벡터 + 키워드 결합

### 설계 원리
> 물리적으로 거리가 멀지만 현재 발화에 꼭 필요한 블록을 탐색해 제공

## ✅ Acceptance Criteria

### AC1: 코드 분석 완료
- [x] Semantic Context 관련 코드 파일 식별
- [x] Vector Embedding 검색 로직 분석
- [x] BM25 검색 구현 분석
- [x] 하이브리드 검색 결합 방식 분석

### AC2: 인터페이스 설계
- [x] SemanticContextProvider 인터페이스 정의
- [x] EmbeddingProvider 인터페이스 정의 (플러그인 패턴)
- [x] SemanticContextOptions 타입 정의
- [x] SemanticContextResult 타입 정의

### AC3: 문서 작성 완료
- [x] Semantic Context 개념 설명 문서
- [x] 임베딩 제공자 통합 가이드
- [x] 사용 예시 코드 (의사 코드)
- [x] README 섹션 초안

## 📦 Technical Details

### 예상 인터페이스
```typescript
// 임베딩 제공자 인터페이스 (플러그인 패턴)
interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
  dimensions: number;
}

interface SemanticContextOptions {
  // 검색 쿼리 (유저 발화)
  query: string;
  
  // 검색 전략
  strategy: 'vector' | 'bm25' | 'hybrid';
  
  // 하이브리드 검색 시 벡터 가중치 (0-1)
  vectorWeight?: number;
  
  // 최대 결과 수
  topK?: number;
  
  // 최소 유사도 임계값
  minScore?: number;
}

interface SemanticSearchResult {
  block: Block;
  score: number;
  matchType: 'vector' | 'bm25' | 'hybrid';
}

interface SemanticContextResult {
  // 의미적으로 관련된 블록들
  relevantBlocks: SemanticSearchResult[];
  
  // 검색 메타데이터
  metadata: {
    totalSearched: number;
    searchTime: number;
    strategy: string;
  };
  
  // 컨텍스트 요약 (LLM 프롬프트용)
  summary: string;
}

interface SemanticContextProvider {
  // 임베딩 제공자 설정
  setEmbeddingProvider(provider: EmbeddingProvider): void;
  
  // 블록 인덱싱
  indexBlocks(blocks: Block[]): Promise<void>;
  
  // 시맨틱 검색
  search(options: SemanticContextOptions): Promise<SemanticContextResult>;
}
```

### 외부 의존성 분석
- **임베딩 API**: OpenAI, Voyage AI, Cohere 등
- **벡터 DB**: 인메모리 (hnswlib) 또는 외부 (Pinecone, Qdrant)
- **BM25**: lunr.js, flexsearch 등

### 설계 고려사항
1. **임베딩 제공자 플러그인**: 다양한 임베딩 API 지원
2. **오프라인 지원**: 로컬 모델 옵션
3. **캐싱 전략**: 임베딩 결과 캐싱으로 비용/속도 최적화

## 🔗 Dependencies
- **선행**: E017-001 (코드 분석 및 추상화 설계)
- **후행**: 없음
- **블로커**: 없음

## 🎯 Definition of Done
- [x] 코드 분석 문서 작성 (`docs/02-semantic-context.md`)
- [x] 인터페이스 정의 완료
- [x] README Semantic Context 섹션 작성
- [x] 임베딩 제공자 통합 가이드 작성

## 📝 Notes
- Semantic Context는 **진행 중** 상태이므로 현재 구현 기준 분석
- 임베딩 제공자의 플러그인 패턴이 핵심 설계 포인트
- 비용 최적화를 위한 캐싱 전략 중요
