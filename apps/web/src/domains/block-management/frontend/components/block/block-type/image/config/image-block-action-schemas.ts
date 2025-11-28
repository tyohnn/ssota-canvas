import { z } from 'zod';

export const ImageBlockActionSchemas = {
  imageSearch: z.object({
    query: z.string().min(1, 'Search query is required'),
  }),

  generate: z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    modelId: z.string().optional(), // 기본값: google/gemini-2.5-flash-image
    negativePrompt: z.string().optional(), // Google 모델만 지원
    aspectRatio: z.string().optional(), // 기본값: 1:1, OpenAI는 size로 자동 변환
  }),

  searchStyle: z.object({}),
};
