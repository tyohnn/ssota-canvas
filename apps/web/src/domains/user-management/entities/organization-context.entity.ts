// apps/web/src/domains/user-management/entities/organization-context.entity.ts

import { UserId } from '../value-objects/ids.vo';
import { OrganizationId } from '../value-objects/ids.vo';

export class OrganizationContext {
  constructor(
    public readonly id: string,
    public readonly userId: UserId,
    public readonly selectedOrganizationId: OrganizationId,
    public readonly selectedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // 상태 변경 메서드
  updateSelectedOrganization(organizationId: OrganizationId): void {
    // 새로운 조직 선택 시 업데이트 시간 갱신
    (this as any).selectedOrganizationId = organizationId;
    (this as any).selectedAt = new Date();
    (this as any).updatedAt = new Date();
  }

  // Getters
  get isActive(): boolean {
    // 24시간 이내에 선택된 경우 활성 상태
    const hoursSinceSelection =
      (Date.now() - this.selectedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceSelection < 24;
  }

  get isExpired(): boolean {
    return !this.isActive;
  }
}

