import { Result } from '@/utils/result';
import type { ProfileAggregate } from '../../../shared/aggregates/profile.aggregate';
import type { GetProfileRequest } from '../../../shared/dtos/requests/profile.requests';
import { XAppSpaceError } from '../../../shared/errors/x-app-space.error';
import type { IProfileRepository } from '../../repositories/interfaces/profile.repository.interface';

export async function getProfile(
  safeDto: GetProfileRequest,
  profileRepository: IProfileRepository
): Promise<Result<ProfileAggregate | null, XAppSpaceError>> {
  try {
    const aggregate = await profileRepository.findByUserId(safeDto.userId);
    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof XAppSpaceError) {
      return Result.error(error);
    }
    return Result.error(
      new XAppSpaceError(
        'PROFILE_QUERY_FAILED',
        error instanceof Error ? error.message : 'Failed to get profile',
        { userId: safeDto.userId }
      )
    );
  }
}
