/**
 * Built-in apps registry source.
 * Consumed by AppRegistry.initialize().
 */

import type { IAppDefinition } from '@/domains/app-system/shared/interfaces/app-definition.interface';

import { SSotaLinkApp } from './built-in/ssota-link.app';

export const BUILT_IN_APPS: IAppDefinition[] = [SSotaLinkApp];
