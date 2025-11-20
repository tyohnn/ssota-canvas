import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * React Component Block Properties Interface
 */
export interface ReactComponentBlockProperties {
  componentName: string;
  props: Record<string, any>;
}

/**
 * React Component Block Properties Value Object
 *
 * React 컴포넌트 블록의 속성을 관리하는 Value Object
 */
export class ReactComponentBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly componentName: string,
    public readonly props: Record<string, any>
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (
      typeof this.componentName !== 'string' ||
      this.componentName.trim().length === 0
    ) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Component name must be a non-empty string'
      );
    }

    if (typeof this.props !== 'object' || this.props === null) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Props must be an object'
      );
    }

    // 컴포넌트명 형식 검증 (React 컴포넌트 네이밍 컨벤션)
    if (!this.isValidComponentName(this.componentName)) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Invalid component name format'
      );
    }
    return true;
  }

  /**
   * React 컴포넌트명 형식 검증
   */
  private isValidComponentName(name: string): boolean {
    // PascalCase 형식 검증
    const pascalCaseRegex = /^[A-Z][a-zA-Z0-9]*$/;
    return pascalCaseRegex.test(name);
  }

  /**
   * 컴포넌트명 업데이트
   */
  updateComponentName(componentName: string): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO(componentName, this.props);
  }

  /**
   * Props 업데이트
   */
  updateProps(props: Record<string, any>): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO(this.componentName, props);
  }

  /**
   * 특정 prop 업데이트
   */
  updateProp(key: string, value: any): ReactComponentBlockPropertiesVO {
    const newProps = { ...this.props, [key]: value };
    return new ReactComponentBlockPropertiesVO(this.componentName, newProps);
  }

  /**
   * 특정 prop 제거
   */
  removeProp(key: string): ReactComponentBlockPropertiesVO {
    const newProps = { ...this.props };
    delete newProps[key];
    return new ReactComponentBlockPropertiesVO(this.componentName, newProps);
  }

  /**
   * 특정 prop 가져오기
   */
  getProp(key: string): any {
    return this.props[key];
  }

  /**
   * 특정 prop이 있는지 확인
   */
  hasProp(key: string): boolean {
    return key in this.props;
  }

  /**
   * Props 개수 반환
   */
  getPropsCount(): number {
    return Object.keys(this.props).length;
  }

  /**
   * Props가 비어있는지 확인
   */
  hasProps(): boolean {
    return this.getPropsCount() > 0;
  }

  /**
   * 컴포넌트가 유효한지 확인
   */
  isValid(): boolean {
    return this.componentName.trim().length > 0;
  }

  /**
   * 컴포넌트 import 문 생성
   */
  getImportStatement(): string {
    return `import ${this.componentName} from './${this.componentName}';`;
  }

  /**
   * 컴포넌트 사용 예시 생성
   */
  getUsageExample(): string {
    const propsString = this.hasProps()
      ? ` ${Object.entries(this.props)
          .map(([key, value]) => `${key}={${JSON.stringify(value)}}`)
          .join(' ')}`
      : '';

    return `<${this.componentName}${propsString} />`;
  }

  /**
   * Props를 JSON 문자열로 변환
   */
  getPropsAsJson(): string {
    return JSON.stringify(this.props, null, 2);
  }

  equals(other: ReactComponentBlockPropertiesVO): boolean {
    return (
      this.componentName === other.componentName &&
      JSON.stringify(this.props) === JSON.stringify(other.props)
    );
  }

  toString(): string {
    return this.componentName || 'Untitled Component';
  }

  toJSON(): ReactComponentBlockProperties {
    return {
      componentName: this.componentName,
      props: this.props,
    };
  }

  /**
   * JSON 데이터로부터 ReactComponentBlockPropertiesVO 생성
   */
  static fromJSON(
    data: ReactComponentBlockProperties
  ): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO(data.componentName, data.props);
  }

  /**
   * 기본 React 컴포넌트 속성 생성
   */
  static createDefault(): ReactComponentBlockPropertiesVO {
    return new ReactComponentBlockPropertiesVO('MyComponent', {});
  }
}
