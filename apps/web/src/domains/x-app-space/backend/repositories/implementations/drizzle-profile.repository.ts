import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { adminDb } from '@/db';
import type { IProfileRepository } from '../interfaces/profile.repository.interface';
import {
  xProfiles,
  type XProfile,
} from '@/db/schemas/x-app-space-schema';
import { ProfileAggregate } from '../../../shared/aggregates/profile.aggregate';
import { ProfileEntity } from '../../../shared/entities/profile.entity';
import { XUserId } from '../../../shared/value-objects/x-user-id.vo';

export class DrizzleProfileRepository implements IProfileRepository {
  async create(profileAggregate: ProfileAggregate): Promise<void> {
    let currentAggregate = profileAggregate;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const p = currentAggregate.getProfile();
        await adminDb.insert(xProfiles).values({
          id: p.id,
          user_id: p.userId.value,
          username: p.username,
          name: p.name ?? null,
          profile_image_url: p.profileImageUrl ?? null,
          description: p.description ?? null,
          followers_count: p.followersCount ?? null,
          following_count: p.followingCount ?? null,
          tweet_count: p.tweetCount ?? null,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
        });
        return;
      } catch (error) {
        if (
          (error as { code?: string; constraint?: string }).code === '23505' &&
          (error as { code?: string; constraint?: string }).constraint ===
            'profiles_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            const p = currentAggregate.getProfile();
            const newId = randomUUID();
            console.warn(
              `[DrizzleProfileRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId}`
            );
            const newEntity = ProfileEntity.reconstitute({
              id: newId,
              userId: p.userId,
              username: p.username,
              name: p.name,
              profileImageUrl: p.profileImageUrl,
              description: p.description,
              followersCount: p.followersCount,
              followingCount: p.followingCount,
              tweetCount: p.tweetCount,
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            });
            currentAggregate = ProfileAggregate.reconstitute(newEntity);
          } else {
            throw new Error(
              'Failed to generate unique profile ID after multiple attempts'
            );
          }
        } else {
          throw error;
        }
      }
    }
  }

  async findById(id: string): Promise<ProfileAggregate | null> {
    const result = await adminDb.query.xProfiles.findFirst({
      where: eq(xProfiles.id, id),
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  async findByUserId(userId: string): Promise<ProfileAggregate | null> {
    const result = await adminDb.query.xProfiles.findFirst({
      where: eq(xProfiles.user_id, userId),
    });
    if (!result) return null;
    return this.toDomain(result);
  }

  private toDomain(data: XProfile): ProfileAggregate {
    const entity = ProfileEntity.reconstitute({
      id: data.id,
      userId: new XUserId(data.user_id),
      username: data.username,
      name: data.name ?? undefined,
      profileImageUrl: data.profile_image_url ?? undefined,
      description: data.description ?? undefined,
      followersCount: data.followers_count ?? undefined,
      followingCount: data.following_count ?? undefined,
      tweetCount: data.tweet_count ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
    return ProfileAggregate.reconstitute(entity);
  }
}
