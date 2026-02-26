# React-PDF 학습 가이드

> PDF 블록에서 사용 중인 `react-pdf` (wojtekmaj/react-pdf) 라이브러리 이해도를 높이기 위한 리서치 및 학습 자료

## 1. 기본 개요

### 1.1 라이브러리 식별 (주의: 이름 혼동)

| 패키지 | 용도 | 우리 프로젝트 |
|--------|------|---------------|
| **react-pdf** (wojtekmaj) | PDF **표시/뷰잉** (PDF.js 기반) | ✅ 사용 중 |
| **@react-pdf/renderer** | PDF **생성** (React 컴포넌트 → PDF 출력) | ❌ 미사용 |
| **@react-pdf-viewer/core** | PDF 뷰잉 (플러그인 아키텍처) | 설계 문서 Phase 7에서 전환 검토 |

**핵심**: `react-pdf` = 기존 PDF를 화면에 보여주는 라이브러리. 이미지처럼 쉽게 사용 가능.

- GitHub: https://github.com/wojtekmaj/react-pdf
- Online Demo: https://projects.wojtekmaj.pl/react-pdf/

### 1.2 현재 프로젝트 사용 방식 요약

```
pdf-viewer.tsx
├── Document (file={url})
│   ├── onLoadSuccess → numPages 저장
│   ├── loading / error UI
│   └── Page (단일 페이지)
│       ├── pageNumber={currentPage}
│       ├── width={basePageWidth}
│       ├── scale={zoom}
│       ├── devicePixelRatio={5}
│       ├── renderTextLayer={true}
│       ├── renderAnnotationLayer={true}
│       └── loading={<Skeleton />}
└── PdfToolbar (페이지 네비게이션, 확대/축소, 다운로드)
```

---

## 2. 핵심 컴포넌트 & API

### 2.1 Document

- **역할**: PDF 로드 및 **컨텍스트 제공**. Document만으로는 아무것도 렌더링되지 않음.
- **필수**: 자식에 `<Page />` 등을 넣어야 실제 화면에 표시됨.

| 주요 Props | 설명 |
|------------|------|
| `file` | URL, base64, Uint8Array, File 등 |
| `onLoadSuccess` | `{ numPages }` 콜백 |
| `onLoadError` | 에러 콜백 |
| `loading` | 로딩 중 표시할 React 노드 |
| `error` | 에러 시 표시할 React 노드 |
| `options` | pdf.js `getDocument()` 옵션 (cMapUrl, wasmUrl 등) |

**주의사항 (FAQ)**:
- `file` prop에 `{ url: '...' }`처럼 객체를 넘기면, 매 렌더마다 새 객체로 인식되어 **불필요한 재로드** 발생.
- 해결: `useMemo(() => ({ url }), [url])` 등으로 **메모이제이션** 필수.

### 2.2 Page

- **역할**: Document 컨텍스트 안에서 특정 페이지 렌더링.
- **크기 지정**: `scale`, `width`, `height` 중 하나 이상 필요. **CSS로만 리사이즈하면 안 됨** → Text/Annotation 레이어와 캔버스 레이어가 어긋남.
- **권장**: `ResizeObserver` 또는 `window.resize`로 반응형 처리 시, `scale`/`width`/`height`를 명시적으로 갱신.

| 주요 Props | 설명 |
|------------|------|
| `pageNumber` | 1-based 페이지 번호 |
| `width` / `height` / `scale` | 크기 조절 (하나 이상 지정) |
| `devicePixelRatio` | 렌더 해상도 (기본: `window.devicePixelRatio`). 과도하면 느려짐. |
| `renderTextLayer` | 텍스트 선택 레이어 (기본 true) |
| `renderAnnotationLayer` | 링크·주석 레이어 (기본 true) |
| `customTextRenderer` | 텍스트 커스텀 렌더링 (검색 하이라이트 등) |
| `loading` | 페이지 로딩 중 표시할 노드 |

### 2.3 PDF.js Worker 설정

```ts
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
```

**중요**:
- Worker 설정은 **Document/Page를 사용하는 동일 모듈**에서 해야 함.
- 별도 `main.tsx` 등에서만 설정하고 import 순서에 따라 덮어쓰일 수 있음.
- Next.js: 해당 모듈은 `'use client'` 및 동적 import로 SSR 제외 필요.

---

## 3. 스타일 시트

텍스트 선택·주석(링크) 기능을 쓰려면 CSS import 필요:

```ts
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
```

---

## 4. 모범 사례 & 자주 하는 실수

### 4.1 FAQ 기반 주의사항

| 문제 | 원인 | 해결 |
|------|------|------|
| 외부 URL 로드 실패 | CORS / Same-origin Policy | 프록시 또는 대상 서버의 Access-Control-Allow-Origin 설정 |
| Document만 렌더되고 페이지 안 나옴 | Document는 컨텍스트만 제공 | `<Page pageNumber={1} />` 등 자식 필수 |
| 매 렌더마다 PDF 재로드 | `file` 객체가 매번 새로 생성 | `useMemo`로 `file` 메모이제이션 |
| 텍스트 선택 위치 어긋남 | CSS로만 Page 리사이즈 | `scale`/`width`/`height` prop으로 명시적 크기 지정 |

### 4.2 성능 최적화

1. **Partial Content**: 서버가 Range 요청을 지원하면, 첫 페이지만 필요한 경우 전체 PDF를 내려받지 않음. 서버 설정 확인.
2. **필요한 페이지만 렌더**: 여러 페이지를 한 번에 렌더하지 말고, 단일 페이지 또는 가상화(virtualization) 사용.
3. **devicePixelRatio 제한**: 기본값이 `window.devicePixelRatio`라 모바일에서 3x 등 고해상도가 됨. `Math.min(2, window.devicePixelRatio)`로 상한을 두면 성능 향상 가능. (현재 프로젝트는 `5`로 고정해 고해상도 우선)

### 4.3 번들 사이즈

- react-pdf는 PDF.js를 포함해 **압축 전 약 2MB** 수준.
- 가능하면 PDF 관련 컴포넌트는 **동적 import**로 코드 스플리팅 권장. (현재 프로젝트는 `'use client'`로 클라이언트 전용)

---

## 5. 추가 기능 (Recipes)

Wiki Recipes에서 제공하는 패턴:

| 기능 | 구성 |
|------|------|
| **단일 페이지** | `<Document><Page pageNumber={1} /></Document>` |
| **전체 페이지** | `onLoadSuccess` → `numPages` → `Array.from(new Array(numPages), (_, i) => <Page pageNumber={i+1} />)` (주의: 성능 이슈) |
| **페이지 네비게이션** | `currentPage` state + 이전/다음 버튼 |
| **텍스트 하이라이트** | `customTextRenderer`로 `<mark>` 래핑 |
| **목차(Outline)** | `<Outline onItemClick={...} />` |
| **외부 링크 처리** | `Document`의 `onItemClick` |

---

## 6. 비라틴 문자(cMap), JPEG2000, Standard Font

특수 PDF에서 경고가 나오면:

- **cMap**: 한글/중국어 등 – `options.cMapUrl`, `cMapPacked` + cmaps 폴더 복사
- **JPEG 2000**: `options.wasmUrl` + wasm 폴더 복사
- **Standard Font**: `options.standardFontDataUrl` + standard_fonts 폴더 복사

자세한 설정은 [GitHub README](https://github.com/wojtekmaj/react-pdf)의 해당 섹션 참조.

---

## 7. react-pdf vs @react-pdf-viewer

설계 문서(pdf_block_app-space_design.plan.md) Phase 7에서 `@react-pdf-viewer` 전환을 검토 중.

| 항목 | react-pdf | @react-pdf-viewer/core |
|------|-----------|------------------------|
| 다운로드/인기도 | 높음 | 중간 |
| API | Document + Page 기반, 단순 | 플러그인 아키텍처 |
| 커스터마이징 | 기본 UI 직접 구현 | 플러그인으로 주석, 북마크, 툴바 등 제공 |
| 하이라이트/인용 | customTextRenderer 등 직접 구현 | @react-pdf-viewer/highlight 플러그인 |
| 학습 곡선 | 낮음 | 높음 |
| 번들 크기 | ~552 kB | ~345 kB |

**선택 기준**:
- **react-pdf**: 빠른 통합, 단순한 요구사항, 직접 UI 제어
- **@react-pdf-viewer**: 인용 점프/하이라이트, 풍부한 툴바, 엔터프라이즈급 기능 필요 시

---

## 8. 학습 체크리스트

- [ ] Document는 컨텍스트만 제공한다는 점 이해
- [ ] `file` prop 메모이제이션의 중요성 이해
- [ ] Page 크기는 CSS가 아닌 `scale`/`width`/`height`로 지정
- [ ] Worker 설정 위치(같은 모듈 내) 이해
- [ ] `customTextRenderer`로 검색/하이라이트 구현 방법
- [ ] devicePixelRatio와 성능 트레이드오프 이해
- [ ] CORS/외부 PDF 로드 이슈 대응 방법

---

## 9. 참고 링크

- [wojtekmaj/react-pdf GitHub](https://github.com/wojtekmaj/react-pdf)
- [Recipes (Wiki)](https://github.com/wojtekmaj/react-pdf/wiki/Recipes)
- [FAQ (Wiki)](https://github.com/wojtekmaj/react-pdf/wiki/Frequently-Asked-Questions)
- [Online Demo](https://projects.wojtekmaj.pl/react-pdf/)
- [PDF.js FAQ (브라우저 지원)](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions#faq-support)
