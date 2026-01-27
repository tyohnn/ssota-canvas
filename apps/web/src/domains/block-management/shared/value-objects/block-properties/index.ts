/**
 * Block Properties Value Objects
 *
 * 모든 블록 타입의 Properties Value Object들을 중앙에서 관리
 */

// Base class
export { BlockPropertiesVO } from './base.vo';

// Common types
export { TextAlign, FontSize, ShapeType } from './common-types';
export type { ObjectFit, ImageSource } from './common-types';

// Concrete implementations
export { TextBlockPropertiesVO, type TextBlockProperties } from './text.vo';
export { ShapeBlockPropertiesVO, type ShapeBlockProperties } from './shape.vo';
export { ImageBlockPropertiesVO, type ImageBlockProperties } from './image.vo';
export {
  MarkdownBlockPropertiesVO,
  type MarkdownBlockProperties,
} from './markdown.vo';
export {
  YoutubeBlockPropertiesVO,
  type YoutubeBlockProperties,
} from './youtube.vo';
export { PdfBlockPropertiesVO, type PdfBlockProperties } from './pdf.vo';
export { AudioBlockPropertiesVO, type AudioBlockProperties } from './audio.vo';
export { VideoBlockPropertiesVO, type VideoBlockProperties } from './video.vo';
export { FileBlockPropertiesVO, type FileBlockProperties } from './file.vo';
export {
  PythonBlockPropertiesVO,
  type PythonBlockProperties,
} from './python.vo';
export { LinkBlockPropertiesVO, type LinkBlockProperties } from './link.vo';
export {
  PageMentionBlockPropertiesVO,
  type PageMentionBlockProperties,
} from './page-mention.vo';
export { LatexBlockPropertiesVO, type LatexBlockProperties } from './latex.vo';
export {
  GithubPrBlockPropertiesVO,
  type GithubPrBlockProperties,
} from './github-pr.vo';
export {
  ReactComponentBlockPropertiesVO,
  type ReactComponentBlockProperties,
} from './react-component.vo';
export { GroupBlockPropertiesVO, type GroupBlockProperties } from './group.vo';
export type { GithubBranchBlockProperties } from './github-branch.vo';
export type { GithubCommitBlockProperties } from './github-commit.vo';
export type { VercelDeploymentBlockProperties } from './vercel-deployment.vo';

// Property-related Value Objects
export { PropertyOptionVO } from '../property-option.vo';
export { PropertyTypeVO } from '../property-type.vo';
export { CustomPropertyDefinitionVO } from '../custom-property-definition.vo';

// Factory
export { BlockPropertiesFactory } from './factory';
