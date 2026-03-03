import type { CreateProfileCommand } from '../commands/profile.commands';
import type { ProfileView } from '../dtos/views/profile.views';
import { ProfileEntity } from '../entities/profile.entity';
import { ProfileCreatedEvent } from '../events/profile.events';
import type { DomainEvent } from '../events/domain-event';

export class ProfileAggregate {
  private _uncommittedEvents: DomainEvent[] = [];
  private _profile: ProfileEntity;

  constructor(profile: ProfileEntity) {
    this._profile = profile;
  }

  getProfile(): ProfileEntity {
    return this._profile;
  }

  static createProfile(command: CreateProfileCommand): ProfileAggregate {
    const profile = ProfileEntity.reconstitute({
      id: command.profileId.value,
      userId: command.userId,
      username: command.username,
      name: command.name,
      profileImageUrl: command.profileImageUrl,
      description: command.description,
      followersCount: command.followersCount,
      followingCount: command.followingCount,
      tweetCount: command.tweetCount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const event = new ProfileCreatedEvent(
      profile.id,
      {
        profileId: profile.id,
        userId: profile.userId.value,
        username: profile.username,
      },
      new Date()
    );

    const aggregate = new ProfileAggregate(profile);
    aggregate._uncommittedEvents.push(event);
    return aggregate;
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this._uncommittedEvents];
  }

  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  static reconstitute(profile: ProfileEntity): ProfileAggregate {
    return new ProfileAggregate(profile);
  }

  toView(): ProfileView {
    const p = this._profile;
    return {
      id: p.id,
      userId: p.userId.value,
      username: p.username,
      name: p.name,
      profileImageUrl: p.profileImageUrl,
      description: p.description,
      followersCount: p.followersCount,
      followingCount: p.followingCount,
      tweetCount: p.tweetCount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
