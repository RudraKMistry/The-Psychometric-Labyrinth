import React, { useState } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { streamLLM } from '../services/llm/llmService';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  X,
  Cpu,
  Cloud,
  Volume2,
  VolumeX,
  Send,
  Loader2,
  Terminal,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    provider,
    geminiApiKey,
    geminiModel,
    ollamaEndpoint,
    ollamaModel,
    audioVolume,
    audioMuted,
    setProvider,
    setGeminiApiKey,
    setGeminiModel,
    setOllamaEndpoint,
    setOllamaModel,
    setAudioVolume,
    toggleAudioMute,
  } = useSettingsStore();

  const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');

  // Test Streaming State
  const [testPrompt, setTestPrompt] = useState('Who are you, and what is your purpose in this labyrinth?');
  const [testResponse, setTestResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const checkOllamaHealth = async () => {
    setOllamaStatus('checking');
    try {
      const res = await fetch(`${ollamaEndpoint}/api/tags`);
      if (res.ok) {
        setOllamaStatus('online');
      } else {
        setOllamaStatus('offline');
      }
    } catch {
      setOllamaStatus('offline');
    }
  };

  const runTestStream = async () => {
    if (!testPrompt.trim() || isStreaming) return;
    setIsStreaming(true);
    setTestResponse('');
    setStreamError(null);

    try {
      await streamLLM(
        {
          messages: [{ role: 'user', content: testPrompt }],
          systemPrompt: 'You are the Overseer of the Psychometric Labyrinth. Speak in 2 concise, enigmatic sentences with high atmospheric gravity.',
          maxTokens: 250,
        },
        {
          provider,
          geminiApiKey,
          geminiModel,
          ollamaEndpoint,
          ollamaModel,
        },
        {
          onChunk: (chunk) => {
            setTestResponse((prev) => prev + chunk);
          },
          onComplete: () => {
            setIsStreaming(false);
          },
          onError: (err) => {
            setStreamError(err.message);
            setIsStreaming(false);
          },
        }
      );
    } catch (err: any) {
      setStreamError(err.message || 'Stream error occurred');
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-[#11141A] border border-[#1E242E] rounded-lg max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8E98A5] hover:text-[#F0F4F8] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-[#70C1B3]" />
          <h2 className="text-xl font-display font-bold uppercase tracking-wider text-[#F0F4F8]">
            Dual-Rail LLM Architecture
          </h2>
        </div>

        {/* Engine Selection */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-widest text-[#8E98A5] mb-2 font-mono">
            Active Inference Rail
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setProvider('ollama')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded border transition-all ${
                provider === 'ollama'
                  ? 'border-[#70C1B3] bg-[#70C1B3]/10 text-[#70C1B3] shadow-[0_0_15px_rgba(112,193,179,0.2)]'
                  : 'border-[#1E242E] bg-[#090B0E] text-[#8E98A5] hover:border-[#8E98A5]'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span className="font-mono text-sm font-semibold">Local (Ollama)</span>
            </button>

            <button
              onClick={() => setProvider('gemini')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded border transition-all ${
                provider === 'gemini'
                  ? 'border-[#70C1B3] bg-[#70C1B3]/10 text-[#70C1B3] shadow-[0_0_15px_rgba(112,193,179,0.2)]'
                  : 'border-[#1E242E] bg-[#090B0E] text-[#8E98A5] hover:border-[#8E98A5]'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span className="font-mono text-sm font-semibold">Cloud (Gemini)</span>
            </button>
          </div>
        </div>

        {/* Provider Specific Settings */}
        {provider === 'ollama' ? (
          <div className="space-y-4 mb-6 bg-[#090B0E] p-4 rounded border border-[#1E242E]">
            <div>
              <label className="block text-xs font-mono text-[#8E98A5] mb-1">
                Ollama Endpoint (via Vite Proxy)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={ollamaEndpoint}
                  onChange={(e) => setOllamaEndpoint(e.target.value)}
                  className="flex-1 bg-[#11141A] border border-[#1E242E] rounded px-3 py-2 text-sm text-[#F0F4F8] font-mono focus:border-[#70C1B3] focus:outline-none"
                  placeholder="/ollama-proxy"
                />
                <button
                  onClick={checkOllamaHealth}
                  disabled={ollamaStatus === 'checking'}
                  className="px-3 py-2 bg-[#1A202C] border border-[#1E242E] hover:border-[#70C1B3] text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] rounded transition-colors"
                >
                  {ollamaStatus === 'checking' ? 'Testing...' : 'Ping'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8E98A5] mb-1">Target Model</label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full bg-[#11141A] border border-[#1E242E] rounded px-3 py-2 text-sm text-[#F0F4F8] font-mono focus:border-[#70C1B3] focus:outline-none"
                placeholder="gemma4:e4b"
              />
            </div>

            {ollamaStatus === 'online' && (
              <div className="flex items-center space-x-2 text-xs text-[#70C1B3] font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>Ollama daemon connected & ready for inference</span>
              </div>
            )}
            {ollamaStatus === 'offline' && (
              <div className="flex items-center space-x-2 text-xs text-[#EF233C] font-mono">
                <AlertCircle className="w-4 h-4" />
                <span>Cannot reach Ollama at {ollamaEndpoint}. Fallback simulation enabled.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mb-6 bg-[#090B0E] p-4 rounded border border-[#1E242E]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-mono text-[#8E98A5]">Gemini API Key</label>
                {geminiApiKey && (
                  <span className="text-[10px] font-mono text-[#70C1B3] flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#70C1B3]" />
                    <span>Loaded & Active</span>
                  </span>
                )}
              </div>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full bg-[#11141A] border border-[#1E242E] rounded px-3 py-2 text-sm text-[#F0F4F8] font-mono focus:border-[#70C1B3] focus:outline-none"
                placeholder="AIzaSy... (or configure VITE_GEMINI_API_KEY in .env)"
              />
              <span className="text-[10px] text-[#8E98A5] font-mono mt-1 block">
                {geminiApiKey
                  ? 'Key is active from .env or browser storage.'
                  : 'Enter key here or set VITE_GEMINI_API_KEY in .env file.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-[#8E98A5] mb-1">Gemini Model</label>
              <input
                type="text"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full bg-[#11141A] border border-[#1E242E] rounded px-3 py-2 text-sm text-[#F0F4F8] font-mono focus:border-[#70C1B3] focus:outline-none"
                placeholder="gemini-1.5-flash"
              />
            </div>
          </div>
        )}

        {/* Live Test Console */}
        <div className="mb-6 bg-[#090B0E] p-4 rounded border border-[#1E242E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8E98A5] flex items-center space-x-2">
              <Terminal className="w-3.5 h-3.5 text-[#70C1B3]" />
              <span>Live Inference Test Console</span>
            </span>
            <span className="text-[10px] font-mono text-[#70C1B3]">max_tokens: 250 (unclamped)</span>
          </div>

          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="flex-1 bg-[#11141A] border border-[#1E242E] rounded px-3 py-1.5 text-xs text-[#F0F4F8] font-mono focus:border-[#70C1B3] focus:outline-none"
              placeholder="Test prompt..."
              disabled={isStreaming}
            />
            <button
              onClick={runTestStream}
              disabled={isStreaming}
              className="px-3 py-1.5 bg-[#70C1B3] text-[#090B0E] font-mono font-bold text-xs uppercase tracking-wider rounded hover:bg-[#70C1B3]/90 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Streaming</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Test</span>
                </>
              )}
            </button>
          </div>

          {/* Stream Output Window */}
          {(testResponse || isStreaming || streamError) && (
            <div className="bg-[#11141A] p-3 rounded border border-[#1E242E] text-xs font-mono text-[#F0F4F8] leading-relaxed min-h-[60px]">
              {testResponse && <div>{testResponse}</div>}
              {isStreaming && <span className="inline-block w-2 h-3 ml-1 bg-[#70C1B3] animate-pulse" />}
              {streamError && (
                <div className="text-[#EF233C] text-[11px] mt-1">Error: {streamError}</div>
              )}
            </div>
          )}
        </div>

        {/* Audio Volume Slider */}
        <div className="mb-6 bg-[#090B0E] p-4 rounded border border-[#1E242E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8E98A5] flex items-center space-x-2">
              {audioMuted ? <VolumeX className="w-4 h-4 text-[#EF233C]" /> : <Volume2 className="w-4 h-4 text-[#70C1B3]" />}
              <span>Procedural Audio Volume</span>
            </span>
            <button
              onClick={toggleAudioMute}
              className="text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] underline"
            >
              {audioMuted ? 'Unmute' : 'Mute'}
            </button>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={audioVolume}
            onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
            className="w-full accent-[#70C1B3] cursor-pointer"
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#70C1B3] text-[#090B0E] font-mono font-bold text-xs rounded uppercase tracking-wider hover:bg-[#70C1B3]/90 transition-all shadow-[0_0_15px_rgba(112,193,179,0.25)]"
        >
          Confirm & Close
        </button>
      </div>
    </div>
  );
};
