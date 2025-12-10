/**
 * Base Block - Entry Point
 *
 * Compound Component Pattern을 적용한 BaseBlock 컴포넌트
 *
 * 사용법:
 *
 * 1. 기본 사용 (내부 조합):
 * ```tsx
 * <BaseBlock data={blockData} selected={true}>
 *   <MyBlockContent />
 * </BaseBlock>
 * ```
 *
 * 2. 커스텀 구성 (서브 컴포넌트 직접 조합):
 * ```tsx
 * <BaseBlockProvider data={blockData}>
 *   <BaseBlock.Handles />
 *   <BaseBlock.Toolbar />
 *   <BaseBlock.Content>
 *     <MyBlockContent />
 *   </BaseBlock.Content>
 * </BaseBlockProvider>
 * ```
 *
 * 3. 노코드 툴 사용 (Mock 비즈니스 로직):
 * ```tsx
 * const mockBusiness = useMockBaseBlockBusiness();
 * <BaseBlock data={blockData} businessLogic={mockBusiness}>
 *   <MyBlockContent />
 * </BaseBlock>
 * ```
 */

export { BaseBlock } from './components/base-block-container';
export { BaseBlockProvider } from './core/use-base-block.provider';
export { useBaseBlockContext } from './core/use-base-block.context';

// Hooks (로직 분리)
export { useBaseBlockUI } from './core/use-base-block.ui';
export {
  useBaseBlockBusiness,
  useMockBaseBlockBusiness,
} from './core/use-base-block.business';
export { useBaseBlock } from './core/use-base-block';

// Types
export type {
  BaseBlockProps,
  BaseBlockContextValue,
  ResizeData,
  BlockSizeUpdateParams,
} from './core/types';

export type { BaseBlockUIState } from './core/use-base-block.ui';
export type { BaseBlockBusinessLogic } from './core/use-base-block.business';
