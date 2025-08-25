# Canvas Component System Design

## 🎯 개요

캔버스 도메인에 컴포넌트 시스템을 도입하여, 블록을 "정의"와 "인스턴스"로 분리하고 일관된 스타일 관리와 재사용성을 제공합니다.

## 🏗️ 핵심 설계 원칙

### 1. 컴포넌트 모델

- **컴포넌트 정의 (Component Definition)**: 스타일과 스키마를 정의하는 템플릿
- **컴포넌트 인스턴스 (Component Instance)**: 정의를 기반으로 한 실제 블록

### 2. 스타일 관리 규칙

- **기본**: 인스턴스는 정의의 `node_ui` 스타일을 사용
- **오버라이드**: 인스턴스에 `metadata.node_ui`가 있으면 정의 스타일을 덮어씀
- **복원**: 인스턴스의 `node_ui`를 제거하면 정의 스타일로 돌아감

### 3. 데이터 모델

```typescript
// 컴포넌트 정의
type ComponentDefinition = Block & {
  object: "component";
  metadata: {
    role: "definition";
    node_ui: NodeUI; // 기본 스타일
    schema?: SchemaDef; // 데이터 필드 정의
    component_key: string; // 컴포넌트 식별자
  };
};

// 컴포넌트 인스턴스
type ComponentInstance = Block & {
  object: "component";
  metadata: {
    role: "instance";
    component_id: string; // 정의 블록 ID 참조
    node_ui?: NodeUI; // 선택적 스타일 오버라이드
    data?: Record<string, unknown>; // 인스턴스 데이터
  };
};
```

## 🔄 스타일 해석 로직

### 핵심 함수: `resolveNodeStyle`

```typescript
function resolveNodeStyle(
  block: Block,
  definitionsById: Record<string, ComponentDefinition>
): NodeUI {
  if (block.object === "component" && block.metadata?.role === "instance") {
    const def = definitionsById[block.metadata.component_id];
    const baseStyle = def?.metadata?.node_ui ?? DEFAULT_NODE_UI;
    const overrideStyle = block.metadata?.node_ui;

    // 오버라이드가 있으면 머지, 없으면 기본 스타일
    return overrideStyle ? { ...baseStyle, ...overrideStyle } : baseStyle;
  }

  if (block.object === "component" && block.metadata?.role === "definition") {
    return block.metadata.node_ui ?? DEFAULT_NODE_UI;
  }

  // 일반 블록 (점진 전환기)
  return block.metadata?.node_ui ?? DEFAULT_NODE_UI;
}
```

## 🎮 사용자 시나리오

### 1. 컴포넌트 정의 생성

1. 기존 블록을 선택
2. "컴포넌트로 승격" 명령 실행
3. 정의 블록 생성 (스타일/스키마 추출)
4. 원 블록을 인스턴스로 변환

### 2. 컴포넌트 인스턴스 생성

1. 정의 블록을 선택하거나 팔레트에서 선택
2. 캔버스에 드래그하여 인스턴스 생성
3. 정의의 기본 스타일로 렌더링

### 3. 스타일 오버라이드

1. 인스턴스 선택
2. 속성 패널에서 "커스텀 스타일" 활성화
3. 스타일 수정 (색상, 크기, 아이콘 등)
4. 정의 스타일과 머지되어 적용

### 4. 스타일 복원

1. 인스턴스 선택
2. "정의 스타일 사용" 클릭
3. 오버라이드 제거, 정의 스타일로 복원

### 5. 정의 변경 시 인스턴스 반영

1. 정의 블록의 스타일 수정
2. 모든 인스턴스에 즉시 반영 (오버라이드 없는 부분만)
3. 오버라이드된 부분은 유지

## 🏛️ 아키텍처 계층별 구현

### 1. 도메인 계층 (Domain Layer)

- **정책 (Policy)**: 컴포넌트 렌더링, 편집, 추가 정책
- **타입 (Types)**: 컴포넌트 정의/인스턴스 타입 정의
- **유틸리티 (Utils)**: 스타일 해석, 변환 함수

### 2. 저장소 계층 (Store Layer)

- **블록 저장소**: 컴포넌트 정의/인스턴스 상태 관리
- **선택 저장소**: 정의/인스턴스 선택 상태
- **캐시 저장소**: 정의 데이터 LRU 캐시

### 3. 컨텍스트 계층 (Context Layer)

- **데이터 컨텍스트**: 컴포넌트 정의 조회 API
- **선택 컨텍스트**: 정의/인스턴스 선택 상태
- **명령 컨텍스트**: 컴포넌트 관련 명령

### 4. 뷰모델 계층 (ViewModel Layer)

- **React Flow 뷰모델**: 컴포넌트 스타일 해석 및 노드 변환
- **에디터 뷰모델**: 인스턴스 편집 UI 상태

### 5. 어댑터 계층 (Adapter Layer)

- **이벤트 어댑터**: 컴포넌트 관련 UI 이벤트 처리
- **명령 어댑터**: 사용자 액션을 도메인 명령으로 변환

### 6. UI 계층 (UI Layer)

- **에디터 컴포넌트**: 인스턴스 편집, 스타일 오버라이드 UI
- **탐색기 컴포넌트**: 정의/인스턴스 트리 뷰
- **캔버스 컴포넌트**: 컴포넌트 시각적 표시

## 📋 구현 투두리스트

### Phase 1: 핵심 인프라 (1-3단계)

#### 1단계: 도메인 모델 및 타입 정의

- [ ] **1.1** `domains/canvas/types/component.ts` 생성

  - `ComponentDefinition`, `ComponentInstance` 타입 정의
  - `resolveNodeStyle` 유틸리티 함수 구현
  - `isComponentDefinition`, `isComponentInstance` 가드 함수
  - `DEFAULT_NODE_UI` 상수 정의

- [ ] **1.2** `domains/canvas/policy/component-policy.ts` 생성
  - 컴포넌트 관련 정책 인터페이스 정의
  - 스타일 오버라이드 규칙 정책
  - 컴포넌트 변환/승격 규칙
  - 정의-인스턴스 관계 검증 정책

#### 2단계: 뷰모델 계층 수정

- [ ] **2.1** `domains/canvas/view-models/useReactFlowViewModel.ts` 수정

  - `resolveNodeStyle` 함수 통합
  - 컴포넌트 정의 조회 로직 추가
  - 인스턴스 스타일 오버라이드 처리
  - 정의 누락 시 폴백 처리

- [ ] **2.2** `domains/canvas/stores/blocks.store.ts` 수정
  - 컴포넌트 정의/인스턴스 구분 로직 추가
  - 스타일 오버라이드 상태 관리
  - 컴포넌트 관계 추적 로직

#### 3단계: 데이터 컨텍스트 확장

- [ ] **3.1** `domains/canvas/contexts/CanvasDataContext.tsx` 수정

  - `getComponentDefinitionById(id)` 쿼리 추가
  - `listComponentDefinitionsByIds(ids)` 쿼리 추가
  - 컴포넌트 정의 캐싱 로직
  - 인스턴스별 정의 조회 최적화

- [ ] **3.2** `domains/canvas/hooks/usePagePositionCache.tsx` 수정
  - 컴포넌트 정의 데이터 로딩 로직 추가
  - 인스턴스 표시 시 정의 데이터 함께 로드
  - 정의 캐시 무효화 로직

### Phase 2: 명령 및 정책 (4-5단계)

#### 4단계: 명령(Commands) 구현

- [ ] **4.1** `domains/canvas/hooks/useCanvasCommands.ts` 확장

  - `promoteBlockToComponentDefinition(blockId)` 구현
  - `linkBlocksToComponentDefinition(blockIds[], definitionId)` 구현
  - `createInstanceInPage(pageId, definitionId, at?)` 구현
  - `resetInstanceStyle(instanceId)` 구현 (오버라이드 제거)
  - `updateInstanceStyle(instanceId, styleOverrides)` 구현
  - `openComponentDefinitionEditor(instanceId)` 구현

- [ ] **4.2** 컴포넌트 관련 서버 액션 추가
  - `domains/canvas/actions/component.action.ts` 생성
  - 컴포넌트 정의 CRUD 액션
  - 인스턴스 스타일 업데이트 액션
  - 컴포넌트 관계 검증 액션

#### 5단계: 정책(Policy) 계층 수정

- [ ] **5.1** `domains/canvas/policy/block-rendering-policy.ts` 수정

  - 컴포넌트 인스턴스 렌더링 정책 추가
  - 스타일 오버라이드 처리 로직
  - 정의 누락 시 폴백 처리
  - 오버라이드 상태 시각적 표시 정책

- [ ] **5.2** `domains/canvas/policy/block-editor-policy.ts` 수정

  - 인스턴스 편집 시 스타일 오버라이드 UI 제공
  - "정의 스타일로 복원" 옵션 추가
  - 정의 편집으로 이동하는 CTA
  - 오버라이드 상태 표시

- [ ] **5.3** `domains/canvas/policy/block-addition-policy.ts` 수정
  - 컴포넌트 인스턴스 생성 정책
  - 페이지별 허용 컴포넌트 정의 필터링
  - 정의 기반 블록 팔레트 구성

### Phase 3: UI 및 사용자 경험 (6-7단계)

#### 6단계: UI 컴포넌트 수정

- [ ] **6.1** `domains/canvas/components/editor/block-editor-panel.tsx` 수정

  - 인스턴스 편집 시 스타일 오버라이드 섹션 추가
  - "정의 스타일 사용" / "커스텀 스타일" 토글
  - "정의로 이동" 버튼
  - 오버라이드 상태 시각적 표시

- [ ] **6.2** `domains/canvas/components/explorer/component-explorer.tsx` 생성

  - 컴포넌트 정의/인스턴스 트리 뷰
  - 정의별 인스턴스 목록
  - 인스턴스에서 정의로 네비게이션
  - 컴포넌트 검색 및 필터링

- [ ] **6.3** `domains/canvas/components/canvas/react-flow-renderer.tsx` 수정

  - 컴포넌트 인스턴스 시각적 표시 (오버라이드 상태 표시)
  - 정의 누락 시 경고 표시
  - 정의 변경 시 인스턴스 하이라이트

- [ ] **6.4** `domains/canvas/components/palette/component-palette.tsx` 생성
  - 컴포넌트 정의 팔레트
  - 드래그 앤 드롭으로 인스턴스 생성
  - 정의 미리보기

#### 7단계: 이벤트 핸들러 수정

- [ ] **7.1** `domains/canvas/handlers/useReactFlowHandler.tsx` 수정

  - 컴포넌트 인스턴스 드래그/리사이즈 처리
  - 스타일 오버라이드 상태 유지
  - 정의 변경 시 인스턴스 업데이트

- [ ] **7.2** `domains/canvas/handlers/useBlockHandler.tsx` 수정
  - 컴포넌트 관련 블록 조작 핸들러
  - 정의/인스턴스 전환 핸들러
  - 컴포넌트 컨텍스트 메뉴

### Phase 4: 완성도 및 안정성 (8-11단계)

#### 8단계: 선택 상태 관리

- [ ] **8.1** `domains/canvas/contexts/CanvasSelectionContext.tsx` 수정

  - 컴포넌트 정의/인스턴스 선택 상태 추가
  - 정의 선택 시 관련 인스턴스 하이라이트
  - 인스턴스 선택 시 정의 하이라이트

- [ ] **8.2** `domains/canvas/stores/selection.store.ts` 수정
  - 컴포넌트 선택 상태 관리
  - 정의-인스턴스 관계 추적
  - 다중 선택 시 컴포넌트 그룹핑

#### 9단계: 데이터 마이그레이션

- [ ] **9.1** 마이그레이션 스크립트 작성

  - 기존 일반 블록을 컴포넌트로 변환하는 옵션 제공
  - 중복 스타일 정리
  - 컴포넌트 관계 재구성

- [ ] **9.2** 데이터 검증 유틸리티
  - 컴포넌트 정의/인스턴스 무결성 검사
  - 고아 인스턴스 감지 및 수리
  - 스타일 오버라이드 정합성 검증

#### 10단계: 테스트 및 검증

- [ ] **10.1** 단위 테스트 작성

  - `resolveNodeStyle` 함수 테스트
  - 컴포넌트 정책 테스트
  - 명령 패턴 테스트
  - 스타일 오버라이드 로직 테스트

- [ ] **10.2** 통합 테스트

  - 컴포넌트 정의 생성 → 인스턴스 생성 → 스타일 오버라이드 → 복원 시나리오
  - 정의 변경 시 인스턴스 반영 테스트
  - 다중 인스턴스 동시 업데이트 테스트

- [ ] **10.3** 성능 테스트
  - 많은 인스턴스가 있을 때 정의 조회 성능
  - 스타일 오버라이드 시 렌더링 성능
  - 정의 변경 시 전체 인스턴스 업데이트 성능

#### 11단계: 문서화

- [ ] **11.1** 컴포넌트 시스템 사용 가이드 작성

  - 사용자 매뉴얼
  - 베스트 프랙티스
  - 트러블슈팅 가이드

- [ ] **11.2** API 문서 업데이트

  - 컴포넌트 관련 API 문서
  - 타입 정의 문서
  - 정책 인터페이스 문서

- [ ] **11.3** 마이그레이션 가이드 작성
  - 기존 프로젝트 마이그레이션 방법
  - 데이터 변환 가이드
  - 호환성 체크리스트

## 🚀 우선순위별 구현 순서

### 즉시 시작 가능한 작업 (Phase 1)

1. **타입 정의** (1.1) - 기반 구조 확립
2. **뷰모델 수정** (2.1) - 기본 동작 확보
3. **데이터 컨텍스트 확장** (3.1) - 정의 조회 기능

### 핵심 기능 구현 (Phase 2)

1. **명령 구현** (4.1) - 사용자 액션 처리
2. **정책 수정** (5.1) - 렌더링 규칙 적용

### 사용자 경험 개선 (Phase 3)

1. **UI 컴포넌트** (6.1-6.4) - 실제 사용자 인터페이스
2. **이벤트 핸들러** (7.1-7.2) - 상호작용 처리

### 완성도 향상 (Phase 4)

1. **선택 상태** (8.1-8.2) - 고급 선택 기능
2. **마이그레이션** (9.1-9.2) - 데이터 안정성
3. **테스트** (10.1-10.3) - 품질 보장
4. **문서화** (11.1-11.3) - 사용자 지원

## 🎯 기대 효과

### 개발자 경험

- **재사용성**: 컴포넌트 정의로 일관된 UI 패턴 적용
- **유지보수성**: 정의 변경 시 모든 인스턴스 자동 반영
- **확장성**: 새로운 컴포넌트 타입 쉽게 추가

### 사용자 경험

- **일관성**: 동일한 컴포넌트의 일관된 스타일
- **유연성**: 필요시 개별 인스턴스 스타일 커스터마이징
- **효율성**: 컴포넌트 재사용으로 빠른 프로토타이핑

### 시스템 안정성

- **데이터 무결성**: 정의-인스턴스 관계 검증
- **성능**: 효율적인 정의 캐싱 및 조회
- **확장성**: 점진적 마이그레이션 지원

## 🔧 기술적 고려사항

### 성능 최적화

- 정의 데이터 LRU 캐시로 메모리 효율성 확보
- 인스턴스별 정의 조회 최적화
- 스타일 오버라이드 시 머지 연산 최적화

### 데이터 일관성

- 정의 삭제 시 인스턴스 처리 정책
- 오버라이드 스타일 유효성 검증
- 컴포넌트 관계 무결성 보장

### 사용자 경험

- 정의 누락 시 명확한 오류 메시지
- 오버라이드 상태 시각적 표시
- 정의-인스턴스 간 쉬운 네비게이션

이 설계를 통해 캔버스 도메인에 강력하고 유연한 컴포넌트 시스템을 구축할 수 있습니다. 각 단계별로 동작하는 기능을 확보하면서 점진적으로 완성해 나갈 수 있습니다.
