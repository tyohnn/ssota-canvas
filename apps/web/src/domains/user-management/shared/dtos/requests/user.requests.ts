/**
 * User Management - User Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */
import { z } from 'zod';

/**
 * 빈 요청 스키마 (프로필 생성, 설정 상태 확인 등 입력 없음)
 */
export const CreateUserProfileRequestSchema = z
  .union([z.object({}), z.undefined()])
  .transform(() => ({}));

/**
 * 사용자 등록 처리 요청 스키마 (프로필 + 기본 조직)
 */
export const ProcessUserRegistrationRequestSchema = z
  .object({
    language: z.string().min(2).max(2).optional(),
    name: z.string().min(1).max(100).optional(),
    organizationName: z.string().min(1).max(200).optional(),
  })
  .optional()
  .default({});

/**
 * 설정 완료 상태 확인 요청 스키마 (입력 없음)
 */
export const CheckUserSetupStatusRequestSchema = z
  .union([z.object({}), z.undefined()])
  .transform(() => ({}));

/**
 * 기본 조직 생성 또는 조회 요청 스키마
 */
export const CreateOrGetDefaultOrganizationRequestSchema = z.object({
  organizationName: z.string().min(1).max(255),
});

// Input types (프론트엔드에서 사용)
export type CreateUserProfileRequestInput = z.input<
  typeof CreateUserProfileRequestSchema
>;
export type ProcessUserRegistrationRequestInput = z.input<
  typeof ProcessUserRegistrationRequestSchema
>;
export type CheckUserSetupStatusRequestInput = z.input<
  typeof CheckUserSetupStatusRequestSchema
>;
export type CreateOrGetDefaultOrganizationRequestInput = z.input<
  typeof CreateOrGetDefaultOrganizationRequestSchema
>;

// Output types (서버에서 사용)
export type CreateUserProfileRequest = z.output<
  typeof CreateUserProfileRequestSchema
>;
export type ProcessUserRegistrationRequest = z.output<
  typeof ProcessUserRegistrationRequestSchema
>;
export type CheckUserSetupStatusRequest = z.output<
  typeof CheckUserSetupStatusRequestSchema
>;
export type CreateOrGetDefaultOrganizationRequest = z.output<
  typeof CreateOrGetDefaultOrganizationRequestSchema
>;
