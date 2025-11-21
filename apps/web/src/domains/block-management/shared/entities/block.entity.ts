import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';
import {
  BlockPropertiesVO,
  BlockPropertiesFactory,
} from '../value-objects/block-properties';
import { BlockManagementError } from '../errors/block-management.error';
// validateBlockProperties는 Value Objects로 이동됨
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
import { CustomPropertyDefinitionVO } from '../value-objects/custom-property-definition.vo';
import { UserProfile } from '@/domains/user-management/shared/types';

/**
 * Block Entity
 *
 * 블록의 핵심 정보와 비즈니스 로직을 캡슐화
 */
export class Block {
  private constructor(
    public readonly id: BlockId,
    public readonly workspaceId: WorkspaceId,
    public readonly userId: UserId,
    public blockType: BlockType,
    public title: string,
    public properties: BlockPropertiesVO, // Value Object로 변경
    public customProperties: CustomPropertyDefinitionVO[],
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
    public content: unknown = null, // JSONB content (TipTap JSON, 기타 구조화된 콘텐츠)
    public readonly createdByProfile?: UserProfile
  ) {}

  /**
   * Block 생성
   *
   * @param id - Block ID
   * @param workspaceId - 워크스페이스 ID
   * @param userId - 사용자 ID
   * @param blockType - 블록 타입
   * @param title - 블록 제목
   * @param properties - 블록 속성 (선택적, 없으면 기본값 사용)
   * @param createdByProfile - 생성자 프로필
   *
   * @returns Block 인스턴스
   */
  static create(
    id: BlockId,
    workspaceId: WorkspaceId,
    userId: UserId,
    blockType: BlockType,
    title: string = '새 블럭',
    properties?: BlockPropertiesVO,
    content?: unknown // ✨ 초기 content 추가 (JSONB)
  ): Block {
    const now = new Date();
    // ✅ Properties 초기화: 전달받은 properties가 있으면 사용, 없으면 기본값 생성
    const blockProperties =
      properties || BlockPropertiesFactory.createForBlockType(blockType);
    const customProperties: CustomPropertyDefinitionVO[] = [];

    return new Block(
      id,
      workspaceId,
      userId,
      blockType,
      title,
      blockProperties,
      customProperties,
      now,
      now,
      null,
      content ?? null // ✨ content: 전달받은 값 또는 null
    );
  }

  /**
   * 기존 데이터로 Block 재구성 (Repository에서 사용)
   *
   * @param id - Block ID
   * @param workspaceId - 워크스페이스 ID
   * @param userId - 사용자 ID
   * @param blockType - 블록 타입
   * @param title - 블록 제목
   * @param properties - 속성 값 (JSON)
   * @param customProperties - 커스텀 속성 정의
   * @param createdAt - 생성 시각
   * @param updatedAt - 수정 시각
   * @param deletedAt - 삭제 시각
   * @param content - JSONB 콘텐츠
   * @param createdByProfile - 생성자 프로필
   * @returns Block 인스턴스
   */
  static reconstitute(
    id: BlockId,
    workspaceId: WorkspaceId,
    userId: UserId,
    blockType: BlockType,
    title: string,
    properties: BlockPropertiesVO,
    customProperties: CustomPropertyDefinitionVO[],
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
    content: unknown = null,
    createdByProfile?: UserProfile
  ): Block {
    return new Block(
      id,
      workspaceId,
      userId,
      blockType,
      title,
      properties,
      customProperties,
      createdAt,
      updatedAt,
      deletedAt,
      content,
      createdByProfile
    );
  }

  /**
   * 블록 복제
   *
   * @param userId - 사용자 ID
   * @returns 복제된 블록
   */
  duplicate(userId: UserId): Block {
    return new Block(
      BlockId.generate(),
      this.workspaceId,
      userId,
      this.blockType,
      `${this.title} (1)`,
      this.properties,
      this.customProperties,
      this.createdAt,
      this.updatedAt,
      this.deletedAt,
      this.content // 콘텐츠도 복제
    );
  }

  /**
   * 블록 정보 업데이트
   *
   * @param updateData - 업데이트할 데이터
   */
  update(updateData: {
    title?: string;
    properties?: Record<string, any>;
    content?: unknown; // JSONB content (TipTap JSON, 기타 구조화된 콘텐츠)
    contentRaw?: string; // Markdown text (AI context용)
  }): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    // 제목 업데이트
    if (updateData.title !== undefined) {
      this.title = updateData.title;
    }

    // 속성 업데이트 - Properties Value Object는 불변이므로 새로 생성
    if (updateData.properties !== undefined) {
      // 기존 properties와 새로운 properties를 병합하여 새 Value Object 생성
      const currentPropertiesJSON = this.properties.toJSON() as Record<
        string,
        any
      >;
      // 기존 _extraFields (커스텀 속성 값) 포함
      const existingExtraFields = (this.properties as any)._extraFields || {};
      const currentPropertiesWithExtras = {
        ...currentPropertiesJSON,
        ...existingExtraFields,
      };
      const mergedProperties = {
        ...currentPropertiesWithExtras,
        ...updateData.properties,
      };

      // Properties VO 생성 (알 수 없는 필드는 _extraFields에 저장됨)
      const newPropertiesVO = BlockPropertiesFactory.createFromJSON(
        this.blockType,
        mergedProperties
      );

      // 알 수 없는 필드(커스텀 속성 값 등)를 _extraFields에 저장
      const knownPropertyKeys = new Set(Object.keys(currentPropertiesJSON));
      const extraFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(mergedProperties)) {
        if (!knownPropertyKeys.has(key)) {
          extraFields[key] = value;
        }
      }

      // _extraFields 설정 (protected 필드이므로 타입 단언 사용)
      (newPropertiesVO as any)._extraFields = extraFields;

      this.properties = newPropertiesVO;
    }

    // 콘텐츠 업데이트
    if (updateData.content !== undefined) {
      this.content = updateData.content;
    }

    if (updateData.contentRaw !== undefined) {
      (this as any).contentRaw = updateData.contentRaw;
    }

    this.updatedAt = new Date();
  }

  /**
   * 블록 타입 변경
   *
   * @param newType - 새로운 블록 타입
   */
  updateBlockType(newType: BlockType): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    // 새 타입의 기본 Properties Value Object로 업데이트
    this.properties = BlockPropertiesFactory.createForBlockType(newType);
    this.blockType = newType;
    this.updatedAt = new Date();
  }

  /**
   * 커스텀 속성 정의 추가 (Service Layer에서 사용)
   *
   * @param property - 추가할 속성 정의
   */
  addCustomPropertyDefinition(property: CustomPropertyDefinitionVO): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    if (this.customProperties.some(existing => existing.id === property.id)) {
      throw new BlockManagementError(
        'PROPERTY_CREATE_FAILED',
        `Custom property with ID ${property.id} already exists`
      );
    }

    this.customProperties.push(property);
    this.updatedAt = new Date();
  }

  /**
   * 커스텀 속성 정의 업데이트 (Service Layer에서 사용)
   *
   * @param propertyId - 속성 ID
   * @param updatedProperty - 교체할 속성 정의
   */
  updateCustomPropertyDefinition(
    propertyId: string,
    updatedProperty: CustomPropertyDefinitionVO
  ): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    const propertyIndex = this.customProperties.findIndex(
      p => p.id === propertyId
    );
    if (propertyIndex === -1) {
      throw new BlockManagementError(
        'PROPERTY_NOT_FOUND',
        'Custom property not found'
      );
    }

    if (updatedProperty.id !== propertyId) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_DEFINITION',
        'Updated custom property ID does not match target property ID'
      );
    }

    this.customProperties[propertyIndex] = updatedProperty;
    this.updatedAt = new Date();
  }

  /**
   * 커스텀 속성 정의 삭제 (Service Layer에서 사용)
   *
   * @param propertyId - 속성 ID
   */
  removeCustomPropertyDefinition(propertyId: string): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    const propertyIndex = this.customProperties.findIndex(
      p => p.id === propertyId
    );
    if (propertyIndex === -1) {
      throw new BlockManagementError(
        'PROPERTY_NOT_FOUND',
        'Custom property not found'
      );
    }

    this.customProperties.splice(propertyIndex, 1);
    this.updatedAt = new Date();
  }

  /**
   * Properties Value Object 업데이트 (Service Layer에서 사용)
   *
   * @param newProperties - 새로운 Properties Value Object
   */
  updateProperties(newProperties: BlockPropertiesVO): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    this.properties = newProperties;
    this.updatedAt = new Date();
  }

  /**
   * 소프트 삭제 처리
   */
  markAsDeleted(): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Block already deleted'
      );
    }

    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * 삭제 취소
   */
  restore(): void {
    if (!this.isDeleted()) {
      throw new BlockManagementError(
        'INVALID_OPERATION',
        'Block is not deleted'
      );
    }

    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * 삭제 여부 확인
   *
   * @returns 삭제 여부
   */
  isDeleted(): boolean {
    return this.deletedAt !== null && this.deletedAt !== undefined;
  }

  /**
   * 속성 값 가져오기
   *
   * @param propertyId - 속성 ID
   * @returns 속성 값
   */
  getPropertyValue(propertyId: string): any {
    const propertiesJSON = this.properties.toJSON() as Record<string, any>;
    return propertiesJSON[propertyId];
  }

  /**
   * 모든 속성 가져오기
   *
   * @returns 모든 속성 값 (JSON)
   */
  getAllProperties(): Record<string, any> {
    return this.properties.toJSON();
  }

  /**
   * 커스텀 속성 정의 가져오기
   *
   * @returns 커스텀 속성 정의 목록
   */
  getCustomProperties(): CustomPropertyDefinitionVO[] {
    return [...this.customProperties];
  }

  /**
   * 특정 커스텀 속성 정의 가져오기
   *
   * @param propertyId - 속성 ID
   * @returns 커스텀 속성 정의
   */
  getCustomProperty(
    propertyId: string
  ): CustomPropertyDefinitionVO | undefined {
    return this.customProperties.find(p => p.id === propertyId);
  }

  /**
   * 블록의 속성 검증 (Value Objects에서 처리)
   *
   * @param properties - 검증할 속성들 (기본값: 현재 블록의 속성)
   * @returns 검증 결과
   */
  validateProperties(
    properties: Record<string, any> = this.properties
  ): boolean {
    // Value Objects에서 검증 로직을 처리하므로 여기서는 기본 검증만 수행
    return typeof properties === 'object' && properties !== null;
  }

  /**
   * 블록의 기본 속성 가져오기
   *
   * @returns 기본 속성
   */
  getDefaultProperties(): Record<string, any> {
    return this.blockType.getDefaultProperties();
  }

  /**
   * 사용 가능한 블록 툴 목록 가져오기
   *
   * @returns 사용 가능한 툴 목록
   */
  getAvailableTools(): string[] {
    return this.blockType.getAvailableTools();
  }

  /**
   * 블록이 특정 툴을 지원하는지 확인
   *
   * @param toolType - 툴 타입
   * @returns 지원 여부
   */
  supportsTool(toolType: string): boolean {
    return this.getAvailableTools().includes(toolType);
  }

  /**
   * 블록의 JSON 표현 반환
   *
   * @returns 블록의 JSON 표현
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id.value,
      userId: this.userId.value,
      workspaceId: this.workspaceId.value,
      blockType: this.blockType.value,
      title: this.title,
      properties: this.properties.toJSON(),
      customProperties: this.customProperties.map(cp => cp.toJSON()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt?.toISOString() || null,
      createdByProfile: this.createdByProfile,
    };
  }
}
