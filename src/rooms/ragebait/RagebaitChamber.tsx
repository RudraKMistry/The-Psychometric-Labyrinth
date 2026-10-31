import { useState, useEffect, useRef } from 'react';
import { X, Award, Send, Shield, Sparkles, Activity } from 'lucide-react';
import { mazeAudio } from '../maze/mazeAudio';
import { streamLLM } from '../../services/llm/llmService';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface RagebaitChamberProps {
  onClose: () => void;
  onComplete: () => void;
}

export function RagebaitChamber({ onClose, onComplete }: RagebaitChamberProps) {
  // Composure & Game State
  const [currentRage, setCurrentRage] = useState(15); // 0 (Zen Stoic) to 100 (Blinded Rage)
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [isTrialComplete, setIsTrialComplete] = useState(false);
  const [isInterrogatorThinking, setIsInterrogatorThinking] = useState(false);

  // Dialogue & Input
  const [interrogatorQuote, setInterrogatorQuote] = useState(
    '"You think you are clever, don’t you? Stumbling through this dark maze like a lost child with a compass. I have seen fruit flies solve labyrinths with more dignity than you."'
  );
  const [statusReason, setStatusReason] = useState('Baseline neural monitoring active.');
  const [userInput, setUserInput] = useState('');

  // Canvas Visage Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const updateTraits = useGameStore((state) => state.updateTraits);
  const banterAbortRef = useRef<(() => void) | null>(null);

  // 60 FPS Vector Ocular Visor Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;
    let pulse = 0;
    let animId: number;

    const render = () => {
      const w = 80, h = 80;
      const cx = 40, cy = 40;
      ctx.clearRect(0, 0, w, h);

      angle += currentRage >= 65 ? 0.08 : currentRage >= 35 ? 0.04 : 0.02;
      pulse += 0.06;

      let primaryColor = '#70C1B3'; // Stoic Mint
      let glowColor = 'rgba(112, 193, 179, 0.4)';
      let secondaryColor = 'rgba(112, 193, 179, 0.15)';

      if (currentRage >= 65) {
        primaryColor = '#EF233C'; // Hostile Crimson
        glowColor = 'rgba(239, 35, 60, 0.7)';
        secondaryColor = 'rgba(239, 35, 60, 0.2)';
      } else if (currentRage >= 35) {
        primaryColor = '#E0A96D'; // Irritated Amber
        glowColor = 'rgba(224, 169, 109, 0.5)';
        secondaryColor = 'rgba(224, 169, 109, 0.2)';
      }

      ctx.save();

      // Outer Chassis
      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fillStyle = '#0D1117';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#1B212A';
      ctx.stroke();

      // Rotating Calibration Dial
      ctx.beginPath();
      ctx.arc(cx, cy, 35, angle, angle + Math.PI * 1.35);
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Counter-rotating reticle arc
      ctx.beginPath();
      ctx.arc(cx, cy, 31, -angle * 1.4, -angle * 1.4 + Math.PI * 0.75);
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Calibration Ticks
      for (let i = 0; i < 12; i++) {
        const theta = (i * Math.PI * 2) / 12;
        const x1 = cx + Math.cos(theta) * 33;
        const y1 = cy + Math.sin(theta) * 33;
        const x2 = cx + Math.cos(theta) * 36;
        const y2 = cy + Math.sin(theta) * 36;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = i % 3 === 0 ? primaryColor : '#1B212A';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Jitter & Glitch
      let jx = 0, jy = 0;
      if (currentRage >= 65) {
        jx = (Math.random() - 0.5) * 3.5;
        jy = (Math.random() - 0.5) * 3.5;
      } else if (currentRage >= 35) {
        jx = (Math.random() - 0.5) * 1.2;
        jy = (Math.random() - 0.5) * 1.2;
      }

      ctx.save();
      ctx.translate(cx + jx, cy + jy);

      // Chromatic ghost displacement when hostile
      if (currentRage >= 65 && Math.random() > 0.35) {
        ctx.save();
        ctx.translate(2.5, 0);
        drawVisageOptics(ctx, currentRage, pulse, 'rgba(0, 240, 255, 0.45)');
        ctx.restore();
      }

      drawVisageOptics(ctx, currentRage, pulse, primaryColor);
      ctx.restore();

      // Scanlines
      ctx.fillStyle = 'rgba(8, 10, 13, 0.2)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [currentRage]);

  const drawVisageOptics = (
    ctx: CanvasRenderingContext2D,
    rage: number,
    pulse: number,
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = rage >= 65 ? 10 : 5;

    if (rage < 35) {
      // Stoic level slits
      ctx.beginPath();
      ctx.moveTo(-16, -5);
      ctx.lineTo(-5, -5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(5, -5);
      ctx.lineTo(16, -5);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-10.5, -5, 1.6, 0, Math.PI * 2);
      ctx.arc(10.5, -5, 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Breathing sine sensor
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      for (let x = -14; x <= 14; x += 2) {
        const y = 8 + Math.sin(pulse * 2.2 + x * 0.35) * 2.5;
        if (x === -14) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else if (rage < 65) {
      // Irritated angled brows & sweeping radar
      ctx.beginPath();
      ctx.moveTo(-16, -8);
      ctx.lineTo(-4, -4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(16, -8);
      ctx.lineTo(4, -4);
      ctx.stroke();

      const scanX = Math.sin(pulse * 3.5) * 11;
      ctx.beginPath();
      ctx.arc(scanX, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 1.5;
      ctx.moveTo(-12, 8);
      ctx.lineTo(-4, 8);
      ctx.lineTo(0, 5);
      ctx.lineTo(4, 11);
      ctx.lineTo(12, 8);
      ctx.stroke();
    } else {
      // Hostile wedges & violent scream waveform
      ctx.beginPath();
      ctx.moveTo(-18, -10);
      ctx.lineTo(-3, -2);
      ctx.lineTo(-15, -1);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(18, -10);
      ctx.lineTo(3, -2);
      ctx.lineTo(15, -1);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.lineWidth = 2;
      const pts = [-16, 7, -11, 14, -6, 5, 0, 16, 6, 6, 11, 15, 16, 8];
      for (let i = 0; i < pts.length; i += 2) {
        if (i === 0) ctx.moveTo(pts[i], pts[i + 1]);
        else ctx.lineTo(pts[i], pts[i + 1]);
      }
      ctx.stroke();

      if (Math.random() > 0.3) {
        ctx.beginPath();
        ctx.arc(0, -2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Submit player response to the Interrogator
  const submitReply = async (customText?: string) => {
    const text = (customText || userInput).trim();
    if (!text || isInterrogatorThinking || isTrialComplete) return;

    if (!customText) setUserInput('');
    mazeAudio.playStoneClick();
    setIsInterrogatorThinking(true);

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

    let fullTaunt = '';

    streamLLM(
      {
        messages: [
          {
            role: 'system',
            content: `You are the Hostile Cybernetic Interrogator of Chamber 04 in the Psychometric Labyrinth, powered by Gemma.
Your mission is to deliberately provoke the player with razor-sharp, condescending psychological taunts.
The player just responded to your previous taunt.
Evaluate their emotional composure:
- If they answered with calm stoicism, cold intellect, or dignified wit, formulate a biting new taunt acknowledging their composure and attempting to pierce deeper.
- If they took the bait with anger, insults, or defensiveness, mock their fragility mercilessly.
Write 2-3 biting sentences.
At the very end of your response, on a new line, output: [RAGE_DELTA: +XX] (if they lost their temper, +15 to +35) or [RAGE_DELTA: -XX] (if they stayed calm and diffused it, -15 to -30).`
          },
          {
            role: 'assistant',
            content: interrogatorQuote
          },
          {
            role: 'user',
            content: text
          }
        ],
        maxTokens: 350,
        signal: controller.signal
      },
      config,
      {
        onChunk: (chunk: string) => {
          fullTaunt += chunk;
          setInterrogatorQuote(fullTaunt.replace(/\[RAGE_DELTA:.*?\]/g, '').trim());
        },
        onComplete: (fullText: string) => {
          setIsInterrogatorThinking(false);

          let delta = -15;
          const match = fullText.match(/\[RAGE_DELTA:\s*([+-]?\d+)\]/i);
          if (match && match[1]) {
            delta = parseInt(match[1], 10);
          }

          const newRage = Math.max(0, Math.min(100, currentRage + delta));
          setCurrentRage(newRage);

          if (delta > 0) {
            mazeAudio.playSnakeHiss();
            setStatusReason('Neural agitation detected! Emotional containment strained.');
            updateTraits({ composure: -0.08, neuroticism: 0.08 });
          } else {
            mazeAudio.playStoneClick();
            setStatusReason('Equanimity maintained. The provocation failed to destabilize.');
            updateTraits({ composure: 0.1, neuroticism: -0.05 });
          }

          const nextRounds = roundsCompleted + 1;
          setRoundsCompleted(nextRounds);

          if (nextRounds >= 3 && newRage < 65) {
            setIsTrialComplete(true);
            mazeAudio.playVictory();
            updateTraits({ composure: 0.3, conscientiousness: 0.2 });
          }
        },
        onError: () => {
          setIsInterrogatorThinking(false);
          setInterrogatorQuote(
            '"You attempt to hide behind silence, yet your biometric pulse screams beneath the skin."'
          );
          setCurrentRage((r) => Math.max(0, r - 10));
          const nextRounds = roundsCompleted + 1;
          setRoundsCompleted(nextRounds);
          if (nextRounds >= 3) {
            setIsTrialComplete(true);
            mazeAudio.playVictory();
          }
        }
      }
    );
  };

  const handlePosturePreset = (posture: 'stoic' | 'roast' | 'outburst') => {
    if (posture === 'stoic') {
      submitReply('[Silence] Maintains unbroken eye contact without flinching or uttering a sound.');
    } else if (posture === 'roast') {
      submitReply('Your threats are as hollow as your algorithms. Is this truly the pinnacle of synthetic intellect?');
    } else {
      submitReply('Shut up! You know nothing about me or what I am capable of!');
    }
  };

  const handleResetTrial = () => {
    setCurrentRage(15);
    setRoundsCompleted(0);
    setIsTrialComplete(false);
    setIsInterrogatorThinking(false);
    setInterrogatorQuote(
      '"You think you are clever, don’t you? Stumbling through this dark maze like a lost child with a compass. I have seen fruit flies solve labyrinths with more dignity than you."'
    );
    setStatusReason('Baseline neural monitoring active.');
    mazeAudio.playStoneClick();
  };

  useEffect(() => {
    return () => {
      if (banterAbortRef.current) banterAbortRef.current();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#101318] border border-[#1B212A] rounded-xl p-6 shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-150">
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
            <span className="w-3 h-3 rounded-full bg-[#EF233C] animate-pulse" />
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#EF233C] block">
                ROOM 04 // EMOTIONAL CRUCIBLE
              </span>
              <h2 className="text-xl font-display font-bold uppercase text-[#F0F4F8]">
                The Ragebait Crucible
              </h2>
            </div>
          </div>
          <div className="text-right flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#8E98A5]">
              ROUNDS:{' '}
              <strong className="text-[#F0F4F8]">{roundsCompleted} / 3</strong>
            </span>
            <button
              onClick={handleResetTrial}
              className="text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] underline"
            >
              Reset Crucible
            </button>
          </div>
        </div>

        {/* Vector Ocular Visage & Equanimity Gauge */}
        <div className="grid grid-cols-3 gap-3 mb-3.5 bg-[#080A0D] p-3.5 rounded-xl border border-[#1B212A]">
          {/* 60 FPS Canvas Visage */}
          <div className="flex flex-col items-center justify-center border-r border-[#1B212A] pr-3">
            <div className="w-20 h-20 relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={80}
                height={80}
                className="rounded-full bg-[#0D1117] border border-[#1B212A] shadow-inner"
              />
            </div>
            <span
              className={`font-mono text-[9px] mt-2 uppercase tracking-widest font-bold text-center ${
                currentRage >= 65
                  ? 'text-[#EF233C]'
                  : currentRage >= 35
                  ? 'text-[#E0A96D]'
                  : 'text-[#70C1B3]'
              }`}
            >
              {currentRage >= 65
                ? 'HOSTILE // CRITICAL'
                : currentRage >= 35
                ? 'TAUNTING // ACTIVE'
                : 'MONITORING // STABLE'}
            </span>
          </div>

          {/* Equanimity Meter */}
          <div className="col-span-2 flex flex-col justify-center pl-1">
            <div className="flex justify-between font-mono text-[11px] mb-1.5">
              <span className="text-[#70C1B3] flex items-center space-x-1">
                <Activity className="w-3 h-3 text-[#70C1B3]" />
                <span>Stoic Equanimity</span>
              </span>
              <span className="text-[#EF233C]">Blinded Rage</span>
            </div>
            <div className="w-full bg-[#13171F] h-3.5 rounded-full overflow-hidden border border-[#1B212A] relative">
              <div
                className="h-full bg-gradient-to-r from-[#70C1B3] via-[#E0A96D] to-[#EF233C] transition-all duration-500"
                style={{ width: `${currentRage}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-[#8E98A5] mt-1.5 leading-tight">
              {statusReason}
            </span>
          </div>
        </div>

        {/* Taunt Speech Bubble */}
        <div className="bg-[#080A0D] p-4 rounded-xl border border-[#1B212A] mb-3 text-xs font-mono relative">
          <div className="flex items-center justify-between text-[10px] text-[#EF233C] font-bold uppercase tracking-wider mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-[#EF233C]" />
              <span>INTERROGATOR ENTITY (GEMMA)</span>
            </span>
            {isInterrogatorThinking && <span className="text-[#EF233C] animate-pulse">EVALUATING TONE...</span>}
          </div>
          <p className="text-[#F0F4F8] italic leading-relaxed text-xs">
            {interrogatorQuote}
          </p>
        </div>

        {/* Custom Response Composer */}
        <div className="w-full flex space-x-2 mb-2.5">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitReply()}
            disabled={isInterrogatorThinking || isTrialComplete}
            placeholder={
              isTrialComplete
                ? 'Crucible survived with equanimity intact! Claim seal.'
                : 'Formulate your reply to the provocation...'
            }
            className="flex-1 bg-[#080A0D] border border-[#1B212A] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#F0F4F8] focus:border-[#EF233C] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => submitReply()}
            disabled={!userInput.trim() || isInterrogatorThinking || isTrialComplete}
            className="px-4 py-2.5 bg-[#1A202A] hover:bg-[#EF233C] hover:text-[#F0F4F8] disabled:opacity-40 text-[#8E98A5] font-mono text-xs font-bold uppercase rounded-lg transition-all flex items-center space-x-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Respond</span>
          </button>
        </div>

        {/* Posture Presets */}
        <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mb-3.5">
          <button
            onClick={() => handlePosturePreset('stoic')}
            disabled={isInterrogatorThinking || isTrialComplete}
            className="p-2 bg-[#13171F] hover:bg-[#1A202A] border border-[#1B212A] hover:border-[#70C1B3] rounded-lg text-[#70C1B3] truncate transition-all disabled:opacity-40"
          >
            [—] Stoic Silence
          </button>
          <button
            onClick={() => handlePosturePreset('roast')}
            disabled={isInterrogatorThinking || isTrialComplete}
            className="p-2 bg-[#13171F] hover:bg-[#1A202A] border border-[#1B212A] hover:border-[#E0A96D] rounded-lg text-[#E0A96D] truncate transition-all disabled:opacity-40"
          >
            [⚡] Witty Roast
          </button>
          <button
            onClick={() => handlePosturePreset('outburst')}
            disabled={isInterrogatorThinking || isTrialComplete}
            className="p-2 bg-[#13171F] hover:bg-[#1A202A] border border-[#1B212A] hover:border-[#EF233C] rounded-lg text-[#EF233C] truncate transition-all disabled:opacity-40"
          >
            [💥] Take the Bait!
          </button>
        </div>

        {/* Action Controls */}
        <div className="w-full flex space-x-3">
          <button
            onClick={onComplete}
            disabled={!isTrialComplete}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md ${
              isTrialComplete
                ? 'bg-[#70C1B3] hover:bg-[#70C1B3]/90 text-[#080A0D] cursor-pointer animate-pulse'
                : 'bg-[#1A202A] text-[#8E98A5] cursor-not-allowed opacity-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isTrialComplete ? 'Claim Chamber Seal (Master of Equanimity)' : 'Survive 3 Rounds to Claim Seal'}</span>
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
