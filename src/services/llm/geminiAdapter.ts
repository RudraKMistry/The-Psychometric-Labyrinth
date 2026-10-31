import { LLMRequestOptions, StreamCallbacks } from './types';

/**
 * Streaming adapter for Google Gemini API
 * Uses the SSE streaming endpoint with alt=sse
 */
export async function streamGemini(
  options: LLMRequestOptions,
  apiKey: string,
  model = 'gemini-1.5-flash',
  callbacks: StreamCallbacks
): Promise<void> {
  if (!apiKey) {
    callbacks.onError(new Error('Gemini API key is not configured. Please add it in settings.'));
    return;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Format messages into Gemini contents structure
  const contents = options.messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = options.systemPrompt
    ? { parts: [{ text: options.systemPrompt }] }
    : undefined;

  const payload: any = {
    contents,
    generationConfig: {
      maxOutputTokens: options.maxTokens || 150,
      temperature: options.temperature ?? 0.7,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = systemInstruction;
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini API HTTP ${res.status}: ${errBody}`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('Unable to initialize response stream reader.');
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
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const textPart =
              parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textPart) {
              accumulatedText += textPart;
              callbacks.onChunk(textPart);
            }
          } catch {
            // Ignore partial SSE chunk parsing errors
          }
        }
      }
    }

    callbacks.onComplete(accumulatedText);
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    callbacks.onError(err);
  }
}

