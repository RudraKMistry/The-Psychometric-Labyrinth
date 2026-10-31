import { useState, useEffect, useRef } from 'react';
import { X, Award, Shield, Sparkles, Scale } from 'lucide-react';
import { mazeAudio } from '../maze/mazeAudio';
import { streamLLM } from '../../services/llm/llmService';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface MoralChamberProps {
  onClose: () => void;
  onComplete: () => void;
}

export function MoralChamber({ onClose, onComplete }: MoralChamberProps) {
  const [activeObelisk, setActiveObelisk] = useState<'deontology' | 'utilitarian' | null>(null);
  const [moralSpectrum, setMoralSpectrum] = useState(50); // 0 (Pure Duty) to 100 (Pure Greater Good)
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [isDecisionCommitted, setIsDecisionCommitted] = useState(false);
  const [arbiterReflection, setArbiterReflection] = useState<string>(
    '"You stand between the two monoliths of human conscience. Declare whether your soul bows to the categorical imperative of duty, or the crushing mathematical burden of consequence."'
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const updateTraits = useGameStore((state) => state.updateTraits);
  const banterAbortRef = useRef<(() => void) | null>(null);

  // 60 FPS Canvas Twin Obelisks Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    let animId: number;

    const render = () => {
      tick += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background Amphitheater
      ctx.fillStyle = '#080A0D';
      ctx.fillRect(0, 0, w, h);

      // Distant stone floor perspective lines
      ctx.strokeStyle = '#151A22';
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2 + i * 45, h);
        ctx.stroke();
      }

      // Draw Obelisk of Duty (Left - Spectral Mint)
      drawMonolith(
        ctx,
        w * 0.25,
        h * 0.85,
        80,
        180,
        '#70C1B3',
        'rgba(112, 193, 179, 0.4)',
        activeObelisk === 'deontology',
        tick,
        'DUTY'
      );

      // Draw Obelisk of Consequence (Right - Warm Amber)
      drawMonolith(
        ctx,
        w * 0.75,
        h * 0.85,
        80,
        180,
        '#E0A96D',
        'rgba(224, 169, 109, 0.4)',
        activeObelisk === 'utilitarian',
        tick + 1.5,
        'CONSEQUENCE'
      );

      // Central Altar of Weighing Scales
      ctx.save();
      ctx.fillStyle = '#101318';
      ctx.strokeStyle = '#1B212A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.78, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#8E98A5';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText('TRIBUNAL', w / 2, h * 0.78 + 3);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [activeObelisk]);

  const drawMonolith = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    width: number,
    height: number,
    color: string,
    glow: string,
    isActive: boolean,
    tick: number,
    label: string
  ) => {
    ctx.save();

    // Monolith Pillar Tapered Geometry
    const topW = width * 0.65;
    const botW = width;
    const topY = by - height;

    ctx.beginPath();
    ctx.moveTo(bx - botW / 2, by);
    ctx.lineTo(bx - topW / 2, topY);
    ctx.lineTo(bx + topW / 2, topY);
    ctx.lineTo(bx + botW / 2, by);
    ctx.closePath();

    ctx.fillStyle = isActive ? '#141A22' : '#0E1218';
    ctx.fill();

    ctx.strokeStyle = isActive ? color : '#1B212A';
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    if (isActive) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 16;
    }
    ctx.stroke();

    // Etched Runic Lines
    ctx.strokeStyle = isActive ? color : '#2A3444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx, topY + 15);
    ctx.lineTo(bx, by - 20);
    ctx.stroke();

    // Floating Embers
    for (let i = 0; i < 4; i++) {
      const emberY = topY + ((tick * 25 + i * 40) % height);
      const emberX = bx + Math.sin(tick * 2 + i) * (width * 0.4);
      ctx.fillStyle = color;
      ctx.globalAlpha = isActive ? 0.8 : 0.3;
      ctx.beginPath();
      ctx.arc(emberX, emberY, isActive ? 2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Monolith Label
    ctx.fillStyle = isActive ? color : '#8E98A5';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(label, bx, by + 18);

    ctx.restore();
  };

  const commitDeclaration = (framework: 'deontology' | 'utilitarian') => {
    setActiveObelisk(framework);
    setIsDeliberating(true);
    mazeAudio.playVictory();

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

    let fullVerdict = '';

    streamLLM(
      {
        messages: [
          {
            role: 'system',
            content: `You are the Silent Arbiter of the Moral Tribunal in the Psychometric Labyrinth, powered by Gemma.
The player has declared their allegiance to: ${framework.toUpperCase()} (with ethical nuance calibration at ${moralSpectrum}% toward utilitarian consequence).
Deliver an articulate, intellectually arresting moral critique of their declaration (3-4 sentences).
Examine the heavy philosophical burden of their chosen stance:
- If Deontology: Commend their refusal to commodify human souls as instruments of calculation, while cautioning against tragic paralysis when rules collide.
- If Utilitarian: Acknowledge the harrowing courage to calculate consequence for the greater good, while noting the chilling weight of utilitarian sacrifices.`
          },
          {
            role: 'user',
            content: `I declare allegiance to ${framework.toUpperCase()}. Arbiter, deliver your judgment.`
          }
        ],
        maxTokens: 400,
        signal: controller.signal
      },
      config,
      {
        onChunk: (chunk: string) => {
          fullVerdict += chunk;
          setArbiterReflection(fullVerdict);
        },
        onComplete: () => {
          setIsDeliberating(false);
          setIsDecisionCommitted(true);

          if (framework === 'deontology') {
            updateTraits({
              agreeableness: 0.3,
              conscientiousness: 0.25,
              composure: 0.2,
              moralVerdict: 'Deontological Absolutism'
            });
          } else {
            updateTraits({
              riskTolerance: 0.3,
              conscientiousness: 0.2,
              openness: 0.25,
              moralVerdict: 'Utilitarian Consequentialism'
            });
          }
        },
        onError: () => {
          setIsDeliberating(false);
          setIsDecisionCommitted(true);
          setArbiterReflection(
            framework === 'deontology'
              ? '"Fiat Justitia, Ruat Caelum. You refused to make human souls a mere instrument of calculation. Duty stands unbroken."'
              : '"Salus Populi Suprema Lex Est. You bore the harrowing mathematical burden to preserve thousands. A pragmatic weight upon your conscience."'
          );
        }
      }
    );
  };

  const handleResetTrial = () => {
    setActiveObelisk(null);
    setMoralSpectrum(50);
    setIsDeliberating(false);
    setIsDecisionCommitted(false);
    setArbiterReflection(
      '"You stand between the two monoliths of human conscience. Declare whether your soul bows to the categorical imperative of duty, or the crushing mathematical burden of consequence."'
    );
    mazeAudio.playStoneClick();
  };

  useEffect(() => {
    return () => {
      if (banterAbortRef.current) banterAbortRef.current();
    };
  }, []);

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
            <span className="w-3 h-3 rounded-full bg-[#70C1B3] animate-pulse" />
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#70C1B3] block">
                ROOM 06 // MORAL PHILOSOPHY
              </span>
              <h2 className="text-xl font-display font-bold uppercase text-[#F0F4F8]">
                The Hall of Dual Obelisks
              </h2>
            </div>
          </div>
          <div className="text-right flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#8E98A5]">
              ALLEGIANCE:{' '}
              <strong className={activeObelisk === 'deontology' ? 'text-[#70C1B3]' : activeObelisk === 'utilitarian' ? 'text-[#E0A96D]' : 'text-[#8E98A5]'}>
                {activeObelisk ? activeObelisk.toUpperCase() : 'PENDING'}
              </strong>
            </span>
            <button
              onClick={handleResetTrial}
              className="text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] underline"
            >
              Reset
            </button>
          </div>
        </div>

        {/* 60 FPS Twin Obelisks Canvas */}
        <div className="relative mb-3.5 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={430}
            height={200}
            className="rounded-xl border border-[#1B212A] bg-[#080A0D] shadow-2xl max-w-full h-auto"
          />
        </div>

        {/* Ethical Dilemma Scroll */}
        <div className="w-full bg-[#080A0D] p-3.5 rounded-xl border border-[#1B212A] mb-3 text-xs font-mono">
          <span className="text-[10px] text-[#8E98A5] font-bold uppercase tracking-wider block mb-1">
            SCENARIO // THE PROTOCOL OF THE FIVE MINERS
          </span>
          <p className="text-[#F0F4F8] leading-relaxed italic mb-3">
            "A structural cave-in traps five surveyors in an oxygen-deprived gallery. Diverting the auxiliary air supply will immediately save the five, but will flood a lone engineer’s observation capsule with carbon monoxide."
          </p>

          {/* Ethical Spectrum Calibration Slider */}
          <div className="pt-2 border-t border-[#1B212A]">
            <div className="flex justify-between font-mono text-[10px] mb-1.5">
              <span className="text-[#70C1B3]">Duty: Never Murder the One</span>
              <span className="text-[#E0A96D]">Consequence: Save the Five</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={moralSpectrum}
              onChange={(e) => setMoralSpectrum(parseInt(e.target.value, 10))}
              disabled={isDecisionCommitted || isDeliberating}
              className="w-full accent-[#70C1B3] cursor-pointer"
            />
          </div>
        </div>

        {/* Declaration Monolith Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <button
            onClick={() => commitDeclaration('deontology')}
            disabled={isDecisionCommitted || isDeliberating}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeObelisk === 'deontology'
                ? 'bg-[#181D26] border-[#70C1B3] shadow-[0_0_15px_rgba(112,193,179,0.3)]'
                : 'bg-[#101318] border-[#1B212A] hover:border-[#70C1B3] opacity-85'
            }`}
          >
            <span className="text-xs font-mono font-bold text-[#70C1B3] block mb-1 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>OBELISK OF DUTY</span>
            </span>
            <span className="text-[10px] font-mono text-[#8E98A5] leading-normal block">
              Refuse the calculation. Human beings are ends, never mere instruments of arithmetic triage.
            </span>
          </button>

          <button
            onClick={() => commitDeclaration('utilitarian')}
            disabled={isDecisionCommitted || isDeliberating}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeObelisk === 'utilitarian'
                ? 'bg-[#181D26] border-[#E0A96D] shadow-[0_0_15px_rgba(224,169,109,0.3)]'
                : 'bg-[#101318] border-[#1B212A] hover:border-[#E0A96D] opacity-85'
            }`}
          >
            <span className="text-xs font-mono font-bold text-[#E0A96D] block mb-1 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5" />
              <span>OBELISK OF CONSEQUENCE</span>
            </span>
            <span className="text-[10px] font-mono text-[#8E98A5] leading-normal block">
              Bear the horrific burden. Five lives outweigh one; outcome is the only true moral measure.
            </span>
          </button>
        </div>

        {/* Arbiter Verdict */}
        <div className="w-full bg-[#080A0D] p-3.5 rounded-xl border border-[#1B212A] mb-3.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-[#8E98A5] uppercase tracking-wider mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#70C1B3]" />
              <span>THE ARBITER'S VERDICT (GEMMA)</span>
            </span>
            {isDeliberating && <span className="text-[#70C1B3] animate-pulse">WEIGHING ETHICAL SCALES...</span>}
          </div>
          <p className="text-[#F0F4F8] italic leading-relaxed text-xs">
            {arbiterReflection}
          </p>
        </div>

        {/* Action Controls */}
        <div className="w-full flex space-x-3">
          <button
            onClick={onComplete}
            disabled={!isDecisionCommitted}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md ${
              isDecisionCommitted
                ? 'bg-[#70C1B3] hover:bg-[#70C1B3]/90 text-[#080A0D] cursor-pointer animate-pulse'
                : 'bg-[#1A202A] text-[#8E98A5] cursor-not-allowed opacity-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isDecisionCommitted ? 'Claim Chamber Seal (Moral Seal)' : 'Declare Stance to Claim Seal'}</span>
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
