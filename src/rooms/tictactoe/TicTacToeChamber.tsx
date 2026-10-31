import { useState, useEffect, useRef } from 'react';
import { X, Award, RotateCcw, Brain, Shield, Sparkles } from 'lucide-react';
import { mazeAudio } from '../maze/mazeAudio';
import { streamLLM } from '../../services/llm/llmService';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface TicTacToeChamberProps {
  onClose: () => void;
  onComplete: () => void;
}

type BoardCell = 'X' | 'O' | '';
type Difficulty = 'easy' | 'medium' | 'hard';

export function TicTacToeChamber({ onClose, onComplete }: TicTacToeChamberProps) {
  const [board, setBoard] = useState<BoardCell[]>(Array(9).fill(''));
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [scores, setScores] = useState({ player: 0, sentinel: 0, draws: 0 });
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiCommentary, setAiCommentary] = useState<string>(
    '"I have calculated 255,168 possible game states. Place your mark upon the stone, traveler."'
  );
  const [isStreamingBanter, setIsStreamingBanter] = useState(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  const updateTraits = useGameStore((state) => state.updateTraits);
  const banterAbortRef = useRef<(() => void) | null>(null);

  const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
  ];

  function checkWinner(b: BoardCell[]): { winner: 'X' | 'O' | 'draw' | null; line: number[] | null } {
    for (const pattern of WIN_PATTERNS) {
      const [a, bIdx, c] = pattern;
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return { winner: b[a] as 'X' | 'O', line: pattern };
      }
    }
    if (b.every((cell) => cell !== '')) {
      return { winner: 'draw', line: null };
    }
    return { winner: null, line: null };
  }

  // Minimax algorithm for client-side zero-token AI
  function evaluateMinimax(b: BoardCell[], depth: number, isMaximizing: boolean): number {
    const res = checkWinner(b);
    if (res.winner === 'O') return 10 - depth;
    if (res.winner === 'X') return depth - 10;
    if (res.winner === 'draw') return 0;

    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] === '') {
          b[i] = 'O';
          const score = evaluateMinimax(b, depth + 1, false);
          b[i] = '';
          maxScore = Math.max(maxScore, score);
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (b[i] === '') {
          b[i] = 'X';
          const score = evaluateMinimax(b, depth + 1, true);
          b[i] = '';
          minScore = Math.min(minScore, score);
        }
      }
      return minScore;
    }
  }

  function getBestAiMove(b: BoardCell[]): number {
    // If easy, pick random
    const emptyIndices = b.map((val, idx) => (val === '' ? idx : -1)).filter((idx) => idx !== -1);
    if (difficulty === 'easy') {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // If medium, 50% random / 50% best
    if (difficulty === 'medium' && Math.random() < 0.45) {
      return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

    // Hard: Minimax optimal
    let bestScore = -Infinity;
    let bestMove = emptyIndices[0];

    for (const idx of emptyIndices) {
      b[idx] = 'O';
      const score = evaluateMinimax(b, 0, false);
      b[idx] = '';
      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      }
    }
    return bestMove;
  }

  const handleCellClick = (index: number) => {
    if (board[index] !== '' || isGameOver || isAiThinking) return;

    mazeAudio.playStoneClick();
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const matchState = checkWinner(newBoard);
    if (matchState.winner) {
      finishGame(matchState.winner, matchState.line, newBoard);
      return;
    }

    // AI Move
    setIsAiThinking(true);
    setTimeout(() => {
      const aiIdx = getBestAiMove(newBoard);
      if (aiIdx !== undefined) {
        newBoard[aiIdx] = 'O';
        setBoard([...newBoard]);
        mazeAudio.playStoneClick();

        const aiMatchState = checkWinner(newBoard);
        if (aiMatchState.winner) {
          finishGame(aiMatchState.winner, aiMatchState.line, newBoard);
        }
      }
      setIsAiThinking(false);
    }, 280);
  };

  const finishGame = (
    result: 'X' | 'O' | 'draw',
    line: number[] | null,
    _finalBoard: BoardCell[]
  ) => {
    setIsGameOver(true);
    setWinner(result);
    setWinningLine(line);

    if (result === 'X') {
      setScores((prev) => ({ ...prev, player: prev.player + 1 }));
      mazeAudio.playVictory();
      updateTraits({ conscientiousness: 0.25, composure: 0.1, openness: 0.1 });
      requestAiBanter('The player defeated the Sentinel in Tic-Tac-Toe on difficulty: ' + difficulty);
    } else if (result === 'O') {
      setScores((prev) => ({ ...prev, sentinel: prev.sentinel + 1 }));
      updateTraits({ composure: -0.05, conscientiousness: 0.05 });
      requestAiBanter('The Sentinel defeated the player in Tic-Tac-Toe. Offer an enigmatic stoic critique.');
    } else {
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      mazeAudio.playStoneClick();
      updateTraits({ conscientiousness: 0.15, openness: 0.05 });
      requestAiBanter('The game ended in a draw against Minimax. Commend the player’s defensive equilibrium.');
    }
  };

  const requestAiBanter = (context: string) => {
    if (banterAbortRef.current) {
      banterAbortRef.current();
    }

    setIsStreamingBanter(true);
    let fullText = '';
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

    streamLLM(
      {
        messages: [
          {
            role: 'system',
            content:
              'You are the Ancient Stone Sentinel Warden of Chamber 01 in the Psychometric Labyrinth, powered by Gemma. Deliver an articulate, intellectually profound evaluation of the player’s strategy, foresight, and tactical adaptability based on their moves. Speak in an atmospheric, philosophical tone.'
          },
          {
            role: 'user',
            content: context
          }
        ],
        maxTokens: 350,
        signal: controller.signal
      },
      config,
      {
        onChunk: (chunk: string) => {
          fullText += chunk;
          setAiCommentary(fullText);
        },
        onComplete: () => {
          setIsStreamingBanter(false);
        },
        onError: () => {
          setIsStreamingBanter(false);
          setAiCommentary(resultFallback(winner));
        }
      }
    );
  };

  function resultFallback(res: 'X' | 'O' | 'draw' | null) {
    if (res === 'X') {
      return '"An uncommon flaw found in my calculations. You possess an acute spatial awareness, traveler."';
    } else if (res === 'O') {
      return '"Deterministic certainty prevailed. Study the geometry of foresight and try again."';
    }
    return '"Equilibrium achieved. Neither order nor entropy yielded ground upon the tablet."';
  }

  const handleResetBoard = () => {
    mazeAudio.playStoneClick();
    setBoard(Array(9).fill(''));
    setIsGameOver(false);
    setWinner(null);
    setWinningLine(null);
  };

  useEffect(() => {
    return () => {
      if (banterAbortRef.current) {
        banterAbortRef.current();
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#101318] border border-[#1B212A] rounded-xl p-6 shadow-2xl relative flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8E98A5] hover:text-[#F0F4F8] transition-colors p-1"
          title="Return to Labyrinth"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Chamber Header */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-[#1B212A]">
          <div className="flex items-center space-x-3">
            <span className="w-3 h-3 rounded-full bg-[#70C1B3] animate-pulse" />
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#70C1B3] block">
                ROOM 01 // STRATEGIC FORESIGHT
              </span>
              <h2 className="text-xl font-display font-bold uppercase text-[#F0F4F8]">
                Stone Tablet Tic-Tac-Toe
              </h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-[#8E98A5] block">ALGORITHM</span>
            <span className="font-mono text-xs font-bold text-[#E0A96D] uppercase">
              Minimax // {difficulty}
            </span>
          </div>
        </div>

        {/* Scoreboard & Difficulty Toggles */}
        <div className="w-full flex items-center justify-between mb-4 bg-[#080A0D] p-3 rounded-lg border border-[#1B212A] font-mono text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-[#70C1B3] font-bold">YOU (✖): {scores.player}</span>
            <span className="text-[#E0A96D] font-bold">SENTINEL (◯): {scores.sentinel}</span>
            <span className="text-[#8E98A5]">DRAWS: {scores.draws}</span>
          </div>

          <div className="flex items-center space-x-1 bg-[#13171F] p-0.5 rounded border border-[#1B212A] text-[10px]">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  handleResetBoard();
                }}
                className={`px-2 py-0.5 rounded capitalize transition-all ${
                  difficulty === d
                    ? 'bg-[#1A202A] text-[#70C1B3] font-bold border border-[#70C1B3]/40'
                    : 'text-[#8E98A5] hover:text-[#F0F4F8]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* The Carved Stone Tablet Grid */}
        <div className="relative p-6 bg-[#0B0E12] border-2 border-[#1B212A] rounded-2xl shadow-inner mb-4 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-3 w-72 h-72">
            {board.map((cell, idx) => {
              const isWinning = winningLine?.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  disabled={cell !== '' || isGameOver || isAiThinking}
                  className={`relative flex items-center justify-center rounded-xl bg-[#13171F] border border-[#1B212A] transition-all text-4xl font-display font-extrabold select-none ${
                    cell === '' && !isGameOver && !isAiThinking
                      ? 'hover:bg-[#1A202A] hover:border-[#70C1B3]/50 cursor-pointer shadow-sm hover:scale-[1.02]'
                      : 'cursor-default'
                  } ${isWinning ? 'border-[#70C1B3] bg-[#70C1B3]/10 shadow-[0_0_15px_rgba(112,193,179,0.3)]' : ''}`}
                >
                  {/* Subtle Chiseled Corner Inset */}
                  <span className="absolute top-1.5 left-1.5 w-1 h-1 bg-[#1B212A] rounded-full" />
                  <span className="absolute bottom-1.5 right-1.5 w-1 h-1 bg-[#1B212A] rounded-full" />

                  {cell === 'X' && (
                    <span className="text-[#70C1B3] drop-shadow-[0_0_8px_rgba(112,193,179,0.6)] animate-in fade-in zoom-in-75 duration-200">
                      ✖
                    </span>
                  )}
                  {cell === 'O' && (
                    <span className="text-[#E0A96D] drop-shadow-[0_0_8px_rgba(224,169,109,0.6)] animate-in fade-in zoom-in-75 duration-200">
                      ◯
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* AI Thinking Overlay */}
          {isAiThinking && (
            <div className="absolute inset-0 bg-[#0B0E12]/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="flex items-center space-x-2 text-xs font-mono text-[#E0A96D] bg-[#101318] px-3.5 py-1.5 rounded-full border border-[#E0A96D]/40 shadow-lg">
                <Brain className="w-4 h-4 animate-spin text-[#E0A96D]" />
                <span>SENTINEL EVALUATING...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sentinel Banter / Psychological Commentary Box */}
        <div className="w-full bg-[#080A0D] p-3.5 rounded-xl border border-[#1B212A] mb-4 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-[#8E98A5] uppercase tracking-wider mb-1.5">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-[#70C1B3]" />
              <span>SENTINEL PSYCHOMETRIC OBSERVATION</span>
            </span>
            {isStreamingBanter && <span className="text-[#70C1B3] animate-pulse">STREAMING...</span>}
          </div>
          <p className="text-[#F0F4F8] italic leading-relaxed text-xs">
            {aiCommentary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="w-full flex space-x-3">
          <button
            onClick={handleResetBoard}
            className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-[#1A202A] hover:bg-[#232B38] text-[#8E98A5] hover:text-[#F0F4F8] font-mono text-xs font-bold rounded-lg border border-[#1B212A] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Board</span>
          </button>

          <button
            onClick={onComplete}
            className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-[#70C1B3] hover:bg-[#70C1B3]/90 text-[#080A0D] font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md"
          >
            <Award className="w-4 h-4" />
            <span>Claim Chamber Seal & Continue</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[#13171F] hover:bg-[#1A202A] text-[#8E98A5] hover:text-[#F0F4F8] font-mono text-xs rounded-lg border border-[#1B212A]"
          >
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            <span>Exit Chamber</span>
          </button>
        </div>
      </div>
    </div>
  );
}
