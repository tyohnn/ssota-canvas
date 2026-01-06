# Object-based Dependency Injection

This pattern involves gathering all external dependencies (e.g., hooks from libraries like React Flow or global state managers) in a single "Entry Hook" and injecting them into sub-hooks or components as a single configuration object.

## Implementation Principles

### 1. Centralized Entry Hook
All external hook calls (e.g., `useStore`, `useViewport`, `useReactFlow`) must occur only within the main Entry Hook (`use-*.ts`). Sub-logic files (`.ui.ts`, `.business.ts`) should not call these external hooks directly.

### 2. Dependency Bundling
Gathered dependencies should be bundled into semantic objects such as `FlowDependencies` or `DomainDependencies`. Separating dependencies by concern (e.g., Framework vs. Domain) keeps interfaces clean and makes it easier to mock only what is needed for specific tests.

### 3. Logic Injection
Pass these dependency objects into sub-hooks. This makes the sub-hooks "pure" in terms of framework dependency, as they only operate on the data and functions provided to them.

## Entry Hook Template (Boilerplate)

Follow this numbered flow and comment style in every Entry Hook (`use-*.ts`). For complex modules, separate dependencies into **Framework** (e.g., React Flow) and **Domain** (internal services) objects:

```typescript
/**
 * Combined Hook: UI + Business Logic
 *
 * This hook serves as the single point of entry for all external dependencies.
 */
export function useFeatureModule(
  props: FeatureProps,
  businessLogic?: FeatureBusinessLogic
): FeatureReturn {
  // 1. Gather External Dependencies (The only place where external hooks are called)
  // Framework / Library Hooks
  const { deleteElements, setNodes } = useReactFlow();
  const nodes = useStore(state => state.nodes);

  // Domain / Service Hooks
  const transform = useCanvasBlockTransform({ orgId: props.orgId, ... });
  const { exitToDefaultMode } = useCanvasMode();

  // 2. Bundle Dependencies into semantic objects (Separated by concern)
  const flowDependencies: FlowDependencies = {
    nodes,
    setNodes,
    deleteElements,
  };

  const domainDependencies: DomainDependencies = {
    alignBlocks: transform.alignBlocks,
    exitToDefaultMode,
  };

  // 3. Inject into UI State Hook (Designer area)
  const uiState = useFeatureUI({
    selectedNodes: nodes.filter(n => n.selected),
    viewport: useViewport(), // Can also be bundled if needed
  });

  // 4. Inject into Business Logic Hook (Engineer area)
  // Pass separated dependency objects for cleaner interface
  const business =
    businessLogic ??
    useFeatureBusiness(flowDependencies, domainDependencies);

  // 5. Compose and Return
  return {
    ...uiState,
    ...business,
  };
}
```

## Benefits

### 1. Superior Testability
By injecting dependencies as plain objects, you can test business and UI logic without complex mocking of third-party libraries. You simply pass a mock object that matches the interface.

### 2. Framework Decoupling
If the external library (e.g., React Flow) is updated or replaced, you only need to update the mapping in the Entry Hook. The core business logic remains untouched.

### 3. Architectural Visibility
The Entry Hook serves as a clear "manifest" of everything the module depends on, making the architecture easy to audit and understand.
