import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { MazeLayout, CELL_WALL } from './types';
import { computeRaycastPolygon, SIGHT_DISTANCE_TILES } from './raycastLOS';
import { mazeAudio } from './mazeAudio';
import { Sparkles } from 'lucide-react';

interface MazeCanvasProps {
  layout: MazeLayout;
  onEnterChamber: (chamberId: any) => void;
  onReachExit: () => void;
}

export const MazeCanvas: React.FC<MazeCanvasProps> = ({
  layout,
  onEnterChamber,
  onReachExit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { audioMuted, audioVolume } = useSettingsStore();
  const { setPlayerPosition, activeChamber } = useGameStore();

  const [currentChamberHint, setCurrentChamberHint] = useState<string | null>(null);

  // Smooth position interpolation refs
  const renderPosRef = useRef({ x: layout.start.x, y: layout.start.y });
  const targetPosRef = useRef({ x: layout.start.x, y: layout.start.y });
  const waveTickRef = useRef(0);

  // Sync audio state
  useEffect(() => {
    mazeAudio.setMuted(audioMuted);
    mazeAudio.setVolume(audioVolume);
  }, [audioMuted, audioVolume]);

  // Handle movements with collision detection
  const movePlayer = useCallback(
    (dx: number, dy: number) => {
      const newX = targetPosRef.current.x + dx;
      const newY = targetPosRef.current.y + dy;

      if (
        newX >= 0 &&
        newX < layout.width &&
        newY >= 0 &&
        newY < layout.height &&
        layout.grid[newY][newX] !== CELL_WALL
      ) {
        targetPosRef.current = { x: newX, y: newY };
        setPlayerPosition(newX, newY);
        mazeAudio.playFootstep();

        // Check if standing on a chamber or exit
        const cellType = layout.grid[newY][newX];
        const chamber = layout.chambers.find(
          (c) => c.position.x === newX && c.position.y === newY
        );

        if (chamber) {
          setCurrentChamberHint(chamber.name);
          mazeAudio.playChamberDiscover();
        } else if (cellType === 8) {
          setCurrentChamberHint('Exit Portal // Mind Dossier');
          mazeAudio.playChamberDiscover();
        } else {
          setCurrentChamberHint(null);
        }
      }
    },
    [layout, setPlayerPosition]
  );

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeChamber !== null) return; // Do not move when modal is open

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -1;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;
      else if (e.key === ' ' || e.key === 'Enter') {
        const { x, y } = targetPosRef.current;
        const cell = layout.grid[y][x];
        const chamber = layout.chambers.find(
          (c) => c.position.x === x && c.position.y === y
        );

        if (chamber) {
          onEnterChamber(chamber.id);
        } else if (cell === 8) {
          onReachExit();
        }
        return;
      } else {
        return;
      }

      e.preventDefault();
      movePlayer(dx, dy);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChamber, layout, movePlayer, onEnterChamber, onReachExit]);

  // Canvas 60 FPS Render Loop with Raycast Clipping
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      waveTickRef.current += 0.05;
      const cellSize = canvas.width / layout.width;

      // Smooth avatar position interpolation
      renderPosRef.current.x += (targetPosRef.current.x - renderPosRef.current.x) * 0.28;
      renderPosRef.current.y += (targetPosRef.current.y - renderPosRef.current.y) * 0.28;

      const playerPx = renderPosRef.current.x * cellSize + cellSize / 2;
      const playerPy = renderPosRef.current.y * cellSize + cellSize / 2;

      // 1. CLEAR VOID (Absolute graphite abyss)
      ctx.fillStyle = '#090B0E';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. COMPUTE 320-RAY PHYSICAL RAYCAST VISIBILITY POLYGON
      const rayPoints = computeRaycastPolygon(
        playerPx,
        playerPy,
        cellSize,
        layout.grid,
        layout.width,
        layout.height,
        SIGHT_DISTANCE_TILES
      );

      // 3. CLIP CANVAS TO PHYSICAL LINE OF SIGHT (Ephemeral Unrevealing)
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rayPoints[0].x, rayPoints[0].y);
      for (let i = 1; i < rayPoints.length; i++) {
        ctx.lineTo(rayPoints[i].x, rayPoints[i].y);
      }
      ctx.closePath();
      ctx.clip(); // Everything outside this physical light fan is completely invisible!

      // 4. DRAW VISIBLE CELLS INSIDE RAYCAST VISIBILITY CONE
      for (let y = 0; y < layout.height; y++) {
        for (let x = 0; x < layout.width; x++) {
          const type = layout.grid[y][x];
          const px = x * cellSize;
          const py = y * cellSize;

          if (type === CELL_WALL) {
            // Architectural Slate Wall
            ctx.fillStyle = '#1A202C';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#283244';
            ctx.lineWidth = 1;
            ctx.strokeRect(px, py, cellSize, cellSize);
          } else {
            // Walkable Chalk Corridor Floor
            ctx.fillStyle = '#10141C';
            ctx.fillRect(px, py, cellSize, cellSize);

            // Subtle chalk blueprint grid lines
            ctx.strokeStyle = 'rgba(112, 193, 179, 0.12)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);

            if (type >= 2 && type <= 7) {
              // Chamber Portal Seal with Standing Wave Oscillation
              const wave = Math.sin(waveTickRef.current * 2 + x + y) * 2;

              ctx.strokeStyle = '#70C1B3';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(px + cellSize / 2, py + cellSize / 2, (cellSize * 0.35) + wave * 0.3, 0, Math.PI * 2);
              ctx.stroke();

              ctx.fillStyle = '#E0A96D';
              ctx.beginPath();
              ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.18, 0, Math.PI * 2);
              ctx.fill();
            } else if (type === 8) {
              // Exit Portal (Radiant Seal)
              ctx.strokeStyle = '#00F5D4';
              ctx.lineWidth = 2;
              ctx.strokeRect(px + cellSize * 0.2, py + cellSize * 0.2, cellSize * 0.6, cellSize * 0.6);

              ctx.fillStyle = '#00F5D4';
              ctx.beginPath();
              ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.15, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 5. VOLUMETRIC GRADIENT ATTENUATION (Light diminishes down long corridors)
      const grad = ctx.createRadialGradient(
        playerPx,
        playerPy,
        cellSize * 0.4,
        playerPx,
        playerPy,
        cellSize * SIGHT_DISTANCE_TILES
      );
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
      grad.addColorStop(1, 'rgba(9, 11, 14, 0.96)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.restore(); // END RAYCAST CLIP

      // 6. DRAW SUBTLE VISIBLE RAYCAST BOUNDARY CONTOUR
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rayPoints[0].x, rayPoints[0].y);
      for (let i = 1; i < rayPoints.length; i++) {
        ctx.lineTo(rayPoints[i].x, rayPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();

      // 7. DRAW ARCHITECTURAL COMPASS AVATAR RETICLE
      ctx.strokeStyle = '#F0F6FC';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(playerPx, playerPy, cellSize * 0.26, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#70C1B3';
      ctx.beginPath();
      ctx.arc(playerPx, playerPy, 4, 0, Math.PI * 2);
      ctx.fill();

      // Precision Reticle Crosshairs
      ctx.strokeStyle = '#70C1B3';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(playerPx - 10, playerPy);
      ctx.lineTo(playerPx + 10, playerPy);
      ctx.moveTo(playerPx, playerPy - 10);
      ctx.lineTo(playerPx, playerPy + 10);
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [layout]);

  // Responsive Canvas Sizing
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const size = Math.min(
        container.clientWidth - 24,
        container.clientHeight - 24,
        840
      );
      canvas.width = size;
      canvas.height = size;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center bg-[#090B0E] overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="cursor-crosshair shadow-2xl rounded-sm border border-[#1E242E]"
      />

      {/* Ephemeral Chamber Discovery Toast */}
      {currentChamberHint && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-[#11141A]/95 border border-[#70C1B3] px-5 py-2.5 rounded-lg shadow-2xl flex items-center space-x-3 backdrop-blur-md animate-bounce">
            <Sparkles className="w-4 h-4 text-[#70C1B3] animate-spin-slow" />
            <span className="font-mono text-xs text-[#F0F6FC] tracking-wider uppercase font-semibold">
              {currentChamberHint} — PRESS [SPACE] OR ENTER TO ENGAGE
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
