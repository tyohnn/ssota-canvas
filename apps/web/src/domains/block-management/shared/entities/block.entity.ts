import { BlockId } from '../value-objects/block-id.vo';
import { BlockType } from '../value-objects/block-type.vo';
import { PropertyType } from '../value-objects/property-type.vo';
import { MediaURL } from '../value-objects/media-url.vo';
import { BlockManagementError } from '../errors/block-management.error';
import {
  isBlockSkeleton,
  isBlockCompleted,
  getBlockCompletionPercentage,
} from '../schemas/block-type-schemas';
import { validateBlockProperties } from '../types/block-properties.types';

/**
 * 커스텀 속성 정의 인터페이스
 */
export interface CustomPropertyDefinition {
  id: string;
  name: string;
  type: string;
  options?: Array<{ id: string; label: string; color: string }>;
  order: number;
  visible: boolean;
}

/**
 * 작성자 프로필 정보 인터페이스
 */
export interface CreatedByProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Block Entity
 *
 * 블록의 핵심 정보와 비즈니스 로직을 캡슐화
 */
export class Block {
  private constructor(
    public readonly id: BlockId,
    public readonly workspaceId: string,
    public blockType: BlockType,
    public title: string,
    public properties: Record<string, any>,
    public customProperties: CustomPropertyDefinition[],
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
    public readonly createdBy?: string | CreatedByProfile
  ) {}

  /**
   * Block 생성
   *
   * @param id - Block ID
   * @param workspaceId - 워크스페이스 ID
   * @param blockType - 블록 타입
   * @param initialProperties - 초기 속성 값
   * @returns Block 인스턴스
   */
  static create(
    id: BlockId,
    workspaceId: string,
    blockType: BlockType,
    initialProperties: Record<string, any> = {},
    title: string = '새 블럭',
    createdBy?: string
  ): Block {
    const now = new Date();
    const defaultProperties = blockType.getDefaultProperties();
    const properties = { ...defaultProperties, ...initialProperties };

    return new Block(
      id,
      workspaceId,
      blockType,
      title,
      properties,
      [],
      now,
      now,
      null,
      createdBy
    );
  }

  /**
   * 기존 데이터로 Block 재구성 (Repository에서 사용)
   *
   * @param id - Block ID
   * @param workspaceId - 워크스페이스 ID
   * @param blockType - 블록 타입
   * @param properties - 속성 값
   * @param customProperties - 커스텀 속성 정의
   * @param createdAt - 생성 시각
   * @param updatedAt - 수정 시각
   * @param deletedAt - 삭제 시각
   * @returns Block 인스턴스
   */
  static reconstitute(
    id: BlockId,
    workspaceId: string,
    blockType: BlockType,
    title: string,
    properties: Record<string, any>,
    customProperties: CustomPropertyDefinition[],
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null,
    createdBy?: string | CreatedByProfile
  ): Block {
    return new Block(
      id,
      workspaceId,
      blockType,
      title,
      properties,
      customProperties,
      createdAt,
      updatedAt,
      deletedAt,
      createdBy
    );
  }

  /**
   * 블록 정보 업데이트
   *
   * @param updateData - 업데이트할 데이터
   */
  update(updateData: {
    title?: string;
    description?: string;
    properties?: Record<string, any>;
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

    // 설명 업데이트
    if (updateData.description !== undefined) {
      this.properties = {
        ...this.properties,
        description: updateData.description,
      };
    }

    // 속성 업데이트
    if (updateData.properties !== undefined) {
      this.properties = { ...this.properties, ...updateData.properties };
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

    // 새 타입의 기본 속성으로 업데이트
    const newDefaultProperties = newType.getDefaultProperties();
    this.properties = { ...newDefaultProperties };
    this.blockType = newType;
    this.updatedAt = new Date();
  }

  /**
   * 커스텀 속성 추가
   *
   * @param name - 속성 이름
   * @param type - 속성 타입
   * @param options - 선택형 속성 옵션
   */
  addCustomProperty(
    name: string,
    type: string,
    options: Array<{ id: string; label: string; color: string }> = []
  ): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    if (this.customProperties.length >= 50) {
      throw new BlockManagementError(
        'CUSTOM_PROPERTY_LIMIT_EXCEEDED',
        'Maximum 50 custom properties allowed'
      );
    }

    const propertyType = new PropertyType(type);
    const newProperty: CustomPropertyDefinition = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      options,
      order: this.customProperties.length,
      visible: true,
    };

    this.customProperties.push(newProperty);
    this.updatedAt = new Date();
  }

  /**
   * 커스텀 속성 타입 변경
   *
   * @param propertyId - 속성 ID
   * @param newType - 새로운 속성 타입
   * @param newOptions - 새로운 옵션
   */
  changePropertyType(
    propertyId: string,
    newType: string,
    newOptions: Array<{ id: string; label: string; color: string }> = []
  ): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    const property = this.customProperties.find(p => p.id === propertyId);
    if (!property) {
      throw new BlockManagementError(
        'PROPERTY_NOT_FOUND',
        'Custom property not found'
      );
    }

    const propertyType = new PropertyType(newType);
    property.type = newType;
    property.options = newOptions;
    this.updatedAt = new Date();
  }

  /**
   * 커스텀 속성 삭제
   *
   * @param propertyId - 속성 ID
   */
  deleteCustomProperty(propertyId: string): void {
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

    // 속성 정의와 값 모두 삭제
    this.customProperties.splice(propertyIndex, 1);
    delete this.properties[propertyId];
    this.updatedAt = new Date();
  }

  /**
   * 속성 값 설정
   *
   * @param propertyId - 속성 ID
   * @param value - 속성 값
   */
  setPropertyValue(propertyId: string, value: any): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    // 커스텀 속성인지 확인
    const customProperty = this.customProperties.find(p => p.id === propertyId);
    if (customProperty) {
      const propertyType = new PropertyType(customProperty.type);
      if (!propertyType.validateValue(value)) {
        throw new BlockManagementError(
          'PROPERTY_TYPE_MISMATCH',
          `Invalid value for property type ${customProperty.type}`
        );
      }
    }

    this.properties[propertyId] = value;
    this.updatedAt = new Date();
  }

  /**
   * 속성 값 초기화
   *
   * @param propertyId - 속성 ID
   */
  clearPropertyValue(propertyId: string): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    delete this.properties[propertyId];
    this.updatedAt = new Date();
  }

  /**
   * 미디어 파일 업로드
   *
   * @param file - 업로드할 파일
   * @param propertyId - 속성 ID
   * @returns 업로드된 파일 URL
   */
  async uploadMedia(file: File, propertyId: string): Promise<string> {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    // 파일 크기 검증
    const maxSize = file.type.startsWith('image/')
      ? 10 * 1024 * 1024
      : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BlockManagementError(
        'MEDIA_FILE_SIZE_EXCEEDED',
        `File size ${file.size} bytes exceeds maximum allowed size ${maxSize} bytes`
      );
    }

    // MIME 타입 검증
    const allowedMimeTypes = file.type.startsWith('image/')
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      : [
          'application/pdf',
          'text/plain',
          'application/json',
          'application/zip',
        ];

    if (!allowedMimeTypes.includes(file.type)) {
      throw new BlockManagementError(
        'MEDIA_FILE_TYPE_NOT_SUPPORTED',
        `MIME type ${file.type} is not supported`
      );
    }

    // 실제 업로드 로직은 Service Layer에서 처리
    // 여기서는 URL만 반환 (실제 구현에서는 Supabase Storage 사용)
    const mockUrl = `https://storage.example.com/${propertyId}/${file.name}`;
    this.properties[propertyId] = mockUrl;
    this.updatedAt = new Date();

    return mockUrl;
  }

  /**
   * 미디어 파일 삭제
   *
   * @param propertyId - 속성 ID
   */
  deleteMediaFile(propertyId: string): void {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot modify deleted block'
      );
    }

    delete this.properties[propertyId];
    this.updatedAt = new Date();
  }

  /**
   * 블록 툴 실행
   *
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @returns 실행 결과
   */
  async executeBlockTool(
    toolType: string,
    parameters: Record<string, any> = {}
  ): Promise<any> {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot execute tool on deleted block'
      );
    }

    const availableTools = this.blockType.getAvailableTools();
    if (!availableTools.includes(toolType)) {
      throw new BlockManagementError(
        'BLOCK_TOOL_EXECUTION_FAILED',
        `Tool ${toolType} is not available for block type ${this.blockType.value}`
      );
    }

    // 실제 툴 실행 로직은 Service Layer에서 처리
    // 여기서는 기본적인 검증만 수행
    this.updatedAt = new Date();

    return {
      success: true,
      toolType,
      result: `Tool ${toolType} executed successfully`,
      executedAt: new Date(),
    };
  }

  /**
   * AI 블록 툴 실행
   *
   * @param toolType - 툴 타입
   * @param parameters - 툴 파라미터
   * @param aiContext - AI 컨텍스트
   * @returns 실행 결과
   */
  async executeBlockToolByAI(
    toolType: string,
    parameters: Record<string, any> = {},
    aiContext: Record<string, any> = {}
  ): Promise<any> {
    if (this.isDeleted()) {
      throw new BlockManagementError(
        'BLOCK_ALREADY_DELETED',
        'Cannot execute tool on deleted block'
      );
    }

    const availableTools = this.blockType.getAvailableTools();
    if (!availableTools.includes(toolType)) {
      throw new BlockManagementError(
        'BLOCK_TOOL_EXECUTION_FAILED',
        `Tool ${toolType} is not available for block type ${this.blockType.value}`
      );
    }

    // AI 컨텍스트와 함께 툴 실행
    this.updatedAt = new Date();

    return {
      success: true,
      toolType,
      result: `AI Tool ${toolType} executed successfully`,
      aiContext,
      executedAt: new Date(),
    };
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
    return this.properties[propertyId];
  }

  /**
   * 모든 속성 가져오기
   *
   * @returns 모든 속성 값
   */
  getAllProperties(): Record<string, any> {
    return { ...this.properties };
  }

  /**
   * 커스텀 속성 정의 가져오기
   *
   * @returns 커스텀 속성 정의 목록
   */
  getCustomProperties(): CustomPropertyDefinition[] {
    return [...this.customProperties];
  }

  /**
   * 특정 커스텀 속성 정의 가져오기
   *
   * @param propertyId - 속성 ID
   * @returns 커스텀 속성 정의
   */
  getCustomProperty(propertyId: string): CustomPropertyDefinition | undefined {
    return this.customProperties.find(p => p.id === propertyId);
  }

  /**
   * 블록의 속성 검증
   *
   * @param properties - 검증할 속성들 (기본값: 현재 블록의 속성)
   * @returns 검증 결과
   */
  validateProperties(
    properties: Record<string, any> = this.properties
  ): boolean {
    // SSOT: block-properties.types.ts의 validateBlockProperties 사용
    return validateBlockProperties(this.blockType.value, properties);
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
   * 블록이 스켈레톤 상태인지 확인
   * (필수 속성이 비어있는 상태)
   *
   * @returns 스켈레톤 상태 여부
   */
  isSkeleton(): boolean {
    return isBlockSkeleton(this.blockType.value, this.properties);
  }

  /**
   * 블록이 완성된 상태인지 확인
   * (모든 필수 속성이 채워진 상태)
   *
   * @returns 완성 상태 여부
   */
  isCompleted(): boolean {
    return isBlockCompleted(this.blockType.value, this.properties);
  }

  /**
   * 블록의 완성도 퍼센트 계산
   *
   * @returns 완성도 퍼센트 (0-100)
   */
  getCompletionPercentage(): number {
    return getBlockCompletionPercentage(this.blockType.value, this.properties);
  }

  /**
   * 블록의 렌더링 상태 반환
   * (React Flow 노드에서 사용)
   *
   * @returns 렌더링 상태 ('skeleton' | 'completed')
   */
  getRenderState(): 'skeleton' | 'completed' {
    return this.isCompleted() ? 'completed' : 'skeleton';
  }

  /**
   * 블록의 JSON 표현 반환
   *
   * @returns 블록의 JSON 표현
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id.value,
      workspaceId: this.workspaceId,
      blockType: this.blockType.value,
      properties: this.properties,
      customProperties: this.customProperties,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      deletedAt: this.deletedAt?.toISOString() || null,
    };
  }
}
