/**
 * Block View Mode Value Object
 *
 * 블록의 보기 방식을 나타내는 Value Object
 * - note: 노트 보기 (content를 마크다운으로 표시)
 * - original: 오리지널 보기 (블록 고유의 UI)
 * - card: 카드 보기 (속성 중심 카드 형태)
 *
 * Value Object로 정의한 이유:
 * 1. 타입 안전성: 문자열 리터럴 대신 명시적 타입으로 컴파일 타임 검증
 * 2. 불변성 보장: readonly value로 값 변경 방지, equals() 메서드로 값 기반 비교
 * 3. 도메인 의미 명확화: 단순 문자열이 아닌 "블록의 보기 방식"이라는 비즈니스 개념 표현
 * 4. 검증 로직 캡슐화: create() 메서드에서 유효한 값만 허용 (향후 확장 가능)
 * 5. DDD 원칙 준수: 값 객체는 도메인 모델의 핵심 요소로, Entity와 구분하여 사용
 * 6. 테스트 용이성: equals(), toString() 등으로 일관된 동작 보장
 */

export type BlockViewModeValue = 'note' | 'original' | 'card';

export class BlockViewMode {
  constructor(public readonly value: BlockViewModeValue = 'original') {}

  static create(value: BlockViewModeValue): BlockViewMode {
    return new BlockViewMode(value);
  }

  static default(): BlockViewMode {
    return new BlockViewMode('original');
  }

  equals(other: BlockViewMode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
