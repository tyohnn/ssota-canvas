"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AIInput,
  AIInputTextarea,
  AIInputToolbar,
  AIInputSubmit,
  AIInputTools,
  AIInputButton,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
} from "@workspace/ui/components/kibo-ui/ai/input";
import { AIResponse } from "@workspace/ui/components/kibo-ui/ai/response";
import {
  AIReasoning,
  AIReasoningContent,
  AIReasoningTrigger,
} from "@workspace/ui/components/kibo-ui/ai/reasoning";
import {
  AISources,
  AISourcesContent,
  AISourcesTrigger,
  AISource,
} from "@workspace/ui/components/kibo-ui/ai/source";
import {
  AITool,
  AIToolContent,
  AIToolHeader,
  AIToolParameters,
  AIToolResult,
  type AIToolStatus,
} from "@workspace/ui/components/kibo-ui/ai/tool";
import { ScrollArea } from "@workspace/ui/components/ui/scroll-area";
import { Button } from "@workspace/ui/components/ui/button";
import { MessageSquare, X, PlusIcon, MicIcon, GlobeIcon } from "lucide-react";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  reasoning?: string;
  sources?: Array<{ href: string; title: string }>;
  tools?: Array<{
    name: string;
    description: string;
    status: AIToolStatus;
    parameters: Record<string, unknown>;
    result: string | undefined;
    error: string | undefined;
  }>;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIChatPanelProps {
  className?: string;
}

// Fake data for demo
const mockTokens = [
  "### AI Assistant Response",
  "\n\n",
  "I can help you with your workflow canvas questions! ",
  "Here are some key insights about the current system:",
  "\n\n",
  "**Canvas Components:**",
  "\n",
  "- TopToolbox: Controls zoom, grid, and file operations",
  "\n",
  "- EditorPanel: Properties editor as overlay",
  "\n",
  "- Canvas: React Flow based node editor",
  "\n\n",
  "```typescript",
  "\n",
  "const canvasState = useCanvas();",
  "\n",
  "const { displayBlocks, selectedBlocks } = canvasState;",
  "\n",
  "```",
  "\n\n",
  "The system uses **Context API** to manage state and reduce prop drilling.",
  "\n\n",
  "Would you like me to explain any specific part in more detail?",
];

const mockReasoningSteps = [
  "Let me analyze the current canvas architecture step by step.",
  "\n\nI can see this is a React Flow based workflow editor with several key components:",
  "\n\n1. **Canvas Context**: Centralized state management using React Context API",
  "\n\n2. **Resizable Panels**: Flexible UI layout with resizable panels",
  "\n\n3. **Block/Node System**: Workflow elements as draggable nodes",
  "\n\n4. **AI Chat Panel**: New feature for AI assistance",
  "\n\nThe user is asking about the canvas system, so I should provide helpful information about the current implementation and offer assistance with specific questions.",
];

const mockSources = [
  { href: "https://reactflow.dev/docs", title: "React Flow Documentation" },
  {
    href: "https://react.dev/reference/react/useContext",
    title: "React Context API",
  },
  { href: "https://tailwindcss.com/docs", title: "Tailwind CSS Documentation" },
  { href: "https://nextjs.org/docs", title: "Next.js Documentation" },
  {
    href: "https://typescriptlang.org/docs",
    title: "TypeScript Documentation",
  },
];

const mockTools = [
  {
    name: "database_query",
    description: "Fetching canvas component data",
    status: "completed" as AIToolStatus,
    parameters: {
      query: "SELECT * FROM canvas_components WHERE type = ?",
      params: ["workflow"],
      database: "canvas_db",
    },
    result: `| Component | Type | Status | Usage |
|-----------|------|--------|-------|
| TopToolbox | Control | Active | 100% |
| EditorPanel | Overlay | Active | 85% |
| Canvas | Node Editor | Active | 95% |
| AIChatPanel | Assistant | New | 10% |`,
    error: undefined,
  },
  {
    name: "file_analyzer",
    description: "Analyzing code structure",
    status: "completed" as AIToolStatus,
    parameters: {
      path: "./src/domains/workflow-canvas",
      analysis: "component_structure",
    },
    result:
      "Found 15 components, 3 contexts, 8 hooks. Architecture follows React best practices.",
    error: undefined,
  },
];

const models = [
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-2", name: "Claude 2" },
  { id: "claude-instant", name: "Claude Instant" },
  { id: "palm-2", name: "PaLM 2" },
  { id: "llama-2-70b", name: "Llama 2 70B" },
  { id: "llama-2-13b", name: "Llama 2 13B" },
  { id: "cohere-command", name: "Command" },
  { id: "mistral-7b", name: "Mistral 7B" },
];

export function AIChatPanel({ className }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(
    models[0]?.id || "gpt-4"
  );
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 10); // Small delay to ensure DOM is updated
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize with a welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: "welcome-1",
      type: "ai",
      content:
        "### Welcome to AI Assistant\n\nI can help you with your workflow canvas questions. What would you like to know?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Function to chunk text into fake tokens
  const chunkIntoTokens = useCallback((text: string): string[] => {
    const tokens: string[] = [];
    let i = 0;
    while (i < text.length) {
      const chunkSize = Math.floor(Math.random() * 3) + 2; // Random size between 2-4
      tokens.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return tokens;
  }, []);

  // Simulate AI response with streaming
  const simulateAIResponse = useCallback(
    (userMessage: string) => {
      const aiMessageId = `ai-${Date.now()}`;

      // Add user message immediately
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        type: "user",
        content: userMessage,
        timestamp: new Date(),
      };

      // Add empty AI message that will be streamed
      const aiMsg: ChatMessage = {
        id: aiMessageId,
        type: "ai",
        content: "",
        reasoning: "",
        sources: mockSources,
        tools: mockTools,
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      // Simulate reasoning streaming first
      const reasoningTokens = chunkIntoTokens(mockReasoningSteps.join(""));
      let reasoningIndex = 0;

      const reasoningInterval = setInterval(() => {
        if (reasoningIndex < reasoningTokens.length) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId
                ? {
                    ...msg,
                    reasoning:
                      (msg.reasoning || "") + reasoningTokens[reasoningIndex],
                  }
                : msg
            )
          );
          reasoningIndex++;
        } else {
          clearInterval(reasoningInterval);

          // After reasoning, start main response
          const responseTokens = mockTokens;
          let responseIndex = 0;

          const responseInterval = setInterval(() => {
            if (responseIndex < responseTokens.length) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId
                    ? {
                        ...msg,
                        content:
                          (msg.content || "") + responseTokens[responseIndex],
                      }
                    : msg
                )
              );
              responseIndex++;
            } else {
              clearInterval(responseInterval);
              setIsStreaming(false);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
                )
              );
            }
          }, 30);
        }
      }, 20);
    },
    [chunkIntoTokens]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    simulateAIResponse(inputValue);
    setInputValue("");
  };

  const clearChat = () => {
    setMessages([]);
    setIsStreaming(false);
  };

  return (
    <div
      className={`flex flex-col h-full bg-background border-l border-border overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            AI Assistant
          </h3>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearChat}
          className="h-6 w-6 p-0"
          title="Clear Chat"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
        <div className="p-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-24 text-center">
              <div className="text-muted-foreground">
                <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-50" />
                <p className="text-xs">
                  Start a conversation with AI Assistant
                </p>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              {/* User Message */}
              {message.type === "user" && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-primary-foreground rounded-lg px-2 py-1.5">
                    <div className="text-xs font-medium opacity-80 mb-0.5">
                      You
                    </div>
                    <div className="text-xs break-words whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              )}

              {/* AI Message */}
              {message.type === "ai" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3 text-primary" />
                    <div className="text-xs font-medium text-primary">
                      AI Assistant
                    </div>
                  </div>

                  {/* Reasoning */}
                  {message.reasoning && (
                    <AIReasoning isStreaming={message.isStreaming}>
                      <AIReasoningTrigger />
                      <AIReasoningContent>
                        {message.reasoning}
                      </AIReasoningContent>
                    </AIReasoning>
                  )}

                  {/* Tools */}
                  {message.tools && message.tools.length > 0 && (
                    <div className="space-y-1.5">
                      {message.tools.map((tool, index) => (
                        <AITool key={`${tool.name}-${index}`}>
                          <AIToolHeader
                            description={tool.description}
                            name={tool.name}
                            status={tool.status}
                          />
                          <AIToolContent>
                            <AIToolParameters parameters={tool.parameters} />
                            {(tool.result || tool.error) && (
                              <AIToolResult
                                error={tool.error}
                                result={<AIResponse>{tool.result}</AIResponse>}
                              />
                            )}
                          </AIToolContent>
                        </AITool>
                      ))}
                    </div>
                  )}

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <AISources>
                      <AISourcesTrigger count={message.sources.length} />
                      <AISourcesContent>
                        {message.sources.map((source) => (
                          <AISource
                            key={source.href}
                            href={source.href}
                            title={source.title}
                          />
                        ))}
                      </AISourcesContent>
                    </AISources>
                  )}

                  {/* Main Response */}
                  {message.content && (
                    <div className="bg-muted/30 rounded-lg border border-border/50 p-2 max-h-80 overflow-y-auto w-full">
                      <div className="w-full overflow-hidden">
                        <AIResponse
                          className="break-words w-full max-w-full text-xs [&_*]:max-w-full [&_pre]:max-w-full [&_code]:max-w-full [&_p]:break-words [&_li]:break-words [&_h1]:break-words [&_h2]:break-words [&_h3]:break-words [&_h4]:break-words [&_h5]:break-words [&_h6]:break-words [&_ul]:break-words [&_ol]:break-words"
                          style={{
                            wordWrap: "break-word",
                            overflowWrap: "break-word",
                          }}
                        >
                          {message.content}
                        </AIResponse>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Bottom spacer for better scroll experience */}
          <div className="h-4" />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <AIInput onSubmit={handleSubmit}>
          <AIInputTextarea
            value={inputValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInputValue(e.target.value)
            }
            placeholder="Ask about your workflow canvas..."
            disabled={isStreaming}
            maxHeight={100}
            className="text-xs"
          />
          <AIInputToolbar>
            <AIInputTools>
              <AIInputButton>
                <PlusIcon size={14} />
              </AIInputButton>
              <AIInputButton>
                <MicIcon size={14} />
              </AIInputButton>
              <AIInputButton>
                <GlobeIcon size={14} />
                <span className="text-xs">Search</span>
              </AIInputButton>
              <AIInputModelSelect
                onValueChange={setSelectedModel}
                value={selectedModel}
              >
                <AIInputModelSelectTrigger>
                  <AIInputModelSelectValue />
                </AIInputModelSelectTrigger>
                <AIInputModelSelectContent>
                  {models.map((model) => (
                    <AIInputModelSelectItem key={model.id} value={model.id}>
                      {model.name}
                    </AIInputModelSelectItem>
                  ))}
                </AIInputModelSelectContent>
              </AIInputModelSelect>
            </AIInputTools>
            <AIInputSubmit
              disabled={!inputValue.trim() || isStreaming}
              status={isStreaming ? "streaming" : "ready"}
            />
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
}
