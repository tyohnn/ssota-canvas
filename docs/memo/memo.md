# xbowl 개발 메모

## UI/UX 개선사항

### 1. 캔버스 노드별 상단 툴바
- 선택된 노드 타입에 따라 컨텍스트별 툴바 제공
- Workflow 선택시: Start/Conditional/End 노드 툴
- Artifact Template 선택시: Node/Edge/Column Definition 툴

### 2. 우측 에디터 패널 (Editor Panel Overlay)
- 캔버스에서 노드 클릭하면 우측에 에디터 띄우기
- 확대되는 애니메이션 효과
- 노드 타입별 컨텍스트 폼 제공
- z-index 오버레이로 구현

### 3. 헤더 탭 구조 개선
- Workflow Editor와 Execution 모드를 헤더 탭으로 배치
- 중앙 탭 제거하고 깔끔한 구조로

### 4. 계층적 인스턴스 관리
- 첫번째 계층: 워크플로우 인스턴스들
- 인스턴스 클릭시: 생성된 파일들 및 실행 내역 확인
- 실행 모드에서 실시간 진행상황 모니터링

### 5. 상시 채팅 인터페이스
- 우측에 항상 채팅 인터페이스 띄우기
- 에이전트와 실시간 소통 가능

## 아티팩트 시스템 확장 설계

### 6. 아티팩트 정의 에디터들
- **노드 정의 에디터**: 커스텀 노드 타입 정의
- **엣지 정의 에디터**: 노드 간 연결 규칙 정의  
- **칼럼 정의 에디터**: 테이블 형태 아티팩트용

### 7. 렌더링 타입별 아티팩트 출력
아티팩트는 렌더링 타입에 따라 다양한 형태로 캔버스에 출력:

#### 기본 렌더러들
- **캔버스**: 기본 노드/엣지 플로우
- **마크다운**: 텍스트 문서 형태
- **테이블**: 데이터 테이블 형태
- **칸반**: 칸반보드 형태

#### 캔버스 익스텐션 (확장 시스템)
- **웹뷰 프리뷰**: 와이어프레임 조작용
- **커스텀 렌더러**: 개발자 정의 가능

### 8. MCP스러운 엄밀한 스키마 시스템

캔버스 익스텐션이 되려면 아티팩트 템플릿에 정의된 엄밀한 스키마 필요:

```typescript
interface ArtifactTemplateSchema {
  renderer: {
    type: "canvas" | "markdown" | "table" | "kanban" | "webview" | "custom"
    schema: RendererSchema
  }
  element_definitions: {
    node_types: NodeDefinitionSchema[]
    edge_types: EdgeDefinitionSchema[] 
    column_types?: ColumnDefinitionSchema[]
  }
  agent_schema: {
    description: string
    generation_rules: string[]
    validation_rules: string[]
  }
}
```

### 9. 웹뷰 익스텐션 예시 (와이어프레임용)

```typescript
interface WebviewRendererSchema {
  type: "webview"
  framework: "react" | "vue" | "vanilla" | "figma-like"
  
  interaction_schema: {
    editable_elements: string[] // CSS 셀렉터들
    style_properties: string[] // 조작 가능한 속성들
    data_bindings: DataBindingSchema[]
  }
  
  wireframe_elements: {
    containers: ContainerDefinition[]
    components: ComponentDefinition[]
    interactions: InteractionDefinition[]
  }
}
```

### 10. AI 에이전트 통합 방식

템플릿별로 AI가 읽기 쉬운 구조:
- **SDK 개발자**: 새로운 렌더러를 플러그인처럼 추가
- **AI 에이전트**: 구조화된 스키마로 아티팩트 생성
- **사용자**: 템플릿 노드 에디터로 직관적 정의

이를 통해 와이어프레임처럼 웹뷰에서 실제 UI를 조작하며 AI에게 프로토타입을 제공할 수 있음.

## 확장 시스템의 핵심 아키텍처

### SDK 기반 렌더러 플러그인 시스템

```typescript
// 개발자가 새로운 렌더러를 등록하는 방식
interface RendererExtension {
  id: string
  name: string
  version: string
  
  // 렌더러 구현체 (React 컴포넌트)
  renderer_component: React.ComponentType<RendererProps>
  
  // 스키마 정의
  schema_definition: {
    element_types: ElementTypeDefinition[]
    tool_definitions: ToolDefinition[]
    validation_rules: ValidationRule[]
  }
  
  // AI 에이전트가 이해할 수 있는 설명
  agent_integration: {
    description_template: string
    generation_prompt: string
    validation_prompt: string
  }
  
  // 템플릿 노드에서 사용할 전용 에디터들
  template_nodes: {
    node_definition_editor: NodeDefinitionEditorConfig
    edge_definition_editor: EdgeDefinitionEditorConfig
    custom_property_editor?: CustomPropertyEditorConfig
  }
}
```

### 에이전트가 읽기 쉬운 템플릿 스키마

```typescript
// AI가 템플릿을 이해하고 조작하기 위한 인터페이스
interface AgentTemplateInterface {
  // 템플릿 설명을 자연어로 제공
  describe_template(template_id: string): {
    description: string
    available_elements: string[]
    constraints: string[]
    example_usage: string
  }
  
  // 에이전트가 노드를 생성할 때 사용하는 툴들
  create_node_with_template(
    template_id: string,
    node_type: string,
    properties: any
  ): Promise<NodeCreationResult>
  
  // 웹뷰 조작 툴 (와이어프레임용)
  manipulate_webview(
    element_selector: string,
    action: "create" | "update" | "delete" | "style",
    properties: Record<string, any>
  ): Promise<WebviewManipulationResult>
  
  // 템플릿 기반 검증
  validate_structure(
    template_id: string,
    nodes: Node[],
    edges: Edge[]
  ): ValidationResult
}
```

### 구체적 활용 시나리오: 와이어프레임 제작

#### 1. 와이어프레임 템플릿 정의
- **노드 정의 에디터**로 Container, Button, Input 등 UI 요소 정의
- **엣지 정의 에디터**로 포함관계, 이벤트 연결 등 정의
- **웹뷰 렌더러**로 실제 HTML/CSS 조작 가능하게 설정

#### 2. AI 에이전트가 와이어프레임 생성
```typescript
// 에이전트가 사용할 수 있는 와이어프레임 전용 툴들
const wireframeTools = {
  create_container: {
    description: "Create wireframe container element",
    parameters: {
      position: { x: number, y: number },
      size: { width: number, height: number },
      style: "card | panel | section"
    }
  },
  
  create_button: {
    description: "Create interactive button",
    parameters: {
      text: string,
      click_action: string,
      style_preset: "primary | secondary | danger"
    }
  },
  
  connect_interaction: {
    description: "Define interaction between elements",
    parameters: {
      source_element: string,
      target_element: string,
      interaction_type: "click | hover | focus"
    }
  }
}
```

#### 3. 실시간 웹뷰 조작
- 에이전트가 `manipulate_webview` 툴로 실제 DOM 조작
- 사용자가 실시간으로 변경사항 확인 가능
- CSS 스타일, 레이아웃, 상호작용까지 즉시 프리뷰

#### 4. AI에게 시각적 컨텍스트 제공
- 완성된 와이어프레임을 스크린샷으로 캡처
- 다음 단계 AI 에이전트에게 시각적 자료로 전달
- "이 와이어프레임을 기반으로 실제 코드를 생성해줘" 같은 요청 가능

### 캔버스 익스텐션의 확장성

#### 다양한 도메인별 익스텐션 가능
- **3D 모델링**: Three.js 기반 3D 캔버스
- **데이터 시각화**: D3.js 기반 차트/그래프 캔버스  
- **게임 개발**: Phaser.js 기반 게임 엔진 캔버스
- **음악 제작**: Web Audio API 기반 음악 시퀀서
- **영상 편집**: FFmpeg 기반 타임라인 에디터

#### Universal Node System과의 통합
- 모든 익스텐션이 동일한 노드 시스템 사용
- 크로스 도메인 아티팩트 연동 가능
- 예: 와이어프레임 → 3D 모델 → 게임 레벨 자동 생성

### 개발자 생태계 조성

#### SDK 제공으로 오픈 생태계 구축
- **렌더러 SDK**: 새로운 캔버스 타입 쉽게 개발
- **템플릿 마켓플레이스**: 커뮤니티 제작 템플릿 공유
- **AI 프롬프트 라이브러리**: 도메인별 AI 프롬프트 공유
- **플러그인 아키텍처**: Figma처럼 확장 가능한 구조

이렇게 하면 xbowl이 단순한 AI 워크플로우 툴을 넘어서 **Universal Creative Platform**이 될 수 있을 것 같습니다!
