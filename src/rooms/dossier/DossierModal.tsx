import { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  X,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Brain,
  Shield,
  Compass,
  Scale,
  Activity,
  Flame,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { streamLLM } from '../../services/llm/llmService';
import { mazeAudio } from '../maze/mazeAudio';

interface DossierModalProps {
  onClose: () => void;
  onRestart: () => void;
}

export function DossierModal({ onClose, onRestart }: DossierModalProps) {
  const traits = useGameStore((state) => state.traits);
  const completedChambers = useGameStore((state) => state.completedChambers);

  const [synthesisText, setSynthesisText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const synthesisAbortRef = useRef<(() => void) | null>(null);

  // Big Five & Dimensional Metrics mapped to 0-100%
  const radarData = [
    { trait: 'Openness', score: Math.round(((traits.openness + 1) / 2) * 100), fullMark: 100 },
    { trait: 'Conscientiousness', score: Math.round(((traits.conscientiousness + 1) / 2) * 100), fullMark: 100 },
    { trait: 'Extraversion', score: Math.round(((traits.extraversion + 1) / 2) * 100), fullMark: 100 },
    { trait: 'Agreeableness', score: Math.round(((traits.agreeableness + 1) / 2) * 100), fullMark: 100 },
    { trait: 'Neuroticism', score: Math.round(((traits.neuroticism + 1) / 2) * 100), fullMark: 100 },
    { trait: 'Risk Tolerance', score: Math.round(((traits.riskTolerance + 1) / 2) * 100), fullMark: 100 },
    { trait: 'Composure', score: Math.round(traits.composure * 100), fullMark: 100 },
  ];

  const chambersList = [
    { id: 'tictactoe', name: '01 Stone Tablet (Minimax)', icon: Brain },
    { id: 'snakes', name: '02 Trial of Ascendance (Snakes)', icon: Flame },
    { id: 'entrapment', name: '03 Iron Portcullis (Persuasion)', icon: Shield },
    { id: 'ragebait', name: '04 Interrogator (Equanimity)', icon: Activity },
    { id: 'mbti', name: '05 Astrolabe (MBTI Typology)', icon: Compass },
    { id: 'moral', name: '06 Monoliths (Ethics)', icon: Scale },
  ];

  // Auto-synthesize on initial open
  useEffect(() => {
    mazeAudio.playVictory();
    triggerHolisticSynthesis();

    return () => {
      if (synthesisAbortRef.current) synthesisAbortRef.current();
    };
  }, []);

  const triggerHolisticSynthesis = () => {
    setIsSynthesizing(true);
    setSynthesisText('');

    if (synthesisAbortRef.current) synthesisAbortRef.current();

    const controller = new AbortController();
    synthesisAbortRef.current = () => controller.abort();

    const settings = useSettingsStore.getState();
    const config = {
      provider: settings.provider,
      geminiApiKey: settings.geminiApiKey,
      geminiModel: settings.geminiModel,
      ollamaEndpoint: settings.ollamaEndpoint,
      ollamaModel: settings.ollamaModel,
    };

    const promptSummary = `
Chambers Completed: ${completedChambers.size} of 6
MBTI Archetype: ${traits.mbtiType || 'Undiagnosed'}
Moral Framework: ${traits.moralVerdict || 'Undecided'}
Composure Rating: ${Math.round(traits.composure * 100)}%
Risk Tolerance: ${traits.riskTolerance.toFixed(2)}
Openness: ${traits.openness.toFixed(2)}
Conscientiousness: ${traits.conscientiousness.toFixed(2)}
Agreeableness: ${traits.agreeableness.toFixed(2)}
Extraversion: ${traits.extraversion.toFixed(2)}
`;

    let accumulated = '';

    streamLLM(
      {
        messages: [
          {
            role: 'system',
            content: `You are the Grand Architect of the Psychometric Labyrinth, powered by the Gemma model.
The traveler has completed the trial of the maze and stands before the Final Mind Dossier.
Synthesize an articulate, atmospheric, and psychologically profound holistic assessment of their mind (3-5 paragraphs):
1. **The Core Persona**: Synthesize their MBTI type and personality vectors into an unforgettable title and archetype.
2. **Behavioral Dynamics**: Deconstruct how their composure, risk-taking, and strategic mindset manifest under cognitive stress.
3. **The Moral Alignment**: Reflect upon their declared ethical philosophy and how it harmonizes or clashes with their raw psychometric traits.
Write with evocative literary precision, dark academia gravitas, and clear psychological resonance.`,
          },
          {
            role: 'user',
            content: `Traveler Trial Data:\n${promptSummary}\nSynthesize my holistic Mind Dossier.`,
          },
        ],
        maxTokens: 500,
        signal: controller.signal,
      },
      config,
      {
        onChunk: (chunk: string) => {
          accumulated += chunk;
          setSynthesisText(accumulated);
        },
        onComplete: () => {
          setIsSynthesizing(false);
        },
        onError: () => {
          setIsSynthesizing(false);
          setSynthesisText(
            `### THE ARCHITECT'S FINAL DECREE // CLASSIFIED DOSSIER\n\n` +
            `**MBTI Typology**: ${traits.mbtiType || 'INTJ // The Strategic Sentinel'}\n` +
            `**Moral Framework**: ${traits.moralVerdict || 'Deontological Absolutism'}\n\n` +
            `Across the procedural depths of the Labyrinth, your neural signature demonstrates exceptional composure (${Math.round(traits.composure * 100)}%) and calibrated tactical execution. ` +
            `Whether confronting deterministic Minimax logic or enduring the caustic vitriol of the Sentinel, your cognitive core held unwavering equanimity.\n\n` +
            `You depart the Labyrinth not merely as a survivor, but as a mind calibrated to master chaotic systems with stoic lucidity.`
          );
        },
      }
    );
  };

  const handleCopyDossier = () => {
    const textToCopy = `PSYCHOMETRIC LABYRINTH // MIND DOSSIER
======================================
MBTI Type: ${traits.mbtiType || 'Undiagnosed'}
Moral Framework: ${traits.moralVerdict || 'Undeclared'}
Composure Rating: ${Math.round(traits.composure * 100)}%
Chambers Cleared: ${completedChambers.size}/6

PSYCHOMETRIC METRICS:
- Openness: ${Math.round(((traits.openness + 1) / 2) * 100)}%
- Conscientiousness: ${Math.round(((traits.conscientiousness + 1) / 2) * 100)}%
- Extraversion: ${Math.round(((traits.extraversion + 1) / 2) * 100)}%
- Agreeableness: ${Math.round(((traits.agreeableness + 1) / 2) * 100)}%
- Risk Tolerance: ${Math.round(((traits.riskTolerance + 1) / 2) * 100)}%

SYNTHESIS:
${synthesisText}
`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#101318] border border-[#1B212A] rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#1B212A]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#70C1B3]/10 border border-[#70C1B3]/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#70C1B3]" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#70C1B3] block">
                CLASSIFIED ARCHIVAL RECORD // FINAL SYNTHESIS
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-bold uppercase text-[#F0F4F8]">
                The Mind Dossier
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyDossier}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1B212A] hover:bg-[#252D3A] text-[#F0F4F8] rounded-lg font-mono text-xs transition-colors"
              title="Copy Dossier to Clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-[#70C1B3]" /> : <Copy className="w-3.5 h-3.5 text-[#8E98A5]" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8E98A5] hover:text-[#F0F4F8] hover:bg-[#1B212A] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid: Radar Chart + Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
          {/* Radar Chart (7 cols) */}
          <div className="lg:col-span-7 bg-[#080A0D] border border-[#1B212A] rounded-xl p-4 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-1 px-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8E98A5]">
                Psychometric Spider Matrix
              </span>
              <span className="font-mono text-[10px] text-[#70C1B3]">
                7-Dimensional Assessment
              </span>
            </div>
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#1B212A" />
                  <PolarAngleAxis
                    dataKey="trait"
                    tick={{ fill: '#8E98A5', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#4E5A6B', fontSize: 8 }}
                    stroke="#1B212A"
                  />
                  <Radar
                    name="Mind Profile"
                    dataKey="score"
                    stroke="#70C1B3"
                    fill="#70C1B3"
                    fillOpacity={0.35}
                    strokeWidth={2}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#101318] border border-[#1B212A] px-2.5 py-1.5 rounded shadow-lg text-[11px] font-mono">
                          <span className="text-[#8E98A5]">{data.trait}: </span>
                          <span className="text-[#70C1B3] font-bold">{data.score}%</span>
                        </div>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Cognitive Identifiers (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* MBTI Archetype Seal */}
            <div className="bg-[#080A0D] border border-[#1B212A] rounded-xl p-3.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#8E98A5] block mb-1">
                COGNITIVE ARCHETYPE (CHAMBER 05)
              </span>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#E0A96D]/10 border border-[#E0A96D]/30 flex items-center justify-center font-display font-bold text-[#E0A96D] text-lg">
                  {traits.mbtiType ? traits.mbtiType.slice(0, 2) : '??'}
                </div>
                <div>
                  <span className="font-display font-bold text-[#F0F4F8] text-base block">
                    {traits.mbtiType || 'Undiagnosed Traveler'}
                  </span>
                  <span className="font-mono text-[10px] text-[#E0A96D]">
                    {traits.mbtiType ? '4-Axis Astrolabe Synthesized' : 'Chamber 05 not completed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Moral Stance Seal */}
            <div className="bg-[#080A0D] border border-[#1B212A] rounded-xl p-3.5">
              <span className="text-[10px] font-mono tracking-wider uppercase text-[#8E98A5] block mb-1">
                MORAL PHILOSOPHY (CHAMBER 06)
              </span>
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#70C1B3]/10 border border-[#70C1B3]/30 flex items-center justify-center font-display font-bold text-[#70C1B3]">
                  <Scale className="w-5 h-5 text-[#70C1B3]" />
                </div>
                <div>
                  <span className="font-display font-bold text-[#F0F4F8] text-sm block">
                    {traits.moralVerdict || 'Ethical Framework Pending'}
                  </span>
                  <span className="font-mono text-[10px] text-[#70C1B3]">
                    {traits.moralVerdict ? 'Twin Monoliths Decided' : 'Chamber 06 not completed'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chamber Completion Badges */}
            <div className="bg-[#080A0D] border border-[#1B212A] rounded-xl p-3.5 flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#8E98A5]">
                  CHAMBER TRIAL SEALS
                </span>
                <span className="font-mono text-[10px] text-[#70C1B3] font-bold">
                  {completedChambers.size} / 6 CLEARED
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {chambersList.map((ch) => {
                  const isDone = completedChambers.has(ch.id as any);
                  return (
                    <div
                      key={ch.id}
                      className={`flex items-center space-x-1.5 p-1.5 rounded border text-[10px] font-mono ${
                        isDone
                          ? 'bg-[#70C1B3]/10 border-[#70C1B3]/30 text-[#70C1B3]'
                          : 'bg-[#101318] border-[#1B212A] text-[#4E5A6B]'
                      }`}
                    >
                      {isDone ? (
                        <Check className="w-3 h-3 text-[#70C1B3] shrink-0" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2A3444] shrink-0" />
                      )}
                      <span className="truncate">{ch.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI Synthesis Box (Gemma) */}
        <div className="bg-[#080A0D] border border-[#1B212A] rounded-xl p-4 sm:p-5 mb-5 relative">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1B212A]">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#70C1B3]" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#F0F4F8]">
                Holistic Gemma AI Dossier Synthesis
              </span>
            </div>
            {isSynthesizing && (
              <span className="font-mono text-[10px] text-[#70C1B3] animate-pulse flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#70C1B3]"></span>
                <span>Synthesizing...</span>
              </span>
            )}
          </div>

          <div className="font-mono text-xs sm:text-sm text-[#F0F4F8] leading-relaxed max-h-52 overflow-y-auto space-y-2 pr-2">
            {synthesisText ? (
              <p className="whitespace-pre-line text-[#E2E8F0]">{synthesisText}</p>
            ) : (
              <p className="text-[#8E98A5] italic">
                Initiating psychological matrix deconstruction via Gemma neural model...
              </p>
            )}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1B212A]">
          <button
            onClick={triggerHolisticSynthesis}
            disabled={isSynthesizing}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#1B212A] hover:bg-[#252D3A] text-[#8E98A5] hover:text-[#F0F4F8] rounded-xl font-mono text-xs font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>Re-Synthesize Dossier</span>
          </button>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <button
              onClick={onRestart}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#EF233C]/10 border border-[#EF233C]/30 hover:bg-[#EF233C]/20 text-[#EF233C] rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Restart Labyrinth
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#70C1B3] text-[#080A0D] hover:bg-[#70C1B3]/90 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
