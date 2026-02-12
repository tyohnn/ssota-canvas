import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeGrepBlockContent } from '../grep-block-content.service';
import type { GrepBlockContentFinal } from '../grep-block-content.service';
import type { BlockSearchRepository } from '../../../repositories/interfaces/block-search.repository.interface';
import { randomUUID } from 'crypto';

/**
 * grepBlockContent service unit tests.
 * Verifies content_raw, source_content, and source_summary branches and result merging.
 */
describe('grep-block-content.service', () => {
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
    args: Parameters<typeof executeGrepBlockContent>[1],
    options?: { pageId?: string }
  ): Promise<GrepBlockContentFinal> {
    const gen = executeGrepBlockContent(mockRepo, args, options ?? { pageId });
    let final: GrepBlockContentFinal | undefined;
    for (;;) {
      const { value, done } = await gen.next();
      if (done) {
        final = value as GrepBlockContentFinal;
        break;
      }
    }
    return final as GrepBlockContentFinal;
  }

  describe('default behavior', () => {
    it('calls content_raw, source_content, and source_summary and merges results by block', async () => {
      vi.mocked(mockRepo.findByContentPattern).mockResolvedValue([
        {
          blockMountId: 'bm1',
          blockType: 'youtube',
          title: 'Video',
          contentRaw: 'block text with foo',
        },
      ]);
      vi.mocked(mockRepo.findBySourceContentPattern).mockResolvedValue([
        {
          blockMountId: 'bm1',
          blockType: 'youtube',
          title: 'Video',
          rawContent: 'transcript line with foo',
        },
      ]);
      vi.mocked(mockRepo.findBySourceSummaryPattern).mockResolvedValue([
        {
          blockMountId: 'bm1',
          blockType: 'youtube',
          title: 'Video',
          language: 'ko',
          summary: '요약에 foo 포함',
        },
      ]);

      const final: GrepBlockContentFinal = await runToFinal({
        patterns: ['foo'],
        pageId,
      });

      expect(mockRepo.findByContentPattern).toHaveBeenCalledTimes(1);
      expect(mockRepo.findBySourceContentPattern).toHaveBeenCalledTimes(1);
      expect(mockRepo.findBySourceSummaryPattern).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Object),
        undefined
      );

      expect(final.matches).toHaveLength(1);
      const block = final.matches[0]!;
      expect(block.blockMountId).toBe('bm1');
      const sources = block.matches.map(m => m.source);
      expect(sources).toContain('content_raw');
      expect(sources).toContain('source_content');
      expect(sources).toContain('source_summary');
      expect(final.totalMatches).toBe(block.matches.length);
    });

    it('passes summaryLanguages to findBySourceSummaryPattern when provided', async () => {
      vi.mocked(mockRepo.findByContentPattern).mockResolvedValue([]);
      vi.mocked(mockRepo.findBySourceContentPattern).mockResolvedValue([]);
      vi.mocked(mockRepo.findBySourceSummaryPattern).mockResolvedValue([]);

      await runToFinal({
        patterns: ['x'],
        pageId,
        summaryLanguages: ['ko', 'en'],
      });

      expect(mockRepo.findBySourceSummaryPattern).toHaveBeenCalledWith(
        ['x'],
        expect.any(Object),
        ['ko', 'en']
      );
    });
  });
});
