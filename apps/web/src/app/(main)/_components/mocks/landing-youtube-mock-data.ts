/**
 * Landing Page YouTube Mock Data
 *
 * Shared mock data for YouTube block and editor panel across landing page.
 * Source: Y Combinator "How To Get Your First Users"
 */

export const YOUTUBE_VIDEO_ID = "0kARDVL2nZg";

export const LANDING_YOUTUBE_PROPERTIES = {
  url: "https://www.youtube.com/watch?v=0kARDVL2nZg",
  likeCount: 4002,
  viewCount: 72098,
  youtubeId: "7af97c36-ddef-4408-8f40-c5494cbc2c87",
  channelName: "Y Combinator",
  publishedAt: "2026-01-14T15:00:05.000Z",
  commentCount: 91,
  youtubeTitle: "How To Get Your First Users",
  channelThumbnail:
    "https://yt3.ggpht.com/dGyATx87Fp_s1nZvnupUFSnMqbAPZ6nqRby9Esk1m6YE41iBq-9Z8iGoIgHTCT9SiDBUpP2V=s800-c-k-c0x00ffffff-no-rj",
  youtubeChannelId: "UCcefcZRL2oaA_uBNeo5UOWg",
  youtubeThumbnail: "https://i.ytimg.com/vi/0kARDVL2nZg/hqdefault.jpg",
  youtubeDescription:
    "When you're starting out, it isn't enough to just build a minimum viable product. You also need a minimum evolvable product - one that can adapt to the needs of those critical early customers. \n\nIn this episode of Main Function, YC General Partner Ankit Gupta offers an update to the classic MVP playbook. He'll outline strategies for getting your first customers, the power of adaptability and how feedback from early users will ultimately shape the future of your product and your company.\n\nApply to Y Combinator: https://www.ycombinator.com/apply\nWork at a startup: https://www.ycombinator.com/jobs\n\nChapters:\n00:00 - The Minimum Evolvable Product Playbook\n00:46 - Finding the First True Believers\n01:29 - Counterintuitive Rules To Get Early Users\n02:10 - Learn Fast And Don't Fear Churn\n02:52 - How Early Users Shape the Market You Enter\n04:22 - Tesla Case Study\n05:14 - Conclusion",
} as const;

export const LANDING_MOCK_BLOCK_DATA = {
  blockId: "mock-block-id",
  blockMountId: "mock-mount-id",
  blockType: "youtube" as const,
  properties: LANDING_YOUTUBE_PROPERTIES,
};
