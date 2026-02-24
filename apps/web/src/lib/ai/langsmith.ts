/**
 * LangSmith tracing for Vercel AI SDK.
 *
 * Set env for tracing:
 *   LANGCHAIN_TRACING=true
 *   LANGCHAIN_API_KEY=<your-langsmith-api-key>
 *
 * @see https://docs.langchain.com/langsmith/trace-with-vercel-ai-sdk
 */

import * as ai from 'ai';
import { wrapAISDK } from 'langsmith/experimental/vercel';

const wrapped = wrapAISDK(ai);

export const generateText = wrapped.generateText;
export const streamText = wrapped.streamText;

export { traceable } from 'langsmith/traceable';
