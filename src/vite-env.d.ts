/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_LLM_PROVIDER?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_GEMINI_MODEL?: string;
  readonly VITE_OLLAMA_ENDPOINT?: string;
  readonly VITE_OLLAMA_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

