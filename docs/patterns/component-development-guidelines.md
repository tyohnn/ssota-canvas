# 프론트엔드 컴포넌트 개발 가이드라인

## 목차
- [개요](#개요)
- [핵심 원칙](#핵심-원칙)
- [Container/Presentational 패턴](#containerpresentational-패턴)
- [컴포넌트 패턴](#컴포넌트-패턴)
- [폴더 구조](#폴더-구조)
- [Props 설계](#props-설계)
- [상태 관리](#상태-관리)
- [로우코드 워크플로우 (Storybook)](#로우코드-워크플로우-storybook)
- [Optimistic Updates with TanStack Query](#optimistic-updates-with-tanstack-query)
- [실전 예제](#실전-예제)
- [안티패턴](#안티패턴)

---

## 개요

이 가이드라인은 SSOTA 프로젝트의 프론트엔드 컴포넌트 개발 표준을 정의합니다. 특히 다음 세 가지 목표를 염두에 두고 설계되었습니다:

1. **로우코드 툴 호환성**: Storybook, Playroom과 같은 컴포넌트 테스팅 환경에서 독립적으로 테스트 가능한 구조
2. **Container/Presentational 패턴**: 비즈니스 로직(Container)과 UI 렌더링(Presentational)을 명확히 분리
3. **디자이너 참여 워크플로우**: 디자이너가 Props만으로 컴포넌트를 테스트하고 스타일링할 수 있는 환경 제공

---

## 핵심 원칙

### 1. Compound Component Pattern 우선

복잡한 UI를 구성할 때는 단일 컴포넌트보다 여러 서브 컴포넌트의 조합으로 설계합니다.

**✅ 좋은 예:**
```tsx
<PropertyAddPopover>
  <PropertyNameInput />
  <PropertyTypeGrid />
</PropertyAddPopover>
```

**❌ 나쁜 예:**
```tsx
<PropertyAddPopover 
  renderInput={(props) => <input {...props} />}
  renderGrid={(props) => <div {...props} />}
/>
```

### 2. Container/Presentational 패턴

컴포넌트를 **로직을 담당하는 Container**와 **렌더링만 담당하는 Presentational**로 분리합니다.

**✅ 좋은 예 (Presentational):**
```tsx
// Props만 받아서 렌더링 (테스트 쉬움!)
interface MemberListTableProps {
  members: Member[];
  isLoading: boolean;
}

export function MemberListTable({ members, isLoading }: MemberListTableProps) {
  return <Table>{/* 렌더링만 */}</Table>;
}
```

**✅ 좋은 예 (Container):**
```tsx
// Hook으로 데이터 가져와서 Props로 전달
export function MembersTab({ workspaceId }: MembersTabProps) {
  const { members, isLoading } = useMembersTab(workspaceId);
  
  return <MemberListTable members={members} isLoading={isLoading} />;
}
```

**❌ 나쁜 예 (로직과 렌더링 혼재):**
```tsx
// 컴포넌트 내부에서 직접 Hook 사용 → 테스트 어려움
export function MemberListTable() {
  const { members, isLoading } = useMembersTabContext(); // Context 의존
  return <Table>{/* ... */}</Table>;
}
```

**Context는 언제 사용하는가?**
- ✅ **전역 데이터**: 앱 전체에서 사용 (WorkspaceContext, ThemeContext)
- ✅ **도메인 레벨**: 큰 기능 단위 (SettingsDialogContext)
- ❌ **로컬 레벨**: 작은 컴포넌트 (Props로 전달하는 게 더 간단함)

### 3. 로직 분리와 테스트 가능성

컴포넌트는 **UI 상태**와 **비즈니스 로직**을 분리하여 테스트와 재사용이 쉬워야 합니다.

**파일 구조:**
```
component/
├── index.tsx                      # UI 구조 (선언적)
├── use-component.ui.ts            # UI 상태 (로컬 상태 관리)
├── use-component.business.ts      # 비즈니스 로직 (API, 검증)
├── use-component.ts               # 통합 (UI + Business)
└── context.tsx                    # Context Provider
```

**장점:**
- ✅ **로우코드 툴 호환**: 디자이너는 Storybook에서 Props만으로 테스트
- ✅ **테스트 용이**: UI/Business 로직 각각 독립 테스트
- ✅ **Mock 지원**: 비즈니스 로직을 쉽게 교체 가능

> 💡 **자세한 내용**: [로우코드 워크플로우 (Storybook)](#로우코드-워크플로우-storybook) 참조

---

## Container/Presentational 패턴

### 개념

컴포넌트를 두 가지 역할로 분리합니다:

```
┌─────────────────────────────────┐
│  Container Component            │
│  (로직 담당)                     │
│  - Hook으로 데이터 가져오기      │
│  - 비즈니스 로직 처리            │
│  - Props로 Presentational에 전달 │
└──────────┬──────────────────────┘
           │ Props (단순 값만)
           ↓
┌─────────────────────────────────┐
│  Presentational Component       │
│  (렌더링만 담당)                 │
│  - Props만 받음                  │
│  - 순수 함수                     │
│  - 로직 없음                     │
│  - Storybook 테스트 쉬움 ✅      │
└─────────────────────────────────┘
```

### 예시

#### Container (index.tsx)
```tsx
// members-tab/index.tsx
export function MembersTab({ workspaceId }: MembersTabProps) {
  // Hook으로 데이터 가져오기
  const { memberView, isLoading } = useMembersTab(workspaceId);

  // Props로 전달 (로직 없음)
  return (
    <MembersTabContent
      members={memberView?.currentMembers || []}
      pendingInvitations={memberView?.pendingInvitations || []}
      isLoading={isLoading}
    />
  );
}
```

#### Presentational (components/)
```tsx
// members-tab/components/members-tab-content.tsx
interface MembersTabContentProps {
  members: Member[];
  pendingInvitations: Invitation[];
  isLoading: boolean;
}

export function MembersTabContent({
  members,
  pendingInvitations,
  isLoading,
}: MembersTabContentProps) {
  // 렌더링만! Hook 없음
  return (
    <Box>
      <MembersTabHeader />
      <WorkspaceMemberListTable
        currentMembers={members}
        pendingInvitations={pendingInvitations}
        isLoading={isLoading}
      />
    </Box>
  );
}
```

### Storybook 테스트

```tsx
// members-tab-content.stories.tsx
export default {
  title: 'Workspace/MembersTabContent',
  component: MembersTabContent,
};

// 디자이너가 직접 작성 가능!
export const Default = () => (
  <MembersTabContent
    members={[{ userId: '1', name: 'John', ... }]}
    pendingInvitations={[]}
    isLoading={false}
  />
);

export const Loading = () => (
  <MembersTabContent
    members={[]}
    pendingInvitations={[]}
    isLoading={true}  // 로딩 상태 테스트
  />
);
```

### Context는 언제 필요한가?

#### ✅ Context 사용 (전역/도메인 레벨)
```tsx
// 앱 전체 또는 큰 기능 단위
<WorkspaceContext>           // 전역: workspace 데이터
  <SettingsDialogContext>    // 도메인: 설정 다이얼로그 전체
    <MembersTab />           // 로컬: Props로 전달
  </SettingsDialogContext>
</WorkspaceContext>
```

#### ❌ Context 불필요 (로컬 레벨)
```tsx
// 작은 컴포넌트는 Props로 충분
<MembersTab workspaceId={workspaceId}>  // Container
  <MembersTabContent                    // Presentational
    members={members}                   // Props로 전달
    isLoading={isLoading}
  />
</MembersTab>
```

**가이드라인:**
- **Props drilling 1-2단계**: Props 전달 (간단함)
- **Props drilling 3단계 이상**: Context 고려
- **전역 데이터** (workspaceId, 테마): Context
- **테스트하고 싶은 컴포넌트**: Presentational (Props만)

---

## 컴포넌트 패턴

### Static Member Compound Pattern (FlyOut 스타일, 내부 조합)

실제 리팩토링 결과, **Provider + 서브 컴포넌트 분리** 구조는 유지하면서도 정적 멤버를 외부로 노출하지 않고 `index.tsx`에서 미리 조합한 레이아웃을 반환하는 방식을 채택했습니다. 커스텀 속성 추가 플로우의 UI 구성이 모든 화면에서 동일하다는 점을 반영한 결정입니다.

#### 왜 이렇게 조정했는가?
- **소비자 코드 단순화**: `PropertyAddPopover`를 호출하기만 하면 내부적으로 Trigger → Content → Label → NameInput → TypeGrid 순서가 구성되어, 추가적인 선언 없이 바로 사용할 수 있습니다.
- **Radix Popover 연동 간소화**: `PopoverTrigger`가 자체적으로 열림/닫힘을 관리하므로, Trigger에서 context의 `toggleOpen`을 직접 호출할 필요가 없어졌습니다.
- **확장성 확보**: 서브 컴포넌트는 여전히 별도 파일로 분리되어 있어, 필요 시 정적 멤버 형태로 재노출하거나 커스터마이징 버전을 제공하기 쉽습니다.

#### 현재 구성 요소
- `property-add-popover/index.tsx`: Provider + Trigger + Content + Label + PropertyNameInput + PropertyTypeGrid를 조합한 최종 엔트리
- `property-add-popover/provider.tsx`: Context Provider와 Radix `Popover` 래핑
- `property-add-popover/property-add-popover.context.tsx`: Context와 커스텀 훅 정의
- `property-add-popover/use-property-add-popover.ts`: 상태 및 비즈니스 로직
- `property-add-popover/trigger.tsx`: 버튼 UI (`title` 텍스트 커스터마이즈 허용)
- `property-add-popover/content.tsx`: PopoverContent 래퍼 (`onEscapeKeyDown`에서 닫기 처리)
- `property-add-popover/property-name-input.tsx`: 이름 입력 필드 + 내부 IconPicker 상태 관리
- `property-add-popover/property-type-grid.tsx`: 타입 선택 그리드
- `property-add-popover/property-type-grid-item.tsx`: 타입 선택 버튼

#### 실제 코드 스니펫
```tsx
// index.tsx (요약)
export function PropertyAddPopover({ blockId }: PropertyAddPopoverProps) {
  return (
    <PropertyAddPopoverProvider blockId={blockId}>
      <Trigger />
      <Content>
        <Label
          htmlFor="property-name"
          className="text-xs font-medium text-muted-foreground"
        >
          커스텀 속성 추가
        </Label>
        <PropertyNameInput />
        <PropertyTypeGrid />
      </Content>
    </PropertyAddPopoverProvider>
  );
}
```

필요 시 아래와 같이 서브 컴포넌트를 독립적으로 export해 정적 멤버 패턴으로 재구성할 수 있습니다. 현재는 요구 사항이 없어 기본 엔트리만 공개합니다.

```tsx
// 확장 예시 (필요 시)
export { Trigger as PropertyAddPopoverTrigger } from './trigger';
export { Content as PropertyAddPopoverContent } from './content';
```

#### 권장 폴더 구조
```
property-add-popover/
├── index.tsx                        # Provider + 내부 조합
├── provider.tsx                     # Provider 컴포넌트 (Context Provider + Popover 구조)
├── property-add-popover.context.tsx # Context 정의 및 커스텀 훅
├── use-property-add-popover.ts      # 상태∙비즈니스 로직
├── trigger.tsx                      # Popover Trigger UI
├── content.tsx                      # Popover Content 래퍼
├── property-name-input.tsx          # 이름 입력 필드
├── property-type-grid.tsx           # 타입 선택 그리드
├── property-type-grid-item.tsx      # 타입 선택 버튼
└── types.ts                         # 공유 타입 정의
```

> 💡 **노트:** 노코드 툴에서 블록 구조를 임의로 재배치해야 하는 요구가 생기면, 기존에 문서화해 둔 정적 멤버 패턴을 다시 도입하여 외부에 공개하는 것을 권장합니다. 두 접근 모두 동일한 컨텍스트/훅 로직을 재사용할 수 있습니다.

---

### Controlled vs Semi-Controlled vs Uncontrolled Pattern

컴포넌트의 상태 관리 방식에 따라 **Controlled**, **Semi-Controlled**, **Uncontrolled** 세 가지 패턴으로 나뉩니다. 각 패턴은 상태의 "소유권"이 어디에 있는지에 따라 결정됩니다.

#### 개념 정리

```
┌─────────────────────────────────────────────────────────┐
│  Controlled:     부모가 모든 상태 제어                   │
│  Semi-Controlled: 내부가 즉시 반응, 부모가 최종 제어     │
│  Uncontrolled:   내부가 모든 상태 제어                   │
└─────────────────────────────────────────────────────────┘
```

#### 1. Controlled Component (완전 제어)

부모 컴포넌트가 모든 상태를 제어합니다. 컴포넌트는 내부 상태를 가지지 않고, props로 받은 값을 그대로 사용합니다.

```tsx
// ✅ Controlled: 부모가 모든 상태 제어
interface ControlledInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function ControlledInput({ value, onChange }: ControlledInputProps) {
  // 내부 상태 없음, 모든 것이 props
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// 사용 예시
function Parent() {
  const [value, setValue] = useState('');
  
  return (
    <ControlledInput
      value={value}              // 부모가 상태 소유
      onChange={setValue}        // 부모가 변경 처리
    />
  );
}
```

**특징:**
- ✅ 부모가 상태를 완전히 제어
- ✅ 외부에서 값을 직접 설정 가능
- ✅ 단일 소스 of truth (부모)
- ❌ 부모의 상태 업데이트가 느리면 UI 반응 지연 가능

**사용 시기:**
- 부모가 값을 검증하거나 변환해야 할 때
- 여러 컴포넌트 간 상태 동기화가 필요할 때
- 외부에서 값을 강제로 설정해야 할 때

#### 2. Semi-Controlled Component (반제어)

컴포넌트가 내부 상태를 가지지만, 부모의 props와 동기화됩니다. UI 반응성을 위해 내부 상태를 즉시 업데이트하되, 부모에도 변경을 알립니다.

```tsx
// ✅ Semi-Controlled: 내부가 즉시 반응, 부모가 최종 제어
interface ToolbarOptionPopoverProps<T> {
  currentValue: T;                      // 부모의 현재 값
  onValueChange: (value: T) => void;   // 부모에 변경 알림
  options: ToolbarOption<T>[];
}

export function ToolbarOptionPopover<T>({
  currentValue,
  onValueChange,
  options,
}: ToolbarOptionPopoverProps<T>) {
  // 내부 상태로 즉시 UI 반응
  const [selectedValue, setSelectedValue] = useState<T>(currentValue);
  
  // 외부 변경 시 동기화
  useEffect(() => {
    setSelectedValue(currentValue);
  }, [currentValue]);
  
  const handleClick = (optionValue: T) => {
    setSelectedValue(optionValue);  // 즉시 UI 업데이트 (optimistic)
    onValueChange(optionValue);     // 부모에 알림 (부모가 async 처리 가능)
  };
  
  return (
    <Popover>
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => handleClick(option.value)}
          className={selectedValue === option.value ? 'active' : ''}
        >
          {option.label}
        </button>
      ))}
    </Popover>
  );
}

// 사용 예시
function Parent() {
  const [shape, setShape] = useState<EdgeShape>('default');
  
  const handleShapeChange = async (newShape: EdgeShape) => {
    // 비동기 업데이트 가능 (서버 저장 등)
    await saveShapeToServer(newShape);
    setShape(newShape);  // 실제 반영은 나중에
  };
  
  return (
    <ToolbarOptionPopover
      currentValue={shape}        // 부모의 현재 값
      onValueChange={handleShapeChange}
      options={EDGE_SHAPES}
    />
  );
}
```

**특징:**
- ✅ 즉시 UI 반응 (내부 상태 업데이트)
- ✅ 부모는 비동기 처리 가능 (서버 저장 등)
- ✅ 부모가 최종적으로 상태 제어
- ✅ Optimistic Update 패턴과 잘 맞음

**사용 시기:**
- UI 반응성이 중요한 인터랙션 (드래그, 선택 등)
- 부모의 상태 업데이트가 비동기일 때
- Optimistic Update가 필요할 때
- **권장**: 대부분의 Presentational 컴포넌트에 적합

#### 3. Uncontrolled Component (비제어)

컴포넌트가 모든 상태를 내부에서 관리합니다. 부모는 초기값(`defaultValue`)만 제공하고, 이후 변경사항은 내부에서만 처리합니다.

```tsx
// ✅ Uncontrolled: 내부가 모든 상태 제어
interface UncontrolledInputProps {
  defaultValue: string;           // 초기값만 제공
  onSubmit?: (value: string) => void;  // 최종 제출 시에만 알림
}

export function UncontrolledInput({
  defaultValue,
  onSubmit,
}: UncontrolledInputProps) {
  // 내부 상태로 모든 것 제어
  const [value, setValue] = useState(defaultValue);
  
  const handleSubmit = () => {
    onSubmit?.(value);  // 필요할 때만 부모에 알림
  };
  
  return (
    <div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}  // 내부에서만 관리
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

// 사용 예시
function Parent() {
  const handleSubmit = (value: string) => {
    console.log('Final value:', value);  // 제출 시에만 값 확인
  };
  
  return (
    <UncontrolledInput
      defaultValue=""           // 초기값만 제공
      onSubmit={handleSubmit}   // 제출 시에만 알림
    />
  );
}
```

**특징:**
- ✅ 부모 컴포넌트 간단 (상태 관리 불필요)
- ✅ 내부에서 모든 상태 제어
- ✅ 불필요한 리렌더링 최소화
- ❌ 외부에서 값을 강제로 설정하기 어려움
- ❌ 부모가 중간 값을 확인하기 어려움

**사용 시기:**
- 단순한 폼 입력 (검색창, 댓글 입력 등)
- 부모가 중간 상태를 알 필요가 없을 때
- 성능 최적화가 중요할 때

#### 패턴 비교표

| 패턴 | 상태 소유권 | 부모 역할 | 사용 시기 | Presentational 호환 |
|------|------------|----------|----------|-------------------|
| **Controlled** | 부모 | 모든 상태 제어 | 검증/변환이 필요할 때 | ✅ |
| **Semi-Controlled** | 내부 + 부모 동기화 | 최종 제어 | UI 반응성 + 부모 제어 필요 | ✅ (권장) |
| **Uncontrolled** | 내부 | 초기값만 제공 | 단순 입력, 성능 최적화 | ✅ |

#### Presentational 컴포넌트와의 관계

**중요:** 세 가지 패턴 모두 Presentational 컴포넌트가 될 수 있습니다!

```tsx
// ✅ 모두 Presentational입니다!

// Controlled Presentational
export function ControlledInput({ value, onChange }) {
  return <input value={value} onChange={onChange} />;
}

// Semi-Controlled Presentational (권장)
export function ToolbarOptionPopover({ currentValue, onValueChange }) {
  const [selectedValue, setSelectedValue] = useState(currentValue);
  useEffect(() => setSelectedValue(currentValue), [currentValue]);
  // ... 비즈니스 로직 없음, Context 의존성 없음
  return <UI />;
}

// Uncontrolled Presentational
export function SearchInput({ defaultValue, onSubmit }) {
  const [value, setValue] = useState(defaultValue);
  // ... 비즈니스 로직 없음, Context 의존성 없음
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

**Presentational의 핵심:**
- 비즈니스 로직 없음 (API 호출 X)
- Context 의존성 없음 (전역 상태 X)
- Props로 외부 제어 가능
- Storybook에서 독립 테스트 가능

**상태 관리 방식(Controlled/Semi/Uncontrolled)은 Presentational 여부와 무관합니다!**

#### 실제 프로젝트 예시

**ToolbarOptionPopover** (Semi-Controlled):
```tsx
// packages/ui/src/components/ssota-ui/toolbar-option-popover.tsx
export function ToolbarOptionPopover<T>({
  currentValue,      // 부모의 현재 값
  onValueChange,     // 부모에 변경 알림
  options,
}: ToolbarOptionPopoverProps<T>) {
  const [selectedValue, setSelectedValue] = useState(currentValue);
  
  useEffect(() => {
    setSelectedValue(currentValue);  // 외부 동기화
  }, [currentValue]);
  
  const handleClick = (value: T) => {
    setSelectedValue(value);    // 즉시 UI 반응
    onValueChange(value);        // 부모 알림
  };
  
  // ... 비즈니스 로직 없음, Context 의존성 없음
  // ✅ Presentational 컴포넌트!
}
```

**장점:**
- 사용자가 옵션을 클릭하면 **즉시** UI가 반응 (내부 state)
- 부모는 비동기로 상태 업데이트 가능 (서버 저장 등)
- 부모가 외부에서 값을 변경하면 자동으로 동기화 (`useEffect`)

---

## 폴더 구조

### 기본 구조 (Flat Structure)

단순한 컴포넌트의 경우 플랫 구조를 사용합니다:

```
component-name/
├── index.tsx                # 메인 컴포넌트 (export default)
├── context.tsx              # Context 정의 (선택)
├── use-component-name.ts    # 비즈니스 로직 훅 (선택)
├── types.ts                 # 공유 타입
├── sub-component-a.tsx      # 서브 컴포넌트
├── sub-component-b.tsx      # 서브 컴포넌트
└── utils.ts                 # 유틸리티 함수 (선택)
```

### 계층 구조 (components/ + core/ Pattern)

복잡한 컴포넌트나 하위 컴포넌트가 많은 경우 `components/` 와 `core/` 폴더로 분리합니다:

```
component-name/
├── components/              # UI 컴포넌트들 (계층적)
│   ├── sub-component-a/     # 서브 컴포넌트 (재귀적 구조 가능)
│   │   ├── components/      # 더 깊은 하위 컴포넌트
│   │   ├── core/            # 서브 컴포넌트의 로직
│   │   ├── index.tsx
│   │   └── README.md
│   ├── sub-component-b.tsx  # 단순 서브 컴포넌트
│   └── sub-component-c.tsx
├── core/                    # 비즈니스 로직 (플랫)
│   ├── context.tsx          # Context 정의
│   ├── provider.tsx         # Provider 컴포넌트
│   ├── types.ts             # 타입 정의
│   ├── use-component-name.ui.ts        # UI 상태 (선택)
│   ├── use-component-name.business.ts  # 비즈니스 로직 (선택)
│   ├── use-component-name.ts           # 통합 훅
│   └── README.md            # 로직 설명
├── index.tsx                # 메인 컴포넌트 (Provider + UI 조합)
└── README.md                # 컴포넌트 문서
```

**언제 사용하는가?**

✅ **components/ + core/ 사용 (계층 구조)**
- 서브 컴포넌트가 3개 이상
- 서브 컴포넌트가 또 다른 하위 컴포넌트를 가짐 (프랙탈 구조)
- 복잡한 비즈니스 로직이 있음
- 여러 레벨의 Context가 필요함

❌ **Flat 구조 사용 (기본 구조)**
- 서브 컴포넌트가 2개 이하
- 단순한 UI 컴포넌트
- 비즈니스 로직이 간단함

**실제 예시:**
```
custom-properties-section/          # 복잡한 컴포넌트
├── components/                      # UI 컴포넌트 (계층적)
│   ├── custom-property-add-popover/ # 하위 컴포넌트 (재귀적 구조)
│   │   ├── components/              # 팝오버의 하위 UI들
│   │   │   ├── label.tsx
│   │   │   ├── name-input.tsx
│   │   │   └── type-grid.tsx
│   │   ├── core/                    # 팝오버의 로직
│   │   │   ├── context.tsx
│   │   │   ├── provider.tsx
│   │   │   ├── types.ts
│   │   │   ├── use-*.ui.ts
│   │   │   ├── use-*.business.ts
│   │   │   └── use-*.ts
│   │   ├── index.tsx
│   │   └── README.md
│   ├── custom-property-item/        # 또 다른 복잡한 하위 컴포넌트
│   │   └── (동일한 구조 반복)
│   └── properties-list.tsx          # 단순 컴포넌트
├── core/                            # 메인 컴포넌트의 로직 (플랫)
│   ├── context.tsx
│   ├── provider.tsx
│   ├── types.ts
│   ├── use-custom-properties-section.ts
│   └── README.md
├── index.tsx                        # 메인 엔트리
└── README.md
```

### 프랙탈 아키텍처 (Fractal Architecture)

위 구조는 **프랙탈 패턴**을 따릅니다. 각 컴포넌트가 동일한 구조(`components/` + `core/`)를 가질 수 있어, 무한히 중첩 가능합니다.

```
Level 1: custom-properties-section/
         ├── components/
         │   └── Level 2: custom-property-item/
         │                ├── components/
         │                │   └── Level 3: property-detail-popover/
         │                │                ├── components/
         │                │                │   └── Level 4: option-sections/
         │                │                │                ├── components/
         │                │                │                └── core/
         │                │                └── core/
         │                └── core/
         └── core/
```

**장점:**
- ✅ **일관성**: 모든 레벨에서 동일한 구조
- ✅ **확장성**: 새 하위 컴포넌트 추가가 쉬움
- ✅ **독립성**: 각 컴포넌트가 자체 로직/상태를 가짐
- ✅ **테스트 용이**: 각 레벨을 독립적으로 테스트

### 파일명 규칙

- **index.tsx**: 메인 컴포넌트, 폴더 대표 export
- **use-xxx.ts**: Custom Hook (use- prefix 필수)
- **xxx-context.tsx** 또는 **context.tsx**: Context 정의
- **provider.tsx**: Context Provider 컴포넌트
- **types.ts**: 타입 정의만 포함
- **README.md**: 컴포넌트/로직 설명 문서
- 모든 파일은 kebab-case 사용

---

## Props 설계

### 노코드 친화적 Props

**✅ 노출해야 할 Props:**
- 디자인 관련: `className`, `style`, `variant`, `size`
- 텍스트 콘텐츠: `label`, `placeholder`, `title`
- 불리언 플래그: `disabled`, `required`, `readOnly`
- 단순 값: `defaultValue`, `maxLength`

**❌ 노출하지 말아야 할 Props:**
- 함수: `onChange`, `onClick`, `onSubmit`
- 복잡한 객체: `config`, `options` (객체 타입)
- Ref: `inputRef`, `ref`
- 상태: `value`, `isOpen`

### 타입 정의

```tsx
// types.ts
export interface PropertyAddPopoverProps {
  blockId: string;              // 외부에서 전달받는 필수 Props
  children?: React.ReactNode;   // 추후 커스텀 구성을 위해 예약 (기본 조합 사용 시 생략)
}

// 내부 타입은 export하지 않음
interface InternalState {
  propertyName: string;
  open: boolean;
}
```

`Trigger`, `Content`, `PropertyNameInput`, `PropertyTypeGrid` 등 서브 컴포넌트는 노코드 호환을 위해 다음과 같이 최소한의 값/스타일 Props만 노출합니다.

- `TriggerProps`: `{ title?: string }`
- `ContentProps`: `{ className?: string }`
- `PropertyNameInputProps`: `{ placeholder?: string; className?: string; autoFocus?: boolean }`
- `PropertyTypeGridProps`: `{ options?: PropertyTypeOption[] }`

함수 Props 없이도 커스터마이징이 가능하도록, 모든 액션은 Context에서 제공하는 핸들러를 직접 호출합니다. IconPicker와 같이 추가 UI 상태가 필요한 경우에도 컴포넌트 내부에서 캡슐화하여 외부 노출을 최소화합니다.

---

## 상태 관리

### 로컬 상태 (useState, useReducer)

컴포넌트 내부에서만 사용하는 UI 상태는 로컬 상태로 관리합니다.

```tsx
const [open, setOpen] = useState(false);
const [propertyName, setPropertyName] = useState('');
```

### 공유 상태 (Context)

**Context 사용 레벨:**

#### 1️⃣ 전역 레벨 (App-wide)
```tsx
// 앱 전체에서 사용
<WorkspaceContext>    // ✅ workspace 데이터
<UserContext>         // ✅ 인증 정보
<ThemeContext>        // ✅ 테마
```

#### 2️⃣ 도메인 레벨 (Feature-wide)
```tsx
// 큰 기능 단위 (다이얼로그, 섹션)
<WorkspaceSettingsDialogContext>  // ✅ 설정 다이얼로그 전체
  <GeneralSettingsForm />
  <MembersTab />
</WorkspaceSettingsDialogContext>
```

#### 3️⃣ 로컬 레벨 (Component-local)
```tsx
// ❌ Context 불필요 (Props로 충분!)
// Props drilling 1-2단계는 괜찮음
<MembersTab workspaceId={workspaceId}>
  <MembersTabContent members={members} />
</MembersTab>
```

**가이드라인:**
- **전역/도메인**: Context 사용 (Props drilling 3단계 이상)
- **로컬**: Props 전달 (Props drilling 1-2단계)
- **원칙**: Presentational 컴포넌트는 Props만 받음

### 도메인 상태 (Custom Hook)

서버 데이터나 도메인 로직은 별도 훅으로 분리합니다.

```tsx
const { createField } = useCustomProperty();
```

---

## 로우코드 워크플로우 (Storybook)

### Why: 디자이너-엔지니어 협업

**Storybook/Playroom** 환경에서 디자이너가 Presentational 컴포넌트를 독립적으로 테스트하고, 엔지니어가 Container에서 비즈니스 로직을 배선하는 워크플로우를 지원합니다.

**핵심 아이디어:**
- 🎨 **디자이너**: Storybook에서 Props만으로 UI 테스트
- 💼 **엔지니어**: Hook으로 비즈니스 로직 구현
- 🔌 **통합**: Container가 Hook → Props 변환

```
┌─────────────────────────────────────────┐
│  Designer (Storybook)                   │
│  ↓ Presentational Component             │
│  → Props로 Mock 데이터 주입              │
│  → Context/Hook 몰라도 됨                │
│  → 즉시 시각적 피드백                    │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Engineer (Production)                  │
│  ↓ Container Component                  │
│  → Hook으로 데이터 가져오기              │
│  → Props로 Presentational에 전달         │
└─────────────────────────────────────────┘
```

### 워크플로우

#### Phase 1: 디자이너 작업 (Storybook)

디자이너는 Presentational 컴포넌트를 Storybook에서 독립적으로 테스트합니다:

```tsx
// workspace-member-list-table.stories.tsx
export default {
  title: 'Workspace/MemberListTable',
  component: WorkspaceMemberListTable,
};

// 디자이너가 직접 작성 가능!
export const Default = () => (
  <WorkspaceMemberListTable
    currentMembers={[
      { userId: '1', name: 'John Doe', email: 'john@example.com', ... }
    ]}
    pendingInvitations={[]}
    isLoading={false}
  />
);

export const Loading = () => (
  <WorkspaceMemberListTable
    currentMembers={[]}
    pendingInvitations={[]}
    isLoading={true}  // 로딩 상태 테스트
  />
);

export const WithPending = () => (
  <WorkspaceMemberListTable
    currentMembers={[...]}
    pendingInvitations={[
      { id: '1', invitedUserEmail: 'jane@example.com', ... }
    ]}
    isLoading={false}
  />
);
```

**디자이너가 할 수 있는 것:**
- ✅ Props 값만 바꿔서 다양한 UI 상태 테스트
- ✅ Context/Hook/Provider 몰라도 됨
- ✅ 즉시 시각적 피드백
- ✅ 애니메이션, 스타일 조정
- ✅ 반응형 디자인 테스트

**디자이너가 할 필요 없는 것:**
- ❌ API 연동
- ❌ 비즈니스 로직
- ❌ Context 설정
- ❌ Hook 이해

#### Phase 2: 엔지니어 배선 (Production)

엔지니어는 Container에서 Hook으로 데이터를 가져와 Props로 전달합니다:

```tsx
// members-tab/index.tsx (Container)
export function MembersTab({ workspaceId, disableInvite }: MembersTabProps) {
  // Hook으로 비즈니스 로직 처리
  const {
    memberView,
    isLoadingMembers,
    isLoadingMembersQuery,
  } = useMembersTab({ workspaceId, disableInvite });

  const isLoading = isLoadingMembers || isLoadingMembersQuery;

  // Props로 Presentational에 전달
  return (
    <MembersTabContent
      members={memberView?.currentMembers || []}
      pendingInvitations={memberView?.pendingInvitations || []}
      isLoading={isLoading}
    />
  );
}
```

### 1️⃣ UI State Hook (`.ui.ts`)

```tsx
// use-custom-property-add-popover.ui.ts
export interface PropertyAddPopoverUIState {
  // UI 상태
  open: boolean;
  propertyName: string;
  icon: string | null;
  
  // UI 액션
  setOpen: (open: boolean) => void;
  setPropertyName: (name: string) => void;
  setIcon: (icon: string | null) => void;
  handleOpenChange: (open: boolean) => void;
  
  // Ref
  inputRef: RefObject<HTMLInputElement | null>;
}

export function usePropertyAddPopoverUI(): PropertyAddPopoverUIState {
  const [open, setOpen] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [icon, setIcon] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setPropertyName('');
      setIcon(null);
    }
  }, []);

  return {
    open,
    propertyName,
    icon,
    setOpen,
    setPropertyName,
    setIcon,
    handleOpenChange,
    inputRef,
  };
}
```

**핵심 특징:**
- ✅ 비즈니스 로직 없음
- ✅ 로컬 상태 관리만
- ✅ 노코드 환경에서 독립적으로 테스트 가능
- ✅ API 호출 없음

### 2️⃣ Business Logic Hook (`.business.ts`)

```tsx
// use-custom-property-add-popover.business.ts
export interface PropertyAddBusinessLogic {
  onSubmit: (params: {
    name: string;
    type: PropertyType;
    icon: string;
  }) => Promise<void>;
  
  validate?: (name: string) => string | null;
  onCancel?: () => void;
}

/**
 * Production 비즈니스 로직
 */
export function usePropertyAddBusiness(
  blockId: string
): PropertyAddBusinessLogic {
  const { createField } = useCustomProperty();
  const { setLastAddedPropertyId } = useCustomPropertiesSectionContext();

  const onSubmit = useCallback(
    async (params) => {
      try {
        const newPropertyId = await createField(blockId, params);
        setLastAddedPropertyId(newPropertyId);
      } catch (error) {
        console.error('Failed to create property:', error);
        throw error;
      }
    },
    [blockId, createField, setLastAddedPropertyId]
  );

  const validate = useCallback((name: string) => {
    if (!name.trim()) return 'Property name is required';
    if (name.length > 50) return 'Property name is too long';
    return null;
  }, []);

  return { onSubmit, validate };
}

/**
 * Mock 비즈니스 로직 (노코드 툴용)
 */
export function useMockPropertyAddBusiness(): PropertyAddBusinessLogic {
  const onSubmit = useCallback(async (params) => {
    console.log('[Mock] Creating property:', params);
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  return { onSubmit };
}
```

**핵심 특징:**
- ✅ API 호출
- ✅ 데이터 검증
- ✅ 에러 처리
- ✅ 도메인 로직
- ✅ Mock 버전 제공

### 3️⃣ Combined Hook (통합)

```tsx
// use-custom-property-add-popover.ts
export function useCustomPropertyAddPopover(
  blockId: string,
  businessLogic?: PropertyAddBusinessLogic // 🎯 Optional injection
) {
  // UI State (디자이너 영역)
  const uiState = usePropertyAddPopoverUI();
  
  // Business Logic (엔지니어 영역)
  const defaultBusiness = usePropertyAddBusiness(blockId);
  const business = businessLogic ?? defaultBusiness;

  // Combined Logic
  const handleSelectType = useCallback(
    async (type: PropertyType, fallbackName: string) => {
      const finalName = uiState.propertyName.trim() || fallbackName;

      // Business: Validation
      const error = business.validate?.(finalName);
      if (error) {
        console.warn('Validation error:', error);
        return;
      }

      // UI: Close optimistically
      uiState.setOpen(false);

      try {
        // Business: Submit
        await business.onSubmit({
          name: finalName,
          type,
          icon: uiState.icon || 'FileText',
        });
        
        // UI: Reset on success
        uiState.setPropertyName('');
        uiState.setIcon(null);
      } catch (error) {
        // UI: Restore on error
        uiState.setOpen(true);
      }
    },
    [uiState, business]
  );

  return {
    blockId,
    ...uiState,
    handleSelectType,
  };
}
```

**핵심 특징:**
- ✅ UI + Business 통합
- ✅ Optional injection 지원
- ✅ Production: 기본 비즈니스 로직 사용
- ✅ Test/Mock: 커스텀 로직 주입 가능

### 사용 예시

#### Production 환경

```tsx
// 기본 비즈니스 로직 사용 (businessLogic 생략)
<CustomPropertyAddPopover blockId={blockId} />

// 커스텀 비즈니스 로직 주입
const customBusiness = useCustomBusiness();
<CustomPropertyAddPopover blockId={blockId} businessLogic={customBusiness} />
```

#### Test 환경

```tsx
const mockBusiness = useMockPropertyAddBusiness();
<CustomPropertyAddPopover blockId="test-id" businessLogic={mockBusiness} />
```

#### Framer 환경

```tsx
// UI State Hook만 직접 사용
const uiState = usePropertyAddPopoverUI();
const mockBusiness = useMockPropertyAddBusiness();

// UI 컴포넌트 직접 구성
<Popover open={uiState.open}>
  <Input value={uiState.propertyName} />
  {/* ... */}
</Popover>
```

### 이 패턴이 해결하는 문제

**Before (단일 훅):**
```tsx
// ❌ UI + Business 로직이 섞여있어 Framer에서 사용 불가
const { open, propertyName, handleSubmit } = usePropertyAddPopover(blockId);
// handleSubmit 내부에 API 호출이 있어 디자이너가 테스트 불가
```

**After (분리된 훅):**
```tsx
// ✅ 디자이너: UI 로직만 사용
const uiState = usePropertyAddPopoverUI();
const mockBusiness = useMockPropertyAddBusiness();

// ✅ 엔지니어: 비즈니스 로직 배선
const business = usePropertyAddBusiness(blockId);
<CustomPropertyAddPopover blockId={blockId} businessLogic={business} />
```

**장점:**
- ✅ **로우코드 툴 호환**: 디자이너가 Storybook에서 독립적으로 작업
- ✅ **테스트 용이**: Presentational 컴포넌트 독립 테스트
- ✅ **유연성**: Mock 데이터 쉽게 교체
- ✅ **재사용성**: Presentational 컴포넌트를 다양한 Context에서 재사용
- ✅ **디버깅 쉬움**: Props로 데이터 흐름 추적 용이

### Container/Presentational 분리 전략

#### Presentational 컴포넌트 (components/)
```tsx
// workspace-member-list-table.tsx
interface WorkspaceMemberListTableProps {
  currentMembers: Member[];          // ✅ 단순 배열
  pendingInvitations: Invitation[];  // ✅ 단순 배열
  isLoading: boolean;                // ✅ 단순 boolean
}

export function WorkspaceMemberListTable({
  currentMembers,
  pendingInvitations,
  isLoading,
}: WorkspaceMemberListTableProps) {
  // Hook 사용 금지! Props만 사용
  // Context 사용 금지! Props만 사용
  
  return (
    <Table>
      {isLoading ? <LoadingSkeleton /> : <MemberRows members={currentMembers} />}
    </Table>
  );
}
```

#### Container 컴포넌트 (index.tsx)
```tsx
// members-tab/index.tsx
export function MembersTab({ workspaceId }: MembersTabProps) {
  // Hook 사용 ✅
  const business = useMembersTabBusiness(workspaceId);
  const ui = useMembersTabUI();
  
  // Props로 변환
  return (
    <MembersTabContent
      members={business.memberView?.currentMembers || []}
      isLoading={business.isLoading}
      onInviteClick={ui.handleOpenInviteDialog}
    />
  );
}
```

### 폴더 구조

```
members-tab/
├── components/                       # Presentational (Props만)
│   ├── workspace-member-list-table.tsx
│   ├── members-tab-header.tsx
│   └── members-tab-content.tsx
├── core/                             # 비즈니스 로직
│   ├── use-members-tab.ts            # Hook
│   ├── use-members-tab.ui.ts
│   ├── use-members-tab.business.ts
│   └── types.ts
└── index.tsx                         # Container (Hook → Props)
```

**규칙:**
- **Presentational**: Context 사용 금지, Hook 사용 금지, Props만
- **Container**: Hook으로 데이터 가져와서 Props로 전달
- **Core**: 비즈니스 로직, UI 로직 분리

---

## Optimistic Updates with TanStack Query

복잡한 상태 관리와 Optimistic Update를 간단하게 처리하기 위해 TanStack Query를 사용합니다.

### 개념

**Optimistic Update란?**
서버 응답을 기다리지 않고 UI를 먼저 업데이트하여 사용자 경험을 개선하는 패턴입니다.

```
1. 사용자 액션 → UI 즉시 업데이트 (Optimistic)
2. 백그라운드에서 서버 요청
3. 성공 → 그대로 유지
4. 실패 → 자동 롤백
```

### 문제점 (Before TanStack Query)

```tsx
// ❌ 복잡한 수동 Optimistic Update
export function useBlockPropertyUpdate() {
  const updateProperty = async (blockId, path, value, blockData) => {
    // 1. 원본 백업
    const originalData = blockData;
    
    // 2. Optimistic update
    const updatedData = updateNestedProperty(blockData, path, value);
    updateNode(blockId, { data: updatedData });
    
    try {
      // 3. 검증
      if (!blockData.workspaceId) {
        updateNode(blockId, { data: originalData }); // Rollback
        return;
      }
      
      // 4. Server action
      const result = await updateBlockPropertyAction(...);
      
      if (isFailure(result)) {
        updateNode(blockId, { data: originalData }); // Rollback
      }
    } catch (error) {
      updateNode(blockId, { data: originalData }); // Rollback
    }
  };
}
```

**문제점:**
- ✅ Rollback 로직이 3곳에 중복
- ✅ 로딩 상태 수동 관리
- ✅ 에러 처리 반복
- ✅ 코드 가독성 저하

### 해결 (After TanStack Query)

```tsx
// ✅ TanStack Query로 간결하게
import { useMutation } from '@tanstack/react-query';

export function useBlockPropertyUpdate() {
  const { updateNode, getNode } = useReactFlow();

  const mutation = useMutation({
    // Server action
    mutationFn: async ({ blockData, propertyPath, value }) => {
      // Validation
      if (!blockData.workspaceId || !blockData.orgId) {
        throw new Error('Missing workspaceId or orgId');
      }

      const request = {
        blockId: blockData.blockId,
        propertyPath,
        value,
        workspaceId: blockData.workspaceId,
        orgId: blockData.orgId,
      };

      const result = await updateBlockPropertyAction(request);
      if (isFailure(result)) {
        throw new Error(result.error);
      }
      return result;
    },

    // Optimistic Update
    onMutate: async ({ blockId, propertyPath, value, blockData }) => {
      // Get latest data
      const latestNode = getNode(blockId);
      const currentData = latestNode?.data || blockData;

      // Backup for rollback
      const previousData = currentData;

      // Apply optimistic update
      const updatedData = updateNestedProperty(currentData, propertyPath, value);
      updateNode(blockId, { data: updatedData });

      // Return context for rollback
      return { previousData, blockId };
    },

    // Auto rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData && context?.blockId) {
        updateNode(context.blockId, { data: context.previousData });
      }
      toast.error(error.message);
    },
  });

  return {
    updateProperty: mutation.mutateAsync,
    isUpdating: mutation.isPending, // 🎯 로딩 상태 자동 관리
  };
}
```

**장점:**
- ✅ Rollback 자동 처리 (onError)
- ✅ 로딩 상태 자동 관리 (isPending)
- ✅ 에러 처리 한 곳에 집중
- ✅ 코드 가독성 향상 (70% 감소)
- ✅ 업계 표준 패턴

### 설정

#### 1. 패키지 설치

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

#### 2. QueryClient Provider 설정

```tsx
// lib/query-client.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5분
          },
          mutations: {
            retry: false, // Optimistic update는 즉시 롤백
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

#### 3. Root Layout에 추가

```tsx
// app/provider.tsx
import { QueryProvider } from '@/lib/query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <NextThemesProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </NextThemesProvider>
    </QueryProvider>
  );
}
```

### 사용 예시

#### Before (수동 Optimistic Update)

```tsx
// ❌ 296 lines of code
export function useBlockPropertyUpdate() {
  const updateProperty = async (blockId, path, value, blockData) => {
    const originalData = blockData;
    const updatedData = updateNestedProperty(blockData, path, value);
    updateNode(blockId, { data: updatedData });

    try {
      if (!blockData.workspaceId || !blockData.orgId) {
        updateNode(blockId, { data: originalData });
        return;
      }

      const request = { ... };
      const parseResult = UpdateBlockPropertyRequestSchema.safeParse(request);
      if (!parseResult.success) {
        updateNode(blockId, { data: originalData });
        return;
      }

      const result = await updateBlockPropertyAction(parseResult.data);
      if (isFailure(result)) {
        updateNode(blockId, { data: originalData });
      }
    } catch (error) {
      updateNode(blockId, { data: originalData });
    }
  };

  // updateProperties, updatePropertyImmediate... (반복)
}
```

#### After (TanStack Query)

```tsx
// ✅ ~100 lines of code (66% 감소)
export function useBlockPropertyUpdate() {
  const { updateNode, getNode } = useReactFlow();

  const mutation = useMutation({
    mutationFn: async ({ blockData, propertyPath, value }) => {
      // Validation & Server action
      const result = await updateBlockPropertyAction(...);
      if (isFailure(result)) throw new Error(result.error);
      return result;
    },
    onMutate: async ({ blockId, propertyPath, value, blockData }) => {
      const previousData = blockData;
      const updatedData = updateNestedProperty(blockData, propertyPath, value);
      updateNode(blockId, { data: updatedData });
      return { previousData, blockId };
    },
    onError: (error, variables, context) => {
      updateNode(context.blockId, { data: context.previousData });
      toast.error(error.message);
    },
  });

  return {
    updateProperty: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
```

### 주요 API

#### useMutation

```tsx
const mutation = useMutation({
  mutationFn: async (variables) => {
    // Server action
    return await serverAction(variables);
  },
  
  onMutate: async (variables) => {
    // Optimistic update
    // Return context for rollback
    return { previousData: ... };
  },
  
  onError: (error, variables, context) => {
    // Auto rollback
  },
  
  onSuccess: (data, variables, context) => {
    // Success handling
  },
});

// Usage
mutation.mutate(variables);           // Fire and forget
await mutation.mutateAsync(variables); // Wait for result

// State
mutation.isPending  // Loading state
mutation.isError    // Error state
mutation.isSuccess  // Success state
mutation.data       // Result data
mutation.error      // Error object
```

### 고급 패턴

#### 1. Multiple Mutations

```tsx
export function useBlockPropertyUpdate() {
  const propertyMutation = useMutation({ ... });
  const propertiesMutation = useMutation({ ... });

  return {
    updateProperty: propertyMutation.mutateAsync,
    updateProperties: propertiesMutation.mutateAsync,
    isUpdating: propertyMutation.isPending || propertiesMutation.isPending,
  };
}
```

#### 2. Query Invalidation (Cache Refresh)

```tsx
import { useQueryClient } from '@tanstack/react-query';

const mutation = useMutation({
  mutationFn: updateBlock,
  onSuccess: () => {
    // Refetch related queries
    queryClient.invalidateQueries({ queryKey: ['blocks'] });
  },
});
```

#### 3. Optimistic Update with useQuery

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['block', blockId],
  queryFn: () => fetchBlock(blockId),
});

const mutation = useMutation({
  mutationFn: updateBlock,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['block', blockId] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['block', blockId]);
    
    // Optimistically update
    queryClient.setQueryData(['block', blockId], newData);
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback
    queryClient.setQueryData(['block', blockId], context.previous);
  },
});
```

### 언제 사용하는가?

#### ✅ TanStack Query 사용 (권장)
- Optimistic update가 필요한 경우
- 서버 상태 관리가 복잡한 경우
- 캐싱, 재시도, 로딩 상태가 필요한 경우
- 여러 컴포넌트에서 같은 데이터를 사용하는 경우

#### ❌ TanStack Query 불필요
- 로컬 UI 상태만 관리하는 경우
- 서버 통신이 없는 경우
- 단순한 폼 상태 (React Hook Form 사용)

### 참고 자료

- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [useMutation API](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)

---

## 실전 예제

이 가이드라인의 핵심 개념을 실제로 적용한 예시를 확인하세요:

### 1. Compound Component Pattern
→ [컴포넌트 패턴](#컴포넌트-패턴) 섹션 참조

### 2. 로직 분리 (UI + Business)
→ [노코드 워크플로우를 위한 로직 분리](#노코드-워크플로우를-위한-로직-분리) 섹션 참조

### 3. Optimistic Updates
→ [Optimistic Updates with TanStack Query](#optimistic-updates-with-tanstack-query) 섹션 참조

**실제 리팩토링 케이스:**
- `CustomPropertyAddPopover`: UI/Business 로직 분리 패턴 적용
- `useBlockPropertyUpdate`: TanStack Query로 Optimistic Update 구현 (코드 66% 감소)

---

## 안티패턴

### 1. Render Props 과용

```tsx
// ❌ 노코드 툴에서 사용 불가
<PropertyAddPopover
  renderInput={(props) => <Input {...props} />}
  renderGrid={(props) => <Grid {...props} />}
/>
```

### 2. 함수 Props 남발

```tsx
// ❌ 노코드 툴에서 함수를 전달할 수 없음
<PropertyNameInput 
  onChange={handleChange}
  onBlur={handleBlur}
  onFocus={handleFocus}
/>
```

### 3. 복잡한 객체 Props

```tsx
// ❌ 노코드 툴에서 객체를 구성하기 어려움
<PropertyTypeGrid 
  config={{
    columns: 2,
    gap: 8,
    options: [...],
    handlers: {...}
  }}
/>
```

### 4. Context 남용

```tsx
// ❌ 전역 Context로 만들면 안 됨
// 폴더 로컬 Context로 제한
export const GlobalPropertyAddPopoverContext = ...
```

---

## 체크리스트

새 컴포넌트를 만들 때 다음을 확인하세요:

### 기본 구조
- [ ] 폴더 구조가 가이드라인을 따르는가?
- [ ] index.tsx가 Container 역할 (Hook → Props)을 하는가?
- [ ] Context가 전역/도메인 레벨에만 사용되는가?
- [ ] 로컬 레벨에서는 Props로 전달하는가?
- [ ] 타입이 명확히 정의되어 있는가?

### Container/Presentational 분리
- [ ] Presentational 컴포넌트가 Props만 받는가?
- [ ] Presentational 컴포넌트에 Hook/Context가 없는가?
- [ ] Container가 Hook으로 데이터를 가져오는가?
- [ ] Container가 Props로 Presentational에 전달하는가?
- [ ] Props drilling이 1-2단계 이내인가?

### 로우코드 워크플로우 (Storybook)
- [ ] Presentational 컴포넌트가 Storybook에서 테스트 가능한가?
- [ ] Mock 데이터로 다양한 UI 상태를 테스트할 수 있는가?
- [ ] Props만으로 컴포넌트를 제어할 수 있는가?
- [ ] 디자이너가 Context/Hook 없이 테스트할 수 있는가?
- [ ] UI 로직이 `.ui.ts` 파일로 분리되어 있는가?
- [ ] 비즈니스 로직이 `.business.ts` 파일로 분리되어 있는가?

### Optimistic Updates
- [ ] 복잡한 상태 업데이트에 TanStack Query를 사용하는가?
- [ ] useMutation으로 Optimistic update를 구현했는가?
- [ ] onMutate에서 backup 데이터를 반환하는가?
- [ ] onError에서 자동 rollback을 처리하는가?
- [ ] isPending으로 로딩 상태를 관리하는가?

---

## 참고 자료

### 영향을 받은 라이브러리

- **Radix UI**: Compound Component 패턴의 모범 사례
- **Headless UI**: 로직과 표현 분리
- **Chakra UI**: Context 기반 테마 시스템
- **React Hook Form**: Context를 활용한 폼 상태 관리
- **TanStack Query**: Optimistic Update와 서버 상태 관리

### 추가 읽을거리

- [Compound Components Pattern](https://kentcdodds.com/blog/compound-components-with-react-hooks)
- [Container/Presentational Pattern](https://www.patterns.dev/react/presentational-container-pattern)
- [Storybook 공식 문서](https://storybook.js.org/docs)
- [Radix UI Architecture](https://www.radix-ui.com/docs/primitives/overview/introduction)
- [TanStack Query 공식 문서](https://tanstack.com/query/latest)
- [Optimistic Updates 가이드](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-12-14 | 4.0.0 | **메이저 업데이트**: 노코드(Framer) → 로우코드(Storybook) 스타일로 전환<br>- Container/Presentational 패턴 도입<br>- 국소적 Context 사용 최소화 (Props 전달 권장)<br>- Storybook 기반 워크플로우로 변경<br>- Context 사용 레벨 명확화 (전역/도메인/로컬) |
| 2025-11-27 | 3.1.0 | 폴더 구조 섹션 업데이트: components/ + core/ 계층 구조 패턴 및 프랙탈 아키텍처 추가 |
| 2025-11-10 | 3.0.0 | TanStack Query를 활용한 Optimistic Updates 패턴 추가 |
| 2025-11-10 | 2.0.0 | 노코드 워크플로우를 위한 로직 분리 패턴 추가 (UI/Business 3-Layer 아키텍처) |
| 2025-11-08 | 1.0.0 | 초안 작성 (PropertyAddPopover 리팩토링 기반) |


