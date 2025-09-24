import * as path from 'path';
import { loadConfig } from '../config.js';
import { loadState, saveState } from '../state.js';
import { writeJson } from '../fs.js';

export interface PullResult {
  status: 'not-configured' | 'not-modified' | 'updated';
}

export async function pullFromRemote(cwd: string): Promise<PullResult> {
  const cfg = await loadConfig(cwd);
  const api = cfg.remote?.apiBaseUrl;
  if (!api || !cfg.workspace?.id) {
    return { status: 'not-configured' };
  }
  const state = await loadState(cwd);
  const url = `${api.replace(/\/$/, '')}/workspaces/${cfg.workspace.id}/export/registry`;

  const headers: Record<string, string> = {};
  const tokenEnv = cfg.remote?.auth?.tokenEnv;
  const token = tokenEnv ? process.env[tokenEnv] : undefined;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (state.remote.workspaceEtag)
    headers['If-None-Match'] = state.remote.workspaceEtag;

  const res = await fetch(url, { headers });
  if (res.status === 304) {
    return { status: 'not-modified' };
  }
  if (!res.ok) {
    throw new Error(`Pull failed: ${res.status} ${await res.text()}`);
  }
  const etag = res.headers.get('etag') || undefined;
  const data = await res.json();
  await writeJson(path.join(cwd, '.ssota/block-registry.json'), data);
  if (etag) {
    state.remote.workspaceEtag = etag;
    state.lastSyncAt = new Date().toISOString();
    await saveState(cwd, state);
  }
  return { status: 'updated' };
}
