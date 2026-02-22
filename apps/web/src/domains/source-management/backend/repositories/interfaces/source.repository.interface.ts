import type { SourceTypeValue } from '../../../shared/value-objects/source-type.vo';

import { Source } from '../../../shared/entities/source.entity';
import { SourceId } from '../../../shared/value-objects/source-id.vo';

export interface ISourceRepository {
  create(source: Source): Promise<void>;
  update(source: Source): Promise<void>;
  findById(id: SourceId): Promise<Source | null>;
  findByUrl(url: string): Promise<Source | null>;
  findByUrlHash(urlHash: string): Promise<Source | null>;
  findNonExpiredByUrl(
    url: string,
    sourceType?: SourceTypeValue
  ): Promise<Source | null>;
}
