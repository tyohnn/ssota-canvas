/**
 * Public schema barrel.
 * Defines cross-domain relations here to avoid circular dependencies:
 * - profilesRelations (ownedOrganizations)
 * - organizationsRelations (workspaces)
 * - pagesRelations (blockMounts, edges, viewports, eventLogs)
 */
import { relations } from 'drizzle-orm';

import { users } from '../../external-schema';
import * as ai from './ai-management-schema';
import * as canvas from './canvas-schema';
import * as enums from './enums';
import * as org from './organization-schema';
import * as profilesModule from './profiles-schema';
import * as share from './share-schema';
import * as workspace from './workspace-schema';

// Re-export all enums and tables
export * from './enums';
export * from './profiles-schema';
export * from './organization-schema';
export * from './workspace-schema';
export * from './canvas-schema';
export * from './ai-management-schema';
export * from './share-schema';
export * from './source-management-schema';

// Cross-domain relations (break cycles)
export const profilesRelations = relations(
  profilesModule.profiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [profilesModule.profiles.id],
      references: [users.id],
    }),
    ownedOrganizations: many(org.organizations),
  })
);

export const organizationsRelations = relations(
  org.organizations,
  ({ one, many }) => ({
    owner: one(profilesModule.profiles, {
      fields: [org.organizations.owner_id],
      references: [profilesModule.profiles.id],
    }),
    members: many(org.organizationMembers),
    invitations: many(org.invitations),
    workspaces: many(workspace.workspaces),
  })
);

export const pagesRelations = relations(workspace.pages, ({ one, many }) => ({
  workspace: one(workspace.workspaces, {
    fields: [workspace.pages.workspace_id],
    references: [workspace.workspaces.id],
  }),
  parent: one(workspace.pages, {
    fields: [workspace.pages.parent_id],
    references: [workspace.pages.id],
    relationName: 'pageHierarchy',
  }),
  children: many(workspace.pages, {
    relationName: 'pageHierarchy',
  }),
  creator: one(profilesModule.profiles, {
    fields: [workspace.pages.created_by],
    references: [profilesModule.profiles.id],
  }),
  favorites: many(workspace.pageFavorites),
  blockMounts: many(canvas.blockMounts),
  edges: many(canvas.edges),
  viewports: many(canvas.viewports),
  eventLogs: many(ai.eventLogs),
}));

// Type exports
export type Profile = typeof profilesModule.profiles.$inferSelect;
export type NewProfile = typeof profilesModule.profiles.$inferInsert;
export type Organization = typeof org.organizations.$inferSelect;
export type NewOrganization = typeof org.organizations.$inferInsert;
export type OrganizationMember = typeof org.organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof org.organizationMembers.$inferInsert;
export type Invitation = typeof org.invitations.$inferSelect;
export type NewInvitation = typeof org.invitations.$inferInsert;
export type Notification = typeof org.notifications.$inferSelect;
export type NewNotification = typeof org.notifications.$inferInsert;

export type Workspace = typeof workspace.workspaces.$inferSelect;
export type NewWorkspace = typeof workspace.workspaces.$inferInsert;
export type Page = typeof workspace.pages.$inferSelect;
export type NewPage = typeof workspace.pages.$inferInsert;
export type WorkspaceMember = typeof workspace.workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspace.workspaceMembers.$inferInsert;
export type PageFavorite = typeof workspace.pageFavorites.$inferSelect;
export type NewPageFavorite = typeof workspace.pageFavorites.$inferInsert;
export type WorkspaceInvitation = typeof workspace.workspaceInvitations.$inferSelect;
export type NewWorkspaceInvitation =
  typeof workspace.workspaceInvitations.$inferInsert;

export type Block = typeof canvas.blocks.$inferSelect;
export type NewBlock = typeof canvas.blocks.$inferInsert;
export type BlockMount = typeof canvas.blockMounts.$inferSelect;
export type NewBlockMount = typeof canvas.blockMounts.$inferInsert;
export type Edge = typeof canvas.edges.$inferSelect;
export type NewEdge = typeof canvas.edges.$inferInsert;
export type Viewport = typeof canvas.viewports.$inferSelect;
export type NewViewport = typeof canvas.viewports.$inferInsert;

export type EventLog = typeof ai.eventLogs.$inferSelect;
export type NewEventLog = typeof ai.eventLogs.$inferInsert;

export type PublishedPageRow = typeof share.publishedPages.$inferSelect;
export type NewPublishedPageRow = typeof share.publishedPages.$inferInsert;

export type OrganizationType = (typeof enums.organizationTypeEnum.enumValues)[number];
export type MemberRole = (typeof enums.memberRoleEnum.enumValues)[number];
export type InvitationStatus = (typeof enums.invitationStatusEnum.enumValues)[number];
export type NotificationType = (typeof enums.notificationTypeEnum.enumValues)[number];
export type BetaStatus = (typeof enums.betaStatusEnum.enumValues)[number];
export type CanvasEdgeShape = (typeof enums.canvasEdgeShapeEnum.enumValues)[number];
export type EdgeMarker = (typeof enums.edgeMarkerEnum.enumValues)[number];
export type AlignmentType = (typeof enums.alignmentTypeEnum.enumValues)[number];
export type EventType = (typeof enums.eventTypeEnum.enumValues)[number];
export type EventAction = (typeof enums.eventActionEnum.enumValues)[number];
