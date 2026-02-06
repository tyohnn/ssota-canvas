'use server';

import { ActionResult, err, ok } from '@/lib';
import { createClient } from '@/utils/supabase/server';
import { DrizzleOrganizationRepository } from '../backend/repositories/implementations/drizzle-organization.repository';
import { OrganizationId } from '../shared/value-objects/ids.vo';
import {
  GetOrganizationRequestSchema,
  type GetOrganizationRequest,
} from '../shared/dtos';

export type GetOrganizationResult = {
  id: string;
  name: string;
  iconUrl: string | null;
  organizationType: string;
  isDefault: boolean;
  createdAt: string;
};

/**
 * 단일 조직 조회 (RLS: 소유자만 조회 가능)
 */
export async function getOrganizationAction(
  req: GetOrganizationRequest
): Promise<ActionResult<GetOrganizationResult>> {
  const parsed = GetOrganizationRequestSchema.safeParse(req);
  if (!parsed.success) {
    return err(parsed.error.message, { issues: parsed.error.issues });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return err('Unauthorized', { code: 'UNAUTHORIZED' });
  }

  const repository = new DrizzleOrganizationRepository();
  const aggregate = await repository.findById(
    new OrganizationId(parsed.data.organizationId)
  );

  if (!aggregate) {
    return err('Organization not found', { code: 'NOT_FOUND' });
  }

  const entity = aggregate.entity;
  return ok({
    id: entity.id.value,
    name: entity.name,
    iconUrl: entity.iconUrl,
    organizationType: entity.organizationType,
    isDefault: entity.isDefault,
    createdAt: entity.createdAt.toISOString(),
  });
}
