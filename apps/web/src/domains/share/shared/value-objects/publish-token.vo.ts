// apps/web/src/domains/share/shared/value-objects/publish-token.vo.ts

import {
  ShareManagementError,
  SHARE_MANAGEMENT_ERROR_MESSAGES,
} from '../errors/share-management.error';

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export class PublishToken {
  private readonly value: string;

  constructor(token: string) {
    if (!token || token.trim().length === 0) {
      throw new ShareManagementError(
        'INVALID_PUBLISH_TOKEN',
        SHARE_MANAGEMENT_ERROR_MESSAGES.INVALID_PUBLISH_TOKEN
      );
    }

    if (!BASE64_PATTERN.test(token)) {
      throw new ShareManagementError(
        'INVALID_PUBLISH_TOKEN',
        SHARE_MANAGEMENT_ERROR_MESSAGES.INVALID_PUBLISH_TOKEN
      );
    }

    this.value = token;
  }

  toString(): string {
    return this.value;
  }
}
