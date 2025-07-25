# US-001 Test Suite: Design Workflow in Visual Canvas

이 테스트 스위트는 US-001 "Design Workflow in Visual Canvas" 스토리에 대한 포괄적인 테스트를 제공합니다.

## 테스트 구조

### 1. 컴포넌트 테스트 (Unit Level)

- **위치**: `unit/components/`
- **목적**: 개별 React 컴포넌트를 격리된 환경에서 테스트
- **프레임워크**: Vitest + @testing-library/react

#### 테스트 대상 컴포넌트:

- `canvas-page.test.tsx` - Canvas Page 컴포넌트
- `node-explorer.test.tsx` - Node Explorer 컴포넌트
- `top-toolbox.test.tsx` - Top Toolbox 컴포넌트
- `editor-panel.test.tsx` - Editor Panel 컴포넌트
- `canvas.test.tsx` - Canvas 컴포넌트

### 2. 비즈니스 로직 테스트 (Unit Level)

- **위치**: `unit/business-logic/`
- **목적**: 비즈니스 로직 함수, 훅, 유틸리티 테스트
- **프레임워크**: Vitest

#### 테스트 대상 로직:

- `canvas-state-management.test.ts` - Canvas 상태 관리 로직
- `node-operations.test.ts` - Node CRUD 작업 로직
- `node-validation.test.ts` - Node 검증 로직
- `connection-validation.test.ts` - 연결 검증 로직

### 3. 통합 테스트

- **위치**: `integration/`
- **목적**: 컴포넌트 간 상호작용 및 데이터 플로우 테스트
- **프레임워크**: Vitest + MSW

#### 테스트 대상 통합:

- `canvas-layout-to-workflow-designer.test.tsx` - Canvas Layout과 Workflow Designer 통합
- `node-explorer-to-widget-selector.test.tsx` - Node Explorer와 Widget Selector 통합
- `widget-selector-to-canvas.test.tsx` - Widget Selector와 Canvas 통합

## 테스트 실행

### 전체 테스트 스위트 실행

```bash
pnpm test:us001
```

### 개별 테스트 카테고리 실행

```bash
# 컴포넌트 테스트만
pnpm test:unit

# 비즈니스 로직 테스트만
pnpm test:unit --testPathPattern=business-logic

# 통합 테스트만
pnpm test:integration
```

### 커버리지와 함께 실행

```bash
pnpm test:coverage
```

### 감시 모드로 실행

```bash
pnpm test:watch
```

## 테스트 데이터

`test-data.ts` 파일에는 다음 테스트 데이터가 포함되어 있습니다:

- **User authentication data**: 사용자 인증 정보
- **Workspace data**: 워크스페이스 정보
- **Node type definitions**: 7개 핵심 노드 타입 정의
- **Widget selection data**: 위젯 선택 데이터
- **Node metadata**: 노드 메타데이터
- **Connection validation rules**: 연결 검증 규칙
- **Workflow save data**: 워크플로우 저장 데이터

## 테스트 실행 순서

test-case-US-001.json에 정의된 테스트 계층 구조에 따라 다음 순서로 실행됩니다:

1. **Canvas Layout Rendering** → **Workflow Designer Page Loading**
2. **Workflow Designer Page Loading** → **Seven Core Node Explorer Rendering**
3. **Node Explorer Rendering** → **Widget Selector Functionality**
4. **Widget Selector** → **React Flow Canvas Node Creation**
5. **Canvas Node Creation** → **Editor Panel Overlay Opening**
6. **Editor Panel** → **Node Metadata Editor Form**
7. **Metadata Editor** → **Node Validation Logic**
8. **Canvas** → **Node Operations Logic**
9. **Canvas Connection** → **Connection Validation Logic**

## 커버리지 요구사항

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## 모킹 전략

### 외부 의존성 모킹

- **Next.js Router**: `next/navigation` 모킹
- **Clerk Authentication**: `@clerk/nextjs` 모킹
- **Supabase**: `@supabase/supabase-js` 모킹
- **API Calls**: MSW를 사용한 API 모킹

### 컴포넌트 모킹

- **UI Components**: `@/components/ui/*` 모킹
- **Child Components**: 각 컴포넌트의 자식 컴포넌트 모킹
- **Icons**: Lucide React 아이콘 모킹

## 검증 규칙

### 컴포넌트 테스트

- ✅ 컴포넌트가 올바르게 렌더링되는지 확인
- ✅ Props를 올바르게 처리하는지 확인
- ✅ 이벤트를 올바르게 처리하는지 확인
- ✅ 접근성이 보장되는지 확인

### 비즈니스 로직 테스트

- ✅ 입력값을 올바르게 검증하는지 확인
- ✅ 오류를 올바르게 처리하는지 확인
- ✅ 예상된 출력을 반환하는지 확인
- ✅ 순수 함수인지 확인

### 통합 테스트

- ✅ 데이터 플로우를 테스트하는지 확인
- ✅ 컴포넌트 간 상호작용을 테스트하는지 확인
- ✅ 비동기 작업을 올바르게 처리하는지 확인
- ✅ 오류 전파를 테스트하는지 확인

## 문제 해결

### 일반적인 문제들

1. **Vitest 모듈을 찾을 수 없음**

   ```bash
   pnpm install
   ```

2. **타입 오류**

   ```bash
   pnpm typecheck
   ```

3. **린터 오류**

   ```bash
   pnpm lint:fix
   ```

4. **테스트 실패**
   - 테스트 데이터가 올바른지 확인
   - 모킹이 올바르게 설정되었는지 확인
   - 비동기 작업이 올바르게 처리되었는지 확인

## 추가 정보

- **테스트 케이스 문서**: `docs/architect/test-case-US-001.json`
- **테스팅 규칙**: `docs/data/testing-rule.md`
- **Vitest 설정**: `vitest.config.ts`
- **테스트 설정**: `src/__tests__/setup.ts`
