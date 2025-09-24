import { db, cliSecrets } from '@/db';
import { eq } from 'drizzle-orm';

export async function requireCliAuth(headers: Headers) {
  const secret = headers.get('x-ssota-cli-key');
  if (!secret) return null;

  const enc = new TextEncoder();
  const hashArray = Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(secret)))
  );
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  const [row] = await db
    .select()
    .from(cliSecrets)
    .where(eq(cliSecrets.secret_hash, hashHex))
    .limit(1);
  if (!row || row.revoked_at) return null;
  return { userId: row.user_id, workspaceId: row.workspace_id } as const;
}
