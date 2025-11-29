<!-- 8239afdc-4226-4dbf-a887-230807f57d75 10e9b8ac-1467-4593-ae0d-0b053a9bf684 -->
# Landing Canvas Demo 마케팅 페이지

## 프로젝트 개요

완전히 새로운 마케팅 랜딩페이지를 구축합니다. 사용자가 수직 스크롤하면 좌측에는 핵심 메시지가, 우측 고정된 Canvas에서는 5가지 시나리오가 자동으로 시연됩니다.

**핵심 컨셉**: 튜토리얼 + 마케팅 메시지 통합

## 파일 구조

```
apps/web/src/
  app/(landing)/
    showcase/
      page.tsx                 # 메인 랜딩페이지
      layout.tsx              # 랜딩 레이아웃
  domains/landing/
    components/
      canvas-demo/
        index.tsx              # Canvas 데모 메인
        landing-canvas-wrapper.tsx  # Canvas wrapper (read-only)
        block-appspace-demo.tsx     # Block Appspace 데모 컴포넌트
        sections/
          section1-usecase-badges.tsx    # Section 1
          section2-blocks-appspace.tsx   # Section 2 (블록 앱스페이스)
          section3-transform.tsx         # Section 3
          section4-customize.tsx         # Section 4
          section5-ai-jarvis.tsx         # Section 5
        hooks/
          use-scroll-progress.ts
          use-section-animation.ts
        data/
          section1-data.ts
          section2-data.ts
          section3-data.ts
          section4-data.ts
          section5-data.ts
        utils/
          animation-helpers.ts
          typing-effect.ts
```

## 5개 섹션 상세 명세

### SECTION 1: "ONE CANVAS WHERE YOUR WORK LIVES"

**좌측 카피**:

```
ONE CANVAS WHERE
YOUR WORK LIVES

Software to Content Creation,
Education to Circuit Analysis.

Every workflow on one canvas.

[배지: 🚀 Software Development | 📚 Education | 🎨 Content Creator | 🖼️ Image Editing]
```

**Canvas 동작**: 4가지 usecase별 블록 레이아웃이 스크롤에 따라 전환됨

---

### SECTION 2: "EVERY DATA LIVES IN CANVAS" + BLOCK APPSPACE ⭐

**좌측 카피**:

```
EVERY DATA LIVES IN CANVAS

Add any content type.
Edit with powerful tools.
Connect everything.

From simple blocks to full editors,
everything lives on your canvas.
```

**Canvas 동작**:

**Phase 2a**: 초기 상태

- 3개 블록 배치 (Text, Shape, Image)

**Phase 2b**: Add Dialog 표시 (스크롤)

- BlockAddDialog 열림 → "Image" 타입 선택 → Image 블록 생성

**Phase 2c**: 블록 선택 및 Toolbar (스크롤)

- Image 블록 선택 → BlockMountToolbar 표시
- Toolbar의 "Open Editor" 버튼 하이라이트

**Phase 2d**: Block Appspace 열기 (스크롤) ⭐ NEW

- "Open Editor" 클릭 애니메이션
- 화면 전체 블러 처리
- **Image Block Appspace가 전체 화면으로 확대** (scale animation, 800ms)
- **Appspace UI 구성**:
  - 좌측 사이드바: Explore / Editor(active) / Community 탭
  - 중앙: 이미지 에디터 (크롭, 필터, 레이어 등)
  - 우측: 속성 패널

**Phase 2e**: Appspace에서 편집 (스크롤)

- Filter 도구 선택 → Vibrance 슬라이더 조작
- 실시간 필터 적용 프리뷰
- "Save" 버튼 → Appspace 축소 → Canvas 복귀
- 블록이 편집된 이미지로 업데이트

**Phase 2f**: 다양한 Appspace 소개 (스크롤)

- Canvas zoom out
- 여러 블록 타입 동시 표시:
  - Image → "Image Editor" 라벨
  - Code → "Code Playground" 라벨
  - Video → "Video Editor" 라벨
  - Markdown → "Rich Text Editor" 라벨

**구현 포인트**:

```typescript
// block-appspace-demo.tsx
export function BlockAppspaceDemo({ 
  isOpen, 
  blockType, 
  onClose 
}: BlockAppspaceDemoProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Appspace UI */}
      <div className="flex h-full">
        {/* Left Sidebar */}
        <div className="w-64 border-r">
          <Tabs value="editor">
            <TabsList>
              <TabsTrigger value="explore">Explore</TabsTrigger>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Center Editor */}
        <div className="flex-1">
          {blockType === 'image' && <ImageEditorDemo />}
          {/* ... other editors */}
        </div>
        
        {/* Right Properties */}
        <div className="w-80 border-l">
          <PropertiesPanel />
        </div>
      </div>
    </motion.div>
  );
}
```

---

### SECTION 3: "TRANSFORM EVERY WAY"

**좌측 카피**:

```
TRANSFORM EVERY WAY

Turn audio into text.
Images into markdown.
Data flows seamlessly.
```

**Canvas 동작**: Audio → Markdown 변환 데모 + 4가지 변환 예시 도식화

---

### SECTION 4: "CUSTOMIZE YOUR BLOCK"

**좌측 카피**:

```
CUSTOMIZE YOUR BLOCK

Add any property.
Make it yours.
```

**Canvas 동작**: EditorPanel 열기 → Custom Property 추가 → 블록에 반영

---

### SECTION 5: "AI COLLABORATE LIKE JARVIS"

**좌측 카피**:

```
AI COLLABORATE LIKE JARVIS

Natural language commands.
Instant execution.
Your intelligent workspace.
```

**Canvas 동작**: AI 채팅 → 블록 생성 → 블록 수정 → 레이아웃 정렬

---

## 핵심 기술 구현

### LandingCanvasWrapper (Read-only Canvas)

```typescript
export function LandingCanvasWrapper({
  nodes,
  edges,
  selectedNodeId,
  canvasMode = 'default',
  showToolbar,
  showEditorPanel,
  showActionBar,
  showAppspace, // NEW
  appspaceBlockType, // NEW
  viewport,
  onAnimationComplete
}: LandingCanvasWrapperProps) {
  // ... existing code
  
  return (
    <>
      <ReactFlow
        nodes={internalNodes}
        edges={internalEdges}
        // ... all interactions disabled
      >
        {/* ... existing conditional UI */}
        
        {showToolbar && selectedNodeId && (
          <BlockMountToolbarAnimated nodeId={selectedNodeId} />
        )}
      </ReactFlow>
      
      {/* Block Appspace Overlay */}
      {showAppspace && appspaceBlockType && (
        <BlockAppspaceDemo 
          isOpen={showAppspace}
          blockType={appspaceBlockType}
          onClose={() => {}}
        />
      )}
    </>
  );
}
```

### useScrollProgress Hook

스크롤 위치에 따라 section, subPhase 추적

### Animation Utilities

- `typeText`: 타이핑 효과
- `useTypingEffect`: 타이핑 Hook
- `delay`: Promise 기반 딜레이

---

## 페이지 레이아웃

```typescript
// app/(landing)/showcase/page.tsx
export default function ShowcasePage() {
  const { section, subPhase } = useScrollProgress();
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Scrollable sections */}
      <div className="w-1/2 overflow-y-auto">
        <section className="landing-section min-h-screen">
          <Section1UsecaseBadges activePhase={subPhase} />
        </section>
        
        <section className="landing-section min-h-screen">
          <Section2BlocksAppspace />
        </section>
        
        <section className="landing-section min-h-screen">
          <Section3Transform />
        </section>
        
        <section className="landing-section min-h-screen">
          <Section4Customize />
        </section>
        
        <section className="landing-section min-h-screen">
          <Section5AIJarvis />
        </section>
      </div>
      
      {/* Right: Fixed canvas */}
      <div className="w-1/2 sticky top-0 h-screen">
        <ReactFlowProvider>
          <CanvasModeProvider>
            <CanvasDemoController section={section} subPhase={subPhase} />
          </CanvasModeProvider>
        </ReactFlowProvider>
      </div>
    </div>
  );
}
```

## 구현 우선순위

1. 기본 레이아웃 및 라우트
2. LandingCanvasWrapper (read-only)
3. Section 1: Usecase 전환
4. Section 2: 블록 추가 + **Appspace 데모** ⭐
5. Section 3: Transform 데모
6. Section 4: Custom properties
7. Section 5: AI Jarvis
8. 애니메이션 polish
9. 반응형 및 최적화

### To-dos

- [ ] 랜딩페이지 라우트 및 기본 레이아웃 생성
- [ ] LandingCanvasWrapper read-only 컴포넌트 구현
- [ ] useScrollProgress Hook 구현