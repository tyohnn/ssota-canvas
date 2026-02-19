import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeGlobBlocks } from '../internal-search/globBlocks/glob-blocks.service';
import type { GlobBlocksFinal } from '../internal-search/globBlocks/glob-blocks.service';
import type { BlockSearchRepository } from '../../../repositories/interfaces/block-search.repository.interface';
import { randomUUID } from 'crypto';

describe('glob-blocks.service', () => {
  const pageId = randomUUID();

  let mockRepo: BlockSearchRepository;

  beforeEach(() => {
    mockRepo = {
      findByContentPattern: vi.fn(),
      findByMetadata: vi.fn(),
      findContentByBlockMountId: vi.fn(),
      findBySourceContentPattern: vi.fn(),
      findBySourceSummaryPattern: vi.fn(),
    } as unknown as BlockSearchRepository;
  });

  async function runToFinal(
    args: Parameters<typeof executeGlobBlocks>[1],
    options?: { pageId?: string }
  ): Promise<GlobBlocksFinal> {
    const gen = executeGlobBlocks(mockRepo, args, options ?? { pageId });
    let final: GlobBlocksFinal | undefined;
    for (;;) {
      const { value, done } = await gen.next();
      if (done) {
        final = value as GlobBlocksFinal;
        break;
      }
    }
    return final as GlobBlocksFinal;
  }

  it('calls findByMetadata with single string query as one pattern and default queryMatchMode', async () => {
    vi.mocked(mockRepo.findByMetadata).mockResolvedValue([]);
    await runToFinal({ query: '마케팅' }, { pageId });
    expect(mockRepo.findByMetadata).toHaveBeenCalledTimes(1);
    expect(mockRepo.findByMetadata).toHaveBeenCalledWith(
      ['마케팅'],
      'any',
      expect.objectContaining({ pageId: expect.anything() }),
      50
    );
  });

  it('calls findByMetadata with multiple patterns and queryMatchMode "any"', async () => {
    vi.mocked(mockRepo.findByMetadata).mockResolvedValue([]);
    await runToFinal(
      { query: ['마케팅', '요약'], queryMatchMode: 'any' },
      { pageId }
    );
    expect(mockRepo.findByMetadata).toHaveBeenCalledWith(
      ['마케팅', '요약'],
      'any',
      expect.any(Object),
      expect.any(Number)
    );
  });

  it('calls findByMetadata with multiple patterns and queryMatchMode "all"', async () => {
    vi.mocked(mockRepo.findByMetadata).mockResolvedValue([]);
    await runToFinal(
      { query: ['마케팅', '요약'], queryMatchMode: 'all' },
      { pageId }
    );
    expect(mockRepo.findByMetadata).toHaveBeenCalledWith(
      ['마케팅', '요약'],
      'all',
      expect.any(Object),
      expect.any(Number)
    );
  });

  it('includes query and queryMatchMode in filteredBy when title filter applied', async () => {
    vi.mocked(mockRepo.findByMetadata).mockResolvedValue([
      {
        blockMountId: 'bm1',
        blockType: 'markdown',
        title: '마케팅 요약',
        parentBlockMountId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const final = await runToFinal(
      { query: ['마케팅', '요약'], queryMatchMode: 'all' },
      { pageId }
    );
    expect(final.filteredBy).toBeDefined();
    expect(final.filteredBy?.query).toEqual(['마케팅', '요약']);
    expect(final.filteredBy?.queryMatchMode).toBe('all');
  });

  it('passes limit to repository', async () => {
    vi.mocked(mockRepo.findByMetadata).mockResolvedValue([]);
    await runToFinal({ query: 'x', limit: 10 }, { pageId });
    expect(mockRepo.findByMetadata).toHaveBeenCalledWith(
      ['x'],
      'any',
      expect.any(Object),
      10
    );
  });

  it('returns empty blocks and no filteredBy.query when scope is missing', async () => {
    const final = await runToFinal({ query: 'x' }, {});
    expect(mockRepo.findByMetadata).not.toHaveBeenCalled();
    expect(final.blocks).toEqual([]);
    expect(final.totalBlocks).toBe(0);
  });
});
