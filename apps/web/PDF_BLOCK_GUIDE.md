# PDF 블록 구현 가이드 (Next.js 15 + Turbopack)

## 📋 체크리스트

### 1. 의존성 설치
```bash
# react-pdf만 설치 (pdfjs-dist는 자동으로 관리됨)
pnpm add react-pdf
```

**❌ 하지 말 것**: `pdfjs-dist`를 직접 설치하지 않기 (버전 충돌 발생)

### 2. pnpm 설정 (.npmrc)
```
public-hoist-pattern[]=pdfjs-dist
```

### 3. Next.js Turbopack 설정 (next.config.mjs)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: false,
        encoding: false,
      },
    },
  },
};

export default nextConfig;
```

### 4. PDF 블록 컴포넌트 (pdf-block.tsx)

#### 워커 설정 (컴포넌트 상단)
```typescript
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

export const PdfBlock = memo(function PdfBlock({ ... }) {
  // PDF.js 워커 설정 (공식 권장 방법)
  React.useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }, []);
  
  // ... 나머지 컴포넌트 코드
});
```

### 5. 동적 Import로 SSR 방지

#### canvas-react-flow-wrapper.tsx
```typescript
import dynamic from 'next/dynamic';

// PDF Block - SSR 비활성화
const PdfBlock = dynamic(
  () =>
    import('@/domains/block-management/frontend/components/block/pdf/pdf-block').then(
      mod => ({ default: mod.PdfBlock })
    ),
  { ssr: false }
);
```

#### block/index.ts
```typescript
// PDF Block - SSR 방지를 위해 export 주석 처리
// export * from './pdf/pdf-block';
```

## 🔧 문제 해결

### 문제 1: API 버전 불일치
```
The API version "5.4.296" does not match the Worker version "5.4.394"
```

**원인**: `pdfjs-dist`를 직접 설치하여 버전 충돌

**해결**:
```bash
pnpm remove pdfjs-dist  # 제거
pnpm install            # 재설치 (react-pdf가 자동 관리)
```

### 문제 2: DOMMatrix is not defined
```
ReferenceError: DOMMatrix is not defined
```

**원인**: PDF 블록이 서버 사이드에서 로드됨

**해결**:
1. 동적 import 사용 (`ssr: false`)
2. `index.ts`에서 export 주석 처리
3. 직접 파일 경로로 import

### 문제 3: Turbopack 경고
```
⚠ Webpack is configured while Turbopack is not
```

**원인**: webpack 설정 사용

**해결**: `experimental.turbo` 설정으로 변경

## 🎯 완전한 설정 예제

### 1. 프로젝트 루트 .npmrc
```
public-hoist-pattern[]=pdfjs-dist
```

### 2. apps/web/next.config.mjs
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@workspace/ui'],
  experimental: {
    turbo: {
      resolveAlias: {
        canvas: false,
        encoding: false,
      },
    },
  },
};

export default nextConfig;
```

### 3. apps/web/package.json
```json
{
  "dependencies": {
    "react-pdf": "^10.2.0"
    // pdfjs-dist는 포함하지 않음
  }
}
```

## 📝 중요 포인트

1. **pdfjs-dist를 직접 설치하지 마세요**
   - react-pdf가 자동으로 올바른 버전을 관리합니다

2. **워커 설정은 컴포넌트 내부에서**
   - `useEffect`로 클라이언트 사이드에서만 실행

3. **SSR 완전히 차단**
   - 동적 import + index.ts export 주석

4. **Turbopack 사용 시**
   - webpack 설정 대신 `experimental.turbo` 사용

## 🚀 설치 순서

```bash
# 1. 기존 node_modules 정리
cd /Users/titanism/projects/ssota
rm -rf node_modules apps/web/node_modules
rm -rf .pnpm-store

# 2. 의존성 재설치
pnpm install

# 3. 개발 서버 시작
cd apps/web
pnpm dev
```

## ✅ 성공 확인

다음 조건이 모두 만족되면 성공:
- [ ] 버전 불일치 오류 없음
- [ ] DOMMatrix 오류 없음
- [ ] Turbopack 경고 없음
- [ ] PDF가 정상적으로 렌더링됨
- [ ] 페이지 수가 자동으로 표시됨

## 📚 참고 자료

- [react-pdf 공식 문서](https://github.com/wojtekmaj/react-pdf)
- [Next.js 15 Turbopack 문서](https://nextjs.org/docs/app/api-reference/next-config-js/turbopack)

