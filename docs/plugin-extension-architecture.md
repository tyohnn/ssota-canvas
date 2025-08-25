# xbowl Plugin & Extension Architecture: Iframe-based Extensible Canvas System

## Executive Summary

**Core Innovation**: xbowl implements a **Figma/Framer-inspired iframe-based plugin architecture** that enables third-party developers to create custom canvas renderers, artifact types, and AI agent tools while maintaining complete security isolation and seamless integration with the Universal Node System.

**Key Architectural Principles**:
- **Iframe Sandboxing**: Complete security isolation between host and plugins
- **MCP-like Schema System**: Standardized, AI-readable schemas for all extensions
- **Universal Node Integration**: All plugins operate within the unified node system
- **Background Worker Support**: React Builder-style iframe communication
- **SDK-first Development**: Comprehensive SDK for rapid plugin development

## Architecture Overview

### 1. Iframe-based Plugin System

#### **Security & Isolation Model**

```typescript
// Plugin Container Architecture
interface PluginContainer {
  id: string
  iframe_url: string
  sandbox_permissions: SandboxPermission[]
  communication_channel: MessageChannel
  security_domain: string
  resource_limits: ResourceLimits
}

interface SandboxPermission {
  type: "network" | "storage" | "canvas" | "ai_tools"
  scope: string[]
  restrictions: SecurityRestriction[]
}
```

#### **Plugin Lifecycle Management**

```typescript
// Plugin Registry & Lifecycle
interface PluginRegistry {
  plugins: Map<string, PluginDefinition>
  active_instances: Map<string, PluginInstance>
  
  // Plugin Management
  install(plugin: PluginPackage): Promise<void>
  activate(plugin_id: string, container: HTMLElement): Promise<PluginInstance>
  deactivate(instance_id: string): Promise<void>
  
  // Security & Validation
  validate_schema(plugin: PluginDefinition): ValidationResult
  check_permissions(plugin_id: string, action: string): boolean
}

interface PluginInstance {
  id: string
  plugin_id: string
  iframe: HTMLIFrameElement
  communication: PluginCommunication
  state: PluginState
  resource_usage: ResourceUsage
}
```

### 2. Canvas Renderer Extension System

#### **Renderer Plugin Architecture**

```typescript
// Base Renderer Interface (MCP-like Schema)
interface CanvasRendererPlugin {
  metadata: {
    id: string
    name: string
    version: string
    description: string
    author: string
    category: "visualization" | "interaction" | "ai_tools"
  }
  
  // Rendering Capabilities
  renderer: {
    type: "canvas" | "webview" | "3d" | "table" | "kanban" | "custom"
    supported_artifacts: ArtifactType[]
    ui_framework: "react" | "vue" | "vanilla" | "webgl"
    performance_profile: PerformanceProfile
  }
  
  // AI Integration Schema
  ai_schema: {
    node_definitions: NodeDefinitionSchema[]
    edge_definitions: EdgeDefinitionSchema[]
    generation_tools: AIToolDefinition[]
    validation_rules: ValidationSchema[]
  }
  
  // Plugin Communication Interface
  communication: {
    host_api_version: string
    supported_events: PluginEvent[]
    required_permissions: Permission[]
  }
}
```

#### **Specific Renderer Examples**

**1. Wireframe/Webview Renderer Plugin**

```typescript
interface WireframeRendererPlugin extends CanvasRendererPlugin {
  renderer: {
    type: "webview"
    supported_artifacts: ["wireframe", "prototype", "ui_spec"]
    ui_framework: "react"
    
    // Wireframe-specific capabilities
    interaction_schema: {
      editable_elements: [
        { selector: ".container", properties: ["width", "height", "background"] },
        { selector: ".button", properties: ["text", "color", "onclick"] },
        { selector: ".input", properties: ["placeholder", "type", "validation"] }
      ]
      
      manipulation_tools: [
        "create_element", "update_style", "delete_element", 
        "set_interaction", "preview_mode", "export_html"
      ]
    }
  }
  
  ai_schema: {
    node_definitions: [
      {
        type: "ui_container",
        properties: {
          position: { type: "object", schema: { x: "number", y: "number" } },
          size: { type: "object", schema: { width: "number", height: "number" } },
          style: { type: "object", schema: "css_properties" },
          children: { type: "array", items: "ui_element" }
        },
        ai_description: "Container element that can hold other UI elements",
        generation_prompt: "Create a container with specified position, size, and styling"
      },
      
      {
        type: "ui_button",
        properties: {
          text: { type: "string", required: true },
          action: { type: "string", description: "JavaScript onclick handler" },
          style_preset: { type: "enum", values: ["primary", "secondary", "danger"] }
        },
        ai_description: "Interactive button element with click actions",
        generation_prompt: "Create a button with text, styling, and click behavior"
      }
    ],
    
    generation_tools: [
      {
        name: "create_wireframe_element",
        description: "Create a new UI element in the wireframe",
        parameters: {
          type: { type: "string", enum: ["container", "button", "input", "text", "image"] },
          position: { type: "object", properties: { x: "number", y: "number" } },
          properties: { type: "object", description: "Element-specific properties" }
        },
        ai_usage: "Use this tool to create visual elements in wireframes based on user requirements"
      },
      
      {
        name: "update_element_interaction",
        description: "Set interaction behavior for UI elements",
        parameters: {
          element_id: { type: "string" },
          interaction_type: { type: "string", enum: ["click", "hover", "focus", "submit"] },
          action: { type: "string", description: "Action to perform on interaction" }
        }
      }
    ]
  }
}
```

**2. 3D Model Renderer Plugin**

```typescript
interface ThreeDRendererPlugin extends CanvasRendererPlugin {
  renderer: {
    type: "3d"
    supported_artifacts: ["3d_model", "scene", "animation"]
    ui_framework: "webgl"
    
    // 3D-specific capabilities
    rendering_engine: {
      framework: "three.js" | "babylon.js" | "webgl"
      features: ["lighting", "materials", "animations", "physics"]
      performance_level: "high" | "medium" | "low"
    }
  }
  
  ai_schema: {
    node_definitions: [
      {
        type: "3d_object",
        properties: {
          geometry: { type: "string", enum: ["box", "sphere", "cylinder", "custom"] },
          material: { type: "object", schema: "material_properties" },
          transform: { type: "object", schema: "transform_matrix" },
          animations: { type: "array", items: "animation_clip" }
        }
      },
      
      {
        type: "3d_scene",
        properties: {
          objects: { type: "array", items: "3d_object" },
          lighting: { type: "object", schema: "lighting_setup" },
          camera: { type: "object", schema: "camera_properties" }
        }
      }
    ],
    
    generation_tools: [
      {
        name: "create_3d_object",
        description: "Create a 3D object in the scene",
        parameters: {
          geometry_type: { type: "string" },
          position: { type: "array", items: "number", length: 3 },
          scale: { type: "array", items: "number", length: 3 },
          material_properties: { type: "object" }
        }
      }
    ]
  }
}
```

### 3. Plugin Communication Protocol

#### **Host-Plugin Message System**

```typescript
// Figma-inspired Message Protocol
interface PluginMessage {
  id: string
  type: PluginMessageType
  source: "host" | "plugin"
  target_plugin?: string
  payload: any
  timestamp: number
}

type PluginMessageType = 
  | "initialize"
  | "render_artifact"
  | "node_created"
  | "node_updated" 
  | "ai_tool_invocation"
  | "canvas_interaction"
  | "export_data"
  | "request_permission"
  | "error"

// Host API exposed to plugins
interface HostAPI {
  // Universal Node System Integration
  nodes: {
    create(node_data: NodeCreationData): Promise<NodeId>
    update(node_id: NodeId, changes: Partial<NodeData>): Promise<void>
    delete(node_id: NodeId): Promise<void>
    query(filters: NodeQuery): Promise<Node[]>
    
    // Real-time subscriptions
    subscribe(node_id: NodeId, callback: NodeChangeCallback): SubscriptionId
    unsubscribe(subscription_id: SubscriptionId): void
  }
  
  // AI Agent Integration
  ai_tools: {
    invoke_agent(tool_name: string, parameters: any): Promise<any>
    register_tool(tool_definition: AIToolDefinition): Promise<void>
    get_context(context_type: string): Promise<any>
  }
  
  // Canvas Integration
  canvas: {
    get_viewport(): ViewportInfo
    set_viewport(viewport: ViewportInfo): void
    export_view(format: "png" | "svg" | "json"): Promise<string>
    
    // Selection & Focus
    select_nodes(node_ids: NodeId[]): void
    focus_node(node_id: NodeId): void
  }
  
  // Storage & Persistence
  storage: {
    get(key: string): Promise<any>
    set(key: string, value: any): Promise<void>
    delete(key: string): Promise<void>
  }
  
  // UI Integration
  ui: {
    show_notification(message: string, type: "info" | "success" | "error"): void
    show_modal(component: ModalComponent): Promise<any>
    add_toolbar_button(button: ToolbarButton): void
  }
}
```

#### **Plugin SDK Implementation**

```typescript
// Plugin SDK for developers
class XbowlPluginSDK {
  private hostAPI: HostAPI
  private messageChannel: MessageChannel
  
  constructor(iframe_window: Window) {
    this.setupCommunication(iframe_window)
  }
  
  // Easy Node Management
  async createNode(type: string, properties: any): Promise<Node> {
    return this.hostAPI.nodes.create({
      type_id: type,
      content: properties,
      parent_id: this.getCurrentContext().parent_id
    })
  }
  
  // AI Tool Registration
  async registerAITool(tool: AIToolDefinition): Promise<void> {
    await this.hostAPI.ai_tools.register_tool(tool)
  }
  
  // Canvas Rendering
  async renderArtifact(artifact: ArtifactData): Promise<void> {
    // Plugin-specific rendering logic
    const nodes = await this.generateNodesFromArtifact(artifact)
    
    for (const node of nodes) {
      await this.createNode(node.type, node.properties)
    }
    
    // Update canvas viewport
    await this.hostAPI.canvas.set_viewport(this.calculateOptimalViewport(nodes))
  }
  
  // Real-time Updates
  onNodeUpdate(callback: (node: Node) => void): void {
    this.hostAPI.nodes.subscribe("*", callback)
  }
  
  // UI Extensions
  addToolbarButton(label: string, action: () => void): void {
    this.hostAPI.ui.add_toolbar_button({
      label,
      icon: this.getPluginIcon(),
      onClick: action
    })
  }
}
```

### 4. AI Agent Integration with Plugins

#### **Plugin-Aware AI Tools**

```typescript
// AI Agents can use plugin-specific tools
interface PluginAwareAgent {
  available_plugins: PluginDefinition[]
  active_renderers: RendererPlugin[]
  
  // Tool Discovery & Usage
  discover_tools(artifact_type: string): AIToolDefinition[]
  invoke_plugin_tool(plugin_id: string, tool_name: string, params: any): Promise<any>
  
  // Context-Aware Generation
  generate_with_plugin_context(
    prompt: string, 
    template: ArtifactTemplate,
    active_plugins: PluginId[]
  ): Promise<GenerationResult>
}

// Example: AI Agent using Wireframe Plugin
const wireframeGeneration = async (agent: PluginAwareAgent, requirements: string) => {
  // Discover available wireframe tools
  const wireframe_tools = agent.discover_tools("wireframe")
  
  // Generate wireframe structure
  const wireframe_plan = await agent.generate_with_plugin_context(
    `Create a wireframe based on: ${requirements}`,
    wireframe_template,
    ["wireframe-renderer-plugin"]
  )
  
  // Use plugin tools to create actual wireframe
  for (const element of wireframe_plan.elements) {
    await agent.invoke_plugin_tool(
      "wireframe-renderer-plugin",
      "create_wireframe_element",
      element
    )
  }
  
  // Set up interactions
  for (const interaction of wireframe_plan.interactions) {
    await agent.invoke_plugin_tool(
      "wireframe-renderer-plugin", 
      "update_element_interaction",
      interaction
    )
  }
}
```

#### **Template-Plugin Integration**

```typescript
// Artifact Templates can specify required plugins
interface PluginAwareTemplate extends ArtifactTemplate {
  required_plugins: PluginRequirement[]
  optional_plugins: PluginRequirement[]
  
  // Plugin-specific template sections
  plugin_configs: {
    [plugin_id: string]: PluginConfiguration
  }
}

interface PluginRequirement {
  plugin_id: string
  min_version: string
  required_features: string[]
  fallback_behavior?: "disable" | "basic_render" | "error"
}

// Example: Wireframe Template with Plugin Requirements
const wireframeTemplate: PluginAwareTemplate = {
  id: "advanced-wireframe-template",
  name: "Advanced Interactive Wireframe",
  artifact_type: "wireframe",
  
  required_plugins: [
    {
      plugin_id: "wireframe-renderer-plugin",
      min_version: "1.0.0",
      required_features: ["element_creation", "interaction_setup", "live_preview"]
    }
  ],
  
  plugin_configs: {
    "wireframe-renderer-plugin": {
      default_framework: "react",
      interaction_mode: "live_preview",
      export_formats: ["html", "react_component", "figma"]
    }
  },
  
  ai_schema: {
    // Template can reference plugin-specific node types
    node_definitions: [
      // References node types from wireframe plugin
      { $ref: "wireframe-renderer-plugin#/node_definitions/ui_container" },
      { $ref: "wireframe-renderer-plugin#/node_definitions/ui_button" }
    ],
    
    generation_tools: [
      // References tools from wireframe plugin
      { $ref: "wireframe-renderer-plugin#/generation_tools/create_wireframe_element" }
    ]
  }
}
```

### 5. Plugin Development Workflow

#### **Plugin Development SDK**

```bash
# Plugin Development CLI
npx xbowl-plugin-cli create wireframe-renderer
cd wireframe-renderer

# Generated project structure
├── src/
│   ├── renderer/           # Main renderer component
│   ├── ai-tools/          # AI tool definitions
│   ├── node-definitions/  # Custom node types
│   └── index.ts           # Plugin entry point
├── public/
│   └── manifest.json      # Plugin manifest
├── test/
└── xbowl.config.js       # Plugin configuration
```

```typescript
// Plugin Entry Point
import { XbowlPlugin, RendererPlugin } from '@xbowl/plugin-sdk'

export default class WireframeRendererPlugin extends RendererPlugin {
  async initialize(): Promise<void> {
    // Register AI tools
    await this.registerAITools([
      CreateWireframeElementTool,
      UpdateElementInteractionTool,
      ExportWireframeTool
    ])
    
    // Register node types
    await this.registerNodeTypes([
      UIContainerNode,
      UIButtonNode,
      UIInputNode
    ])
    
    // Setup renderer
    this.setRenderer(WireframeRenderer)
  }
  
  async renderArtifact(artifact: ArtifactData): Promise<void> {
    const renderer = new WireframeRenderer(this.getCanvas())
    await renderer.render(artifact)
  }
}

// AI Tool Implementation
class CreateWireframeElementTool extends AITool {
  name = "create_wireframe_element"
  description = "Create a UI element in the wireframe"
  
  parameters = {
    type: { type: "string", enum: ["container", "button", "input"] },
    position: { type: "object", properties: { x: "number", y: "number" } },
    properties: { type: "object" }
  }
  
  async execute(params: any): Promise<any> {
    const element = this.createElement(params.type, params.position, params.properties)
    
    // Create node in Universal Node System
    const node = await this.sdk.createNode(params.type, {
      ...params.properties,
      position: params.position,
      renderer_data: element.serialize()
    })
    
    // Render in plugin canvas
    await this.renderElement(element)
    
    return { node_id: node.id, element_id: element.id }
  }
}
```

#### **Plugin Testing & Validation**

```typescript
// Plugin Test Framework
import { PluginTestEnvironment } from '@xbowl/plugin-testing'

describe('WireframeRendererPlugin', () => {
  let testEnv: PluginTestEnvironment
  let plugin: WireframeRendererPlugin
  
  beforeEach(async () => {
    testEnv = new PluginTestEnvironment()
    plugin = await testEnv.loadPlugin('./dist/wireframe-renderer-plugin.js')
  })
  
  test('should create wireframe elements', async () => {
    // Mock AI tool invocation
    const result = await plugin.invokeAITool('create_wireframe_element', {
      type: 'button',
      position: { x: 100, y: 100 },
      properties: { text: 'Click me' }
    })
    
    expect(result.node_id).toBeDefined()
    expect(testEnv.getCreatedNodes()).toHaveLength(1)
  })
  
  test('should render artifact correctly', async () => {
    const artifact = testEnv.createMockArtifact('wireframe', {
      elements: [
        { type: 'container', position: { x: 0, y: 0 }, size: { width: 400, height: 300 } },
        { type: 'button', position: { x: 50, y: 50 }, text: 'Submit' }
      ]
    })
    
    await plugin.renderArtifact(artifact)
    
    const renderedElements = testEnv.getRenderedElements()
    expect(renderedElements).toHaveLength(2)
    expect(renderedElements[0].type).toBe('container')
    expect(renderedElements[1].type).toBe('button')
  })
})
```

### 6. Plugin Marketplace & Distribution

#### **Plugin Package Format**

```json
// plugin-manifest.json
{
  "id": "wireframe-renderer-plugin",
  "name": "Wireframe Renderer",
  "version": "1.0.0",
  "description": "Interactive wireframe creation and prototyping",
  "author": "xbowl-community",
  "category": "visualization",
  
  "xbowl_version": ">=1.0.0",
  "api_version": "1.0",
  
  "entry_point": "./dist/index.js",
  "assets": ["./dist/assets/"],
  
  "permissions": [
    "canvas.render",
    "nodes.create",
    "nodes.update", 
    "ai_tools.register",
    "storage.local"
  ],
  
  "dependencies": {
    "three": "^0.150.0",
    "react": "^18.0.0"
  },
  
  "screenshots": ["./screenshots/demo.png"],
  "documentation": "./README.md",
  
  "pricing": {
    "model": "freemium",
    "premium_features": ["advanced_interactions", "export_formats"]
  }
}
```

#### **Plugin Installation & Security**

```typescript
// Plugin Installation System
class PluginInstaller {
  async install(plugin_url: string): Promise<InstallResult> {
    // Download and validate plugin
    const plugin_package = await this.downloadPlugin(plugin_url)
    const validation_result = await this.validatePlugin(plugin_package)
    
    if (!validation_result.safe) {
      throw new SecurityError(`Plugin failed security validation: ${validation_result.issues}`)
    }
    
    // Sandbox installation
    const sandbox = await this.createPluginSandbox(plugin_package)
    await this.installInSandbox(plugin_package, sandbox)
    
    // Register in plugin registry
    await this.registerPlugin(plugin_package.manifest)
    
    return { success: true, plugin_id: plugin_package.id }
  }
  
  private async validatePlugin(plugin: PluginPackage): Promise<ValidationResult> {
    return {
      safe: true,
      scanned_for: ["malicious_code", "excessive_permissions", "data_exfiltration"],
      certificate_valid: true,
      signature_verified: true
    }
  }
}
```

### 7. Performance & Resource Management

#### **Plugin Resource Limits**

```typescript
interface PluginResourceLimits {
  memory_limit: number        // MB
  cpu_time_limit: number     // seconds per operation
  network_requests: number   // per minute
  storage_quota: number      // MB
  iframe_count: number       // max concurrent iframes
}

// Resource Monitor
class PluginResourceMonitor {
  private limits: Map<string, PluginResourceLimits> = new Map()
  private usage: Map<string, PluginResourceUsage> = new Map()
  
  async monitorPlugin(plugin_id: string): Promise<void> {
    const performance_observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.updateResourceUsage(plugin_id, entry)
      }
    })
    
    performance_observer.observe({ entryTypes: ['measure', 'navigation'] })
  }
  
  private updateResourceUsage(plugin_id: string, entry: PerformanceEntry): void {
    const current_usage = this.usage.get(plugin_id) || this.createEmptyUsage()
    const limits = this.limits.get(plugin_id)
    
    // Update usage metrics
    current_usage.cpu_time += entry.duration
    current_usage.last_updated = Date.now()
    
    // Check limits
    if (limits && current_usage.cpu_time > limits.cpu_time_limit) {
      this.throttlePlugin(plugin_id)
    }
    
    this.usage.set(plugin_id, current_usage)
  }
}
```

### 8. Example Plugin Implementations

#### **Data Visualization Plugin**

```typescript
// D3.js-based Data Visualization Plugin
class DataVisualizationPlugin extends RendererPlugin {
  async initialize(): Promise<void> {
    await this.registerAITools([
      CreateChartTool,
      UpdateDataTool,
      ExportVisualizationTool
    ])
    
    await this.registerNodeTypes([
      ChartNode,
      DatasetNode,
      AxisNode,
      LegendNode
    ])
  }
  
  async renderArtifact(artifact: ArtifactData): Promise<void> {
    const chart_config = artifact.content as ChartConfiguration
    const d3_renderer = new D3ChartRenderer(this.getCanvas())
    
    await d3_renderer.renderChart(chart_config)
  }
}

class CreateChartTool extends AITool {
  name = "create_chart"
  description = "Create a data visualization chart"
  
  parameters = {
    chart_type: { type: "string", enum: ["bar", "line", "pie", "scatter"] },
    data_source: { type: "string", description: "Data source node ID" },
    x_axis: { type: "string" },
    y_axis: { type: "string" },
    styling: { type: "object" }
  }
  
  async execute(params: ChartParams): Promise<any> {
    // Create chart configuration
    const chart_config = this.buildChartConfig(params)
    
    // Create nodes in Universal Node System
    const chart_node = await this.sdk.createNode("chart", chart_config)
    
    // Render using D3
    await this.renderChart(chart_config)
    
    return { chart_id: chart_node.id }
  }
}
```

#### **Video/Timeline Editor Plugin**

```typescript
// Video Timeline Editor Plugin
class VideoTimelinePlugin extends RendererPlugin {
  async initialize(): Promise<void> {
    await this.registerAITools([
      AddVideoClipTool,
      SetTransitionTool,
      ExportVideoTool
    ])
    
    await this.registerNodeTypes([
      VideoClipNode,
      AudioTrackNode,
      TransitionNode,
      TimelineNode
    ])
  }
  
  async renderArtifact(artifact: ArtifactData): Promise<void> {
    const timeline_config = artifact.content as TimelineConfiguration
    const timeline_renderer = new VideoTimelineRenderer(this.getCanvas())
    
    await timeline_renderer.renderTimeline(timeline_config)
  }
}

class AddVideoClipTool extends AITool {
  name = "add_video_clip"
  description = "Add a video clip to the timeline"
  
  parameters = {
    video_url: { type: "string" },
    start_time: { type: "number" },
    duration: { type: "number" },
    track_index: { type: "number" },
    effects: { type: "array", items: "effect_config" }
  }
  
  async execute(params: VideoClipParams): Promise<any> {
    // Create video clip node
    const clip_node = await this.sdk.createNode("video_clip", {
      source: params.video_url,
      timeline_position: params.start_time,
      duration: params.duration,
      track: params.track_index,
      effects: params.effects
    })
    
    // Update timeline visualization
    await this.updateTimelineDisplay()
    
    return { clip_id: clip_node.id }
  }
}
```

## Implementation Roadmap

### Phase 1: Core Plugin Infrastructure (MVP)
- Basic iframe sandboxing system
- Plugin SDK foundation
- Simple renderer plugin support
- Basic AI tool integration

### Phase 2: Advanced Plugin Features
- Full MCP-like schema system
- Plugin marketplace foundation
- Advanced security & resource management
- Complex renderer plugins (3D, video, etc.)

### Phase 3: Ecosystem Maturation
- Community marketplace
- Advanced plugin development tools
- Cross-plugin communication
- Enterprise plugin management

## Benefits & Competitive Advantages

### **Security & Isolation**
- Complete security through iframe sandboxing
- Granular permission system
- Resource limits and monitoring
- Plugin validation and certification

### **Developer Experience**
- Comprehensive SDK with TypeScript support
- Rich development tools and testing framework
- Clear documentation and examples
- Active community support

### **AI Integration**
- Seamless AI agent-plugin communication
- MCP-like standardized schemas
- Context-aware tool discovery
- Intelligent plugin recommendations

### **Extensibility**
- Support for any rendering technology
- Cross-domain plugin capabilities
- Universal Node System integration
- Future-proof architecture

This architecture transforms xbowl from a static workflow platform into a **dynamic, extensible ecosystem** where developers can create specialized tools for any domain, from wireframing to 3D modeling to video editing, all while maintaining security, performance, and seamless AI integration.