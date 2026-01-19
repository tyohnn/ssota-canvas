# Prettier Import Order 규칙

이 프로젝트는 Prettier를 사용하여 import 문의 순서를 자동으로 정렬합니다.

## 설정

`prettier.config.js`에 `@ianvs/prettier-plugin-sort-imports` 플러그인이 설정되어 있습니다.

**참고**: Prettier 3.x와의 호환성을 위해 `@ianvs/prettier-plugin-sort-imports`를 사용합니다. 이 플러그인은 `@trivago/prettier-plugin-sort-imports`의 유지보수되는 포크입니다.

**v4.7.0 변경사항**: `importOrderSeparation`와 `importOrderSortSpecifiers` 옵션이 제거되었습니다. 대신 `importOrder` 배열에 빈 문자열(`""`)을 추가하여 그룹 간 빈 줄을 제어합니다.

## Import 순서 규칙

다음 순서로 import가 자동 정렬됩니다:

1. **React 관련**
   - `react`
   - `react-dom`
   - `next`

2. **외부 라이브러리 (Third-party)**
   - `@xyflow/react`
   - `lucide-react`
   - `zod`
   - 기타 npm 패키지

3. **Workspace 패키지**
   - `@workspace/*`

4. **내부 절대 경로**
   - `@/*` (예: `@/components`, `@/domains`)

5. **상대 경로**
   - `./`
   - `../`

## 예시

### Before (정렬 전)
```typescript
import { ToolbarContent } from './components/toolbar-content';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';
import React, { memo, useEffect } from 'react';
import { useMultiSelectionToolbar } from './core/use-multi-selection-toolbar';
import type { MultiSelectionToolbarProps } from './core/types';
```

### After (정렬 후)
```typescript
import React, { memo, useEffect } from 'react';

import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';

import { useMultiSelectionToolbar } from './core/use-multi-selection-toolbar';
import { ToolbarContent } from './components/toolbar-content';
import type { MultiSelectionToolbarProps } from './core/types';
```

## 사용 방법

### 자동 포맷팅
```bash
# 전체 프로젝트 포맷팅
pnpm format

# 특정 파일 포맷팅
pnpm prettier --write "path/to/file.ts"
```

### VS Code 설정
VS Code에서 저장 시 자동 포맷팅을 사용하려면:

1. `.vscode/settings.json`에 다음 추가:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

2. Prettier 확장 프로그램 설치

## 설정 옵션

`.prettierrc.json`의 주요 옵션:

- `importOrder`: import 순서를 정의하는 배열
  - `^react$`: 정확히 "react"만 매칭
  - `^react-dom$`: 정확히 "react-dom"만 매칭
  - `^next`: "next"로 시작하는 모든 import
  - `<THIRD_PARTY_MODULES>`: 외부 라이브러리 (npm 패키지)
  - `^@workspace/(.*)$`: workspace 패키지
  - `^@/(.*)$`: 내부 절대 경로
  - `^[./]`: 상대 경로

- `importOrderSeparation: true`: 각 그룹 사이에 빈 줄 추가 ✅
- `importOrderSortSpecifiers: true`: 각 import 그룹 내에서 알파벳 순 정렬 ✅

## 주의사항

- Type-only imports (`import type`)는 일반 imports와 함께 정렬됩니다
- Side-effect imports (`import './styles.css'`)는 상대 경로 그룹에 포함됩니다
- 동적 imports (`import()`)는 정렬되지 않습니다

# Prettier Import Order 설정 상세 설명

## 현재 설정 (`prettier.config.js`)

```javascript
{
  importOrder: [
    '^react$',
    '^react-dom$',
    '^next',
    '',  // 빈 줄 (그룹 분리)
    '<THIRD_PARTY_MODULES>',
    '',  // 빈 줄
    '^@workspace/(.*)$',
    '',  // 빈 줄
    '^@/(.*)$',
    '',  // 빈 줄
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx'],
  importOrderCaseSensitive: false,
}
```

## 순서 설명

### 1. `^react$` (정확히 "react"만)
- **정규식**: `^` (시작) + `react` + `$` (끝)
- **매칭**: `import React from 'react'` ✅
- **비매칭**: `import { useState } from 'react-dom'` ❌

### 2. `^react-dom$` (정확히 "react-dom"만)
- **정규식**: `^react-dom$`
- **매칭**: `import { render } from 'react-dom'` ✅

### 3. `^next` ("next"로 시작하는 모든 것)
- **정규식**: `^next`
- **매칭**: 
  - `import Link from 'next/link'` ✅
  - `import Image from 'next/image'` ✅
  - `import { useRouter } from 'next/navigation'` ✅

### 4. `<THIRD_PARTY_MODULES>` (외부 라이브러리)
- **특수 키워드**: 모든 npm 패키지
- **매칭**:
  - `import { Button } from '@xyflow/react'` ✅
  - `import { useState } from 'lucide-react'` ✅
  - `import { z } from 'zod'` ✅
  - `import { useQuery } from '@tanstack/react-query'` ✅

### 5. `^@workspace/(.*)$` (Workspace 패키지)
- **정규식**: `@workspace/`로 시작하는 모든 것
- **매칭**:
  - `import { Button } from '@workspace/ui'` ✅
  - `import { config } from '@workspace/eslint-config'` ✅

### 6. `^@/(.*)$` (내부 절대 경로)
- **정규식**: `@/`로 시작하는 모든 것
- **매칭**:
  - `import { Button } from '@/components/ui/button'` ✅
  - `import { useCanvas } from '@/domains/canvas-management/...'` ✅

### 7. `^[./]` (상대 경로)
- **정규식**: `.` 또는 `/`로 시작
- **매칭**:
  - `import { Component } from './component'` ✅
  - `import { utils } from '../utils'` ✅
  - `import type { Props } from './types'` ✅

## 알파벳 오름차순 정렬

**기본적으로 각 그룹 내에서 자동으로 알파벳 오름차순 정렬됩니다!**

### 예시

**Before:**
```typescript
import { z } from 'zod';
import { Button } from '@xyflow/react';
import { useState } from 'lucide-react';
```

**After (자동 정렬):**
```typescript
import { Button } from '@xyflow/react';
import { useState } from 'lucide-react';
import { z } from 'zod';
```

### 정렬 규칙

1. **그룹 간 순서**: `importOrder` 배열의 순서대로
2. **그룹 내 정렬**: 각 그룹 내에서 알파벳 오름차순
3. **Type imports**: `import type`도 함께 정렬됨

## 실제 정렬 예시

### 입력
```typescript
import { ToolbarContent } from './components/toolbar-content';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';
import React, { memo, useEffect } from 'react';
import { useMultiSelectionToolbar } from './core/use-multi-selection-toolbar';
import type { MultiSelectionToolbarProps } from './core/types';
import { Button } from '@/components/ui/button';
import { useStore } from '@xyflow/react';
```

### 출력 (정렬 후)
```typescript
// 1. React 그룹
import React, { memo, useEffect } from 'react';

// 2. 외부 라이브러리 그룹 (알파벳 순)
import { useStore } from '@xyflow/react';

// 3. 내부 절대 경로 그룹 (알파벳 순)
import { Button } from '@/components/ui/button';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';

// 4. 상대 경로 그룹 (알파벳 순)
import { ToolbarContent } from './components/toolbar-content';
import type { MultiSelectionToolbarProps } from './core/types';
import { useMultiSelectionToolbar } from './core/use-multi-selection-toolbar';
```

## 그룹 간 빈 줄

기본적으로 각 그룹 사이에 빈 줄이 자동으로 추가됩니다.

## 추가 옵션 (선택사항)

더 세밀한 제어가 필요하다면 다음 옵션을 추가할 수 있습니다:

```json
{
  "importOrderSeparation": true,        // 그룹 간 빈 줄 (기본값: true)
  "importOrderSortSpecifiers": true,    // 각 import 내부 정렬 (기본값: true)
  "importOrderCaseSensitive": false      // 대소문자 구분 없이 정렬 (기본값: false)
}
```

하지만 현재 버전(v4.7.0)에서는 기본 동작이 충분히 좋아서 추가 옵션이 필요 없을 수 있습니다.

## 정렬 우선순위 요약

1. **그룹 우선순위**: `importOrder` 배열 순서
2. **그룹 내 정렬**: 알파벳 오름차순 (자동)
3. **Type imports**: 일반 imports와 함께 정렬
4. **Side-effect imports**: 상대 경로 그룹에 포함
