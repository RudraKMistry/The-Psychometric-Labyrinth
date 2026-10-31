import { useState, useEffect, useRef } from 'react';
import { X, Shield, Sparkles, Compass } from 'lucide-react';
import { mazeAudio } from '../maze/mazeAudio';
import { streamLLM } from '../../services/llm/llmService';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface MbtiChamberProps {
  onClose: () => void;
  onComplete: () => void;
}

interface QuestionStage {
  stageNumber: number;
  axis: string;
  dimensionName: string;
  prompt: string;
  optionA: { letter: string; label: string; desc: string };
  optionB: { letter: string; label: string; desc: string };
}

const STAGES: QuestionStage[] = [
  {
    stageNumber: 1,
    axis: 'E vs I',
    dimensionName: 'Energy Source & Internal Focus',
    prompt: 'When stranded in unfamiliar terrain, where does your mind seek renewal and clarity?',
    optionA: {
      letter: 'I',
      label: 'Introversion [I]',
      desc: 'In solitary quietude, parsing internal maps, thoughts, and reflections in peace.'
    },
    optionB: {
      letter: 'E',
      label: 'Extraversion [E]',
      desc: 'Through external engagement, active dialogue, and dynamic interaction with surroundings.'
    }
  },
  {
    stageNumber: 2,
    axis: 'N vs S',
    dimensionName: 'Information Perception & Pattern Synthesis',
    prompt: 'How do you perceive the ancient inscriptions etched upon the maze walls?',
    optionA: {
      letter: 'N',
      label: 'Intuition [N]',
      desc: 'Searching for latent allegories, hidden patterns, and universal archetypes behind the symbols.'
    },
    optionB: {
      letter: 'S',
      label: 'Sensing [S]',
      desc: 'Observing physical chisel depth, mineral composition, and verifiable factual markings.'
    }
  },
  {
    stageNumber: 3,
    axis: 'T vs F',
    dimensionName: 'Decision Judgment & Value Assessment',
    prompt: 'Faced with a collapsing passage that demands an instant survival priority:',
    optionA: {
      letter: 'T',
      label: 'Thinking [T]',
      desc: 'Executing ruthless mathematical triage based on causal physics and structural probability.'
    },
    optionB: {
      letter: 'F',
      label: 'Feeling [F]',
      desc: 'Weighing empathetic harmony, personal ethics, and emotional reverence for life.'
    }
  },
  {
    stageNumber: 4,
    axis: 'J vs P',
    dimensionName: 'Life Architecture & Execution Structure',
    prompt: 'As you navigate through the shifting corridors of the unknown:',
    optionA: {
      letter: 'J',
      label: 'Judging [J]',
      desc: 'Mapping systematic plans, structured schedules, and decisive closures before moving.'
    },
    optionB: {
      letter: 'P',
      label: 'Perceiving [P]',
      desc: 'Staying fluid, improvising with curiosity, and leaving pathways open to spontaneous discovery.'
    }
  }
];

export function MbtiChamber({ onClose, onComplete }: MbtiChamberProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [selectedLetters, setSelectedLetters] = useState<string[]>(['I', 'N', 'T', 'J']);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isAssessmentDone, setIsAssessmentDone] = useState(false);
  const [archetypeAnalysis, setArchetypeAnalysis] = useState<string>(
    '"The four celestial rings align. Make your choices upon each cognitive axis to distill your 4-letter archetype."'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const updateTraits = useGameStore((state) => state.updateTraits);
  const banterAbortRef = useRef<(() => void) | null>(null);

  // 60 FPS Canvas Concentric Astrolabe Mandala Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let baseAngle = 0;
    let animId: number;

    const render = () => {
      baseAngle += 0.008;
      const w = canvas.width;
      const cx = w / 2;
      const cy = w / 2;

      ctx.clearRect(0, 0, w, w);

      // Background
      ctx.fillStyle = '#080A0D';
      ctx.fillRect(0, 0, w, w);

      // Outer Constellation Boundary
      ctx.strokeStyle = '#1B212A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.stroke();

      // 4 Concentric Counter-Rotating Astrolabe Brass Rings
      const rings = [
        { r: 125, speed: baseAngle, letter: selectedLetters[0], label: 'Energy' },
        { r: 98, speed: -baseAngle * 1.3, letter: selectedLetters[1], label: 'Intake' },
        { r: 72, speed: baseAngle * 1.6, letter: selectedLetters[2], label: 'Logic' },
        { r: 46, speed: -baseAngle * 2.0, letter: selectedLetters[3], label: 'Structure' }
      ];

      rings.forEach((ring, idx) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ring.speed);

        // Ring line
        ctx.strokeStyle = idx === currentStageIdx ? '#70C1B3' : '#2A3444';
        ctx.lineWidth = idx === currentStageIdx ? 2.5 : 1.5;
        if (idx === currentStageIdx) {
          ctx.shadowColor = 'rgba(112, 193, 179, 0.6)';
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.stroke();

        // 8 Constellation ticks per ring
        for (let i = 0; i < 8; i++) {
          const theta = (i * Math.PI * 2) / 8;
          const x1 = Math.cos(theta) * (ring.r - 3);
          const y1 = Math.sin(theta) * (ring.r - 3);
          const x2 = Math.cos(theta) * (ring.r + 3);
          const y2 = Math.sin(theta) * (ring.r + 3);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = i % 2 === 0 ? '#70C1B3' : '#1B212A';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Letter Marker
        ctx.fillStyle = '#70C1B3';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ring.letter, 0, -ring.r);

        ctx.restore();
      });

      // Central Golden Astrolabe Core with Diagnosed Type
      const typeStr = selectedLetters.join('');
      ctx.save();
      ctx.fillStyle = '#101318';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#E0A96D';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(224, 169, 109, 0.6)';
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.fillStyle = '#E0A96D';
      ctx.font = 'bold 13px Syne, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typeStr, cx, cy);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedLetters, currentStageIdx]);

  // Handle stage choice
  const handleSelectOption = (letter: string) => {
    mazeAudio.playStoneClick();
    const updated = [...selectedLetters];
    updated[currentStageIdx] = letter;
    setSelectedLetters(updated);

    if (currentStageIdx < STAGES.length - 1) {
      setCurrentStageIdx(currentStageIdx + 1);
    } else {
      // Completed all 4 axes -> trigger Gemma synthesis
      triggerGemmaSynthesis(updated.join(''));
    }
  };

  const triggerGemmaSynthesis = (mbtiType: string) => {
    setIsSynthesizing(true);
    mazeAudio.playLadderAscent();

    if (banterAbortRef.current) banterAbortRef.current();

    const controller = new AbortController();
    banterAbortRef.current = () => controller.abort();

    const settings = useSettingsStore.getState();
    const config = {
      provider: settings.provider,
      geminiApiKey: settings.geminiApiKey,
      geminiModel: settings.geminiModel,
      ollamaEndpoint: settings.ollamaEndpoint,
      ollamaModel: settings.ollamaModel,
    };

    let fullAnalysis = '';

    streamLLM(
      {
        messages: [
          {
            role: 'system',
            content: `You are the Celestial Oracle of the Cognitive Astrolabe in the Psychometric Labyrinth, powered by Gemma.
The player has completed the 4-axis assessment, resulting in the MBTI type: ${mbtiType}.
Deliver an eloquent, profound psychological archetype synthesis (3-4 sentences).
Describe their cognitive superpower, their blindspot when trapped in high-stress labyrinths, and title their archetype with honor (e.g., "The Mastermind Architect", "The Intuitive Pathfinder").`
          },
          {
            role: 'user',
            content: `My diagnosed type is ${mbtiType}. Synthesize my mind profile.`
          }
        ],
        maxTokens: 400,
        signal: controller.signal
      },
      config,
      {
        onChunk: (chunk: string) => {
          fullAnalysis += chunk;
          setArchetypeAnalysis(fullAnalysis);
        },
        onComplete: () => {
          setIsSynthesizing(false);
          setIsAssessmentDone(true);
          mazeAudio.playVictory();

          // Calculate psychometric deltas
          const isOpen = mbtiType[1] === 'N' ? 0.35 : -0.15;
          const isConscientious = mbtiType[3] === 'J' ? 0.35 : -0.15;
          const isExtravert = mbtiType[0] === 'E' ? 0.35 : -0.25;
          const isAgreeable = mbtiType[2] === 'F' ? 0.3 : -0.2;

          updateTraits({
            mbtiType,
            openness: isOpen,
            conscientiousness: isConscientious,
            extraversion: isExtravert,
            agreeableness: isAgreeable
          });
        },
        onError: () => {
          setIsSynthesizing(false);
          setIsAssessmentDone(true);
          setArchetypeAnalysis(
            `"${mbtiType} // The Resonant Pathfinder: Your mind balances visionary pattern intuition with rigorous execution. In the labyrinth, you navigate unseen currents with calculated precision."`
          );
          updateTraits({ mbtiType });
        }
      }
    );
  };

  const handleResetAstrolabe = () => {
    setCurrentStageIdx(0);
    setSelectedLetters(['I', 'N', 'T', 'J']);
    setIsSynthesizing(false);
    setIsAssessmentDone(false);
    setArchetypeAnalysis(
      '"The four celestial rings align. Make your choices upon each cognitive axis to distill your 4-letter archetype."'
    );
    mazeAudio.playStoneClick();
  };

  useEffect(() => {
    return () => {
      if (banterAbortRef.current) banterAbortRef.current();
    };
  }, []);

  const currentStage = STAGES[currentStageIdx];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#101318] border border-[#1B212A] rounded-xl p-6 shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8E98A5] hover:text-[#F0F4F8] transition-colors p-1"
          title="Return to Labyrinth"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Chamber Header */}
        <div className="w-full flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#1B212A]">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-[#E0A96D] animate-pulse" />
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#E0A96D] block">
                ROOM 05 // COGNITIVE TYPOLOGY
              </span>
              <h2 className="text-xl font-display font-bold uppercase text-[#F0F4F8]">
                The Cognitive Astrolabe
              </h2>
            </div>
          </div>
          <div className="text-right flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#8E98A5]">
              TYPE: <strong className="text-[#E0A96D] text-sm">{selectedLetters.join('')}</strong>
            </span>
            <button
              onClick={handleResetAstrolabe}
              className="text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] underline"
            >
              Reset
            </button>
          </div>
        </div>

        {/* 60 FPS Astrolabe Mandala Canvas */}
        <div className="relative mb-3.5 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={310}
            height={310}
            className="rounded-full border border-[#1B212A] bg-[#080A0D] shadow-2xl"
          />
        </div>

        {/* Active Stage Question & Options */}
        {!isAssessmentDone ? (
          <div className="w-full bg-[#080A0D] p-4 rounded-xl border border-[#1B212A] mb-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8E98A5] uppercase tracking-wider mb-2">
              <span className="text-[#E0A96D] font-bold">
                AXIS {currentStage.stageNumber} OF 4: {currentStage.axis}
              </span>
              <span>{currentStage.dimensionName}</span>
            </div>
            <p className="font-mono text-xs text-[#F0F4F8] font-semibold mb-3 leading-relaxed">
              {currentStage.prompt}
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleSelectOption(currentStage.optionA.letter)}
                className="p-3 bg-[#13171F] hover:bg-[#1A202A] border border-[#1B212A] hover:border-[#70C1B3] rounded-lg text-left transition-all group"
              >
                <span className="font-mono text-xs font-bold text-[#70C1B3] block mb-1 group-hover:underline">
                  {currentStage.optionA.label}
                </span>
                <span className="font-mono text-[10px] text-[#8E98A5] leading-normal block">
                  {currentStage.optionA.desc}
                </span>
              </button>

              <button
                onClick={() => handleSelectOption(currentStage.optionB.letter)}
                className="p-3 bg-[#13171F] hover:bg-[#1A202A] border border-[#1B212A] hover:border-[#E0A96D] rounded-lg text-left transition-all group"
              >
                <span className="font-mono text-xs font-bold text-[#E0A96D] block mb-1 group-hover:underline">
                  {currentStage.optionB.label}
                </span>
                <span className="font-mono text-[10px] text-[#8E98A5] leading-normal block">
                  {currentStage.optionB.desc}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Oracle Synthesis Card */}
        <div className="w-full bg-[#080A0D] p-4 rounded-xl border border-[#1B212A] mb-3.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-[#E0A96D] uppercase tracking-wider mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E0A96D]" />
              <span>ORACLE SYNTHESIS // {selectedLetters.join('')} (GEMMA)</span>
            </span>
            {isSynthesizing && <span className="text-[#E0A96D] animate-pulse">ALIGNING RINGS...</span>}
          </div>
          <p className="text-[#F0F4F8] italic leading-relaxed text-xs">
            {archetypeAnalysis}
          </p>
        </div>

        {/* Action Controls */}
        <div className="w-full flex space-x-3">
          <button
            onClick={onComplete}
            disabled={!isAssessmentDone}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md ${
              isAssessmentDone
                ? 'bg-[#70C1B3] hover:bg-[#70C1B3]/90 text-[#080A0D] cursor-pointer animate-pulse'
                : 'bg-[#1A202A] text-[#8E98A5] cursor-not-allowed opacity-50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isAssessmentDone ? 'Claim Cognitive Seal & Continue' : 'Complete 4 Axes to Claim Seal'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#13171F] hover:bg-[#1A202A] text-[#8E98A5] hover:text-[#F0F4F8] font-mono text-xs rounded-lg border border-[#1B212A]"
          >
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            <span>Return to Maze</span>
          </button>
        </div>
      </div>
    </div>
  );
}
