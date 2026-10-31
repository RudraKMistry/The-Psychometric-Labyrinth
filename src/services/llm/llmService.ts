import { streamGemini } from './geminiAdapter';
import { streamOllama } from './ollamaAdapter';
import { LLMRequestOptions, StreamCallbacks, DualRailConfig } from './types';

/**
 * Unified Dual-Rail LLM Service
 * Dispatches to Gemini Cloud API or Local Ollama (gemma4:e4b),
 * with an atmospheric offline simulation fallback to ensure zero runtime lockups.
 */
export async function streamLLM(
  options: LLMRequestOptions,
  config: DualRailConfig,
  callbacks: StreamCallbacks
): Promise<void> {
  const { provider, geminiApiKey, geminiModel, ollamaEndpoint, ollamaModel } = config;

  // Wrapped callbacks to catch provider errors and route to graceful fallback
  const wrappedCallbacks: StreamCallbacks = {
    onChunk: callbacks.onChunk,
    onComplete: callbacks.onComplete,
    onError: (err) => {
      console.warn(`[DualRailLLM] ${provider} error, triggering fallback simulation:`, err);
      simulateOfflineResponse(options, callbacks, provider, err.message);
    },
  };

  if (provider === 'gemini') {
    if (!geminiApiKey) {
      simulateOfflineResponse(
        options,
        callbacks,
        'gemini',
        'Gemini API key is unconfigured. Operating in offline simulation mode.'
      );
      return;
    }
    await streamGemini(options, geminiApiKey, geminiModel, wrappedCallbacks);
  } else {
    // Ollama rail
    await streamOllama(options, ollamaEndpoint, ollamaModel, wrappedCallbacks);
  }
}

/**
 * Atmospheric Offline Simulation Fallback
 * Provides contextual dialogue matching the chamber warden if local daemon or cloud API is offline.
 */
function simulateOfflineResponse(
  options: LLMRequestOptions,
  callbacks: StreamCallbacks,
  _attemptedProvider: string,
  _reason: string
) {
  const lastUserMsg = options.messages[options.messages.length - 1]?.content || '';
  const isEntrapment = options.systemPrompt?.includes('Entrapment') || options.systemPrompt?.includes('trapped');
  const isRagebait = options.systemPrompt?.includes('Ragebait') || options.systemPrompt?.includes('provoke');
  const isMBTI = options.systemPrompt?.includes('16Personalities') || options.systemPrompt?.includes('MBTI');
  const isMoral = options.systemPrompt?.includes('Moral') || options.systemPrompt?.includes('trolley');

  let text = '';
  if (isEntrapment) {
    text = `The stone seal trembles at your words: "${lastUserMsg}". Your argument shows conviction. The threshold of your will is acknowledged.`;
  } else if (isRagebait) {
    text = `Is that truly the sharpest retort your intellect can muster? You cling to civility, yet your hesitation reveals a latent tremor.`;
  } else if (isMBTI) {
    text = `Your choice reflects an inclination toward calculated introspection over impulsive crowds. The second pillar shifts into alignment.`;
  } else if (isMoral) {
    text = `An exacting judgment. You chose the utilitarian calculation, sacrificing the few to preserve the collective structure.`;
  } else {
    text = `The chamber warden registers your presence. The labyrinth shifts in response to your cognition.`;
  }

  // Stream simulation with typing delay
  let index = 0;
  const interval = setInterval(() => {
    if (index < text.length) {
      const chunk = text.slice(index, index + 3);
      callbacks.onChunk(chunk);
      index += 3;
    } else {
      clearInterval(interval);
      callbacks.onComplete(text);
    }
  }, 20);
}
