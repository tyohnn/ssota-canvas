# Property Detail Popover Core

속성 상세 편집 팝오버의 비즈니스 로직을 담당하는 core 모듈입니다.

## 파일 구조

```
core/
├── context.tsx              # Context 정의 및 훅
├── provider.tsx             # Provider 컴포넌트
├── types.ts                 # 타입 정의
└── use-detail-popover.ts    # 메인 비즈니스 로직 훅
```

## 역할

### context.tsx
- `DetailPopoverContext` 정의
- `useDetailPopoverContext` 훅 제공
- Context 값 타입 정의: `DetailPopoverContextValue`

### provider.tsx
- `DetailPopoverProvider` 컴포넌트
- `useDetailPopover` 훅을 사용하여 Context 값 생성
- 하위 컴포넌트에 Context 제공

### types.ts
- `DetailPopoverField` 타입 정의
- `DetailPopoverProps` 타입 정의
- 컴포넌트의 props 인터페이스

### use-detail-popover.ts
메인 비즈니스 로직을 담당하는 훅:

1. **이름 관리**
   - `label` 상태로 로컬 이름 관리
   - 외부 `field.name` 변경 시 자동 동기화 (`useEffect`)
   - 500ms 디바운스 후 `saveLabel` 호출하여 자동 저장
   - 저장 실패 시 이전 값으로 복원

2. **아이콘 관리**
   - `icon` 상태로 로컬 아이콘 관리
   - 외부 `field.icon` 변경 시 자동 동기화 (`useEffect`)
   - `setIcon` 호출 시 즉시 optimistic update 수행 (디바운스 없음)
   - React Flow node data에 즉시 반영되어 UI에 바로 표시됨
   - 저장 실패 시 자동 롤백

3. **복제 처리**
   - `handleDuplicate`: 속성 복제 핸들러
   - `duplicateField`를 통해 속성 복제
   - 복제 성공 시 팝오버 닫기

4. **삭제 처리**
   - `handleDelete`: 속성 삭제 핸들러
   - `deleteField`를 통해 속성 삭제
   - 삭제 성공 시 팝오버 닫기

5. **키보드 처리**
   - `handleKeyDown`: 키보드 이벤트 핸들러
   - ESC 키 입력 시 팝오버 닫기

6. **상위 Context 연동**
   - `useCustomPropertyItemContext`를 통해 팝오버 닫기 함수 접근

## Context Value

```typescript
interface DetailPopoverContextValue {
  blockId: string;                                    // 블록 ID
  field: DetailPopoverField;                          // 편집 중인 속성 필드
  label: string;                                      // 로컬 이름 상태
  setLabel: (value: string) => void;                  // 이름 설정
  icon: string | null;                                // 로컬 아이콘 상태
  setIcon: (value: string | null) => void;           // 아이콘 설정
  handleDuplicate: () => Promise<void>;               // 복제 핸들러
  handleDelete: () => Promise<void>;                  // 삭제 핸들러
  handleKeyDown: (event: React.KeyboardEvent) => void; // 키보드 이벤트 핸들러
}
```

## 사용 방법

```tsx
// Provider로 감싸기
<DetailPopoverProvider blockId={blockId} field={field}>
  {/* 하위 컴포넌트 */}
</DetailPopoverProvider>

// 하위 컴포넌트에서 Context 사용
const { label, setLabel, icon, setIcon, handleDuplicate, handleDelete } = 
  useDetailPopoverContext();
```

## 특징

- 이름 변경 시 자동 저장 (500ms 디바운스)
- 아이콘 변경 시 즉시 optimistic update (디바운스 없음)
- 외부 변경 사항 자동 동기화
- 저장 실패 시 자동 롤백
- 키보드 단축키 지원 (ESC로 팝오버 닫기)
- 복제/삭제 액션 제공

