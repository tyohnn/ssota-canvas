# Image Change Toolbar Item

## 📋 개요

이미지 변경을 위한 툴바 아이템 컴포넌트

**역할**:
- 파일 선택 다이얼로그 표시
- 이미지 업로드 (Server Action)
- Block Properties 업데이트

**패턴**: Flat Structure + UI/Business 분리

---

## 🏗️ 폴더 구조

```
image-change-toolbar-item/
├── core/
│   ├── types.ts                                    # 타입 정의
│   ├── utils.ts                                    # 순수 함수 (Base64, Metadata)
│   ├── use-image-change-toolbar-item.business.ts  # 비즈니스 로직
│   └── use-image-change-toolbar-item.ts            # 통합 Hook
├── index.tsx                                       # 메인 컴포넌트
└── README.md                                       # 이 문서
```

**구조 선택 이유**:
- ✅ 서브 컴포넌트 없음 (단일 Button + Tooltip)
- ✅ 비즈니스 로직 간단 (파일 업로드)
- ✅ Flat 구조 적합

---

## 🎯 사용 방법

### 기본 사용

```tsx
import { ImageChangeToolbarItem } from './image-change-toolbar-item';

<ImageChangeToolbarItem
  blockId={blockId}
  workspaceId={workspaceId}
  orgId={orgId}
  pageId={pageId}
  currentValue={imageUrl}
  onPropertiesChange={async (props) => {
    await updateProperties(blockId, props, blockData);
  }}
/>
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `blockId` | string | ✅ | 블록 ID |
| `blockMountId` | string | ❌ | 블록 마운트 ID |
| `currentValue` | string | ✅ | 현재 이미지 URL |
| `disabled` | boolean | ❌ | 비활성화 여부 |
| `orgId` | string | ✅ | 조직 ID |
| `workspaceId` | string | ✅ | 워크스페이스 ID |
| `pageId` | string | ✅ | 페이지 ID |
| `onValueChange` | function | ❌ | URL만 업데이트 (Legacy) |
| `onPropertiesChange` | function | ❌ | 여러 속성 업데이트 (권장) |

---

## 🔄 데이터 흐름

### 사용자 인터랙션

```
1. 사용자가 버튼 클릭
   ↓
2. handleImageChange() 실행
   ↓
3. 파일 선택 다이얼로그 표시
   ↓
4. 사용자가 파일 선택
   ↓
5. onchange 이벤트
```

### 비즈니스 로직

```
1. extractImageMetadata(file)
   → { width, height }
   ↓
2. fileToBase64(file)
   → Base64 string
   ↓
3. uploadImageAction({ fileBase64, fileName, ... })
   → Server Action (Trust Boundary)
   → ImageUploadService (Storage + DB + Signed URL)
   → ImageAsset (signed URL 포함)
   ↓
4. onPropertiesChange({
     imageAssetId,
     imageUrl,
     imageSource: 'user-upload',
   })
   → Block properties 업데이트
   ↓
5. 이미지 즉시 렌더링
```

---

## 🧩 컴포넌트 구조

### index.tsx (UI)

**역할**:
- Button + Tooltip UI 렌더링
- Hook 통합

**특징**:
- ✅ 선언적 UI
- ✅ 비즈니스 로직 없음
- ✅ Props만 전달

### core/use-image-change-toolbar-item.business.ts (비즈니스 로직)

**역할**:
- 파일 선택 처리
- 이미지 업로드
- Properties 업데이트
- 에러 처리

**특징**:
- ✅ Server Action 호출
- ✅ 상태 관리 (isUploading)
- ✅ 콜백 실행

### core/utils.ts (유틸리티)

**역할**:
- 순수 함수만 포함
- 도메인 독립적

**함수**:
- `fileToBase64()`: File → Base64 변환
- `extractImageMetadata()`: File → { width, height }

---

## 🎨 노코드 친화적 설계

### 디자이너가 다룰 수 있는 Props

```tsx
<ImageChangeToolbarItem
  disabled={false}              // ✅ Boolean
  currentValue="https://..."    // ✅ String
/>
```

### 디자이너가 다룰 수 없는 Props (Context로 처리)

```tsx
// ❌ 함수 Props는 노출하지 않음
onValueChange={...}
onPropertiesChange={...}
```

**참고**: 현재는 단순 툴바 아이템이므로 Context 불필요. 필요 시 추가 가능.

---

## 🧪 테스트

### Business Logic 테스트

```typescript
import { renderHook, act } from '@testing-library/react';
import { useImageChangeToolbarItemBusiness } from './use-image-change-toolbar-item.business';

test('should upload image and call onPropertiesChange', async () => {
  const onPropertiesChange = jest.fn();
  
  const { result } = renderHook(() =>
    useImageChangeToolbarItemBusiness(
      'workspace-123',
      false,
      undefined,
      onPropertiesChange
    )
  );

  await act(async () => {
    await result.current.handleImageChange();
  });

  expect(onPropertiesChange).toHaveBeenCalledWith({
    imageAssetId: expect.any(String),
    imageUrl: expect.any(String),
    imageSource: 'user-upload',
  });
});
```

### Mock 사용 (노코드 툴)

```typescript
import { useMockImageChangeToolbarItemBusiness } from './use-image-change-toolbar-item.business';

const mockBusiness = useMockImageChangeToolbarItemBusiness();

<ImageChangeToolbarItem
  {...props}
  businessLogic={mockBusiness}
/>
```

---

## 📚 참고 자료

### 컴포넌트 가이드라인
- `docs/event-domain-design/discussion/frontend-architecture/component-development-guidelines.md`
  - Flat Structure 패턴
  - UI/Business 로직 분리
  - 노코드 친화적 설계

### 관련 컴포넌트
- `generate-image-action/` - 복잡한 컴포넌트 예시 (components/ + core/)
- `visibility-toggle/` - 단순 컴포넌트 예시 (Flat)

---

## 🔄 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-11-30 | 2.0.0 | Flat Structure + UI/Business 분리 리팩토링 |
| 2025-11-30 | 1.1.0 | uploadImageAction으로 마이그레이션 |
| 이전 | 1.0.0 | 초기 구현 (단일 파일) |

---

**작성일**: 2025-11-30  
**버전**: v2.0.0  
**작성자**: AI Assistant







