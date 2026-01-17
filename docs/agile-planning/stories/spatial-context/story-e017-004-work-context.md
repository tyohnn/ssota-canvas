# Story E017-004: Work Context 분석 및 문서화

## 📋 Story 개요
**Epic**: Epic-017: Spatial Context SDK 오픈소스화  
**Sprint**: Sprint 028  
**Story Points**: 2  
**담당자**: [할당 필요]  
**상태**: 계획됨  
**구현 상태**: 🚧 진행 중 (SSOTA)

## 🎯 Story Goal
```
As a 개발자
I want to Work Context(작업 맥락) 기능을 분석하고 문서화하여
So that SDK README에 포함할 내용과 구현 가이드를 작성할 수 있다
```

## 📝 Description
**작업 맥락(Work Context)**은 캔버스 내에서 일어난 과거 이력들을 추적하고 관련 컨텍스트를 제공한다.

### 핵심 기능
1. **이벤트 히스토리**: 블록 조작, 기타 작업 이력 추적
2. **시간순 필터링**: 최근 이벤트 우선 제공
3. **관련성 필터링**: 유저 발화와 연관된 과거 이벤트 검색

### 설계 원리
> 사람이 자신의 업무 맥락을 장기적으로 기억하고 있는 것과 같은 효과를 제공

## ✅ Acceptance Criteria

### AC1: 코드 분석 완료
- [ ] Work Context 관련 코드 파일 식별
- [ ] 이벤트 추적 메커니즘 분석
- [ ] 이벤트 저장 구조 분석
- [ ] 이벤트 검색/필터링 로직 분석

### AC2: 인터페이스 설계
- [ ] WorkContextProvider 인터페이스 정의
- [ ] CanvasEvent 타입 정의
- [ ] WorkContextOptions 타입 정의
- [ ] WorkContextResult 타입 정의

### AC3: 문서 작성 완료
- [ ] Work Context 개념 설명 문서
- [ ] 이벤트 타입 정의 문서
- [ ] 사용 예시 코드 (의사 코드)
- [ ] README 섹션 초안

## 📦 Technical Details

### 예상 인터페이스
```typescript
// 캔버스 이벤트 타입
type CanvasEventType = 
  | 'block.created'
  | 'block.updated'
  | 'block.deleted'
  | 'block.moved'
  | 'block.resized'
  | 'block.selected'
  | 'edge.created'
  | 'edge.deleted'
  | 'viewport.changed'
  | 'user.action';

interface CanvasEvent {
  id: string;
  type: CanvasEventType;
  timestamp: Date;
  
  // 이벤트 대상
  targetId?: string;
  targetType?: 'block' | 'edge' | 'viewport';
  
  // 이벤트 상세 데이터
  data: Record<string, unknown>;
  
  // 이벤트 발생 사용자
  userId?: string;
  
  // 세션 식별자
  sessionId?: string;
}

interface WorkContextOptions {
  // 시간 범위 필터
  timeRange?: {
    from?: Date;
    to?: Date;
  };
  
  // 이벤트 타입 필터
  eventTypes?: CanvasEventType[];
  
  // 특정 블록 관련 이벤트만
  blockIds?: string[];
  
  // 최대 이벤트 수
  maxEvents?: number;
  
  // 관련성 검색 쿼리 (유저 발화)
  relevanceQuery?: string;
}

interface WorkContextResult {
  // 관련 이벤트 목록
  events: CanvasEvent[];
  
  // 이벤트 요약
  summary: {
    totalEvents: number;
    eventTypeCounts: Record<CanvasEventType, number>;
    timeRange: { from: Date; to: Date };
  };
  
  // 컨텍스트 요약 (LLM 프롬프트용)
  contextSummary: string;
}

interface WorkContextProvider {
  // 이벤트 기록
  recordEvent(event: Omit<CanvasEvent, 'id' | 'timestamp'>): void;
  
  // 컨텍스트 조회
  getContext(options?: WorkContextOptions): WorkContextResult;
  
  // 이벤트 스트림 구독
  subscribe(
    callback: (event: CanvasEvent) => void
  ): () => void;
  
  // 세션 관리
  startSession(): string;
  endSession(sessionId: string): void;
}
```

### 저장 전략 분석
1. **인메모리**: 세션 기반 단기 저장
2. **로컬 스토리지**: 브라우저 기반 영구 저장
3. **서버 동기화**: 장기 저장 및 공유

### 설계 고려사항
1. **프라이버시**: 민감한 작업 이력 관리
2. **성능**: 대량 이벤트 처리 최적화
3. **저장 용량**: 이벤트 보존 정책 (TTL, 최대 개수)

## 🔗 Dependencies
- **선행**: E017-001 (코드 분석 및 추상화 설계)
- **후행**: 없음
- **블로커**: 없음

## 🎯 Definition of Done
- [ ] 코드 분석 문서 작성 (`analysis/work-context.md`)
- [ ] 인터페이스 정의 완료
- [ ] README Work Context 섹션 작성
- [ ] 이벤트 타입 정의 문서 작성

## 📝 Notes
- Work Context는 **진행 중** 상태이므로 현재 구현 기준 분석
- 이벤트 추적은 성능에 영향을 줄 수 있으므로 최적화 전략 필요
- GDPR 등 프라이버시 규정 고려 필요
