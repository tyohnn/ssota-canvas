import type { BlockAggregate } from '../../../shared/aggregates/block.aggregate';
import type { IBlockRepository } from '../../repositories/interfaces/block.repository.interface';

export type PropertyOptionInput = {
  id?: string;
  label: string;
  value?: string;
  color?: string;
  order?: number;
  disabled?: boolean;
  description?: string;
};

export type PropertyValidationInput = {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
};

export type AddCustomPropertyParams = {
  blockAggregate: BlockAggregate;
  blockRepository: IBlockRepository;
  property: {
    id?: string;
    name: string;
    type: string;
    options?: PropertyOptionInput[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    icon?: string | null;
    validation?: PropertyValidationInput;
  };
};

export type UpdateCustomPropertyParams = {
  blockAggregate: BlockAggregate;
  blockRepository: IBlockRepository;
  propertyId: string;
  updates: {
    name?: string;
    type?: string;
    options?: PropertyOptionInput[];
    order?: number;
    visible?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    icon?: string | null;
    validation?: PropertyValidationInput;
  };
};

export type DeleteCustomPropertyParams = {
  blockAggregate: BlockAggregate;
  blockRepository: IBlockRepository;
  propertyId: string;
};
