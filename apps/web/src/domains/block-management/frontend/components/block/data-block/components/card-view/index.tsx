/**
 * Card View Component
 *
 * Container Component: Hook → Props 변환
 *
 * 모든 블록의 커스텀 속성을 카드 형태로 표시하는 View
 */

'use client';

import { CardViewView } from './components/card-view-view';
import type { CardViewBusinessLogic, CardViewProps } from './core/types';
import { useCardView } from './core/use-card-view';

export interface CardViewComponentProps extends CardViewProps {
  businessLogic?: CardViewBusinessLogic;
}

/**
 * Card View Component
 *
 * Hook을 사용하여 데이터를 가져오고 Props로 전달
 */
export function CardView(props: CardViewComponentProps) {
  const { businessLogic, ...restProps } = props;
  const { viewProps } = useCardView(restProps, {
    businessLogic,
  });

  return <CardViewView {...viewProps} />;
}
