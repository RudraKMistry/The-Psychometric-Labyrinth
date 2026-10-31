export type LLMProvider = 'gemini' | 'ollama';

export interface AppSettings {
  provider: LLMProvider;
  geminiApiKey: string;
  geminiModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  audioVolume: number;
  audioMuted: boolean;
}

export type ChamberId = 
  | 'tictactoe'
  | 'snakes'
  | 'entrapment'
  | 'ragebait'
  | 'mbti'
  | 'moral'
  | 'dossier';

export interface ChamberInfo {
  id: ChamberId;
  name: string;
  subtitle: string;
  themeColor: string;
  completed: boolean;
}

export interface PsychometricVector {
  openness: number;          // -1.0 to 1.0
  conscientiousness: number; // -1.0 to 1.0
  extraversion: number;      // -1.0 to 1.0
  agreeableness: number;     // -1.0 to 1.0
  neuroticism: number;       // -1.0 to 1.0
  riskTolerance: number;     // -1.0 to 1.0
  composure: number;         // 0.0 to 1.0
  mbtiType?: string;         // e.g. "INTJ", "ENFP"
  moralVerdict?: string;     // e.g. "Deontology" | "Utilitarianism"
}

