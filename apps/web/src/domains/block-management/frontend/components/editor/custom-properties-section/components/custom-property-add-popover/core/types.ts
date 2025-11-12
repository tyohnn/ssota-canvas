import type { PropertyAddBusinessLogic } from './use-custom-property-add-popover.business';

export interface CustomPropertyAddPopoverProps {
  blockId: string;

  /**
   * 비즈니스 로직 주입 (선택)
   * - Production: 생략 시 기본 비즈니스 로직 사용
   * - Test/Mock: Mock 비즈니스 로직 주입
   * - Framer: 노코드 환경용 Mock 주입
   */
  businessLogic?: PropertyAddBusinessLogic;
}
