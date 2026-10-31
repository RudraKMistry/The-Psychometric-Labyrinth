import { LLMProvider } from '../../types';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface LLMRequestOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
}

export interface DualRailConfig {
  provider: LLMProvider;
  geminiApiKey: string;
  geminiModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
}

