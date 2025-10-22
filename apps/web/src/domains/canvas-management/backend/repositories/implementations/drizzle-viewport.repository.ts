import { ViewportRepository } from '../interfaces/viewport.repository.interface';
import { ViewportAggregate } from '../../../shared/aggregates/viewport.aggregate';
import { Viewport } from '../../../shared/entities/viewport.entity';
import { ViewportId } from '../../../shared/value-objects/viewport-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { adminDb } from '@/db';
import { viewports } from '@/db/schema-dev';
import { eq, and } from 'drizzle-orm';

/**
 * DrizzleViewportRepository
 * Drizzle ORM을 사용한 ViewportRepository 구현
 */
export class DrizzleViewportRepository implements ViewportRepository {
  /**
   * Viewport 저장 (생성 또는 업데이트)
   */
  async save(viewportAggregate: ViewportAggregate): Promise<void> {
    const viewport = viewportAggregate.viewport;

    await adminDb
      .insert(viewports)
      .values({
        id: viewport.id.value,
        page_id: viewport.pageId.value,
        user_id: viewport.userId.value,
        zoom_level: viewport.zoomLevel.toString(),
        center_x: viewport.centerX.toString(),
        center_y: viewport.centerY.toString(),
        last_saved: viewport.lastSaved,
        created_at: viewport.createdAt,
        updated_at: viewport.updatedAt,
      })
      .onConflictDoUpdate({
        target: viewports.id,
        set: {
          zoom_level: viewport.zoomLevel.toString(),
          center_x: viewport.centerX.toString(),
          center_y: viewport.centerY.toString(),
          last_saved: viewport.lastSaved,
          updated_at: viewport.updatedAt,
        },
      });
  }

  /**
   * ID로 Viewport 조회
   */
  async findById(viewportId: ViewportId): Promise<ViewportAggregate | null> {
    const result = await adminDb
      .select()
      .from(viewports)
      .where(eq(viewports.id, viewportId.value))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]!);
  }

  /**
   * 페이지 ID와 사용자 ID로 Viewport 조회
   */
  async findByPageId(pageId: PageId): Promise<ViewportAggregate | null> {
    // NOTE: 현재는 사용자 ID를 query에서 받지 않으므로
    // 첫 번째 Viewport를 반환 (향후 userId 파라미터 추가 필요)
    const result = await adminDb
      .select()
      .from(viewports)
      .where(eq(viewports.page_id, pageId.value))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return this.toDomain(result[0]!);
  }

  /**
   * Viewport 삭제
   */
  async delete(viewportId: ViewportId): Promise<void> {
    await adminDb.delete(viewports).where(eq(viewports.id, viewportId.value));
  }

  /**
   * DB Row → Domain Model 변환
   */
  private toDomain(row: typeof viewports.$inferSelect): ViewportAggregate {
    const viewport = new Viewport(
      new ViewportId(row.id),
      new PageId(row.page_id),
      new UserId(row.user_id),
      parseFloat(row.zoom_level),
      parseFloat(row.center_x),
      parseFloat(row.center_y),
      row.last_saved,
      row.created_at,
      row.updated_at
    );

    return new ViewportAggregate(viewport);
  }
}
