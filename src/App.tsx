import { useState, useMemo } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import { useGameStore } from './store/useGameStore';
import { SettingsModal } from './components/SettingsModal';
import { generateProceduralMaze } from './rooms/maze/mazeGenerator';
import { MazeCanvas } from './rooms/maze/MazeCanvas';
import { TicTacToeChamber } from './rooms/tictactoe/TicTacToeChamber';
import { SnakesChamber } from './rooms/snakes/SnakesChamber';
import { EntrapmentChamber } from './rooms/entrapment/EntrapmentChamber';
import { RagebaitChamber } from './rooms/ragebait/RagebaitChamber';
import { MbtiChamber } from './rooms/mbti/MbtiChamber';
import { MoralChamber } from './rooms/moral/MoralChamber';
import { DossierModal } from './rooms/dossier/DossierModal';
import { ChamberId } from './types';
import {
  Settings,
  Cpu,
  Cloud,
  Compass,
  Shield,
  Volume2,
  VolumeX,
  RefreshCw,
  Award,
} from 'lucide-react';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeModalChamber, setActiveModalChamber] = useState<ChamberId | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const { provider, audioMuted, toggleAudioMute } = useSettingsStore();
  const { playerX, playerY, completedChambers, resetGame, completeChamber } = useGameStore();

  // Procedural Maze State (Re-randomizable & scalable)
  const [mazeSeed, setMazeSeed] = useState(0);
  const [mazeDimension, setMazeDimension] = useState<number>(25); // Enlarged default: 25x25 grid
  const mazeLayout = useMemo(
    () => generateProceduralMaze(mazeDimension, mazeDimension),
    [mazeDimension, mazeSeed]
  );

  const handleRegenerateMaze = () => {
    resetGame();
    setMazeSeed((prev) => prev + 1);
  };

  const handleDimensionChange = (dim: number) => {
    resetGame();
    setMazeDimension(dim);
  };

  const handleEnterChamber = (chamberId: ChamberId) => {
    setActiveModalChamber(chamberId);
  };

  const handleReachExit = () => {
    setShowExitModal(true);
  };



  return (
    <div className="relative w-screen h-screen bg-[#090B0E] text-[#F0F4F8] flex flex-col overflow-hidden select-none">
      {/* Top Precision HUD */}
      <header className="h-14 border-b border-[#1E242E] bg-[#0D1016]/95 backdrop-blur-md px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#70C1B3] animate-pulse shadow-[0_0_12px_rgba(112,193,179,0.7)]" />
            <h1 className="font-display font-extrabold text-sm md:text-base tracking-wider uppercase text-[#F0F4F8]">
              Psychometric Labyrinth
            </h1>
          </div>
          <span className="hidden md:inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-[#11141A] border border-[#1E242E] text-[#8E98A5]">
            Physical Raycast LOS • Ephemeral Fog
          </span>
        </div>

        {/* Spatial Coordinates & Controls */}
        <div className="flex items-center space-x-4 md:space-x-6">
          <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-[#8E98A5] bg-[#090B0E] px-3 py-1 rounded border border-[#1E242E]">
            <Compass className="w-3.5 h-3.5 text-[#70C1B3]" />
            <span>LOC: [X: {playerX.toString().padStart(2, '0')}, Y: {playerY.toString().padStart(2, '0')}]</span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono bg-[#090B0E] px-3 py-1 rounded border border-[#1E242E]">
            <Shield className="w-3.5 h-3.5 text-[#E0A96D]" />
            <span>CHAMBERS: {completedChambers.size} / 6</span>
          </div>

          {/* Maze Dimension Selector */}
          <div className="hidden xl:flex items-center space-x-1 bg-[#11141A] p-0.5 rounded border border-[#1E242E] text-[10px] font-mono">
            {[21, 25, 29].map((dim) => (
              <button
                key={dim}
                onClick={() => handleDimensionChange(dim)}
                className={`px-2 py-0.5 rounded transition-all ${
                  mazeDimension === dim
                    ? 'bg-[#1E2532] text-[#F0F4F8] font-bold border border-[#70C1B3]/50'
                    : 'text-[#8E98A5] hover:text-[#F0F4F8]'
                }`}
                title={`Switch maze scale to ${dim}x${dim}`}
              >
                {dim}×{dim}
              </button>
            ))}
          </div>

          {/* Regenerate Random Maze */}
          <button
            onClick={handleRegenerateMaze}
            title="Randomize New Maze Layout"
            className="flex items-center space-x-1.5 text-xs font-mono bg-[#11141A] hover:bg-[#1A202C] px-2.5 py-1 rounded border border-[#1E242E] hover:border-[#70C1B3] text-[#8E98A5] hover:text-[#F0F4F8] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Randomize</span>
          </button>

          {/* Dual-Rail Mode Toggle: Local Gemma vs Cloud API */}
          <div className="flex items-center space-x-1 bg-[#11141A] p-0.5 rounded border border-[#1E242E] text-xs font-mono">
            <button
              onClick={() => useSettingsStore.getState().setProvider('ollama')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-all ${
                provider === 'ollama'
                  ? 'bg-[#181D26] text-[#70C1B3] font-bold border border-[#70C1B3]/50 shadow-sm'
                  : 'text-[#8E98A5] hover:text-[#F0F4F8]'
              }`}
              title="Run on Local Ollama (gemma4:e4b)"
            >
              <Cpu className="w-3.5 h-3.5 text-[#70C1B3]" />
              <span className="hidden md:inline">Local Gemma</span>
              <span className="md:hidden">Local</span>
            </button>
            <button
              onClick={() => useSettingsStore.getState().setProvider('gemini')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded transition-all ${
                provider === 'gemini'
                  ? 'bg-[#181D26] text-[#E0A96D] font-bold border border-[#E0A96D]/50 shadow-sm'
                  : 'text-[#8E98A5] hover:text-[#F0F4F8]'
              }`}
              title="Run on Cloud API (Gemini from .env or Settings)"
            >
              <Cloud className="w-3.5 h-3.5 text-[#E0A96D]" />
              <span className="hidden md:inline">Cloud API</span>
              <span className="md:hidden">API</span>
            </button>
          </div>

          {/* Mind Dossier Archive Button */}
          <button
            onClick={() => setShowExitModal(true)}
            title="Open Mind Dossier Synthesis"
            className="flex items-center space-x-1.5 text-xs font-mono bg-[#11141A] hover:bg-[#1A202C] px-2.5 py-1 rounded border border-[#1E242E] hover:border-[#70C1B3] text-[#70C1B3] transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Dossier</span>
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleAudioMute}
            className="text-[#8E98A5] hover:text-[#F0F4F8] transition-colors"
            title={audioMuted ? 'Unmute procedural sound' : 'Mute procedural sound'}
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-[#EF233C]" /> : <Volume2 className="w-4 h-4 text-[#70C1B3]" />}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded hover:bg-[#11141A] text-[#8E98A5] hover:text-[#F0F4F8] border border-transparent hover:border-[#1E242E] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Maze Canvas Viewport */}
      <main className="relative flex-1 w-full h-full overflow-hidden bg-[#090B0E]">
        <MazeCanvas
          layout={mazeLayout}
          onEnterChamber={handleEnterChamber}
          onReachExit={handleReachExit}
        />

        {/* Ambient Legend (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center space-x-3 bg-[#0D1016]/90 border border-[#1E242E] px-4 py-2 rounded-lg shadow-xl backdrop-blur-sm text-xs font-mono">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F0F6FC]"></span>
            <span className="text-[#8E98A5]">You</span>
          </span>
          <span className="text-[#1E242E]">|</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E0A96D]"></span>
            <span className="text-[#8E98A5]">Chamber Portal</span>
          </span>
          <span className="text-[#1E242E]">|</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded bg-[#00F5D4]"></span>
            <span className="text-[#8E98A5]">Exit</span>
          </span>
        </div>
      </main>

      {/* Chamber Encounter Modal Overlays */}
      {activeModalChamber === 'tictactoe' && (
        <TicTacToeChamber
          onClose={() => setActiveModalChamber(null)}
          onComplete={() => {
            completeChamber('tictactoe');
            setActiveModalChamber(null);
          }}
        />
      )}

      {activeModalChamber === 'snakes' && (
        <SnakesChamber
          onClose={() => setActiveModalChamber(null)}
          onComplete={() => {
            completeChamber('snakes');
            setActiveModalChamber(null);
          }}
        />
      )}

      {activeModalChamber === 'entrapment' && (
        <EntrapmentChamber
          onClose={() => setActiveModalChamber(null)}
          onComplete={() => {
            completeChamber('entrapment');
            setActiveModalChamber(null);
          }}
        />
      )}

      {activeModalChamber === 'ragebait' && (
        <RagebaitChamber
          onClose={() => setActiveModalChamber(null)}
          onComplete={() => {
            completeChamber('ragebait');
            setActiveModalChamber(null);
          }}
        />
      )}

      {activeModalChamber === 'mbti' && (
        <MbtiChamber
          onClose={() => setActiveModalChamber(null)}
          onComplete={() => {
            completeChamber('mbti');
            setActiveModalChamber(null);
          }}
        />
      )}

      {activeModalChamber === 'moral' && (
        <MoralChamber
          onClose={() => setActiveModalChamber(null)}
          onComplete={() => {
            completeChamber('moral');
            setActiveModalChamber(null);
          }}
        />
      )}

      {/* Exit Portal / Mind Dossier Synthesis Modal */}
      {showExitModal && (
        <DossierModal
          onClose={() => setShowExitModal(false)}
          onRestart={() => {
            resetGame();
            setShowExitModal(false);
          }}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
