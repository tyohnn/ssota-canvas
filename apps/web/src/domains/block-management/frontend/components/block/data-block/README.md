# DataBlock Component

여러 View Mode를 지원하는 블록의 기본 컴포넌트입니다.

## View Modes

- **Note View**: 블록의 `content`를 마크다운으로 표시
- **Original View**: 블록 고유의 UI (기존 UI)
- **Card View**: 블록의 properties를 카드 형태로 표시

## 사용법

```tsx
<DataBlock
  data={blockData}
  selected={selected}
  viewMode={viewMode}
  onViewModeChange={handleViewModeChange}
  renderOriginalView={() => <YourOriginalBlockUI />}
  renderCardView={() => <YourCardView />} // 선택적
/>
```

## 구조

```
data-block/
├── index.tsx                  # 메인 컴포넌트
├── components/
│   ├── block-header.tsx       # 제목 표시 (좌측 상단)
│   ├── block-actions.tsx      # 액션 버튼 (우측 상단)
│   ├── view-mode-switcher.tsx # 보기 방식 변경 팝오버
│   ├── note-view.tsx          # 노트 보기
│   ├── original-view.tsx      # 오리지널 보기
│   └── card-view.tsx          # 카드 보기
└── core/
    ├── use-data-block.ts      # 통합 훅
    └── types.ts               # 타입 정의
```
