# React Flow Canvas 마이그레이션 계획

## 📋 개요

Canvas 도메인과 React Flow Canvas 간의 복잡한 동기화 로직을 단순화하고, React Flow의 최적화된 상태 관리를 활용하여 성능을 개선하는 마이그레이션 계획입니다.

## 🎯 목표

### **현재 문제점**
- Canvas SSOT와 React Flow 내부 상태의 중복 관리
- 복잡한 실시간 동기화 로직
- 성능 오버헤드 (불필요한 리렌더링)
- 디버깅의 어려움

### **목표 상태**
- React Flow 내부 상태를 SSOT로 활용
- 페이지 전환 시에만 DB 동기화
- 단순하고 예측 가능한 데이터 흐름
- 향상된 성능과 사용자 경험

## 🚀 마이그레이션 단계

### **Phase 1: 이벤트 핸들러 정리**

#### **현재 상태**
```typescript
// useReactFlowCanvasAdapter.tsx
const onNodeDragStop = useCallback(async (node: Node, event: React.MouseEvent) => {
  // 1. React Flow 상태 업데이트 (Optimistic UI)
  rf.setNodes((nodes) =>
    nodes.map((n) =>
      n.id === node.id ? { ...n, position: node.position } : n
    )
  );
  
  // 2. Canvas SSOT 업데이트 (실시간 동기화)
  await domainCommands.updateNodePosition(node.id, node.position);
}, []);
```

#### **변경 후**
```typescript
// React Flow 내부 상태만 사용
const onNodeDragStop = useCallback(async (node: Node, event: React.MouseEvent) => {
  // DB 업데이트만 (React Flow 상태는 내부에서 관리)
  await domainCommands.updateNodePosition(node.id, node.position);
}, []);
```

#### **수정 대상 파일**
- `apps/web/src/domains/canvas/adapters/useReactFlowCanvasAdapter.tsx`
- `apps/web/src/domains/react-flow-canvas/handlers/useReactFlowHandler.tsx`

#### **제거할 로직**
- ✅ SSOT 실시간 업데이트
- ✅ 복잡한 상태 동기화
- ✅ Optimistic UI 패턴 (React Flow 내부에서 처리)

#### **유지할 로직**
- ✅ DB 업데이트 명령
- ✅ 에러 처리
- ✅ 이벤트 전파 방지

### **Phase 2: React Flow Renderer 직접 연결**

#### **현재 상태**
```typescript
// integrated-react-flow-canvas.tsx
<ReactFlowCanvasRenderer />
```

#### **변경 후**
```typescript
// React Flow 컴포넌트 직접 사용
<ReactFlow
  nodes={reactFlowNodes}
  edges={reactFlowEdges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onNodeClick={onNodeClick}
  onNodeDragStop={onNodeDragStop}
  // ... 기타 이벤트 핸들러들
/>
```

#### **수정 대상 파일**
- `apps/web/src/domains/canvas/components/canvas/integrated-react-flow-canvas.tsx`
- `apps/web/src/domains/canvas/components/canvas-page.tsx`

#### **새로운 구조**
```typescript
// React Flow 상태 직접 관리
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// 이벤트 핸들러 직접 연결
const onNodeDragStop = useCallback(async (node: Node) => {
  await domainCommands.updateNodePosition(node.id, node.position);
}, [domainCommands]);
```

### **Phase 3: 페이지 전환 캐싱 (선택사항)**

#### **구현 내용**
```typescript
// 페이지 전환 시 변경사항 저장
const onPageChange = async (newPageId: string) => {
  if (hasUnsavedChanges) {
    await saveCurrentPageChanges();
  }
  await loadPage(newPageId);
};

// 변경사항 추적
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

const onNodeChange = (changes: NodeChange[]) => {
  setHasUnsavedChanges(true);
};
```

#### **장점**
- ✅ 페이지 전환 시 자동 저장
- ✅ 사용자 작업 손실 방지
- ✅ 성능 최적화 (필요한 경우에만 저장)

## 📊 기대 효과

### **성능 개선**
- **리렌더링 감소**: SSOT 동기화 제거로 50% 이상 개선 예상
- **메모리 사용량 감소**: 중복 상태 제거
- **반응성 향상**: React Flow 내부 최적화 활용

### **개발 경험 개선**
- **디버깅 용이성**: 명확한 데이터 흐름
- **코드 복잡성 감소**: 단순한 구조
- **유지보수성 향상**: 예측 가능한 동작

### **사용자 경험 개선**
- **부드러운 인터랙션**: 지연 없는 드래그/드롭
- **빠른 페이지 전환**: 캐싱 활용
- **안정적인 상태 관리**: 데이터 손실 방지

## 🔧 기술적 세부사항

### **React Flow 상태 관리**
```typescript
// useNodesState, useEdgesState 활용
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// 내장 최적화 활용
const reactFlowInstance = useReactFlow();
```

### **이벤트 핸들러 구조**
```typescript
// 단순한 DB 업데이트만
const eventHandlers = {
  onNodeDragStop: async (node: Node) => {
    await updateNodePosition(node.id, node.position);
  },
  onNodeClick: (node: Node) => {
    setSelectedNodeId(node.id);
  },
  // ... 기타 핸들러들
};
```

### **데이터 변환**
```typescript
// Canvas 도메인 → React Flow 변환
const transformBlocksToNodes = (blocks: Block[], positions: BlockPosition[]) => {
  return blocks.map(block => ({
    id: block.id,
    type: getNodeType(block),
    position: getPosition(block.id, positions),
    data: transformBlockData(block)
  }));
};
```

## ⚠️ 주의사항

### **마이그레이션 중 고려사항**
1. **단계별 테스트**: 각 Phase 완료 후 충분한 테스트
2. **롤백 계획**: 문제 발생 시 이전 단계로 복구 가능
3. **데이터 무결성**: 페이지 전환 시 데이터 손실 방지
4. **성능 모니터링**: 각 단계별 성능 측정

### **호환성 유지**
- 기존 API 인터페이스 유지
- 외부 컴포넌트와의 호환성 보장
- 점진적 마이그레이션으로 안정성 확보

## 📅 일정

### **Phase 1: 이벤트 핸들러 정리 (1-2일)**
- [ ] `useReactFlowCanvasAdapter.tsx` 수정
- [ ] SSOT 업데이트 로직 제거
- [ ] DB 업데이트만 남기기
- [ ] 테스트 및 검증

### **Phase 2: React Flow Renderer 연결 (2-3일)**
- [ ] `integrated-react-flow-canvas.tsx` 수정
- [ ] React Flow 컴포넌트 직접 사용
- [ ] 이벤트 핸들러 직접 연결
- [ ] 상태 관리 로직 정리
- [ ] 테스트 및 검증

### **Phase 3: 페이지 전환 캐싱 (1-2일, 선택사항)**
- [ ] 변경사항 추적 로직 구현
- [ ] 페이지 전환 시 저장 로직
- [ ] 캐싱 최적화
- [ ] 테스트 및 검증

## 🎯 성공 지표

### **정량적 지표**
- 리렌더링 횟수 50% 감소
- 메모리 사용량 30% 감소
- 페이지 전환 시간 40% 단축

### **정성적 지표**
- 코드 복잡성 감소
- 디버깅 시간 단축
- 개발자 만족도 향상

## 📝 결론

이 마이그레이션을 통해 React Flow의 최적화된 상태 관리를 활용하여 성능을 크게 개선하고, 복잡한 동기화 로직을 단순화할 수 있습니다. 단계별 접근으로 안전하게 진행하여 안정성과 성능을 모두 확보할 수 있을 것입니다.
