/**
 * Welcome page block templates
 *
 * 초기 가이드용 블록 정의 (마크다운 블록)
 */

import {
  BlockType,
  VIEW_MODE_DEFAULT_SIZES,
} from '@/domains/block-management/shared/types/block-types';
import { markdownToTiptapServerSafe } from '@/domains/block-management/shared/utils/tiptap-markdown.utils';

const GAP_X = 24;
const START_X = 80;
const START_Y = 100;
const MARKDOWN_NOTE_SIZE = VIEW_MODE_DEFAULT_SIZES.note;

/** Welcome 블록 1: 환영 메시지 (제목은 블록 title로 표시되므로 h1 제외) */
const WELCOME_MARKDOWN = `SSOTA is your AI-powered workspace. Think of it as a canvas where your ideas, links, and files become **blocks** — and the AI helps you read, summarize, and talk about them.

**What is a block?**
A block is a single piece of content: a note, a link, a YouTube video, a PDF, or a file. You place blocks on the canvas, connect them, and add your own notes.

**What can you do?**
- **Notes** — Write or paste text. Take notes on anything.
- **Links** — Save URLs. SSOTA fetches the page and creates a summary for you.
- **YouTube** — Add a video. Get a transcript and summary, then chat with the AI about it.
- **Files** — Attach PDFs, images, or audio. The AI can read and summarize them.

**How does the AI help?**
The AI can read your blocks — summaries, extracted text, metadata. Ask it to explain a video, compare two links, or turn your notes into something new. It can also research topics on the web and organize findings into blocks for you.

**Try it now:** Add a YouTube link, wait a moment for the summary, then open the chat panel and ask "What is this video about?"`;

/** Welcome 블록 2: Quick Start */
const QUICK_START_MARKDOWN = `**Adding a block**

The toolbar at the top has **Note**, **Shape**, **Link**, **File**, and **Audio**. The flow depends on the type:

1. **Note, Shape, Audio** — Click the button, then click on the canvas. The block appears right away. For Note, double-click to type.
2. **Link** — Click Link, click the canvas, paste a URL, press Enter.
3. **File** — Click File, click the canvas, drag a file in or click to choose.

**Every block has an Editor Panel**

Click any block to open the **Editor Panel** on the right. There you'll see tabs such as:
- **Note** — Your own notes on this block
- **Summary** — AI-generated summary
- **Extract** — Full text extracted from the source
- **Metadata** — Title, URL, and other info

Tabs vary by block type. YouTube, Link, and PDF blocks automatically extract content and generate summaries so the AI can read and chat with you about them.

**Move:** Drag blocks to reposition. **Connect:** Draw edges between blocks.`;

/** Welcome 블록 3: AI 에이전트 사용법 */
const AI_AGENT_MARKDOWN = `The **chat panel** on the right side of the canvas lets you work with the AI agent.

**Open the chat:** Click the chat icon (💬) on the right edge if the panel is collapsed.

**What you can do:**
- Ask questions about your blocks and content
- Research topics and organize results
- Add links, summarize text, or generate content

Start a new chat with the **+** button, or browse past conversations with the history icon.`;

/** Welcome 블록 4: 튜토리얼 안내 */
const TUTORIAL_MARKDOWN = `Click the **Tutorial** button in the sidebar (book icon) to open the Getting Started guide.

The tutorial will walk you through:
- Adding your first block
- Placing and selecting blocks
- Editing content

Complete it to get comfortable with SSOTA!`;

/** Welcome 블록 5: 블록 타입 소개 */
const BLOCK_TYPES_MARKDOWN = `The canvas toolbar offers these block types:

- **Note** - Rich text notes (you're reading one!)
- **Shape** - Geometric shapes
- **Link** - URLs with preview
- **File** - Attach files
- **Audio** - Audio players

More types (YouTube, Image, PDF, etc.) are available in the add block menu.`;

export interface WelcomeBlockDef {
  blockType: typeof BlockType.MARKDOWN;
  title: string;
  markdown: string;
}

export const WELCOME_BLOCK_DEFS: WelcomeBlockDef[] = [
  { blockType: BlockType.MARKDOWN, title: 'Welcome to SSOTA', markdown: WELCOME_MARKDOWN },
  { blockType: BlockType.MARKDOWN, title: 'Quick Start', markdown: QUICK_START_MARKDOWN },
  { blockType: BlockType.MARKDOWN, title: 'Using the AI Agent', markdown: AI_AGENT_MARKDOWN },
  { blockType: BlockType.MARKDOWN, title: 'Try the Tutorial', markdown: TUTORIAL_MARKDOWN },
  { blockType: BlockType.MARKDOWN, title: 'Block Types', markdown: BLOCK_TYPES_MARKDOWN },
];

/**
 * Create Welcome page block definitions with layout (position, size, content)
 */
export function buildWelcomeBlocksConfig() {
  let currentX = START_X;

  return WELCOME_BLOCK_DEFS.map((def) => {
    const block = {
      blockType: def.blockType as 'markdown',
      title: def.title,
      position: { x: currentX, y: START_Y },
      size: { width: MARKDOWN_NOTE_SIZE.width, height: MARKDOWN_NOTE_SIZE.height },
      viewMode: 'note' as const,
      initialContent: markdownToTiptapServerSafe(def.markdown),
    };
    currentX += MARKDOWN_NOTE_SIZE.width + GAP_X;
    return block;
  });
}
