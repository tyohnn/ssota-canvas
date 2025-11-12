# Property Detail Popover

커스텀 속성의 상세 정보를 편집하는 팝오버 컴포넌트입니다.

## 구조

프랙탈 구조로 설계되어 있습니다:

```
property-detail-popover/
├── components/          # UI 컴포넌트들
│   ├── wrapper.tsx                    # 팝오버 콘텐츠 래퍼
│   ├── name-label.tsx                 # 이름 라벨 표시
│   ├── name-input.tsx                 # 이름 입력 필드
│   ├── action-buttons.tsx             # 액션 버튼 (복제, 삭제)
│   └── option-sections/               # 타입별 옵션 관리 섹션 컴포넌트
│       ├── components/                # UI 컴포넌트들
│       │   ├── option-item.tsx         # 개별 옵션 아이템
│       │   ├── option-edit-popover.tsx # 옵션 편집 팝오버
│       │   ├── select-like-option/    # SELECT, MULTISELECT 타입 옵션
│       │   └── status-option/         # STATUS 타입 옵션
│       ├── core/                      # 옵션 관리 공통 로직
│       └── index.tsx                   # 메인 컴포넌트
├── core/                # 비즈니스 로직
│   ├── context.tsx      # Context 정의
│   ├── provider.tsx     # Provider 컴포넌트
│   ├── types.ts         # 타입 정의
│   └── use-detail-popover.ts  # 메인 훅
└── index.tsx            # UI와 비즈니스 로직 연결
```

## 역할

- **속성 이름 편집**: 속성의 이름을 변경할 수 있도록 함 (자동 저장)
- **아이콘 편집**: 속성의 아이콘을 변경할 수 있도록 함 (자동 저장)
- **타입별 옵션 관리**: 
  - SELECT/MULTISELECT: 옵션 목록 관리
  - STATUS: 상태 그룹 관리
- **속성 복제**: 현재 속성을 복제하여 새 속성 생성
- **속성 삭제**: 현재 속성을 삭제

## 비즈니스 로직

`use-detail-popover.ts`에서 수행하는 주요 로직:

1. **이름 관리**: 
   - 로컬 상태로 이름 관리
   - 외부 변경 시 자동 동기화
   - 500ms 디바운스 후 자동 저장

2. **아이콘 관리**:
   - 로컬 상태로 아이콘 관리
   - 외부 변경 시 자동 동기화
   - 500ms 디바운스 후 자동 저장

3. **복제 처리**: `duplicateField`를 통해 속성 복제 후 팝오버 닫기

4. **삭제 처리**: `deleteField`를 통해 속성 삭제 후 팝오버 닫기

5. **키보드 처리**: ESC 키로 팝오버 닫기

## 사용 예시

```tsx
<DetailPopover blockId={blockId} field={property} />
```

## 특징

- 이름과 아이콘 변경 시 자동 저장 (디바운스 적용)
- 속성 타입에 따라 다른 편집 콘텐츠 표시
- 복제/삭제 액션 제공
- 키보드 단축키 지원 (ESC)

## 하위 컴포넌트

- **OptionSections**: 필드 타입에 따라 적절한 옵션 관리 섹션을 렌더링 (type만 props로 받음)
- **SelectLikeOption**: SELECT/MULTISELECT 타입의 옵션 관리 UI
- **StatusOption**: STATUS 타입의 상태 그룹 관리 UI
- **Core**: 옵션 관리에 공통으로 사용되는 컴포넌트 및 로직

