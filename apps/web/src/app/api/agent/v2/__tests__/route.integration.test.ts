/**
 * Agent V2 route integration test
 *
 * Verifies:
 * - POST /api/agent/v2 returns 401 when not authenticated
 * - Route is wired and accepts messages body
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';

vi.mock('@/utils/supabase/server', () => ({
  createClient: vi.fn(),
}));

const createClient = await import('@/utils/supabase/server').then(
  (m) => m.createClient
);

describe('POST /api/agent/v2', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockReset();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('not authenticated'),
        }),
      },
    } as any);

    const req = new Request('http://localhost:3000/api/agent/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What is the latest news about AI?' },
        ],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty('error', 'Authentication required');
  });

  it('accepts valid messages body and returns 401 without auth', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: {} }),
      },
    } as any);

    const req = new Request('http://localhost:3000/api/agent/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Search for React 19 release' },
        ],
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});
