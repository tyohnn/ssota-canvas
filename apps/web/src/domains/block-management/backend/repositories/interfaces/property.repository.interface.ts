import type { CustomPropertyDefinition } from '../../../shared/types';

/**
 * PropertyRepository Interface
 *
 * 커스텀 속성 데이터 접근을 위한 Repository 인터페이스
 */
export interface PropertyRepository {
  /**
   * 커스텀 속성 정의 생성
   *
   * @param blockId - 블록 ID
   * @param data - 속성 정의 데이터
   * @returns Promise<CustomPropertyDefinition>
   */
  createCustomPropertyDefinition(
    blockId: string,
    data: {
      workspaceId: string;
      name: string;
      propertyType: string;
      options?: Array<{
        id: string;
        label: string;
        color?: string;
        order: number;
      }>;
    }
  ): Promise<CustomPropertyDefinition>;

  /**
   * 커스텀 속성 정의 업데이트
   *
   * @param propertyId - 속성 ID
   * @param data - 업데이트할 데이터
   * @returns Promise<CustomPropertyDefinition>
   */
  updateCustomPropertyDefinition(
    propertyId: string,
    data: {
      name?: string;
      propertyType?: string;
      options?: Array<{
        id: string;
        label: string;
        color?: string;
        order: number;
      }>;
    }
  ): Promise<CustomPropertyDefinition>;

  /**
   * 커스텀 속성 정의 삭제
   *
   * @param propertyId - 속성 ID
   * @returns Promise<void>
   */
  deleteCustomPropertyDefinition(propertyId: string): Promise<void>;

  /**
   * 워크스페이스의 모든 커스텀 속성 정의 조회
   *
   * @param workspaceId - 워크스페이스 ID
   * @returns Promise<CustomPropertyDefinition[]>
   */
  getCustomPropertyDefinitions(
    workspaceId: string
  ): Promise<CustomPropertyDefinition[]>;
}
