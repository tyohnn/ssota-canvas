import type { AlignmentType } from '../../../core/types';

export interface ArrangeMenuProps {
  onAlign: (alignmentType: AlignmentType) => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  selectedBlockCount: number;
}
