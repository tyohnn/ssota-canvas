'use client';

import React, { useCallback } from 'react';
import { useBlockPropertyUpdate } from '../../hooks/use-block-property-update';
import {
  ColorToolbarItem,
  FontSizeToolbarItem,
  TextAlignToolbarItem,
  RichStyleToolbarItem,
  ShapeTypeToolbarItem,
  BorderStyleToolbarItem,
  ObjectFitToolbarItem,
  ImageChangeToolbarItem,
  CaptionVisibilityToolbarItem,
  ExpandImageToolbarItem,
  LinkUrlToolbarItem,
  OpenLinkToolbarItem,
  CopyLinkToolbarItem,
  YouTubeUrlToolbarItem,
  OpenYoutubeToolbarItem,
  CopyYoutubeLinkToolbarItem,
  ExpandPdfToolbarItem,
  DownloadPdfToolbarItem,
  AudioDownloadToolbarItem,
  AudioUploadToolbarItem,
  AudioRecordToolbarItem,
} from './index';
import {
  FontSize,
  TextAlign,
  TextBlockProperties,
  ShapeBlockProperties,
  ImageBlockProperties,
  MarkdownBlockProperties,
  LinkBlockProperties,
  YoutubeBlockProperties,
  PdfBlockProperties,
  AudioBlockProperties,
} from '../../../shared/value-objects/block-properties';
import type { ObjectFit } from '../../../shared/value-objects/block-properties/common-types';
import { ColorToken } from '../../../shared/types/style-tokens.types';
import { BlockNodeData } from '../../../shared/types/block-data.types';
import { Separator } from '@workspace/ui/components/ui/separator';

interface BlockToolbarMapperProps {
  blockId: string;
  blockType: string;
  blockData: BlockNodeData;
  disabled?: boolean;
}

/**
 * 블럭 타입별 툴바 아이템 매핑 컴포넌트
 *
 * 각 블럭 타입에 따라 적절한 툴바 아이템을 렌더링
 */
export function BlockToolbarMapper({
  blockId,
  blockType,
  blockData,
  disabled = false,
}: BlockToolbarMapperProps) {
  const { updateProperty } = useBlockPropertyUpdate();

  // 속성 업데이트 핸들러 - 제네릭 타입을 통해 타입 안전성 유지
  const handlePropertyUpdate = async <T,>(propertyPath: string, value: T) => {
    if (!blockData) {
      console.warn('Block data not available for property update');
      return;
    }
    await updateProperty<T>(blockId, propertyPath, value, blockData);
  };

  // 블럭 타입별 툴바 아이템 매핑
  const renderToolbarItem = () => {
    switch (blockType) {
      case 'text':
        const textBlockProperties = blockData.properties as TextBlockProperties;
        return (
          <>
            <ColorToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentColor={textBlockProperties.color}
              disabled={disabled}
              onColorChange={async color => {
                await handlePropertyUpdate('properties.color', color);
              }}
            />
            <FontSizeToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentFontSize={textBlockProperties.fontSize}
              disabled={disabled}
              onFontSizeChange={async fontSize => {
                await handlePropertyUpdate('properties.fontSize', fontSize);
              }}
            />
            <TextAlignToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentAlign={textBlockProperties.textAlign}
              disabled={disabled}
              onAlignChange={async align => {
                await handlePropertyUpdate('properties.textAlign', align);
              }}
            />
            <RichStyleToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentRichStyle={textBlockProperties.richStyle}
              disabled={disabled}
              onRichStyleChange={async richStyle => {
                await handlePropertyUpdate('properties.richStyle', richStyle);
              }}
            />
          </>
        );

      case 'shape':
        const shapeBlockProperties =
          blockData.properties as ShapeBlockProperties;
        return (
          <>
            <ShapeTypeToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentShapeType={shapeBlockProperties.shapeType}
              disabled={disabled}
              onShapeTypeChange={async shapeType => {
                await handlePropertyUpdate('properties.shapeType', shapeType);
              }}
            />
            <ColorToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentColor={shapeBlockProperties.color}
              disabled={disabled}
              onColorChange={async color => {
                await handlePropertyUpdate('properties.color', color);
              }}
            />
            <BorderStyleToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentBorderStyle={shapeBlockProperties.borderStyle}
              disabled={disabled}
              onBorderStyleChange={async borderStyle => {
                await handlePropertyUpdate(
                  'properties.borderStyle',
                  borderStyle
                );
              }}
            />
          </>
        );

      case 'image':
        const imageBlockProperties =
          blockData.properties as ImageBlockProperties;
        return (
          <>
            <ImageChangeToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentValue={imageBlockProperties.imageUrl}
              disabled={disabled}
              orgId={blockData.orgId}
              workspaceId={blockData.workspaceId}
              pageId={blockData.pageId}
              onValueChange={async (url: string) => {
                await handlePropertyUpdate('properties.imageUrl', url);
              }}
            />
            <ObjectFitToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentValue={imageBlockProperties.objectFit}
              disabled={disabled}
              onValueChange={async (objectFit: ObjectFit) => {
                await handlePropertyUpdate('properties.objectFit', objectFit);
              }}
            />
            <Separator orientation="vertical" className="h-6" />
            <CaptionVisibilityToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentValue={imageBlockProperties.isCaptionVisible ?? false}
              disabled={disabled}
              onValueChange={async (value: boolean) => {
                await handlePropertyUpdate(
                  'properties.isCaptionVisible',
                  value
                );
              }}
            />
            <ExpandImageToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              imageUrl={imageBlockProperties.imageUrl}
              alt={imageBlockProperties.alt}
              disabled={disabled || !imageBlockProperties.imageUrl}
            />
          </>
        );

      case 'basic':
        return <></>;

      case 'markdown':
        const markdownBlockProperties =
          blockData.properties as MarkdownBlockProperties;
        return (
          <>
            <ColorToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentColor={markdownBlockProperties.color}
              disabled={disabled}
              onColorChange={async color => {
                await handlePropertyUpdate('properties.color', color);
              }}
            />
          </>
        );

      case 'link':
        const linkBlockProperties = blockData.properties as LinkBlockProperties;
        return (
          <>
            <LinkUrlToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentValue={linkBlockProperties.url}
              disabled={disabled}
              onValueChange={async (url: string) => {
                await handlePropertyUpdate('properties.url', url);
              }}
            />
            <Separator orientation="vertical" className="h-6" />
            <OpenLinkToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              url={linkBlockProperties.url}
              disabled={disabled || !linkBlockProperties.url}
            />
            <CopyLinkToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              url={linkBlockProperties.url}
              disabled={disabled || !linkBlockProperties.url}
            />
          </>
        );

      case 'youtube':
        const youtubeBlockProperties =
          blockData.properties as YoutubeBlockProperties;
        return (
          <>
            <YouTubeUrlToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              currentValue={youtubeBlockProperties.url}
              disabled={disabled}
              onValueChange={async (url: string) => {
                await handlePropertyUpdate('properties.url', url);
              }}
            />
            <Separator orientation="vertical" className="h-6" />
            <OpenYoutubeToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              url={youtubeBlockProperties.url}
              disabled={disabled || !youtubeBlockProperties.url}
            />
            <CopyYoutubeLinkToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              url={youtubeBlockProperties.url}
              disabled={disabled || !youtubeBlockProperties.url}
            />
          </>
        );

      case 'pdf':
        const pdfBlockProperties = blockData.properties as PdfBlockProperties;
        return (
          <>
            <ExpandPdfToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              pdfUrl={pdfBlockProperties.url}
              filename={pdfBlockProperties.filename}
              disabled={disabled || !pdfBlockProperties.url}
            />
            <DownloadPdfToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              pdfUrl={pdfBlockProperties.url}
              filename={pdfBlockProperties.filename}
              disabled={disabled || !pdfBlockProperties.url}
            />
          </>
        );

      case 'audio':
        const audioBlockProperties =
          blockData.properties as AudioBlockProperties;
        return (
          <>
            <AudioUploadToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              disabled={disabled}
              orgId={blockData.orgId}
              workspaceId={blockData.workspaceId}
              pageId={blockData.pageId}
              onValueChange={async (url: string) => {
                await handlePropertyUpdate('properties.audioUrl', url);
              }}
            />
            <AudioRecordToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              disabled={disabled}
              orgId={blockData.orgId}
              workspaceId={blockData.workspaceId}
              pageId={blockData.pageId}
              onValueChange={async (url: string) => {
                await handlePropertyUpdate('properties.audioUrl', url);
              }}
            />
            <AudioDownloadToolbarItem
              blockId={blockId}
              blockMountId={blockData.blockMountId}
              audioUrl={audioBlockProperties.audioUrl}
              title={audioBlockProperties.title}
              disabled={disabled || !audioBlockProperties.audioUrl}
            />
          </>
        );

      default:
        // 기본 블럭 타입에 대한 기본 툴바 아이템
        return <></>;
    }
  };

  return <div className="flex items-center gap-2">{renderToolbarItem()}</div>;
}
