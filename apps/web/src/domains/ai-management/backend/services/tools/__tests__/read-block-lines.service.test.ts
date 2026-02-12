import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executeReadBlockLines } from '../internal-search/read-block-lines.service';
import type { ReadBlockLinesFinal } from '../internal-search/read-block-lines.service';
import type { BlockSearchRepository } from '../../../repositories/interfaces/block-search.repository.interface';
import { randomUUID } from 'crypto';

describe('read-block-lines.service', () => {
  const pageId = randomUUID();
  const blockMountId = randomUUID();

  let mockRepo: BlockSearchRepository;

  beforeEach(() => {
    mockRepo = {
      findByContentPattern: vi.fn(),
      findByMetadata: vi.fn(),
      findContentByBlockMountId: vi.fn(),
      findSourceContentByBlockMountId: vi.fn(),
      findSourceSummaryByBlockMountId: vi.fn(),
      findBySourceContentPattern: vi.fn(),
      findBySourceSummaryPattern: vi.fn(),
    } as unknown as BlockSearchRepository;
  });

  async function runToFinal(
    args: Parameters<typeof executeReadBlockLines>[1],
    options?: { pageId?: string }
  ): Promise<ReadBlockLinesFinal> {
    const gen = executeReadBlockLines(mockRepo, args, options ?? { pageId });
    let final: ReadBlockLinesFinal | undefined;
    for (;;) {
      const { value, done } = await gen.next();
      if (done) {
        final = value as ReadBlockLinesFinal;
        break;
      }
    }
    return final as ReadBlockLinesFinal;
  }

  it('reads from source_content when source is source_content', async () => {
    vi.mocked(mockRepo.findSourceContentByBlockMountId).mockResolvedValue({
      blockMountId,
      blockType: 'youtube',
      title: 'Video',
      rawContent: 'Line one\nLine two\nLine three',
    });
    const final = await runToFinal(
      { blockMountId, source: 'source_content' },
      { pageId }
    );
    expect(mockRepo.findSourceContentByBlockMountId).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything()
    );
    expect(mockRepo.findContentByBlockMountId).not.toHaveBeenCalled();
    expect(final.source).toBe('source_content');
    expect(final.blockType).toBe('youtube');
    expect(final.title).toBe('Video');
    expect(final.totalLines).toBe(3);
    expect(final.content).toContain('1| Line one');
    expect(final.content).toContain('2| Line two');
    expect(final.content).toContain('3| Line three');
  });

  it('reads from source_summary when source is source_summary and sets summaryLanguage', async () => {
    vi.mocked(mockRepo.findSourceSummaryByBlockMountId).mockResolvedValue({
      blockMountId,
      blockType: 'youtube',
      title: 'Video',
      language: 'ko',
      summary: '요약 첫 줄\n요약 둘째 줄',
    });
    const final = await runToFinal(
      { blockMountId, source: 'source_summary', summaryLanguage: 'ko' },
      { pageId }
    );
    expect(mockRepo.findSourceSummaryByBlockMountId).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'ko'
    );
    expect(mockRepo.findContentByBlockMountId).not.toHaveBeenCalled();
    expect(final.source).toBe('source_summary');
    expect(final.summaryLanguage).toBe('ko');
    expect(final.totalLines).toBe(2);
    expect(final.content).toContain('1| 요약 첫 줄');
    expect(final.content).toContain('2| 요약 둘째 줄');
  });

  it('defaults to content_raw and calls findContentByBlockMountId', async () => {
    vi.mocked(mockRepo.findContentByBlockMountId).mockResolvedValue({
      blockMountId,
      blockType: 'markdown',
      title: 'Note',
      contentRaw: 'Hello\nWorld',
    });
    const final = await runToFinal({ blockMountId }, { pageId });
    expect(mockRepo.findContentByBlockMountId).toHaveBeenCalledTimes(1);
    expect(mockRepo.findSourceContentByBlockMountId).not.toHaveBeenCalled();
    expect(mockRepo.findSourceSummaryByBlockMountId).not.toHaveBeenCalled();
    expect(final.source).toBe('content_raw');
    expect(final.totalLines).toBe(2);
  });
});
