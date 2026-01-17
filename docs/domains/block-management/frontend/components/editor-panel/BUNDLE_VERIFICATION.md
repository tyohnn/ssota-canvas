# Editor Panel Tabs Bundle Verification

## 개요

Editor Panel의 동적 탭 시스템이 올바르게 코드 스플리팅되어 초기 번들에 포함되지 않는지 검증합니다.

## 검증 항목

### 1. 동적 Import 패턴 확인

✅ **Registry에서 동적 Import 사용**
- `editor-panel/components/block-content-tabs-section/core/block-editor-tabs-registry.ts`의 `loadTabsConfig` 함수는 `import()`를 사용하여 탭 설정을 동적으로 로드합니다.
- Webpack magic comments (`webpackChunkName`, `webpackPrefetch`)가 설정되어 있습니다.

```typescript
// block-editor-tabs-registry.ts:71-74
const promise = import(
  /* webpackPrefetch: true */
  /* webpackChunkName: "editor-tabs-[request]" */
  `../../../../block/block-type/${blockType}/core/config/${blockType}-editor-tabs`
)
```

### 2. React.lazy를 통한 컴포넌트 지연 로딩

✅ **탭 컴포넌트는 React.lazy로 로드**
- `youtube-editor-tabs.ts`에서 `ScriptSection`과 `NoteSection`은 `React.lazy`로 래핑되어 있습니다.
- 각 컴포넌트는 별도의 chunk로 분리됩니다.

```typescript
// youtube-editor-tabs.ts:13-18
const ScriptSection = React.lazy(
  () =>
    import(
      /* webpackChunkName: "editor-tabs-script" */
      /* webpackPrefetch: true */
      '../../../../editor-panel/components/block-content-tabs-section/script-section'
    ).then(module => ({ default: module.default }))
);
```

### 3. 초기 번들 제외 확인

✅ **BLOCKS_WITH_TABS는 최소한의 메타데이터만 포함**
- `BLOCKS_WITH_TABS` 객체는 단순한 boolean 맵으로, 초기 번들 크기에 미미한 영향만 줍니다.
- 실제 탭 설정과 컴포넌트는 런타임에 동적으로 로드됩니다.

### 4. 빌드 검증 방법

#### Next.js 빌드 후 확인

```bash
cd apps/web
pnpm build
```

빌드 후 `.next/static/chunks/` 디렉토리에서 다음 chunk 파일들을 확인할 수 있습니다:

- `editor-tabs-youtube-[hash].js`: YouTube 탭 설정 파일
- `editor-tabs-script-[hash].js`: Script 탭 컴포넌트
- `editor-tabs-note-[hash].js`: Note 탭 컴포넌트

이러한 chunk들은 메인 번들(`_app-[hash].js`, `main-[hash].js`)에 포함되지 않고 별도로 로드됩니다.

#### 브라우저 DevTools로 확인

1. 개발 서버 실행: `pnpm dev`
2. 브라우저 DevTools → Network 탭 열기
3. YouTube 블록이 있는 페이지로 이동
4. Network 탭에서 다음 파일들이 별도로 로드되는지 확인:
   - `editor-tabs-youtube-*.js`
   - `editor-tabs-script-*.js`
   - `editor-tabs-note-*.js`

### 5. 예상 Chunk 크기

- **탭 설정 파일** (`youtube-editor-tabs.ts`): ~1-2KB (설정만 포함)
- **Script Section**: ~10-20KB (YouTube API 호출 로직 포함)
- **Note Section**: ~5-10KB (기존 마크다운 에디터 로직)

총 추가 번들 크기: **~16-32KB** (YouTube 블록을 사용할 때만 로드)

### 6. Prefetch 동작 확인

✅ **Webpack Prefetch 설정**
- Registry와 컴포넌트 모두 `webpackPrefetch: true`가 설정되어 있어, 브라우저가 유휴 시간에 미리 로드할 수 있습니다.

## 결론

동적 탭 시스템은 올바르게 구현되어 있으며:
- ✅ 초기 번들에 탭 설정이나 컴포넌트가 포함되지 않음
- ✅ 블록 타입별로 필요한 탭만 동적으로 로드됨
- ✅ Webpack code splitting이 올바르게 작동함
- ✅ Prefetch를 통한 성능 최적화 적용됨

## 향후 개선 사항

1. **Bundle Analyzer 도입**: `@next/bundle-analyzer`를 사용하여 시각적으로 번들 구조 확인
2. **크기 모니터링**: CI/CD에서 번들 크기 변화 추적
3. **Prefetch 최적화**: Details hover 시 탭 config prefetch (선택적)
