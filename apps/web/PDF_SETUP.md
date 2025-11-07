# PDF 블록 설정 가이드

## 개요

PDF 블록은 react-pdf와 PDF.js를 사용하여 브라우저에서 PDF 문서를 렌더링합니다.

## 설정된 내용

### 1. pnpm 설정 (.npmrc)

pnpm을 사용하는 경우 pdfjs-dist를 hoist해야 합니다:

```
public-hoist-pattern[]=pdfjs-dist
```

이 설정이 있어야 `import.meta.url`을 사용한 워커 파일 로드가 정상 작동합니다.

### 2. Next.js Turbopack 설정 (next.config.mjs)

```javascript
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  experimental: {
    turbo: {
      resolveAlias: {
        // PDF.js가 필요로 하지 않는 Node.js 모듈 비활성화
        canvas: false,
        encoding: false,
      },
    },
  },
};
```

Turbopack에서 PDF.js와 충돌할 수 있는 모듈을 비활성화합니다.

### 3. 동적 임포트 (canvas-react-flow-wrapper.tsx)

```typescript
const PdfBlock = dynamic(
  () =>
    import('@/domains/block-management/frontend/components/block/pdf/pdf-block').then(
      mod => ({ default: mod.PdfBlock })
    ),
  { ssr: false }
);
```

PDF 블록을 클라이언트 사이드에서만 로드하여 SSR 오류를 방지합니다.

**중요**: index.ts를 거치지 않고 직접 pdf-block.tsx를 import해야 합니다. 
index.ts에서 `export * from './pdf/pdf-block'`를 주석 처리하여 SSR 시 로드되지 않도록 합니다.

### 4. 워커 소스 설정 (pdf-block.tsx) - 공식 권장 방법

```typescript
React.useEffect(() => {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}, []);
```

react-pdf 공식 문서에서 권장하는 방법을 사용합니다. 이 방법은:
- 버전이 자동으로 맞춰짐 (API와 워커 버전 불일치 방지)
- 수동 복사 스크립트가 필요 없음
- 간단하고 유지보수하기 쉬움

## 문제 해결

### API 버전과 워커 버전 불일치 오류

**문제**: `The API version "X.X.X" does not match the Worker version "Y.Y.Y"`

**원인**: package.json에 `pdfjs-dist`를 명시적으로 설치하면 `react-pdf`가 사용하는 버전과 충돌

**해결**: 
1. **pdfjs-dist를 package.json에서 제거** (react-pdf가 자체 버전 사용)
2. 공식 권장 방법 사용 (`new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`)
3. `.npmrc`에 `public-hoist-pattern[]=pdfjs-dist` 설정 (pnpm 사용 시)

### DOMMatrix is not defined 오류

**문제**: SSR 환경에서 브라우저 전용 API 접근 시도

**해결**: 
1. PDF 블록을 동적 임포트로 클라이언트 전용 렌더링 (`ssr: false`)
2. **index.ts에서 PdfBlock export를 주석 처리** (직접 import만 허용)
3. Turbopack에서 canvas, encoding 모듈 비활성화

### pnpm에서 워커 로드 실패

**문제**: `import.meta.url`을 사용한 워커 로드 실패

**해결**: `.npmrc`에 `public-hoist-pattern[]=pdfjs-dist` 추가

## 개발 가이드

### 의존성 업데이트 시

react-pdf와 pdfjs-dist를 업데이트할 때:

```bash
pnpm update react-pdf pdfjs-dist
```

공식 권장 방법을 사용하므로 버전이 자동으로 맞춰지고 추가 작업이 필요 없습니다.

### 새 프로젝트 설정 시

1. `.npmrc`에 `public-hoist-pattern[]=pdfjs-dist` 추가
2. PDF 블록 컴포넌트에서 워커 설정:
   ```typescript
   pdfjs.GlobalWorkerOptions.workerSrc = new URL(
     'pdfjs-dist/build/pdf.worker.min.mjs',
     import.meta.url
   ).toString();
   ```
3. Next.js에서 동적 임포트 사용 (`ssr: false`)

## 배포 시 주의사항

1. `.npmrc` 파일이 git에 포함되어야 합니다
2. 워커 파일은 번들에 자동으로 포함되므로 추가 작업 불필요
3. 빌드 시 webpack이 자동으로 워커 파일을 처리합니다

## 참고 자료

- [react-pdf GitHub](https://github.com/wojtekmaj/react-pdf)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Next.js Dynamic Imports](https://nextjs.org/docs/advanced-features/dynamic-import)

