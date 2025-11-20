import { BlockManagementError } from '../../errors/block-management.error';
import { BlockPropertiesVO } from './base.vo';

/**
 * LaTeX Block Properties Interface
 */
export interface LatexBlockProperties {
  formula: string;
  title?: string;
}

/**
 * LaTeX Block Properties Value Object
 *
 * LaTeX 수식 블록의 속성을 관리하는 Value Object
 */
export class LatexBlockPropertiesVO extends BlockPropertiesVO {
  constructor(
    public readonly formula: string,
    public readonly title?: string
  ) {
    super();
    this.validate();
  }

  protected validate(): boolean {
    if (typeof this.formula !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Formula must be a string'
      );
    }

    if (this.title !== undefined && typeof this.title !== 'string') {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Title must be a string'
      );
    }

    // LaTeX 수식이 비어있지 않은지 확인
    if (this.formula.trim().length === 0) {
      throw new BlockManagementError(
        'INVALID_PROPERTY_TYPE',
        'Formula cannot be empty'
      );
    }
    return true;
  }

  /**
   * 수식 업데이트
   */
  updateFormula(formula: string): LatexBlockPropertiesVO {
    return new LatexBlockPropertiesVO(formula, this.title);
  }

  /**
   * 제목 업데이트
   */
  updateTitle(title: string): LatexBlockPropertiesVO {
    return new LatexBlockPropertiesVO(this.formula, title);
  }

  /**
   * 제목 제거
   */
  removeTitle(): LatexBlockPropertiesVO {
    return new LatexBlockPropertiesVO(this.formula);
  }

  /**
   * 제목이 있는지 확인
   */
  hasTitle(): boolean {
    return this.title !== undefined && this.title.trim().length > 0;
  }

  /**
   * 수식이 비어있는지 확인
   */
  isEmpty(): boolean {
    return this.formula.trim().length === 0;
  }

  /**
   * 수식이 유효한지 확인 (기본적인 LaTeX 문법 검증)
   */
  isValid(): boolean {
    if (this.isEmpty()) return false;

    // 기본적인 LaTeX 수식 패턴 검증
    const hasMathDelimiters =
      this.formula.includes('$') ||
      this.formula.includes('\\(') ||
      this.formula.includes('\\[') ||
      this.formula.includes('\\begin{') ||
      this.formula.includes('\\end{');

    return hasMathDelimiters;
  }

  /**
   * 수식에 수학 기호가 포함되어 있는지 확인
   */
  hasMathSymbols(): boolean {
    const mathSymbols = [
      '+',
      '-',
      '*',
      '/',
      '=',
      '<',
      '>',
      '≤',
      '≥',
      '≠',
      '±',
      '×',
      '÷',
      '∑',
      '∏',
      '∫',
      '√',
      '∞',
      'α',
      'β',
      'γ',
      'δ',
      'ε',
      'π',
      'σ',
      'τ',
      'φ',
      'ψ',
      'ω',
    ];
    return mathSymbols.some(symbol => this.formula.includes(symbol));
  }

  /**
   * 수식의 복잡도 계산 (간단한 휴리스틱)
   */
  getComplexity(): 'simple' | 'medium' | 'complex' {
    const formula = this.formula;

    // 복잡한 LaTeX 명령어들
    const complexCommands = [
      '\\frac',
      '\\sum',
      '\\int',
      '\\lim',
      '\\sqrt',
      '\\begin',
      '\\end',
    ];
    const hasComplexCommands = complexCommands.some(cmd =>
      formula.includes(cmd)
    );

    // 중첩된 괄호나 중괄호
    const nestedBrackets = (formula.match(/\{.*\{.*\}.*\}/g) || []).length;
    const nestedParens = (formula.match(/\(.*\(.*\).*\)/g) || []).length;

    if (hasComplexCommands || nestedBrackets > 2 || nestedParens > 2) {
      return 'complex';
    } else if (formula.length > 50 || this.hasMathSymbols()) {
      return 'medium';
    } else {
      return 'simple';
    }
  }

  /**
   * 수식 미리보기 텍스트 생성
   */
  getPreviewText(): string {
    if (this.hasTitle()) {
      return `${this.title}: ${this.formula.substring(0, 50)}${this.formula.length > 50 ? '...' : ''}`;
    }
    return (
      this.formula.substring(0, 100) + (this.formula.length > 100 ? '...' : '')
    );
  }

  equals(other: LatexBlockPropertiesVO): boolean {
    return this.formula === other.formula && this.title === other.title;
  }

  toString(): string {
    return this.title || 'LaTeX Formula';
  }

  toJSON(): LatexBlockProperties {
    return {
      formula: this.formula,
      title: this.title,
    };
  }

  /**
   * JSON 데이터로부터 LatexBlockPropertiesVO 생성
   */
  static fromJSON(data: LatexBlockProperties): LatexBlockPropertiesVO {
    return new LatexBlockPropertiesVO(data.formula, data.title);
  }

  /**
   * 기본 LaTeX 속성 생성
   */
  static createDefault(): LatexBlockPropertiesVO {
    return new LatexBlockPropertiesVO('$x = y$');
  }
}
