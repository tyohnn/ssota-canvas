// apps/web/src/domains/share/shared/value-objects/publish-link-path.vo.ts

import {
  ShareManagementError,
  SHARE_MANAGEMENT_ERROR_MESSAGES,
} from '../errors/share-management.error';
import { PublishToken } from './publish-token.vo';

export class PublishLinkPath {
  private readonly value: string;
  private readonly token: PublishToken;

  constructor(path: string) {
    if (!path || !path.startsWith('/p/')) {
      throw new ShareManagementError(
        'INVALID_PUBLISH_LINK',
        SHARE_MANAGEMENT_ERROR_MESSAGES.INVALID_PUBLISH_LINK
      );
    }

    const tokenPart = path.slice(3);
    if (!tokenPart) {
      throw new ShareManagementError(
        'INVALID_PUBLISH_LINK',
        SHARE_MANAGEMENT_ERROR_MESSAGES.INVALID_PUBLISH_LINK
      );
    }

    this.token = new PublishToken(tokenPart);
    this.value = path;
  }

  toString(): string {
    return this.value;
  }

  getToken(): PublishToken {
    return this.token;
  }
}
