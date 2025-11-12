# Option Sections Core

옵션 관리에 공통으로 사용되는 컴포넌트 및 로직을 제공하는 core 모듈입니다.

## 구조

```
core/
├── context.tsx                      # OptionManagement Context 정의
├── provider.tsx                     # Provider 컴포넌트
└── use-option-management.ts         # 옵션 관리 비즈니스 로직 훅
```

**참고**: UI 컴포넌트(`option-item.tsx`, `option-edit-popover.tsx`)는 `components/` 폴더로 이동되었습니다.

## 역할

### OptionManagementProvider
- 옵션 관리의 최상위 Provider
- `withGroups` 옵션으로 그룹 기능 활성화/비활성화
- `defaultGroups`로 기본 그룹 제공 (STATUS 타입용)
- `useOptionManagement` 훅을 사용하여 옵션 관리 로직 제공


### use-option-management.ts
옵션 관리의 핵심 비즈니스 로직:

1. **옵션 상태 관리**
   - `options` 상태로 옵션 목록 관리
   - 외부 `field.options` 변경 시 자동 동기화

2. **옵션 생성**
   - `handleCreateOption`: 새 옵션 생성
   - 그룹 기능 활성화 시 그룹 정보 포함

3. **옵션 수정**
   - `handleOptionLabelChange`: 옵션 라벨 변경
   - `handleOptionColorChange`: 옵션 색상 변경
   - `handleOptionGroupChange`: 옵션 그룹 변경 (그룹 기능 활성화 시)

4. **옵션 삭제**
   - `handleDeleteOption`: 옵션 삭제

5. **옵션 복제**
   - `handleDuplicateOption`: 옵션 복제

6. **옵션 저장**
   - `commitOptions`를 통해 옵션 변경사항 저장
   - 그룹 기능 활성화 시 저장 전 그룹 정보 제거 (`transformOptionsForCommit`)

7. **그룹별 옵션 조회**
   - `getOptionsByGroup`: 특정 그룹에 속한 옵션들 조회 (그룹 기능 활성화 시)

## Context Value

### OptionManagementContextValue
```typescript
interface OptionManagementContextValue {
  options: PropertyOption[];                    // 옵션 목록
  statusGroups?: StatusGroup[];                 // 상태 그룹 목록 (그룹 기능 활성화 시)
  handleCreateOption: (label, color, group?) => Promise<void>; // 옵션 생성 핸들러
  handleDeleteOption: (optionId: string) => Promise<void>; // 옵션 삭제 핸들러
  handleOptionLabelChange: (optionId, newLabel) => Promise<void>; // 라벨 변경 핸들러
  handleOptionColorChange: (optionId, newColor) => Promise<void>; // 색상 변경 핸들러
  handleOptionGroupChange?: (optionId, newGroup) => Promise<void>; // 그룹 변경 핸들러
  handleDuplicateOption: (optionId: string) => Promise<void>; // 옵션 복제 핸들러
  getOptionsByGroup?: (groupId: string) => PropertyOption[]; // 그룹별 옵션 조회
}
```


## 사용 방법

```tsx
// 옵션 관리 Provider로 감싸기
<OptionManagementProvider withGroups={false}>
  {/* 옵션 관리 UI - OptionManagementContext를 직접 사용 */}
</OptionManagementProvider>
```

## 특징

- SELECT/MULTISELECT와 STATUS 타입 모두에서 공통 사용
- 그룹 기능을 선택적으로 활성화/비활성화 가능
- 옵션 변경 시 자동 저장
- 저장 실패 시 자동 롤백
- 그룹 기능 활성화 시 저장 전 그룹 정보 자동 제거
- UI 상태(newOptionLabel, newOptionGroup 등)는 컴포넌트 로컬 상태로 관리하여 Context 간소화
- Property Detail Popover와 동일한 구조 패턴 (context.tsx, use-option-management.ts, provider.tsx)

