# Story E017-002: Focus Context 분석 및 문서화

## 📋 Story 개요
**Epic**: Epic-017: Spatial Context SDK 오픈소스화  
**Sprint**: Sprint 028  
**Story Points**: 2  
**담당자**: [할당 필요]  
**상태**: 계획됨  
**구현 상태**: ✅ 개발 완료 (SSOTA)

## 🎯 Story Goal
```
As a 개발자
I want to Focus Context(초점 맥락) 기능을 분석하고 문서화하여
So that SDK README에 포함할 내용과 구현 가이드를 작성할 수 있다
```

## 📝 Description
**초점 맥락(Focus Context)**은 현재 업무가 진행되고 있는 주제에 초점을 맞춰 관련된 컨텍스트를 전달한다. 

### 핵심 기능
1. **현재 선택 블록**: 유저가 지금 초점을 맞추고 있는 블록의 속성과 내용
2. **엣지 연결 블록**: 해당 블록과 엣지로 연결된 블록 정보
3. **거리 기반 근접 블록**: 물리적으로 가까운 블록 탐색

### 설계 원리
> 의미적으로 가까운 정보들의 물리적인 거리를 가깝게 배치하는 사람의 사고 특성을 반영

## ✅ Acceptance Criteria

### AC1: 코드 분석 완료
- [ ] Focus Context 관련 코드 파일 식별
- [ ] 선택 블록 추출 로직 분석
- [ ] 엣지 기반 인접 블록 탐색 알고리즘 분석
- [ ] 거리 기반 근접 블록 탐색 알고리즘 분석

### AC2: 인터페이스 설계
- [ ] FocusContextProvider 인터페이스 정의
- [ ] FocusContextOptions 타입 정의
- [ ] FocusContextResult 타입 정의

### AC3: 문서 작성 완료
- [ ] Focus Context 개념 설명 문서
- [ ] 사용 예시 코드 (의사 코드)
- [ ] README 섹션 초안

## 📦 Technical Details

### 예상 인터페이스
```typescript
interface FocusContextOptions {
  // 엣지 연결 탐색 깊이 (1 = 직접 연결만)
  edgeDepth?: number;
  
  // 거리 기반 탐색 반경 (픽셀)
  proximityRadius?: number;
  
  // 포함할 블록 속성 필터
  includeProperties?: string[];
  
  // 최대 결과 수
  maxResults?: number;
}

interface FocusContextResult {
  // 현재 선택된 블록
  selectedBlock: Block | null;
  
  // 엣지로 연결된 블록들
  connectedBlocks: Block[];
  
  // 거리적으로 가까운 블록들
  nearbyBlocks: Block[];
  
  // 컨텍스트 요약 (LLM 프롬프트용)
  summary: string;
}

interface FocusContextProvider {
  getContext(
    selectedBlockId: string | null,
    options?: FocusContextOptions
  ): FocusContextResult;
}
```

### 알고리즘 분석 포인트
1. **엣지 탐색**: BFS/DFS 기반 그래프 탐색
2. **거리 계산**: 유클리드 거리 또는 맨해튼 거리
3. **결과 정렬**: 관련성 점수 기반 우선순위

## 🔗 Dependencies
- **선행**: E017-001 (코드 분석 및 추상화 설계)
- **후행**: 없음
- **블로커**: 없음

## 🎯 Definition of Done
- [ ] 코드 분석 문서 작성 (`analysis/focus-context.md`)
- [ ] 인터페이스 정의 완료
- [ ] README Focus Context 섹션 작성
- [ ] 사용 예시 코드 작성

## 📝 Notes
- Focus Context는 **개발 완료** 상태이므로 실제 구현 코드 참조 가능
- 캔버스의 물리적 배치와 논리적 연결 모두 활용하는 하이브리드 접근
