/**
 * Project-Agnostic Server Actions Framework
 *
 * This module provides generic server action utilities that don't depend on
 * specific authentication mechanisms or domain models.
 *
 * For project-specific wrappers, see @/domains/common/server-actions
 */

export { withSecureAction } from './with-secure-action';
export { createSecureActionBuilder } from './create-secure-action-builder';
export type {
  SecureAction,
  SecureActionOptions,
  MetadataExtractor,
  RateLimitConfig,
  CacheConfig,
  GetAuthenticatedUserFunction,
  AuthorizeFunction,
  AuthorizeResult,
} from './types';
