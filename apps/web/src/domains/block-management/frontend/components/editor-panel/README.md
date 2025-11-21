# Editor Panel

Notion 스타일 우측 슬라이드 패널로, 블록의 상세 정보를 표시하고 편집합니다.

## 구조

프랙탈 구조로 설계되어 있으며, **노코드 워크플로우를 위한 로직 분리** 패턴을 적용했습니다:

```
editor-panel/
├── components/              # UI 컴포넌트들
│   ├── header.tsx          # 패널 헤더 (닫기, 확장, 공유, 더보기 버튼)
│   ├── title-input.tsx     # 블록 제목 입력 필드
│   └── content-area.tsx    # 메인 콘텐츠 영역 (Properties, Content 섹션)
├── core/                   # 비즈니스 로직
│   ├── context.tsx                        # Context 정의
│   ├── provider.tsx                       # Provider 컴포넌트
│   ├── types.ts                           # 타입 정의
│   ├── use-editor-panel.ui.ts             # 🎨 UI 상태 훅 (디자이너용)
│   ├── use-editor-panel.business.ts       # 💼 비즈니스 로직 훅 (엔지니어용)
│   ├── use-editor-panel.ts                # 🔗 통합 훅
│   └── use-viewport-adjustment.ts         # Viewport 조정 로직
├── index.tsx               # UI와 비즈니스 로직 연결
└── README.md
```

## 역할

- **블록 제목 편집**: 실시간 타이틀 수정 (Optimistic Update)
- **속성 편집**: 블록 타입별 기본 속성 + 커스텀 속성
- **콘텐츠 편집**: 마크다운 콘텐츠 편집 (Tiptap)
- **Viewport 조정**: 에디터 열림 시 블록을 자동으로 적절한 위치로 이동

## Features

### 1. Viewport 자동 조정

에디터 패널이 열리면 블록을 가장 보기 좋은 위치로 자동 이동합니다:

**사이드바 상태별 레이아웃**:
- **Collapsed** (닫힘): 블록을 우측으로 (65% 지점), 줌 1.4배
- **Expanded** (열림): 블록을 중앙으로 (50% 지점), 줌 1.15배

**특징**:
- ✅ 사이드바 transition 완료 후 측정 (중간값 무시)
- ✅ 상태별 고정 레이아웃으로 일관된 UX
- ✅ 부드러운 애니메이션 (500ms)

### 2. 슬라이드 애니메이션

- 우측에서 슬라이드 인/아웃
- 300ms transition
- 패널 열림 시 DOM 렌더링 최적화

### 3. 반응형 레이아웃

- 패널 너비: 43%
- 패널 높이: 85%
- 하단 고정 (bottom: 0)

## 아키텍처 패턴

### 3-Layer 구조

1. **UI Component** (`index.tsx`): 패널 구조만 선언
2. **UI State Hook** (`.ui.ts`): 디자이너가 Framer에서 사용
3. **Business Logic Hook** (`.business.ts`): 엔지니어가 배선

### 로직 분리

**UI State** (`use-editor-panel.ui.ts`):
- 애니메이션 상태 (`isAnimating`, `shouldRender`)
- 타이틀 입력 상태 (`title`, `setTitle`)
- Ref 관리 (`inputRef`)

**Business Logic** (`use-editor-panel.business.ts`):
- 타이틀 저장 (`onTitleSave`)
- Optimistic Update & Rollback
- Server Action 호출

**Viewport Adjustment** (`use-viewport-adjustment.ts`):
- 사이드바 상태 감지
- 레이아웃 설정 (상태별 config)
- React Flow viewport 조정

## 사용 예시

### Production (기본)

```tsx
<EditorPanel blockId={blockId} isOpen={isOpen} />
// businessLogic 생략 → useEditorPanelBusiness() 자동 사용
```

### Test/Mock

```tsx
import { useMockEditorPanelBusiness } from './core/use-editor-panel.business';

const mockBusiness = useMockEditorPanelBusiness(() => console.log('close'));

<EditorPanel
  blockId={blockId}
  isOpen={isOpen}
  businessLogic={mockBusiness} // 🧪 Mock 로직 주입
/>
```

### Framer (디자이너)

```tsx
import { useEditorPanelUI } from './core/use-editor-panel.ui';
import { useMockEditorPanelBusiness } from './core/use-editor-panel.business';

const uiState = useEditorPanelUI();
const mockBusiness = useMockEditorPanelBusiness(() => {});

// UI 컴포넌트 직접 구성 가능
```

## 관련 컴포넌트

- **BlockPropertiesSection**: 블록 타입별 기본 속성 편집
- **CustomPropertiesSection**: 사용자 정의 속성 편집
- **BlockContentSection**: 마크다운 콘텐츠 편집

## Component Development Guidelines 준수

✅ **폴더 구조**: 관련 컴포넌트가 하나의 폴더에  
✅ **index.tsx 패턴**: 메인 엔트리 포인트  
✅ **자체 포함**: editor-panel 관련 로직이 모두 한 곳에  
✅ **명확한 책임**: components는 UI, core는 로직  
✅ **타입 안전성**: TypeScript 타입 정의  
✅ **로직 분리**: UI/Business 로직 분리 (노코드 워크플로우 지원)  
✅ **Context 사용**: 서브 컴포넌트 간 상태 공유  
✅ **Optimistic Updates**: 즉시 UI 반영, 실패 시 자동 롤백

