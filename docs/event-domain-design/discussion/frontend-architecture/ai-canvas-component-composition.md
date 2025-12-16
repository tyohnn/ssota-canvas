# AI 협업 캔버스를 통한 컴포넌트 조합 가이드

## 개요

이 문서는 **가상의 AI 협업 캔버스**를 통한 프론트엔드 컴포넌트 개발 워크플로우에 대한 사고실험입니다. React Flow와 유사한 캔버스 환경에서 컴포넌트 블록을 조합하고, AI의 도움을 받아 실제 React 컴포넌트 코드를 생성하는 방식을 탐구합니다.

## 핵심 개념

### AI 협업 캔버스

**AI 협업 캔버스**는 다음과 같은 특징을 가진 가상의 개발 환경입니다:

- **React Flow 스타일 캔버스**: 드래그 앤 드롭으로 컴포넌트 블록을 배치
- **실시간 프리뷰**: 각 블록의 렌더링 결과를 즉시 확인
- **AI 코드 생성**: 블록 조합을 분석하여 실제 React 컴포넌트 코드 생성
- **Next.js 통합**: 생성된 컴포넌트를 Next.js 프로젝트에 바로 적용

## 리액트 프리뷰 블록 (React Preview Block)

### 개념

**리액트 프리뷰 블록**은 기본 컴포넌트를 캔버스에서 사용할 수 있는 단위로 만든 것입니다. 각 블록은:

1. **실제 React 컴포넌트**를 렌더링
2. **Props 패널**을 통해 동적으로 속성 수정
3. **Style 패널**을 통해 스타일 조정
4. **캔버스 위에 배치**하여 조합 가능

### 예시: 기본 컴포넌트 블록

#### Button 컴포넌트 블록

```tsx
// 저장된 기본 버튼 컴포넌트
<Button onClick={() => {}} className="gap-2">
  <UserPlus className="h-4 w-4" />
  Invite Member
</Button>
```

**캔버스 상태:**
- Button 블록이 캔버스 위에 배치됨
- 실시간으로 렌더링 결과 확인 가능

#### 텍스트 컴포넌트 블록

```tsx
// h2 컴포넌트 블록
<h2 className="text-lg font-semibold">Member Management</h2>

// p 컴포넌트 블록
<p className="text-sm text-muted-foreground">
  Invite and manage workspace members.
</p>
```

**캔버스 상태:**
- h2 블록과 p 블록이 캔버스 위에 배치됨
- 각각 독립적으로 Props/Style 수정 가능

## 블록 속성 편집

### Props 패널

각 리액트 프리뷰 블록에는 **Props 패널**이 있어서:

- ✅ **동적 폼 생성**: 컴포넌트의 Props 타입을 분석하여 자동으로 폼 생성
- ✅ **실시간 수정**: Props 값을 입력하면 즉시 프리뷰에 반영
- ✅ **타입 안전성**: TypeScript 타입을 기반으로 유효성 검증

**예시: Button 블록의 Props 패널**
```
┌─────────────────────────┐
│ Button Props            │
├─────────────────────────┤
│ onClick: [Function]     │
│ className: "gap-2"      │
│ variant: [Select]       │
│ size: [Select]          │
│ disabled: [Checkbox]    │
└─────────────────────────┘
```

### Style 패널

**Style 패널**을 통해:

- ✅ **Variant 기반 스타일**: `variant="primary"`, `size="lg"` 등 Props로 조정
- ✅ **직접 스타일링**: CSS-in-JS 또는 Tailwind 클래스를 직접 입력
- ✅ **시각적 스타일 에디터**: 색상, 간격, 폰트 등을 GUI로 조정

**예시: Style 패널**
```
┌─────────────────────────┐
│ Style                   │
├─────────────────────────┤
│ Variant: [primary]     │
│ Size: [lg]             │
│ ─────────────────────  │
│ Custom Classes:        │
│ [gap-2]                │
│ ─────────────────────  │
│ Colors:                │
│ Background: [Picker]   │
│ Text: [Picker]         │
└─────────────────────────┘
```

## 컴포넌트 조합 워크플로우

### 단계별 프로세스

#### 1. 기본 블록 배치

캔버스에 필요한 기본 컴포넌트 블록들을 배치합니다:

```
┌─────────────────────────────────────┐
│  Canvas                              │
│                                      │
│  ┌─────────────┐                     │
│  │ h2 Block    │                     │
│  │ "Member     │                     │
│  │ Management" │                     │
│  └─────────────┘                     │
│                                      │
│  ┌─────────────┐                     │
│  │ p Block     │                     │
│  │ "Invite and │                     │
│  │ manage..."  │                     │
│  └─────────────┘                     │
│                                      │
│  ┌─────────────┐                     │
│  │ Button      │                     │
│  │ Block       │                     │
│  └─────────────┘                     │
│                                      │
└─────────────────────────────────────┘
```

#### 2. 블록 배치 및 스타일링

- 블록들을 **가까이 배치**하여 레이아웃 구성
- 각 블록의 **Props 패널**로 내용 수정
- **Style 패널**로 스타일 조정

#### 3. AI에게 컴포넌트 생성 요청

블록들을 선택하고 AI에게 요청:

> "이 블록들을 조합해서 MembersTabHeader 컴포넌트를 만들어줘"

#### 4. AI 코드 생성

AI가 블록들의 구조와 Props를 분석하여 실제 React 컴포넌트 코드를 생성:

```tsx
// 생성된 코드
export function MembersTabHeader() {
  return (
    <Box className="flex items-center justify-between">
      <Box>
        <h2 className="text-lg font-semibold">Member Management</h2>
        <p className="text-sm text-muted-foreground">
          Invite and manage workspace members.
        </p>
      </Box>
      <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Invite Member
      </Button>
    </Box>
  );
}
```

## 실제 예시: MembersTabHeader

### 초기 상태

**캔버스에 배치된 블록들:**

1. **h2 블록**
   - Props: `className="text-lg font-semibold"`
   - Content: `"Member Management"`

2. **p 블록**
   - Props: `className="text-sm text-muted-foreground"`
   - Content: `"Invite and manage workspace members."`

3. **Button 블록**
   - Props: `onClick`, `className="gap-2"`
   - Children: `<UserPlus />` + `"Invite Member"`

### 조합 과정

1. **레이아웃 구성**
   - h2와 p를 왼쪽에 세로로 배치
   - Button을 오른쪽에 배치
   - Flexbox 레이아웃으로 감싸기

2. **Props 연결**
   - Button의 `onClick`에 함수 연결 (Context에서 가져오기)
   - 스타일 조정 (간격, 정렬 등)

3. **AI 생성 요청**
   ```
   "이 3개 블록을 조합해서 MembersTabHeader 컴포넌트로 만들어줘"
   ```

4. **생성된 컴포넌트**

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { useWorkspaceSettingsDialogContext } from '../../../core/context';

/**
 * Members Tab Header (Presentational)
 *
 * Displays title, description, and invite button
 */
export function MembersTabHeader() {
  const { setIsInviteDialogOpen } = useWorkspaceSettingsDialogContext();

  return (
    <Box className="flex items-center justify-between">
      <Box>
        <h2 className="text-lg font-semibold">Member Management</h2>
        <p className="text-sm text-muted-foreground">
          Invite and manage workspace members.
        </p>
      </Box>
      <Button onClick={() => setIsInviteDialogOpen(true)} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Invite Member
      </Button>
    </Box>
  );
}
```

## 블록 메타데이터

각 리액트 프리뷰 블록은 다음 메타데이터를 포함합니다:

### 필수 메타데이터

```typescript
interface BlockMetadata {
  // 컴포넌트 정보
  componentName: string;
  componentPath: string;
  componentType: 'presentational' | 'container' | 'primitive';
  
  // Props 정보
  propsSchema: {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: any;
  }[];
  
  // 스타일 정보
  styleConfig: {
    variants?: Record<string, string>;
    defaultClasses?: string;
    customizableProperties?: string[];
  };
  
  // 의존성
  dependencies: {
    imports: string[];
    contexts?: string[];
    hooks?: string[];
  };
}
```

### 예시: Button 블록 메타데이터

```json
{
  "componentName": "Button",
  "componentPath": "@/components/ui/button",
  "componentType": "primitive",
  "propsSchema": [
    {
      "name": "onClick",
      "type": "function",
      "required": false
    },
    {
      "name": "className",
      "type": "string",
      "required": false
    },
    {
      "name": "variant",
      "type": "string",
      "required": false,
      "defaultValue": "default",
      "options": ["default", "primary", "secondary", "outline"]
    }
  ],
  "styleConfig": {
    "variants": {
      "default": "bg-primary text-primary-foreground",
      "primary": "bg-blue-600 text-white",
      "secondary": "bg-gray-200 text-gray-900"
    },
    "defaultClasses": "px-4 py-2 rounded-md",
    "customizableProperties": ["padding", "borderRadius", "colors"]
  },
  "dependencies": {
    "imports": ["@/components/ui/button"],
    "contexts": [],
    "hooks": []
  }
}
```

## AI 코드 생성 규칙

### 컴포넌트 생성 시 고려사항

1. **컴포넌트 타입 결정**
   - Presentational: Props만 받는 순수 컴포넌트
   - Container: Hook을 사용하는 로직 컴포넌트

2. **의존성 분석**
   - 사용된 블록들의 import 문 자동 생성
   - Context 사용 여부 확인
   - Hook 사용 여부 확인

3. **Props 추출**
   - 블록들의 Props를 컴포넌트 Props로 변환
   - 함수 Props는 Context나 Hook에서 가져오기

4. **스타일 통합**
   - 블록들의 className을 조합
   - 레이아웃을 위한 wrapper 추가 (Box, Flex 등)

5. **가이드라인 준수**
   - Container/Presentational 패턴
   - Props 설계 원칙 (함수 Props 최소화)
   - Storybook 테스트 가능한 구조

## 다음 단계 (향후 탐구)

이 문서는 초기 개념 정리 단계입니다. 향후 다음 주제들을 탐구할 예정입니다:

- [ ] 복잡한 컴포넌트 조합 (Container + Presentational)
- [ ] Context 연결 자동화
- [ ] Hook 생성 및 연결
- [ ] 데이터 흐름 시각화
- [ ] Next.js 페이지 생성 워크플로우
- [ ] 실제 구현을 위한 기술 스택 제안

## 참고 자료

- [Component Development Guidelines](./component-development-guidelines.md)
- [Container/Presentational Pattern](./component-development-guidelines.md#containerpresentational-패턴)
- React Flow: https://reactflow.dev/

---

**작성일**: 2025-12-14  
**버전**: 0.1.0 (초안)  
**상태**: 사고실험 단계
