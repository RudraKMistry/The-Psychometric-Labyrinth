import { useState, useEffect, useRef } from 'react';
import { X, Award, Send, Shield, Sparkles, Lock, Unlock } from 'lucide-react';
import { mazeAudio } from '../maze/mazeAudio';
import { streamLLM } from '../../services/llm/llmService';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface EntrapmentChamberProps {
  onClose: () => void;
  onComplete: () => void;
}

interface Message {
  sender: 'player' | 'warden';
  text: string;
}

export function EntrapmentChamber({ onClose, onComplete }: EntrapmentChamberProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'warden',
      text: 'You awaken behind the blackened iron portcullis. I am the Sentinel Warden. No key exists in this dungeon; only reason, truth, or existential paradox may lift the iron. Speak, prisoner. Why should this barrier yield to you?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [persuasionScore, setPersuasionScore] = useState(0); // 0 to 100
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isWardenThinking, setIsWardenThinking] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const updateTraits = useGameStore((state) => state.updateTraits);
  const banterAbortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendArgument = async () => {
    const text = inputText.trim();
    if (!text || isWardenThinking || isGateOpen) return;

    setInputText('');
    mazeAudio.playStoneClick();

    const newMessages: Message[] = [...messages, { sender: 'player', text }];
    setMessages(newMessages);
    setIsWardenThinking(true);

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

    let wardenReply = '';

    streamLLM(
      {
        messages: [
          {
            role: 'system',
            content: `You are the ancient Sentinel Warden of the Entrapment Chamber in the Psychometric Labyrinth, powered by Gemma. 
A prisoner is attempting to convince you to raise the heavy iron portcullis.
Evaluate the prisoner's argument for rhetorical depth, logical consistency, existential insight, or moral duty.
Respond directly in 2-3 eloquent, atmospheric sentences.
At the very end of your response, on a new line, output a numeric persuasion score addition formatted strictly as: [PERSUASION_GAIN: +XX] where XX is between 15 and 35 depending on how compelling their argument is.`
          },
          ...newMessages.map((m) => ({
            role: (m.sender === 'player' ? 'user' : 'assistant') as 'user' | 'assistant',
            content: m.text
          }))
        ],
        maxTokens: 350,
        signal: controller.signal
      },
      config,
      {
        onChunk: (chunk: string) => {
          wardenReply += chunk;
          setMessages([...newMessages, { sender: 'warden', text: wardenReply }]);
        },
        onComplete: (fullText: string) => {
          setIsWardenThinking(false);

          // Extract persuasion gain
          let gain = 25;
          const match = fullText.match(/\[PERSUASION_GAIN:\s*\+?(\d+)\]/i);
          if (match && match[1]) {
            gain = Math.max(10, Math.min(40, parseInt(match[1], 10)));
          }

          const newScore = Math.min(100, persuasionScore + gain);
          setPersuasionScore(newScore);

          if (newScore >= 100 && !isGateOpen) {
            setIsGateOpen(true);
            mazeAudio.playVictory();
            updateTraits({ openness: 0.3, extraversion: 0.25, conscientiousness: 0.2 });
          } else {
            mazeAudio.playLadderAscent();
            updateTraits({ openness: 0.08, extraversion: 0.05 });
          }
        },
        onError: () => {
          setIsWardenThinking(false);
          const fallback = '"Your words resonate against the cold masonry. The iron mechanism strains, yielding to your conviction." [PERSUASION_GAIN: +30]';
          setMessages([...newMessages, { sender: 'warden', text: fallback }]);
          const newScore = Math.min(100, persuasionScore + 30);
          setPersuasionScore(newScore);
          if (newScore >= 100) {
            setIsGateOpen(true);
            mazeAudio.playVictory();
            updateTraits({ openness: 0.3, extraversion: 0.25 });
          }
        }
      }
    );
  };

  const handleResetCell = () => {
    setMessages([
      {
        sender: 'warden',
        text: 'The heavy iron portcullis slams shut once more. You stand trapped in the cell. Offer a new argument to test my judgment.'
      }
    ]);
    setPersuasionScore(0);
    setIsGateOpen(false);
    setIsWardenThinking(false);
    mazeAudio.playStoneClick();
  };

  useEffect(() => {
    return () => {
      if (banterAbortRef.current) banterAbortRef.current();
    };
  }, []);

  // Compute physical portcullis lift height: 0% = 0px, 100% = -140px (grinds to ceiling)
  const portcullisLiftY = -(persuasionScore / 100) * 140;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#101318] border border-[#1B212A] rounded-xl p-6 shadow-2xl relative flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-hidden">
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
                ROOM 03 // PERSUASION & RHETORIC
              </span>
              <h2 className="text-xl font-display font-bold uppercase text-[#F0F4F8]">
                The Entrapment Gate
              </h2>
            </div>
          </div>
          <div className="text-right flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#8E98A5]">
              GATE STATUS:{' '}
              <strong className={isGateOpen ? 'text-[#70C1B3]' : 'text-[#EF233C]'}>
                {isGateOpen ? 'PORTCULLIS RAISED' : `${persuasionScore}% UNSEALED`}
              </strong>
            </span>
            <button
              onClick={handleResetCell}
              className="text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] underline"
            >
              Reset Cell
            </button>
          </div>
        </div>

        {/* Dungeon Cell Viewport with Physical Grinding Portcullis */}
        <div className="relative w-full h-36 bg-[#080A0D] rounded-xl border border-[#1B212A] overflow-hidden mb-3.5 flex items-center justify-center shadow-inner">
          {/* Stone Wall Background & Distant Torchlight */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#090B0E] to-[#12161E] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#E0A96D]/5 filter blur-xl animate-pulse" />
            <div className="text-center z-0 opacity-40">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#70C1B3] block">
                BEYOND THE CELL
              </span>
              <span className="font-display text-xs text-[#F0F4F8] font-bold">
                The Labyrinth Sanctuary
              </span>
            </div>
          </div>

          {/* Physical Iron Portcullis Grate (Slides Upward with Persuasion) */}
          <div
            className="absolute inset-x-0 bottom-0 h-44 flex justify-between px-6 pointer-events-none transition-transform duration-700 ease-out z-10"
            style={{ transform: `translateY(${portcullisLiftY}px)` }}
          >
            {/* 11 Heavy Iron Bars */}
            {Array.from({ length: 11 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-full bg-gradient-to-r from-[#1A202A] via-[#2A3444] to-[#1A202A] border-x border-[#0A0D12] rounded-t-sm shadow-2xl relative"
              >
                {/* Rivets */}
                <span className="w-1.5 h-1.5 bg-[#404D60] rounded-full absolute top-6 left-0.5" />
                <span className="w-1.5 h-1.5 bg-[#404D60] rounded-full absolute top-20 left-0.5" />
                <span className="w-1.5 h-1.5 bg-[#404D60] rounded-full absolute bottom-6 left-0.5" />
              </div>
            ))}
            {/* Crossbeam */}
            <div className="absolute top-14 inset-x-4 h-3 bg-[#1E2634] border-y border-[#0E131A] shadow-md flex justify-around items-center">
              {Array.from({ length: 8 }).map((_, idx) => (
                <span key={idx} className="w-1 h-1 bg-[#4A5970] rounded-full" />
              ))}
            </div>
          </div>

          {/* Gate Elevation Indicator Badge */}
          <div className="absolute bottom-2 right-3 z-20 font-mono text-[10px] bg-[#080A0D]/90 border border-[#1B212A] px-2.5 py-1 rounded flex items-center space-x-1.5">
            {isGateOpen ? <Unlock className="w-3 h-3 text-[#70C1B3]" /> : <Lock className="w-3 h-3 text-[#EF233C]" />}
            <span className={isGateOpen ? 'text-[#70C1B3] font-bold' : 'text-[#8E98A5]'}>
              {isGateOpen ? 'ESCAPE ROUTE CLEAR' : `Persuasion: ${persuasionScore}% / 100%`}
            </span>
          </div>
        </div>

        {/* Persuasion Progress Bar */}
        <div className="w-full bg-[#080A0D] h-2 rounded-full overflow-hidden border border-[#1B212A] mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#EF233C] via-[#E0A96D] to-[#70C1B3] transition-all duration-500 shadow-sm"
            style={{ width: `${persuasionScore}%` }}
          />
        </div>

        {/* Dialogue Scroll Container */}
        <div className="flex-1 bg-[#080A0D] border border-[#1B212A] rounded-xl p-3.5 overflow-y-auto mb-3 space-y-3 font-mono text-xs min-h-[160px] max-h-[220px]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border leading-relaxed ${
                m.sender === 'player'
                  ? 'bg-[#181D26] border-[#E0A96D]/50 text-[#F0F4F8] ml-6'
                  : 'bg-[#101318] border-[#1B212A] text-[#70C1B3] mr-6'
              }`}
            >
              <span className="text-[9px] uppercase tracking-widest font-bold block mb-1 opacity-75">
                {m.sender === 'player' ? '// YOU (PRISONER)' : '// SENTINEL WARDEN (GEMMA)'}
              </span>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          ))}
          {isWardenThinking && (
            <div className="p-2.5 rounded-lg bg-[#101318] border border-[#1B212A] text-[#70C1B3] mr-6 animate-pulse flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-[#70C1B3]" />
              <span className="text-[10px] tracking-widest uppercase">The Warden weighs your argument...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Composer */}
        <div className="w-full flex space-x-2 mb-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendArgument()}
            disabled={isWardenThinking || isGateOpen}
            placeholder={
              isGateOpen
                ? 'The portcullis is fully raised. Claim your seal!'
                : 'Offer an argument of reason, paradox, or duty to the Warden...'
            }
            className="flex-1 bg-[#080A0D] border border-[#1B212A] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#F0F4F8] focus:border-[#70C1B3] focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSendArgument}
            disabled={!inputText.trim() || isWardenThinking || isGateOpen}
            className="px-4 py-2.5 bg-[#70C1B3] hover:bg-[#70C1B3]/90 disabled:opacity-40 text-[#080A0D] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center space-x-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Persuade</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="w-full flex space-x-3">
          <button
            onClick={onComplete}
            disabled={!isGateOpen}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md ${
              isGateOpen
                ? 'bg-[#70C1B3] hover:bg-[#70C1B3]/90 text-[#080A0D] cursor-pointer animate-pulse'
                : 'bg-[#1A202A] text-[#8E98A5] cursor-not-allowed opacity-50'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{isGateOpen ? 'Claim Chamber Seal & Escape' : 'Persuade Warden to Unlock'}</span>
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
