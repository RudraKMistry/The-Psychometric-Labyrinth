import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Award, RotateCcw, Dices, Shield, Sparkles, Bot, User, Trophy } from 'lucide-react';
import { mazeAudio } from '../maze/mazeAudio';
import { streamLLM } from '../../services/llm/llmService';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

interface SnakesChamberProps {
  onClose: () => void;
  onComplete: () => void;
}

interface Ladder {
  start: number;
  end: number;
}

interface Snake {
  head: number;
  tail: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface PawnVisual {
  x: number;
  y: number;
  jumpY: number;
  scaleX: number;
  scaleY: number;
}

const REAL_LADDERS: Ladder[] = [
  { start: 5, end: 22 },
  { start: 13, end: 35 },
  { start: 27, end: 46 },
  { start: 40, end: 59 },
  { start: 44, end: 62 }
];

const REAL_SNAKES: Snake[] = [
  { head: 25, tail: 8 },
  { head: 38, tail: 15 },
  { head: 49, tail: 12 },
  { head: 57, tail: 32 },
  { head: 61, tail: 41 }
];

export function SnakesChamber({ onClose, onComplete }: SnakesChamberProps) {
  // Logical Positions (1..64)
  const [playerTile, setPlayerTile] = useState<number>(1);
  const [aiTile, setAiTile] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<'player' | 'ai'>('player');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [roundNumber, setRoundNumber] = useState<number>(1);

  // Dice & Activity States
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Status & Logs
  const [bannerMessage, setBannerMessage] = useState<string>('Your Turn // Cast the golden die to open the duel.');
  const [bannerColor, setBannerColor] = useState<string>('#E0A96D');
  const [stats, setStats] = useState({
    playerSnakes: 0,
    playerLadders: 0,
    aiSnakes: 0,
    aiLadders: 0,
  });

  const [aiCommentary, setAiCommentary] = useState<string>(
    '"A contest of probabilistic destiny. Let us see whose feet the labyrinth favors, mortal."'
  );
  const [isStreamingBanter, setIsStreamingBanter] = useState(false);

  // Refs for 60 FPS animation loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerVisualRef = useRef<PawnVisual>({ x: 0, y: 0, jumpY: 0, scaleX: 1, scaleY: 1 });
  const aiVisualRef = useRef<PawnVisual>({ x: 0, y: 0, jumpY: 0, scaleX: 1, scaleY: 1 });
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const updateTraits = useGameStore((state) => state.updateTraits);
  const banterAbortRef = useRef<(() => void) | null>(null);

  // Helper to map 1..64 tile index to canvas (x, y) coordinates
  const getTileCenter = useCallback((tile: number, cellSize: number) => {
    const t = Math.max(1, Math.min(64, tile)) - 1;
    const row = Math.floor(t / 8);
    const colInRow = t % 8;
    const col = row % 2 === 0 ? colInRow : 7 - colInRow;

    return {
      x: col * cellSize + cellSize / 2,
      y: (7 - row) * cellSize + cellSize / 2
    };
  }, []);

  // Initialize visual pawn positions on mount or canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = canvas.width / 8;
    const pCenter = getTileCenter(playerTile, cellSize);
    const aCenter = getTileCenter(aiTile, cellSize);

    playerVisualRef.current.x = pCenter.x;
    playerVisualRef.current.y = pCenter.y;
    aiVisualRef.current.x = aCenter.x;
    aiVisualRef.current.y = aCenter.y;
  }, [getTileCenter]);

  // Continuous 60 FPS Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pulseAngle = 0;

    const render = () => {
      pulseAngle += 0.04;
      const w = canvas.width;
      const cellSize = w / 8;

      ctx.save();

      // Screen shake translation
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(shakeX, shakeY);
        screenShakeRef.current = Math.max(0, screenShakeRef.current - 0.25);
      }

      // 1. Board Background Fill
      ctx.fillStyle = '#080A0D';
      ctx.fillRect(0, 0, w, w);

      // 2. Render 64 Stone Tiles
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const tileIndex = row % 2 === 0 ? row * 8 + col + 1 : row * 8 + (7 - col) + 1;
          const px = col * cellSize;
          const py = (7 - row) * cellSize;

          ctx.fillStyle = (row + col) % 2 === 0 ? '#101318' : '#13171F';
          ctx.fillRect(px, py, cellSize, cellSize);

          ctx.strokeStyle = '#1B212A';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cellSize, cellSize);

          // Goal Zenith Tile 64 Highlight
          if (tileIndex === 64) {
            ctx.fillStyle = 'rgba(112, 193, 179, 0.15)';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.strokeStyle = '#70C1B3';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

            // Zenith Crown Marker
            ctx.fillStyle = '#70C1B3';
            ctx.font = 'bold 9px JetBrains Mono, monospace';
            ctx.fillText('ZENITH', px + 4, py + cellSize - 6);
          }

          // Tile Coordinate Number
          ctx.fillStyle = tileIndex === 64 ? '#70C1B3' : '#6B7280';
          ctx.font = '500 9px JetBrains Mono, monospace';
          ctx.fillText(tileIndex.toString().padStart(2, '0'), px + 4, py + 12);
        }
      }

      // 3. Render Copper Ladders
      REAL_LADDERS.forEach((ladder) => {
        const p1 = getTileCenter(ladder.start, cellSize);
        const p2 = getTileCenter(ladder.end, cellSize);

        ctx.save();
        ctx.strokeStyle = '#70C1B3';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = 'rgba(112, 193, 179, 0.5)';
        ctx.shadowBlur = 6;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);
        const perpX = -Math.sin(angle) * 7.5;
        const perpY = Math.cos(angle) * 7.5;

        // Two copper side rails
        ctx.beginPath();
        ctx.moveTo(p1.x - perpX, p1.y - perpY);
        ctx.lineTo(p2.x - perpX, p2.y - perpY);
        ctx.moveTo(p1.x + perpX, p1.y + perpY);
        ctx.lineTo(p2.x + perpX, p2.y + perpY);
        ctx.stroke();

        // Rungs
        const rungs = Math.floor(len / 13);
        ctx.lineWidth = 2;
        for (let i = 1; i <= rungs; i++) {
          const t = i / (rungs + 1);
          const rx = p1.x + dx * t;
          const ry = p1.y + dy * t;
          ctx.beginPath();
          ctx.moveTo(rx - perpX, ry - perpY);
          ctx.lineTo(rx + perpX, ry + perpY);
          ctx.stroke();
        }
        ctx.restore();
      });

      // 4. Render Crimson Serpents
      REAL_SNAKES.forEach((snake) => {
        const head = getTileCenter(snake.head, cellSize);
        const tail = getTileCenter(snake.tail, cellSize);

        ctx.save();
        ctx.strokeStyle = '#EF233C';
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(239, 35, 60, 0.6)';
        ctx.shadowBlur = 8;

        const midX = (head.x + tail.x) / 2 + (head.y > tail.y ? 24 : -24);
        const midY = (head.y + tail.y) / 2;

        // Undulating body curve
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.quadraticCurveTo(midX, midY, head.x, head.y);
        ctx.stroke();

        // Viper Head
        ctx.fillStyle = '#EF233C';
        ctx.beginPath();
        ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Fangs & Eyes
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(head.x - 2.5, head.y - 2, 1.8, 0, Math.PI * 2);
        ctx.arc(head.x + 2.5, head.y - 2, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 5. Update & Render Particle FX
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // 6. Draw Pawns with Dynamic Shadows and Parabolic Leaps
      const pv = playerVisualRef.current;
      const av = aiVisualRef.current;

      const isSameTile = Math.hypot(pv.x - av.x, pv.y - av.y) < 14;
      const playerOffsetX = isSameTile ? -7 : 0;
      const aiOffsetX = isSameTile ? 7 : 0;

      // Draw AI Sentinel (Cyan/Mint)
      drawPawn(
        ctx,
        av.x + aiOffsetX,
        av.y,
        av.jumpY,
        av.scaleX,
        av.scaleY,
        '#70C1B3',
        'rgba(112, 193, 179, 0.35)',
        currentTurn === 'ai' && !winner,
        pulseAngle
      );

      // Draw Player (Warm Amber)
      drawPawn(
        ctx,
        pv.x + playerOffsetX,
        pv.y,
        pv.jumpY,
        pv.scaleX,
        pv.scaleY,
        '#E0A96D',
        'rgba(224, 169, 109, 0.35)',
        currentTurn === 'player' && !winner,
        pulseAngle
      );

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [getTileCenter, currentTurn, winner]);

  // Helper to draw a pawn with elevation, shadow, and squish
  const drawPawn = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    jumpY: number,
    scaleX: number,
    scaleY: number,
    color: string,
    glowColor: string,
    isCurrentTurn: boolean,
    pulse: number
  ) => {
    ctx.save();

    // Floor Shadow (shrinks & fades as pawn leaps higher)
    const shadowScale = Math.max(0.35, 1 - jumpY / 30);
    const shadowAlpha = Math.max(0.15, 0.5 - jumpY / 45);
    ctx.save();
    ctx.translate(x, y + 2);
    ctx.scale(shadowScale, shadowScale * 0.55);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Turn Aura Ring (pulsing on current turn)
    if (isCurrentTurn) {
      const auraPulse = Math.sin(pulse) * 3;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y - jumpY, 13 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Pawn Body with Transformation (Squash & Stretch)
    ctx.translate(x, y - jumpY);
    ctx.scale(scaleX, scaleY);

    // Outer Glow Disc
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Solid Pawn Core
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Inner Specular Glint
    ctx.fillStyle = '#080A0D';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Spawn visual impact particles
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 0.8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 28,
        maxLife: 28,
        color,
        size: Math.random() * 2.5 + 1.2
      });
    }
  };

  // Helper promise for time delay
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // High-Quality Parabolic Tile Hop Animation
  const animateSingleHop = async (entity: 'player' | 'ai', fromTile: number, toTile: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = canvas.width / 8;
    const p1 = getTileCenter(fromTile, cellSize);
    const p2 = getTileCenter(toTile, cellSize);
    const visual = entity === 'player' ? playerVisualRef.current : aiVisualRef.current;

    // Hop Duration: 240ms per step (rich, rhythmic, deliberate pacing)
    const duration = 240;
    const startTime = performance.now();

    mazeAudio.playFootstep();

    return new Promise<void>((resolve) => {
      const stepHop = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);

        // Smooth sinusoidal easing
        const easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);

        visual.x = p1.x + (p2.x - p1.x) * easeT;
        visual.y = p1.y + (p2.y - p1.y) * easeT;

        // Parabolic vertical arc: jumps up to 22px in mid-air
        visual.jumpY = Math.sin(t * Math.PI) * 22;

        // Subtle stretch on ascent, squash on landing
        if (t < 0.5) {
          visual.scaleX = 0.9;
          visual.scaleY = 1.15;
        } else if (t < 0.9) {
          visual.scaleX = 1.0;
          visual.scaleY = 1.0;
        } else {
          // Landing touchdown squish
          visual.scaleX = 1.2;
          visual.scaleY = 0.8;
        }

        if (t < 1) {
          requestAnimationFrame(stepHop);
        } else {
          visual.x = p2.x;
          visual.y = p2.y;
          visual.jumpY = 0;
          visual.scaleX = 1;
          visual.scaleY = 1;

          // Touchdown dust
          spawnParticles(p2.x, p2.y, entity === 'player' ? '#E0A96D' : '#70C1B3', 6);
          mazeAudio.playStoneClick();
          resolve();
        }
      };

      requestAnimationFrame(stepHop);
    });
  };

  // Smooth Ladder Climb Animation
  const animateLadderClimb = async (entity: 'player' | 'ai', ladder: Ladder) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = canvas.width / 8;
    const p1 = getTileCenter(ladder.start, cellSize);
    const p2 = getTileCenter(ladder.end, cellSize);
    const visual = entity === 'player' ? playerVisualRef.current : aiVisualRef.current;

    setBannerMessage(`⚡ ASCENDING COPPER LADDER: Tile ${ladder.start} → ${ladder.end}!`);
    setBannerColor('#70C1B3');
    mazeAudio.playLadderAscent();

    const duration = 950; // Smooth 0.95 second ladder ascent
    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      const stepLadder = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);

        visual.x = p1.x + (p2.x - p1.x) * easeT;
        visual.y = p1.y + (p2.y - p1.y) * easeT;

        // Rung climbing bobbing rhythm
        visual.jumpY = Math.abs(Math.sin(t * Math.PI * 6)) * 8;

        // Sparkle trail along ladder
        if (Math.random() > 0.4) {
          spawnParticles(visual.x, visual.y, '#70C1B3', 2);
        }

        if (t < 1) {
          requestAnimationFrame(stepLadder);
        } else {
          visual.x = p2.x;
          visual.y = p2.y;
          visual.jumpY = 0;
          spawnParticles(p2.x, p2.y, '#70C1B3', 14);
          resolve();
        }
      };

      requestAnimationFrame(stepLadder);
    });
  };

  // Smooth Curving Serpent Slide Animation
  const animateSnakeSlide = async (entity: 'player' | 'ai', snake: Snake) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = canvas.width / 8;
    const head = getTileCenter(snake.head, cellSize);
    const tail = getTileCenter(snake.tail, cellSize);
    const visual = entity === 'player' ? playerVisualRef.current : aiVisualRef.current;

    setBannerMessage(`🐍 VIPER STRIKE! Slithering down to Tile ${snake.tail}!`);
    setBannerColor('#EF233C');
    mazeAudio.playSnakeHiss();

    // Trigger board screen shake
    screenShakeRef.current = 6.0;

    const midX = (head.x + tail.x) / 2 + (head.y > tail.y ? 24 : -24);
    const midY = (head.y + tail.y) / 2;

    const duration = 1100; // Smooth 1.1s slide along the serpent curve
    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      const stepSnake = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);

        // Quadratic Bezier interpolation along snake curve
        const invT = 1 - t;
        visual.x = invT * invT * head.x + 2 * invT * t * midX + t * t * tail.x;
        visual.y = invT * invT * head.y + 2 * invT * t * midY + t * t * tail.y;

        // Slight distress vibration
        visual.jumpY = Math.sin(t * Math.PI * 12) * 3;

        // Crimson venom emission trail
        if (Math.random() > 0.3) {
          spawnParticles(visual.x, visual.y, '#EF233C', 3);
        }

        if (t < 1) {
          requestAnimationFrame(stepSnake);
        } else {
          visual.x = tail.x;
          visual.y = tail.y;
          visual.jumpY = 0;
          spawnParticles(tail.x, tail.y, '#EF233C', 16);
          resolve();
        }
      };

      requestAnimationFrame(stepSnake);
    });
  };

  // Complete Turn Sequence Execution
  const executeTurn = async (entity: 'player' | 'ai') => {
    setIsAnimating(true);
    setDiceRolling(true);
    mazeAudio.playDiceRoll();

    // 1. Rolling Dice Deceleration Animation (750ms)
    let rollDisplay = 1;
    const rollStart = performance.now();
    const rollDuration = 750;

    await new Promise<number>((resolve) => {
      const tumble = (now: number) => {
        const elapsed = now - rollStart;
        rollDisplay = Math.floor(Math.random() * 6) + 1;
        setDiceValue(rollDisplay);

        if (elapsed < rollDuration) {
          requestAnimationFrame(tumble);
        } else {
          const finalRoll = Math.floor(Math.random() * 6) + 1;
          setDiceValue(finalRoll);
          setDiceRolling(false);
          resolve(finalRoll);
        }
      };
      requestAnimationFrame(tumble);
    }).then(async (finalRoll) => {
      // 2. Announce Movement
      setBannerMessage(
        entity === 'player'
          ? `You rolled a [${finalRoll}]! Advancing across the court...`
          : `Sentinel rolled a [${finalRoll}]! Advancing across the court...`
      );
      setBannerColor(entity === 'player' ? '#E0A96D' : '#70C1B3');

      await wait(300); // Brief breath to register roll

      // 3. Tile-by-Tile Physical Hopping
      const startTile = entity === 'player' ? playerTile : aiTile;
      let targetTile = startTile + finalRoll;
      if (targetTile > 64) targetTile = 64;

      for (let step = startTile; step < targetTile; step++) {
        await animateSingleHop(entity, step, step + 1);
        if (entity === 'player') setPlayerTile(step + 1);
        else setAiTile(step + 1);
        await wait(50); // Fluid hop separation
      }

      await wait(250); // Pause on landing

      // 4. Encounter Resolution (Ladder / Snake)
      const currentPos = targetTile;
      const ladder = REAL_LADDERS.find((l) => l.start === currentPos);
      const snake = REAL_SNAKES.find((s) => s.head === currentPos);

      let finalPos = currentPos;

      if (ladder) {
        if (entity === 'player') {
          setStats((s) => ({ ...s, playerLadders: s.playerLadders + 1 }));
          updateTraits({ riskTolerance: 0.12, openness: 0.05 });
        } else {
          setStats((s) => ({ ...s, aiLadders: s.aiLadders + 1 }));
        }

        await animateLadderClimb(entity, ladder);
        finalPos = ladder.end;
        if (entity === 'player') setPlayerTile(finalPos);
        else setAiTile(finalPos);
      } else if (snake) {
        if (entity === 'player') {
          setStats((s) => ({ ...s, playerSnakes: s.playerSnakes + 1 }));
          updateTraits({ composure: -0.05, neuroticism: 0.05 });
        } else {
          setStats((s) => ({ ...s, aiSnakes: s.aiSnakes + 1 }));
        }

        await animateSnakeSlide(entity, snake);
        finalPos = snake.tail;
        if (entity === 'player') setPlayerTile(finalPos);
        else setAiTile(finalPos);
      }

      await wait(300);

      // 5. Check Victory / Toggle Turn
      if (finalPos >= 64) {
        setWinner(entity);
        setIsAnimating(false);

        if (entity === 'player') {
          setBannerMessage('👑 TRIUMPH! You conquered Zenith 64 before the Sentinel!');
          setBannerColor('#E0A96D');
          mazeAudio.playVictory();
          updateTraits({ conscientiousness: 0.35, riskTolerance: 0.25, composure: 0.25 });
          requestBattleCommentary('The player defeated the Sentinel in the 1v1 race to tile 64.');
        } else {
          setBannerMessage('⚔️ DEFEAT! The Sentinel claimed Zenith 64 first.');
          setBannerColor('#EF233C');
          mazeAudio.playSnakeHiss();
          updateTraits({ composure: 0.1 });
          requestBattleCommentary('The Sentinel defeated the player in the 1v1 race to tile 64.');
        }
      } else {
        // Toggle turn with deliberate suspense pause (700ms)
        setIsAnimating(false);
        if (entity === 'player') {
          setCurrentTurn('ai');
          setBannerMessage("AI Sentinel's Turn // The machine contemplates its roll...");
          setBannerColor('#70C1B3');
        } else {
          setCurrentTurn('player');
          setRoundNumber((r) => r + 1);
          setBannerMessage('Your Turn // Cast the golden die to take the lead.');
          setBannerColor('#E0A96D');
        }
      }
    });
  };

  // Trigger AI Turn after natural pause
  useEffect(() => {
    if (currentTurn === 'ai' && !winner && !isAnimating) {
      const timer = setTimeout(() => {
        executeTurn('ai');
      }, 900); // 900ms deliberate suspense before AI rolls
      return () => clearTimeout(timer);
    }
  }, [currentTurn, winner, isAnimating]);

  const handlePlayerRoll = () => {
    if (isAnimating || currentTurn !== 'player' || !!winner) return;
    executeTurn('player');
  };

  const requestBattleCommentary = (outcomeContext: string) => {
    if (banterAbortRef.current) banterAbortRef.current();

    setIsStreamingBanter(true);
    let full = '';
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
              'You are the Labyrinth Sentinel Arbiter of Probability, powered by Gemma. Deliver an articulate, evocative psychological and philosophical critique of the 1v1 duel against the player across the serpents and ladders court. Discuss the interplay between calculated perseverance, risk-taking, and emotional composure under sudden reversals of fortune.'
          },
          {
            role: 'user',
            content: `${outcomeContext} Player reached Tile ${playerTile}, AI reached Tile ${aiTile}. Player scaled ${stats.playerLadders} ladders and endured ${stats.playerSnakes} snake bites. Sentinel scaled ${stats.aiLadders} ladders and suffered ${stats.aiSnakes} snake bites.`
          }
        ],
        maxTokens: 350,
        signal: controller.signal
      },
      config,
      {
        onChunk: (chunk: string) => {
          full += chunk;
          setAiCommentary(full);
        },
        onComplete: () => setIsStreamingBanter(false),
        onError: () => {
          setIsStreamingBanter(false);
          setAiCommentary(
            winner === 'player'
              ? '"Your stride proved swifter than mechanical probability. The Zenith acknowledges your triumph."'
              : '"Deterministic patience outlasted mortal fortune. Rise and contest the court once more."'
          );
        }
      }
    );
  };

  const handleResetGame = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const cellSize = canvas.width / 8;
      const start = getTileCenter(1, cellSize);
      playerVisualRef.current = { x: start.x, y: start.y, jumpY: 0, scaleX: 1, scaleY: 1 };
      aiVisualRef.current = { x: start.x, y: start.y, jumpY: 0, scaleX: 1, scaleY: 1 };
    }

    setPlayerTile(1);
    setAiTile(1);
    setCurrentTurn('player');
    setDiceValue(null);
    setDiceRolling(false);
    setIsAnimating(false);
    setWinner(null);
    setRoundNumber(1);
    setStats({ playerSnakes: 0, playerLadders: 0, aiSnakes: 0, aiLadders: 0 });
    setBannerMessage('Rematch Begun! Roll your golden die to seize the lead.');
    setBannerColor('#E0A96D');
    mazeAudio.playStoneClick();
  };

  useEffect(() => {
    return () => {
      if (banterAbortRef.current) banterAbortRef.current();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#101318] border border-[#1B212A] rounded-xl p-6 shadow-2xl relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
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
                ROOM 02 // 1V1 RACE TO THE ZENITH
              </span>
              <h2 className="text-xl font-display font-bold uppercase text-[#F0F4F8]">
                Serpents & Ladders: AI Duel
              </h2>
            </div>
          </div>
          <div className="text-right flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-[#8E98A5]">
              ROUND: <strong className="text-[#F0F4F8]">{roundNumber}</strong>
            </span>
            <button
              onClick={handleResetGame}
              disabled={isAnimating}
              className="text-xs font-mono text-[#8E98A5] hover:text-[#F0F4F8] underline disabled:opacity-40"
            >
              Reset Duel
            </button>
          </div>
        </div>

        {/* Live Race Telemetry Bar */}
        <div className="w-full grid grid-cols-2 gap-3 mb-3 font-mono text-xs">
          {/* Player Scorecard */}
          <div
            className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
              currentTurn === 'player' && !winner
                ? 'bg-[#181D26] border-[#E0A96D] shadow-[0_0_14px_rgba(224,169,109,0.25)] ring-1 ring-[#E0A96D]/50'
                : 'bg-[#0B0E12] border-[#1B212A] opacity-75'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#E0A96D]/20 border border-[#E0A96D] flex items-center justify-center text-[#E0A96D]">
                <User className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#8E98A5] block">YOU (CHALLENGER)</span>
                <span className="text-sm font-bold text-[#E0A96D]">Tile {playerTile.toString().padStart(2, '0')} / 64</span>
              </div>
            </div>
            {currentTurn === 'player' && !winner && (
              <span className="text-[10px] text-[#E0A96D] font-bold animate-pulse uppercase tracking-wider">
                YOUR TURN
              </span>
            )}
          </div>

          {/* AI Sentinel Scorecard */}
          <div
            className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
              currentTurn === 'ai' && !winner
                ? 'bg-[#181D26] border-[#70C1B3] shadow-[0_0_14px_rgba(112,193,179,0.25)] ring-1 ring-[#70C1B3]/50'
                : 'bg-[#0B0E12] border-[#1B212A] opacity-75'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-[#70C1B3]/20 border border-[#70C1B3] flex items-center justify-center text-[#70C1B3]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-[#8E98A5] block">AI SENTINEL</span>
                <span className="text-sm font-bold text-[#70C1B3]">Tile {aiTile.toString().padStart(2, '0')} / 64</span>
              </div>
            </div>
            {currentTurn === 'ai' && !winner && (
              <span className="text-[10px] text-[#70C1B3] font-bold animate-pulse uppercase tracking-wider">
                AI ROLLING...
              </span>
            )}
          </div>
        </div>

        {/* 60 FPS Illustrated Canvas Court */}
        <div className="relative mb-3 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={430}
            height={430}
            className="rounded-xl border border-[#1B212A] bg-[#080A0D] shadow-2xl max-w-full h-auto"
          />
        </div>

        {/* Dice Controller & Battle Event Banner */}
        <div className="w-full flex items-center justify-between bg-[#080A0D] p-3 rounded-xl border border-[#1B212A] mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 bg-[#13171F] border-2 rounded-xl flex items-center justify-center font-mono text-2xl font-extrabold shadow-lg transition-transform ${
                currentTurn === 'player'
                  ? 'border-[#E0A96D] text-[#E0A96D]'
                  : 'border-[#70C1B3] text-[#70C1B3]'
              } ${diceRolling ? 'scale-110 rotate-12 animate-pulse' : ''}`}
            >
              {diceValue ?? '?'}
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-mono text-xs font-bold leading-tight" style={{ color: bannerColor }}>
                {bannerMessage}
              </span>
              <div className="flex items-center space-x-3 text-[10px] font-mono text-[#8E98A5] mt-1">
                <span>You: 🪜{stats.playerLadders} 🐍{stats.playerSnakes}</span>
                <span>•</span>
                <span>AI: 🪜{stats.aiLadders} 🐍{stats.aiSnakes}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePlayerRoll}
            disabled={isAnimating || currentTurn !== 'player' || !!winner}
            className={`px-5 py-2.5 font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center space-x-2 ${
              currentTurn === 'player' && !winner && !isAnimating
                ? 'bg-[#E0A96D] hover:bg-[#E0A96D]/90 text-[#080A0D] hover:shadow-[#E0A96D]/30 cursor-pointer animate-pulse'
                : 'bg-[#1A202A] text-[#8E98A5] cursor-not-allowed opacity-60'
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>
              {winner
                ? 'Concluded'
                : isAnimating
                ? 'Leaping...'
                : currentTurn === 'player'
                ? 'Roll Die'
                : 'AI Turn...'}
            </span>
          </button>
        </div>

        {/* Sentinel Arbiter Commentary */}
        <div className="w-full bg-[#080A0D] p-3 rounded-xl border border-[#1B212A] mb-3 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-[#8E98A5] uppercase tracking-wider mb-1">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3 h-3 text-[#E0A96D]" />
              <span>SENTINEL ARBITER EVALUATION</span>
            </span>
            {isStreamingBanter && <span className="text-[#E0A96D] animate-pulse">STREAMING...</span>}
          </div>
          <p className="text-[#F0F4F8] italic leading-relaxed text-xs">
            {aiCommentary}
          </p>
        </div>

        {/* Action Controls */}
        <div className="w-full flex space-x-3">
          <button
            onClick={handleResetGame}
            disabled={isAnimating}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 bg-[#1A202A] hover:bg-[#232B38] disabled:opacity-40 text-[#8E98A5] hover:text-[#F0F4F8] font-mono text-xs font-bold rounded-lg border border-[#1B212A] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rematch</span>
          </button>

          <button
            onClick={onComplete}
            disabled={isAnimating}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md ${
              winner === 'player'
                ? 'bg-[#70C1B3] hover:bg-[#70C1B3]/90 text-[#080A0D]'
                : 'bg-[#1E2532] hover:bg-[#2A3444] text-[#F0F4F8] border border-[#1B212A]'
            }`}
          >
            {winner === 'player' ? <Trophy className="w-4 h-4 text-[#080A0D]" /> : <Award className="w-4 h-4 text-[#70C1B3]" />}
            <span>Claim Chamber Seal & Continue</span>
          </button>

          <button
            onClick={onClose}
            disabled={isAnimating}
            className="px-4 py-2.5 bg-[#13171F] hover:bg-[#1A202A] disabled:opacity-40 text-[#8E98A5] hover:text-[#F0F4F8] font-mono text-xs rounded-lg border border-[#1B212A]"
          >
            <Shield className="w-3.5 h-3.5 inline mr-1" />
            <span>Exit Chamber</span>
          </button>
        </div>
      </div>
    </div>
  );
}
