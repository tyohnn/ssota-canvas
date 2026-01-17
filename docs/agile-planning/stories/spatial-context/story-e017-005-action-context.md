# Story E017-005: Action Context 분석 및 문서화

## 📋 Story 개요
**Epic**: Epic-017: Spatial Context SDK 오픈소스화  
**Sprint**: Sprint 028  
**Story Points**: 2  
**담당자**: [할당 필요]  
**상태**: ✅ 완료  
**완료 일자**: 2026-01-16  
**구현 상태**: ✅ 개발 완료 (SSOTA)

## 🎯 Story Goal
```
As a 개발자
I want to Action Context(액션 맥락) 기능을 분석하고 문서화하여
So that SDK README에 포함할 내용과 구현 가이드를 작성할 수 있다
```

## 📝 Description
**액션 맥락(Action Context)**은 AI 에이전트가 수행할 수 있는 작업/액션에 대한 정보를 제공한다.

### 핵심 기능
1. **블록 액션 정의**: 각 블록 타입별 수행 가능한 액션 목록
2. **액션 파라미터**: 액션 실행에 필요한 파라미터 스키마
3. **조건부 가용성**: 현재 상태에서 실행 가능한 액션 필터링
4. **공통 액션**: 블록 검색, 블록 조작 등 범용 액션

### 설계 원리
> 업무에 대한 맥락이 있더라도 해당 업무를 수행하는 방법, 프로그램 사용법을 모르면 업무를 완수할 수 없다

## ✅ Acceptance Criteria

### AC1: 코드 분석 완료
- [x] Action Context 관련 코드 파일 식별
- [x] 액션 정의 시스템 분석
- [x] 액션 파라미터 스키마 구조 분석
- [x] 조건부 액션 가용성 판단 로직 분석

### AC2: 인터페이스 설계
- [x] ActionContextProvider 인터페이스 정의
- [x] Action 및 ActionSchema 타입 정의
- [x] ActionContextOptions 타입 정의
- [x] ActionContextResult 타입 정의

### AC3: 문서 작성 완료
- [x] Action Context 개념 설명 문서
- [x] 액션 등록 가이드
- [x] 사용 예시 코드 (의사 코드)
- [x] README 섹션 초안

## 📦 Technical Details

### 예상 인터페이스
```typescript
// 액션 파라미터 스키마 (JSON Schema 기반)
interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
  default?: unknown;
  enum?: unknown[];
  properties?: Record<string, ActionParameter>;  // for object type
  items?: ActionParameter;  // for array type
}

// 액션 정의
interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  
  // 액션 대상 (특정 블록 타입 또는 전역)
  target: 'global' | string[];  // 'global' or block type names
  
  // 파라미터 스키마
  parameters: ActionParameter[];
  
  // 가용성 조건 (optional)
  isAvailable?: (context: ActionAvailabilityContext) => boolean;
  
  // 액션 실행 핸들러
  execute: (params: Record<string, unknown>) => Promise<ActionResult>;
}

interface ActionAvailabilityContext {
  selectedBlocks: Block[];
  canvasState: CanvasState;
  userPermissions: string[];
}

interface ActionResult {
  success: boolean;
  message?: string;
  data?: unknown;
  affectedBlocks?: string[];
}

interface ActionContextOptions {
  // 특정 블록 타입 필터
  blockTypes?: string[];
  
  // 전역 액션 포함 여부
  includeGlobal?: boolean;
  
  // 현재 가용한 액션만 필터
  onlyAvailable?: boolean;
  
  // 유저 발화 기반 관련 액션 필터
  relevanceQuery?: string;
}

interface ActionContextResult {
  // 사용 가능한 액션 목록
  availableActions: ActionDefinition[];
  
  // 액션 카테고리별 그룹
  actionsByCategory: Record<string, ActionDefinition[]>;
  
  // 추천 액션 (유저 발화 기반)
  suggestedActions?: ActionDefinition[];
  
  // 컨텍스트 요약 (LLM 프롬프트용)
  summary: string;
}

interface ActionContextProvider {
  // 액션 등록
  registerAction(action: ActionDefinition): void;
  
  // 액션 일괄 등록
  registerActions(actions: ActionDefinition[]): void;
  
  // 액션 조회
  getContext(options?: ActionContextOptions): ActionContextResult;
  
  // 액션 실행
  executeAction(
    actionId: string,
    params: Record<string, unknown>
  ): Promise<ActionResult>;
}
```

### LLM Tool 생성 유틸리티
```typescript
// ActionDefinition을 LLM Tool 형식으로 변환
interface LLMToolConverter {
  // OpenAI Function Calling 형식
  toOpenAITools(actions: ActionDefinition[]): OpenAITool[];
  
  // Anthropic Tool Use 형식
  toAnthropicTools(actions: ActionDefinition[]): AnthropicTool[];
  
  // MCP Tool 형식
  toMCPTools(actions: ActionDefinition[]): MCPTool[];
}
```

### 설계 고려사항
1. **타입 안정성**: 파라미터 스키마와 TypeScript 타입 동기화
2. **확장성**: 커스텀 액션 쉽게 등록
3. **LLM 통합**: 다양한 LLM의 Tool/Function 형식 지원

## 🔗 Dependencies
- **선행**: E017-001 (코드 분석 및 추상화 설계)
- **후행**: 없음
- **블로커**: 없음

## 🎯 Definition of Done
- [x] 코드 분석 문서 작성 (`docs/04-action-context.md`)
- [x] 인터페이스 정의 완료
- [x] README Action Context 섹션 작성
- [x] LLM Tool 변환 가이드 작성

## 📝 Notes
- Action Context는 **개발 완료** 상태이므로 실제 구현 코드 참조 가능
- LLM Tool 형식 변환은 다양한 LLM 지원을 위해 중요
- JSON Schema 기반 파라미터 정의로 런타임 검증 가능
