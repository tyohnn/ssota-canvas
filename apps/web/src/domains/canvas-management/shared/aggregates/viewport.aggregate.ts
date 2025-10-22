import { Viewport } from '../entities/viewport.entity';
import { ViewportId } from '../value-objects/viewport-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { DomainEvent } from '../events';

/**
 * Viewport Aggregate
 * Viewport Entity의 생명주기와 비즈니스 규칙을 관리
 */
export class ViewportAggregate {
  private _events: DomainEvent[] = [];

  constructor(public readonly viewport: Viewport) {}

  /**
   * 새로운 Viewport 생성
   */
  static createViewport(
    viewportId: ViewportId,
    pageId: PageId,
    userId: UserId,
    zoomLevel: number = 1.0,
    centerX: number = 0,
    centerY: number = 0
  ): ViewportAggregate {
    // 1. Viewport Entity 생성
    const viewport = new Viewport(
      viewportId,
      pageId,
      userId,
      zoomLevel,
      centerX,
      centerY
    );

    // 2. Aggregate 생성
    const aggregate = new ViewportAggregate(viewport);

    // TODO: ViewportCreated 이벤트 생성 및 추가

    return aggregate;
  }

  /**
   * 뷰포트 상태 업데이트
   */
  updateViewportState(
    zoomLevel?: number,
    centerX?: number,
    centerY?: number
  ): void {
    this.viewport.updateViewport(zoomLevel, centerX, centerY);

    // TODO: ViewportUpdated 이벤트 추가
  }

  /**
   * 뷰포트 상태 저장
   */
  saveViewportState(): void {
    this.viewport.saveState();

    // TODO: ViewportSaved 이벤트 추가
  }

  /**
   * 도메인 이벤트 조회
   */
  getEvents(): ReadonlyArray<DomainEvent> {
    return this._events;
  }

  /**
   * 도메인 이벤트 초기화
   */
  clearEvents(): void {
    this._events = [];
  }
}
