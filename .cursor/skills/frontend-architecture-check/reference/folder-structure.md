# Folder Structure

컴포넌트와 도메인 훅의 폴더 구조 규칙.

---

## 컴포넌트 (도메인 내)

```
{component-name}/
├── index.tsx              # Container: 훅 호출 → View에 props 전달
├── components/            # Presentational (View)
│   ├── {view-a}.tsx
│   ├── {view-b}.tsx
│   └── {sub-component}/   # 필요 시 동일 구조 반복 (fractal)
│       ├── index.tsx
│       ├── components/
│       └── core/
├── core/                  # 로직 (플랫)
│   ├── use-{name}.ui.ts
│   ├── use-{name}.business.ts
│   ├── use-{name}.ts      # 오케스트레이션 훅 (컴포넌트명 훅)
│   ├── types.ts
│   └── (context.tsx, provider.tsx 선택)
└── README.md              # 선택
```

- **index.tsx**: Container만; 한 개의 메인 훅 사용 후 결과를 View에 props로 전달.
- **components/**: View만; props만 받음.
- **core/**: 해당 컴포넌트 전용 훅·타입·Context.

---

## 도메인 훅

```
domains/{domain}/frontend/
├── hooks/
│   ├── use-{server-action-1}.ts   # 한 서버 액션당 한 훅 (TanStack Query)
│   ├── use-{server-action-2}.ts
│   └── ...
├── components/
│   └── ...
└── ...
```

- 도메인 훅은 `domains/{domain}/frontend/hooks/` 에만 두고, 서버 액션 단위로 파일 분리.

---

## 규칙 요약

- [ ] 컴포넌트마다 `index.tsx`(Container) + `components/`(View) + `core/`(훅) 구분 유지.
- [ ] 도메인 훅은 `domains/{domain}/frontend/hooks/` 에만 위치.
- [ ] 서브 컴포넌트가 복잡하면 같은 구조를 반복 (fractal); 서브가 2개 이하·단순하면 flat 구조도 허용.
