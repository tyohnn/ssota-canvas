import { Result } from '@/utils/result';
import { ProfileAggregate } from '../../../shared/aggregates/profile.aggregate';
import type { CreateProfileRequest } from '../../../shared/dtos/requests/profile.requests';
import { XAppSpaceError } from '../../../shared/errors/x-app-space.error';
import { ProfileId } from '../../../shared/value-objects/profile-id.vo';
import { XUserId } from '../../../shared/value-objects/x-user-id.vo';
import type { IProfileRepository } from '../../repositories/interfaces/profile.repository.interface';

export async function createProfile(
  safeDto: CreateProfileRequest,
  profileRepository: IProfileRepository
): Promise<Result<ProfileAggregate, XAppSpaceError>> {
  try {
    const profileId = ProfileId.generate();
    const userId = new XUserId(safeDto.userId);

    const aggregate = ProfileAggregate.createProfile({
      profileId,
      userId,
      username: safeDto.username,
      name: safeDto.name,
      profileImageUrl: safeDto.profileImageUrl,
      description: safeDto.description,
      followersCount: safeDto.followersCount,
      followingCount: safeDto.followingCount,
      tweetCount: safeDto.tweetCount,
    });

    await profileRepository.create(aggregate);

    const uncommittedEvents = aggregate.getUncommittedEvents();
    await Promise.allSettled(uncommittedEvents.map(e => e.handle()));
    aggregate.markEventsAsCommitted();

    return Result.success(aggregate);
  } catch (error) {
    if (error instanceof XAppSpaceError) {
      return Result.error(error);
    }
    return Result.error(
      new XAppSpaceError(
        'PROFILE_CREATION_FAILED',
        error instanceof Error ? error.message : 'Failed to create profile',
        { userId: safeDto.userId }
      )
    );
  }
}
