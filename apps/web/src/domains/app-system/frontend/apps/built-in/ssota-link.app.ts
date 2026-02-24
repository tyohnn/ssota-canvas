/**
 * SSOTA Link App – built-in app defining the link block type.
 * See docs/plans/app-system/SSOTA-Link-App.md §2, §5, §8.
 */

import type { IAppDefinition } from '@/domains/app-system/shared/interfaces/app-definition.interface';
import type { IBlockTypeDefinition } from '@/domains/app-system/shared/interfaces/block-type-definition.interface';
import type { IToolDefinition } from '@/domains/app-system/shared/interfaces/tool-definition.interface';

const linkBlockTools: IToolDefinition[] = [
  {
    name: 'summarize',
    description: 'Summarize the linked webpage content in the specified language (ko, en, ja, zh)',
    inputSchema: {
      language: { type: 'string', enum: ['ko', 'en', 'ja', 'zh'], default: 'ko' },
    },
    executionSide: 'server',
  },
  {
    name: 'screenshot',
    description: 'Capture a screenshot of the linked webpage',
    inputSchema: {
      fullPage: { type: 'boolean', default: false },
    },
    executionSide: 'server',
  },
  {
    name: 'extractImages',
    description: 'Extract all image URLs from the linked webpage',
    inputSchema: {},
    executionSide: 'server',
  },
  {
    name: 'extractDesign',
    description: 'Extract the design metadata (colors, fonts, metadata) of the linked webpage',
    inputSchema: {},
    executionSide: 'server',
  },
  {
    name: 'extractJSON',
    description: 'Extract the content of the linked webpage in a structured format according to a custom schema',
    inputSchema: {
      schema: { type: 'object', description: 'The JSON Schema of the data to extract' },
    },
    executionSide: 'server',
  },
];

/**
 * Properties: 블록 렌더링에 쓰이는 데이터만. LinkBlockProperties / LinkBlockPropertiesVO와 동일.
 * 탭(요약, 추출, 스크린샷 등) 데이터는 유튜브 블록처럼 source·별도 도메인에서 관리하며, properties에 두지 않음.
 */
const linkBlockTypeDefinition: IBlockTypeDefinition = {
  typeName: 'link',
  displayName: 'Link',
  icon: 'link',
  propertiesSchema: {
    type: 'object',
    properties: {
      url: { type: 'string' },
      ogTitle: { type: 'string' },
      ogDescription: { type: 'string' },
      ogImage: { type: 'string' },
      siteName: { type: 'string' },
      domain: { type: 'string' },
      faviconUrl: { type: 'string' },
      author: { type: 'string' },
      publishedAt: { type: 'string' },
      pageType: { type: 'string' },
    },
  },
  defaultProperties: {
    url: '',
  },
  blockTools: linkBlockTools,
  isEditable: false,
  openType: true,
  sourceCapability: {
    sourceType: 'link',
    extractable: true,
    summarizable: true,
  },
};

export const SSotaLinkApp: IAppDefinition = {
  id: 'ssota-link',
  name: 'SSOTA Link App',
  slug: 'ssota-link',
  description: 'A Built-in App that allows you to materialize a single URL on the canvas and extract/query its content in various ways',
  category: 'built-in',
  blockTypeDefinitions: [linkBlockTypeDefinition],
  producibleBlockTypes: ['link'],
  appTools: [],
  rendererInfo: {
    componentPath: '@/domains/block-management/frontend/components/block/block-type/link',
  },
};
