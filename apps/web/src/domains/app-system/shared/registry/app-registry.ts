/**
 * App registry: registers built-in apps and provides lookup by app id or block type.
 * Lazy-initializes with BUILT_IN_APPS on first use.
 */

import type { IAppDefinition } from '../interfaces/app-definition.interface';
import type { IBlockTypeDefinition } from '../interfaces/block-type-definition.interface';
import type { IToolDefinition } from '../interfaces/tool-definition.interface';

import { BUILT_IN_APPS } from '@/domains/app-system/frontend/apps';

const appsById = new Map<string, IAppDefinition>();
const appsByBlockType = new Map<string, IAppDefinition>();
const blockTypeDefinitions = new Map<string, IBlockTypeDefinition>();

let initialized = false;

function initialize(): void {
  if (initialized) return;
  BUILT_IN_APPS.forEach(registerApp);
  initialized = true;
}

function ensureInitialized(): void {
  if (!initialized) initialize();
}

export function registerApp(app: IAppDefinition): void {
  appsById.set(app.id, app);
  for (const def of app.blockTypeDefinitions) {
    appsByBlockType.set(def.typeName, app);
    blockTypeDefinitions.set(def.typeName, def);
  }
}

export function getApp(appId: string): IAppDefinition | undefined {
  ensureInitialized();
  return appsById.get(appId);
}

export function getAppByBlockType(typeName: string): IAppDefinition | undefined {
  ensureInitialized();
  return appsByBlockType.get(typeName);
}

export function getBlockTypeDefinition(
  typeName: string
): IBlockTypeDefinition | undefined {
  ensureInitialized();
  return blockTypeDefinitions.get(typeName);
}

export function getBlockToolsForType(typeName: string): IToolDefinition[] {
  const def = getBlockTypeDefinition(typeName);
  return def?.blockTools ?? [];
}

export function getAllApps(): IAppDefinition[] {
  ensureInitialized();
  return Array.from(appsById.values());
}

export const AppRegistry = {
  registerApp,
  getApp,
  getAppByBlockType,
  getBlockTypeDefinition,
  getBlockToolsForType,
  getAllApps,
  initialize,
};
