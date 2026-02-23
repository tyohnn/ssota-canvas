import React from 'react';

// import { GenerateImageAction } from './components/generate-image-action/index';
// import { ImageKeywordSearchAction } from './components/image-search-action/keyword-search-action';
// import { ImageSemanticSearchAction } from './components/image-search-action/semantic-search-action';

// Lazy Loading을 위한 Wrapper 컴포넌트
// 이 컴포넌트 전체가 lazy()로 로드되므로 내부 import도 함께 lazy됨
export function ImageActionItems({ blockId }: { blockId: string }) {
  return (
    <>
      {/* <ImageKeywordSearchAction blockIds={[blockId]} /> */}
      {/* <ImageSemanticSearchAction blockIds={[blockId]} /> */}
      {/* <GenerateImageAction blockIds={[blockId]} /> */}
    </>
  );
}
