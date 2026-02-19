import { UserProfile } from '@/domains/user-management/shared/types';
import { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
// validateBlockProperties는 Value Objects로 이동됨
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';

import { BlockManagementError } from '../errors/block-management.error';
import {
  extractPlainText,
  tiptapToMarkdown,
} from '../utils/tiptap-markdown.utils';
import { BlockId } from '../value-objects/block-id.vo';
import {
  BlockPropertiesFactory,
  BlockPropertiesVO,
} from '../value-objects/block-properties';
import { BlockType } from '../value-objects/block-type.vo';
import { CustomPropertyDefinitionVO } from '../value-objects/custom-property-definition.vo';

/**
 * Block Entity
 *
 * 블록의 핵심 정보와 비즈니스 로직을 캡슐화.
 *
 * 블록 데이터 변경 원칙:
 * - 본문(content): blocks.content로 관리되며 항상 사용자 수정 가능.
 * - 블록 데이터(properties 등): properties 필드와 Block Tool(및 시스템)으로만 변경.
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
    public readonly createdByProfile?: UserProfile,
    public sourceId: string | null = null, // 링크된 소스 (sources.id, nullable)
    public contentVersion: number = 0, // ProseMirror step-based sync (optimistic locking)
    public readonly slug?: string // 8자 hex, DB에서 조회 시 설정. 없으면 id에서 유도
  ) {}

  /** API/응답용 slug (DB 값 또는 id 기반 8자 hex) */
  getSlug(): string {
    return (
      this.slug ?? this.id.value.replace(/-/g, '').toLowerCase().slice(0, 8)
    );
  }

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

    // 블록 생성
    const block = new Block(
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
      content ?? null, // ✨ content: 전달받은 값 또는 null
      undefined, // createdByProfile
      null, // sourceId
      0, // contentVersion
      undefined // slug (create 시 repo에서 id로부터 계산해 insert)
    );

    // content_raw 자동 생성 (AI 컨텍스트용). 마크다운은 tiptapToMarkdown, 그 외/실패 시 extractPlainText
    if (content && typeof content === 'object') {
      let contentRaw =
        blockType.value === 'markdown'
          ? tiptapToMarkdown(content as any)
          : '';
      if (!contentRaw) {
        contentRaw = extractPlainText(content as any);
      }
      if (contentRaw) {
        (block as any).contentRaw = contentRaw;
      }
    }

    return block;
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
    createdByProfile?: UserProfile,
    sourceId: string | null = null,
    contentVersion: number = 0,
    slug?: string
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
      createdByProfile,
      sourceId,
      contentVersion,
      slug
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
      this.content, // 콘텐츠도 복제
      undefined,
      this.sourceId,
      this.contentVersion,
      undefined // slug (복제본은 새 id이므로 repo insert 시 계산)
    );
  }

  /**
   * 소스 링크 설정 (source-management sources.id)
   */
  updateSourceId(sourceId: string | null): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }
    this.sourceId = sourceId;
    this.updatedAt = new Date();
  }

  /**
   * 블록 제목 업데이트
   *
   * @param title - 새로운 제목
   */
  updateTitle(title: string): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    this.title = title;
    this.updatedAt = new Date();
  }

  /**
   * 블록 콘텐츠 업데이트
   * - content, contentRaw 설정 시 contentVersion을 1 증가시킴 (한 번의 변경당 한 번만 증가)
   *
   * @param content - JSONB 콘텐츠 (TipTap JSON, 기타 구조화된 콘텐츠)
   * @param contentRaw - Markdown 텍스트 (AI context용, 선택적)
   */
  updateContent(content: unknown, contentRaw?: string): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    this.content = content;
    if (contentRaw !== undefined) {
      (this as any).contentRaw = contentRaw;
    }
    this.contentVersion += 1;
    this.updatedAt = new Date();
  }

  /**
   * content_version만 증가 (콘텐츠는 변경하지 않을 때 사용)
   * - updateContent()는 이미 content 변경 시 version을 증가시키므로, 별도 호출 시에만 사용
   */
  incrementContentVersion(): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }
    this.contentVersion += 1;
    this.updatedAt = new Date();
  }

  /**
   * 블록 속성 업데이트 (Record 병합)
   *
   * 기존 properties와 새로운 properties를 병합하여 업데이트합니다.
   * Properties Value Object는 불변이므로 새로 생성합니다.
   *
   * @param properties - 업데이트할 속성들 (Record)
   */
  updatePropertiesFromRecord(properties: Record<string, any>): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

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
      ...properties,
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
    this.updatedAt = new Date();
  }

  /**
   * 블록 정보 업데이트 (레거시 호환용 - 내부 사용)
   *
   * @deprecated 이 메서드는 레거시 호환성을 위해 유지됩니다.
   * 새로운 코드에서는 세분화된 메서드들(updateTitle, updateContent, updatePropertiesFromRecord)을 사용하세요.
   *
   * @param updateData - 업데이트할 데이터
   * @internal
   */
  private update(updateData: {
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

    // 속성 업데이트
    if (updateData.properties !== undefined) {
      this.updatePropertiesFromRecord(updateData.properties);
      // updatedAt은 updatePropertiesFromRecord에서 이미 설정됨
      return;
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
