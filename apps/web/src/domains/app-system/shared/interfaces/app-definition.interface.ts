/**
 * App definition: block type definitions, producible types, and renderer info.
 */

import type { AppCategory } from '../types/app.types';
import type { IBlockTypeDefinition } from './block-type-definition.interface';
import type { IToolDefinition } from './tool-definition.interface';

export interface RendererInfo {
  componentPath: string;
  editorPath?: string;
}

export interface IAppDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: AppCategory;
  blockTypeDefinitions: IBlockTypeDefinition[];
  producibleBlockTypes: string[];
  appTools: IToolDefinition[];
  rendererInfo: RendererInfo;
}
