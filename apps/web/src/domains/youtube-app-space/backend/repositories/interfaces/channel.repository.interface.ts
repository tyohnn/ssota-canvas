/**
 * Channel Repository Interface
 *
 * Domain Layer에서 사용할 Repository 인터페이스 정의
 *
 * DDD 원칙: Infrastructure 레이어(Drizzle)에 의존하지 않음
 */
import type { ChannelAggregate } from '../../../shared/aggregates/channel.aggregate';

/**
 * Channel Repository Interface
 *
 * YouTube 채널 데이터 액세스 계약
 * edge 패턴: Aggregate로 주고받음
 */
export interface IChannelRepository {
  /**
   * Channel 생성
   */
  create(channelAggregate: ChannelAggregate): Promise<void>;

  /**
   * ID로 Aggregate 조회
   */
  findById(id: string): Promise<ChannelAggregate | null>;

  /**
   * YouTube Channel ID로 Aggregate 조회
   */
  findByChannelId(channelId: string): Promise<ChannelAggregate | null>;
}
