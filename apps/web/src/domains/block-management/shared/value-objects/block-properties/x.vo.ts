import type {
  XPostEntities,
  XPostEntityHashtag,
  XPostEntityMention,
  XPostEntityUrl,
} from '@/domains/x-app-space/shared/types/post-metadata.types';

import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * X Block Properties Value Object
 *
 * X (Twitter) 포스트 블록의 속성을 관리
 */
export interface XBlockProperties {
  url: string;
  xPostId?: string;
  xText?: string;
  xAuthorUsername?: string;
  xAuthorName?: string;
  xAuthorProfileImageUrl?: string;
  xPostedAt?: string;
  xLikeCount?: number;
  xRetweetCount?: number;
  xReplyCount?: number;
  /** Entities for linking mentions, hashtags, URLs (X Display Requirements) */
  xEntities?: XPostEntities;
  sourceRawContentAccessGranted?: boolean;
  sourceSummaryAccessLanguages?: string[];
}

function parseXEntities(val: unknown): XPostEntities | undefined {
  if (!val || typeof val !== 'object') return undefined;
  const o = val as Record<string, unknown>;
  const mentions = Array.isArray(o.mentions)
    ? (o.mentions as unknown[]).filter(
        (m): m is XPostEntityMention =>
          m != null &&
          typeof m === 'object' &&
          typeof (m as XPostEntityMention).start === 'number' &&
          typeof (m as XPostEntityMention).end === 'number' &&
          typeof (m as XPostEntityMention).username === 'string'
      )
    : undefined;
  const hashtags = Array.isArray(o.hashtags)
    ? (o.hashtags as unknown[]).filter(
        (h): h is XPostEntityHashtag =>
          h != null &&
          typeof h === 'object' &&
          typeof (h as XPostEntityHashtag).start === 'number' &&
          typeof (h as XPostEntityHashtag).end === 'number' &&
          typeof (h as XPostEntityHashtag).tag === 'string'
      )
    : undefined;
  const urls = Array.isArray(o.urls)
    ? (o.urls as unknown[]).filter(
        (u): u is XPostEntityUrl =>
          u != null &&
          typeof u === 'object' &&
          typeof (u as XPostEntityUrl).start === 'number' &&
          typeof (u as XPostEntityUrl).end === 'number' &&
          typeof (u as XPostEntityUrl).url === 'string'
      )
    : undefined;
  if (!mentions?.length && !hashtags?.length && !urls?.length) return undefined;
  return { mentions, hashtags, urls };
}

export class XBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly url: string,
    public readonly xPostId?: string,
    public readonly xText?: string,
    public readonly xAuthorUsername?: string,
    public readonly xAuthorName?: string,
    public readonly xAuthorProfileImageUrl?: string,
    public readonly xPostedAt?: string,
    public readonly xLikeCount?: number,
    public readonly xRetweetCount?: number,
    public readonly xReplyCount?: number,
    public readonly xEntities?: XPostEntities,
    public readonly sourceRawContentAccessGranted?: boolean,
    public readonly sourceSummaryAccessLanguages?: string[]
  ) {
    super();
    this.validate();
  }

  static createDefault(): XBlockPropertiesVO {
    return new XBlockPropertiesVO('');
  }

  static fromJSON(json: Record<string, unknown>): XBlockPropertiesVO {
    const url = typeof json.url === 'string' ? json.url : '';
    const xEntities = parseXEntities(json.xEntities);
    return new XBlockPropertiesVO(
      url,
      typeof json.xPostId === 'string' ? json.xPostId : undefined,
      typeof json.xText === 'string' ? json.xText : undefined,
      typeof json.xAuthorUsername === 'string' ? json.xAuthorUsername : undefined,
      typeof json.xAuthorName === 'string' ? json.xAuthorName : undefined,
      typeof json.xAuthorProfileImageUrl === 'string'
        ? json.xAuthorProfileImageUrl
        : undefined,
      typeof json.xPostedAt === 'string' ? json.xPostedAt : undefined,
      typeof json.xLikeCount === 'number' ? json.xLikeCount : undefined,
      typeof json.xRetweetCount === 'number' ? json.xRetweetCount : undefined,
      typeof json.xReplyCount === 'number' ? json.xReplyCount : undefined,
      xEntities,
      json.sourceRawContentAccessGranted === true,
      Array.isArray(json.sourceSummaryAccessLanguages)
        ? (json.sourceSummaryAccessLanguages as string[])
        : undefined
    );
  }

  toJSON(): XBlockProperties {
    return {
      url: this.url,
      xPostId: this.xPostId,
      xText: this.xText,
      xAuthorUsername: this.xAuthorUsername,
      xAuthorName: this.xAuthorName,
      xAuthorProfileImageUrl: this.xAuthorProfileImageUrl,
      xPostedAt: this.xPostedAt,
      xLikeCount: this.xLikeCount,
      xRetweetCount: this.xRetweetCount,
      xReplyCount: this.xReplyCount,
      xEntities: this.xEntities,
      sourceRawContentAccessGranted: this.sourceRawContentAccessGranted,
      sourceSummaryAccessLanguages: this.sourceSummaryAccessLanguages,
    };
  }

  protected validate(): boolean {
    if (typeof this.url !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'X block url must be a string'
      );
    }
    return true;
  }
}
