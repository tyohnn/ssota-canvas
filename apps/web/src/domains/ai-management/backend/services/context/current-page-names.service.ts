import type { PageRepository } from '@/domains/workspace-management/backend/repositories/interfaces/page.repository.interface';
import type { WorkspaceRepository } from '@/domains/workspace-management/backend/repositories/interfaces/workspace.repository.interface';
import type { OrganizationRepository } from '@/domains/organization-management/backend/repositories/interfaces/organization.repository.interface';
import type { UserRepository } from '@/domains/user-management/backend/repositories/interfaces/user.repository.interface';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { OrganizationId } from '@/domains/organization-management/shared/value-objects/ids.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

/**
 * Result of fetching display names for the Current Page context block.
 * All fields are optional; missing IDs or failed lookups yield undefined.
 */
export interface CurrentPageNames {
  pageTitle?: string;
  workspaceTitle?: string;
  organizationName?: string;
  userProfileName?: string;
}

export interface CurrentPageNamesInput {
  pageId?: string;
  workspaceId?: string;
  orgId?: string;
  userId: string;
}

export interface CurrentPageNamesDeps {
  pageRepository: PageRepository;
  workspaceRepository: WorkspaceRepository;
  organizationRepository: OrganizationRepository;
  userRepository: UserRepository;
}

/**
 * Fetches display names for the agent's Current Page context (page, workspace, org, user).
 * Uses Promise.allSettled so partial failures do not break the whole result.
 */
export async function getCurrentPageNames(
  deps: CurrentPageNamesDeps,
  input: CurrentPageNamesInput
): Promise<CurrentPageNames> {
  const { pageId, workspaceId, orgId, userId } = input;
  const { pageRepository, workspaceRepository, organizationRepository, userRepository } = deps;

  const results = await Promise.allSettled([
    pageId
      ? pageRepository.findById(new PageId(pageId)).then(p => p?.title ?? null)
      : Promise.resolve(null),
    workspaceId
      ? workspaceRepository.findById(new WorkspaceId(workspaceId)).then(w => w?.name ?? null)
      : Promise.resolve(null),
    orgId
      ? organizationRepository.getOrganizationName(new OrganizationId(orgId))
      : Promise.resolve(null),
    userRepository.getUserProfile(new UserId(userId)).then(p => p?.name ?? null),
  ]);

  const [pageTitle, workspaceTitle, organizationName, userProfileName] = results.map(r =>
    r.status === 'fulfilled' ? r.value : null
  ) as (string | null)[];

  return {
    pageTitle: pageTitle ?? undefined,
    workspaceTitle: workspaceTitle ?? undefined,
    organizationName: organizationName ?? undefined,
    userProfileName: userProfileName ?? undefined,
  };
}
