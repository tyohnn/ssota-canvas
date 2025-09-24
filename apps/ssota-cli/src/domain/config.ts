import * as path from 'path';
import { pathExists, readJson } from './fs.js';

export interface TemplatesConfig {
  requiredPhrases?: string[];
  securityWarnings?: string[];
}

export interface PathsConfig {
  claudeAgents: string;
  claudeCommands: string;
  data: string;
  artifacts: string;
  templates: string;
}

export interface RemoteConfig {
  apiBaseUrl?: string;
  auth?: { method?: string; tokenEnv?: string };
}

export interface SyncConfig {
  trackGenerated?: boolean;
  commitGenerated?: boolean;
  include?: string[];
  exclude?: string[];
}

export interface XbowlConfig {
  $schema?: string;
  version?: string;
  workspace?: { id?: string; name?: string };
  remote?: RemoteConfig;
  sync?: SyncConfig;
  paths: PathsConfig;
  templates?: TemplatesConfig;
}

const DEFAULT_CONFIG: XbowlConfig = {
  $schema: 'https://schema.ssota.dev/config',
  version: '1',
  paths: {
    claudeAgents: '.claude/agents',
    claudeCommands: '.claude/commands',
    data: '.ssota/data',
    artifacts: '.ssota/artifacts',
    templates: '.ssota/templates',
  },
  sync: {
    trackGenerated: true,
    commitGenerated: true,
    include: ['agents', 'tasks', 'workflows', 'data', 'artifact_class'],
    exclude: [],
  },
  templates: {
    requiredPhrases: [
      'Always consider user needs first',
      'Validate assumptions with data',
    ],
    securityWarnings: [
      'Never expose sensitive data in outputs',
      'Validate all user inputs',
    ],
  },
};

export async function loadConfig(cwd: string): Promise<XbowlConfig> {
  const file = path.join(cwd, '.ssota', 'config.json');
  if (!(await pathExists(file))) return DEFAULT_CONFIG;
  const user = await readJson<XbowlConfig>(file);
  return {
    ...DEFAULT_CONFIG,
    ...user,
    paths: { ...DEFAULT_CONFIG.paths, ...(user.paths || {}) },
    sync: { ...DEFAULT_CONFIG.sync, ...(user.sync || {}) },
    templates: { ...DEFAULT_CONFIG.templates, ...(user.templates || {}) },
  };
}
