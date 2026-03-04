# Custom Properties Section — "Coming soon" 이전 구조 (Git 기준)

이 문서는 **Coming soon**으로 대체되기 전에 Custom Properties Section에 들어가 있던 UI/로직을 Git 히스토리 기준으로 정리한 것이다.

- **변경 커밋**: `bcdffcdba2e36765617056e9abbb94a6f83633d0`  
  - 메시지: `fix: remove custom property add logic temporary`  
  - 날짜: 2026-02-23  
- **원본 경로**: `apps/web/src/domains/block-management/frontend/components/editor-panel/components/content-area/components/custom-properties-section/`

---

## 1. 최상위 진입점 (index.tsx)

**이전에 렌더되던 것**

- `PropertyGroup` (id: `custom-properties`, label: `Custom Properties`, order: 1000)
  - **자식 1**: `PropertiesList` — 커스텀 속성 목록
  - **자식 2**: `CustomPropertyAddPopover` — 속성 추가 팝오버 (props: `blockId`)

**래핑 구조**

- `CustomPropertiesSectionProvider`에 `blockId` 넘겨서 감싼 뒤, 내부에서 `CustomPropertiesSectionContent` 렌더.
- `CustomPropertiesSectionContent`에서:
  - `useCustomPropertiesSectionContext()` → `customProperties`, `blockId`
  - `useCanvasReadOnly()` → `readonly`
  - **readonly 이면서 custom properties가 없으면** 그룹 전체를 `return null`로 숨김.

**요약**

- Section = **PropertiesList** + **CustomPropertyAddPopover**.
- Provider/Context로 blockId, customProperties, propertyValues, lastAddedPropertyId 등 공유.

---

## 2. Core (비즈니스/데이터)

### 2.1 Props (core/types.ts)

- `CustomPropertiesSectionProps`: `{ blockId: string }`

### 2.2 use-custom-properties-section.ts

- **입력**: `blockId`
- **데이터 소스**: `useReactFlow().getNodes()`로 노드 목록 조회 후, `node.id === blockId` 또는 `node.data.blockId === blockId`인 노드의 `node.data`를 블록 데이터로 사용.
- **계산**:
  - `customProperties`: `blockData.customProperties`를 `order` 기준 정렬한 배열.
  - `propertyValues`: `blockData.properties`에서 각 커스텀 속성 id별 값 조회, 없으면 해당 속성의 `defaultValue` 사용.
- **상태**: `lastAddedPropertyId` / `setLastAddedPropertyId` — 새로 추가된 속성 ID를 넣어 두고, 상세 팝오버 자동 오픈 등에 사용.
- **에러**: 블록을 찾지 못하면 토스트 후 `throw new Error('Cannot find block')`.

### 2.3 Context 값 (core/context)

- `blockId`
- `resolvedBlockData` (블록 노드 데이터)
- `customProperties` (정렬된 커스텀 속성 정의 배열)
- `propertyValues` (속성 id → 현재/기본값)
- `lastAddedPropertyId`, `setLastAddedPropertyId`

---

## 3. 하위 컴포넌트 구조 (이전 디렉터리 기준)

```
custom-properties-section/
├── components/
│   ├── custom-property-add-popover/   # 속성 추가 팝오버
│   │   ├── components/
│   │   │   ├── trigger-button.tsx     # "Add Property" 트리거 (Framer/테스트용 순수 UI)
│   │   │   ├── label.tsx
│   │   │   ├── name-input.tsx         # 속성 이름 + IconPicker
│   │   │   ├── type-grid.tsx          # 타입 선택 그리드
│   │   │   └── type-grid-item.tsx
│   │   └── core/
│   │       ├── context, provider, types
│   │       ├── use-custom-property-add-popover.ui.ts
│   │       ├── use-custom-property-add-popover.business.ts
│   │       └── use-custom-property-add-popover.ts
│   ├── custom-property-item/          # 개별 속성 행 + 상세 팝오버
│   │   └── components/property-detail-popover/
│   │       └── option-sections/       # 타입별 옵션 (select 옵션, status 그룹 등)
│   ├── properties-list.tsx           # 속성 리스트 컨테이너
│   └── properties-list-box.tsx        # 리스트 레이아웃
├── core/
│   ├── context.tsx
│   ├── provider.tsx
│   ├── types.ts
│   └── use-custom-properties-section.ts
└── index.tsx
```

---

## 4. Custom Property Add Popover (요지)

- **역할**: 새 커스텀 속성 추가 (이름, 타입, 아이콘).
- **UI**: Popover 안에 이름 입력, IconPicker, 타입 그리드(Text, Number, Select, Multi Select, Status, Date, Checkbox, URL, Email, Phone, Color 등).
- **로직**: 타입 선택 시 이름 없으면 fallback 이름 사용, 타입별 기본 아이콘 설정 후 속성 생성; 생성 성공 시 상위 섹션에 `setLastAddedPropertyId`로 ID 전달해 상세 팝오버 자동 오픈.
- **readonly**: `useCanvasReadOnly()`가 true면 Add 버튼(팝오버 트리거) 미렌더.

---

## 5. 패키지(editor-panel)와의 차이

- **현재 packages/editor-panel**  
  - `entityId` + `deps`(resolveEntityData, propertyUpdateDeps) 기반의 **제네릭/패키지용** API.  
  - 실제 UI는 **Coming soon** 박스만 있음.
- **이전 앱(block-management)**  
  - `blockId` 단일 prop, ReactFlow 노드에서 블록/커스텀 속성/값을 직접 조회하고, PropertiesList + CustomPropertyAddPopover 전체 플로우가 동작함.

나중에 "Coming soon"을 다시 실제 UI로 복구할 때는 위 구조와 원본 경로의 컴포넌트/훅을 참고하면 된다. 패키지 쪽은 `entityId`/`deps`에 맞게 블록 도메인을 주입하는 방식으로 연결하면 됨.
