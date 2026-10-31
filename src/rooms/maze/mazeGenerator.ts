import {
  MazeLayout,
  ChamberPlacement,
  CELL_WALL,
  CELL_CORRIDOR,
  CELL_CHAMBER_TICTACTOE,
  CELL_CHAMBER_SNAKES,
  CELL_CHAMBER_ENTRAPMENT,
  CELL_CHAMBER_RAGEBAIT,
  CELL_CHAMBER_MBTI,
  CELL_CHAMBER_MORAL,
  CELL_EXIT_PORTAL,
  Point,
} from './types';

const CHAMBER_DEFS: Array<{ id: any; cellType: number; name: string; subtitle: string }> = [
  { id: 'tictactoe', cellType: CELL_CHAMBER_TICTACTOE, name: 'Tic-Tac-Toe Arena', subtitle: 'Spatial Opportunism & Minimax Trial' },
  { id: 'snakes', cellType: CELL_CHAMBER_SNAKES, name: 'Snakes & Ladders Court', subtitle: 'Fortune, Risk & Emotional Reactivity' },
  { id: 'entrapment', cellType: CELL_CHAMBER_ENTRAPMENT, name: 'The Entrapment Chamber', subtitle: 'Warden Persuasion & Escape Protocol' },
  { id: 'ragebait', cellType: CELL_CHAMBER_RAGEBAIT, name: 'The Ragebait Crucible', subtitle: 'Composure & Equanimity Evaluation' },
  { id: 'mbti', cellType: CELL_CHAMBER_MBTI, name: '16Personalities Sanctum', subtitle: 'Adaptive Myers-Briggs 4-Axis Diagnosis' },
  { id: 'moral', cellType: CELL_CHAMBER_MORAL, name: 'The Moral Tribunal', subtitle: 'Utilitarian vs Deontological Trial' },
];

/**
 * Procedural Randomized Maze Generator
 * Generates an odd-dimension grid using randomized DFS backtracker
 * Guarantees all chambers and the exit are placed at reachable nodes.
 */
export function generateProceduralMaze(width = 23, height = 23): MazeLayout {
  // Ensure odd dimensions for proper wall/passage interleaving
  const w = width % 2 === 0 ? width + 1 : width;
  const h = height % 2 === 0 ? height + 1 : height;

  // Initialize all cells as solid walls (0)
  const grid: number[][] = Array(h).fill(0).map(() => Array(w).fill(CELL_WALL));

  // Carve passages using randomized Depth-First Search
  const stack: Point[] = [];
  const start: Point = { x: 1, y: 1 };
  grid[start.y][start.x] = CELL_CORRIDOR;
  stack.push(start);

  const directions: Point[] = [
    { x: 0, y: -2 }, // Up
    { x: 0, y: 2 },  // Down
    { x: -2, y: 0 }, // Left
    { x: 2, y: 0 },  // Right
  ];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // Shuffle directions for randomized paths
    const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
    let carved = false;

    for (const dir of shuffledDirs) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === CELL_WALL) {
        // Carve wall between current and neighbor
        grid[current.y + dir.y / 2][current.x + dir.x / 2] = CELL_CORRIDOR;
        // Carve neighbor cell
        grid[ny][nx] = CELL_CORRIDOR;
        stack.push({ x: nx, y: ny });
        carved = true;
        break;
      }
    }

    if (!carved) {
      stack.pop();
    }
  }

  // Find all corridor cells and compute Manhattan distance from start
  const corridorCells: Array<{ pos: Point; dist: number; neighbors: number }> = [];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (grid[y][x] === CELL_CORRIDOR && !(x === start.x && y === start.y)) {
        let neighborCount = 0;
        if (grid[y - 1][x] !== CELL_WALL) neighborCount++;
        if (grid[y + 1][x] !== CELL_WALL) neighborCount++;
        if (grid[y][x - 1] !== CELL_WALL) neighborCount++;
        if (grid[y][x + 1] !== CELL_WALL) neighborCount++;

        const dist = Math.abs(x - start.x) + Math.abs(y - start.y);
        corridorCells.push({ pos: { x, y }, dist, neighbors: neighborCount });
      }
    }
  }

  // Prioritize dead ends (neighbors === 1) and sort by distance
  corridorCells.sort((a, b) => {
    if (a.neighbors === 1 && b.neighbors !== 1) return -1;
    if (b.neighbors === 1 && a.neighbors !== 1) return 1;
    return b.dist - a.dist;
  });

  // Assign the furthest point as the Exit Portal
  const exitCandidate = corridorCells.shift() || { pos: { x: w - 2, y: h - 2 } };
  const exitPos = exitCandidate.pos;
  grid[exitPos.y][exitPos.x] = CELL_EXIT_PORTAL;

  // Space out the 6 chambers evenly across remaining candidates
  const chamberPlacements: ChamberPlacement[] = [];
  const step = Math.max(1, Math.floor(corridorCells.length / CHAMBER_DEFS.length));

  for (let i = 0; i < CHAMBER_DEFS.length; i++) {
    const candidateIndex = Math.min((i * step) + Math.floor(Math.random() * (step / 2)), corridorCells.length - 1);
    const chosen = corridorCells.splice(candidateIndex, 1)[0] || corridorCells.pop()!;
    const def = CHAMBER_DEFS[i];

    grid[chosen.pos.y][chosen.pos.x] = def.cellType;
    chamberPlacements.push({
      id: def.id,
      cellType: def.cellType,
      name: def.name,
      subtitle: def.subtitle,
      position: chosen.pos,
    });
  }

  return {
    width: w,
    height: h,
    grid,
    start,
    exit: exitPos,
    chambers: chamberPlacements,
  };
}

