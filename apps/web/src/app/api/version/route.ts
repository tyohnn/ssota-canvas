/**
 * GET /api/version
 *
 * Returns the current deployment version for client-side version check.
 * No auth required.
 */
import { config } from '@/config';

export async function GET() {
  return Response.json({ version: config.app.version });
}
