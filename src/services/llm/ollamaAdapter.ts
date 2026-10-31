import { LLMRequestOptions, StreamCallbacks } from './types';

/**
 * Streaming adapter for local Ollama HTTP instance (e.g. gemma4:e4b)
 * Uses the NDJSON /api/chat streaming endpoint via Vite proxy (/ollama-proxy)
 */
export async function streamOllama(
  options: LLMRequestOptions,
  endpoint = '/ollama-proxy',
  model = 'gemma4:e4b',
  callbacks: StreamCallbacks
): Promise<void> {
  const url = `${endpoint.replace(/\/$/, '')}/api/chat`;

  const messages = [...options.messages];
  if (options.systemPrompt && !messages.some((m) => m.role === 'system')) {
    messages.unshift({ role: 'system', content: options.systemPrompt });
  }

  const payload = {
    model,
    messages,
    stream: true,
    options: {
      num_predict: options.maxTokens || 150, // Frugal token cap
      temperature: options.temperature ?? 0.7,
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama HTTP ${res.status}: ${errText || 'Connection failed'}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Unable to initialize Ollama response reader.');
    }

    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const chunk = parsed.message?.content || '';
          if (chunk) {
            accumulatedText += chunk;
            callbacks.onChunk(chunk);
          }
          if (parsed.done) {
            break;
          }
        } catch {
          // Ignore partial line parses
        }
      }
    }

    callbacks.onComplete(accumulatedText);
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    callbacks.onError(err);
  }
}

