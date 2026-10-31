import { create } from 'zustand';
import { AppSettings, LLMProvider } from '../types';

interface SettingsState extends AppSettings {
  setProvider: (provider: LLMProvider) => void;
  toggleProvider: () => void;
  setGeminiApiKey: (key: string) => void;
  setGeminiModel: (model: string) => void;
  setOllamaEndpoint: (endpoint: string) => void;
  setOllamaModel: (model: string) => void;
  setAudioVolume: (volume: number) => void;
  toggleAudioMute: () => void;
}

const savedProvider = 
  (localStorage.getItem('labyrinth_provider') as LLMProvider) || 
  (import.meta.env.VITE_DEFAULT_LLM_PROVIDER as LLMProvider) || 
  'ollama';

const savedApiKey = 
  localStorage.getItem('labyrinth_gemini_api_key') || 
  import.meta.env.VITE_GEMINI_API_KEY || 
  '';

export const useSettingsStore = create<SettingsState>((set) => ({
  provider: savedProvider,
  geminiApiKey: savedApiKey,
  geminiModel: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash',
  ollamaEndpoint: import.meta.env.VITE_OLLAMA_ENDPOINT || '/ollama-proxy',
  ollamaModel: import.meta.env.VITE_OLLAMA_MODEL || 'gemma4:e4b',
  audioVolume: 0.5,
  audioMuted: false,

  setProvider: (provider) => {
    localStorage.setItem('labyrinth_provider', provider);
    set({ provider });
  },
  toggleProvider: () => {
    set((state) => {
      const next: LLMProvider = state.provider === 'ollama' ? 'gemini' : 'ollama';
      localStorage.setItem('labyrinth_provider', next);
      return { provider: next };
    });
  },
  setGeminiApiKey: (geminiApiKey) => {
    localStorage.setItem('labyrinth_gemini_api_key', geminiApiKey);
    set({ geminiApiKey });
  },
  setGeminiModel: (geminiModel) => set({ geminiModel }),
  setOllamaEndpoint: (ollamaEndpoint) => set({ ollamaEndpoint }),
  setOllamaModel: (ollamaModel) => set({ ollamaModel }),
  setAudioVolume: (audioVolume) => set({ audioVolume }),
  toggleAudioMute: () => set((state) => ({ audioMuted: !state.audioMuted })),
}));
