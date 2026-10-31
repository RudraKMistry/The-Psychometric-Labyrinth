import { RaycastPoint, CELL_WALL } from './types';

export const NUM_RAYS = 360;
export const SIGHT_DISTANCE_TILES = 6.8;

/**
 * Computes a physical line-of-sight polygon from player position using raymarching.
 * Rays stop physically at wall boundaries (CELL_WALL).
 */
export function computeRaycastPolygon(
  playerPx: number,
  playerPy: number,
  cellSize: number,
  grid: number[][],
  gridWidth: number,
  gridHeight: number,
  maxSightTiles = SIGHT_DISTANCE_TILES
): RaycastPoint[] {
  const maxSightPx = cellSize * maxSightTiles;
  const points: RaycastPoint[] = [];

  for (let i = 0; i < NUM_RAYS; i++) {
    const angle = (i / NUM_RAYS) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let dist = 0;
    const step = 3; // Fine precision step
    let hit = false;
    let hitX = playerPx;
    let hitY = playerPy;

    while (dist < maxSightPx) {
      dist += step;
      const tx = playerPx + cos * dist;
      const ty = playerPy + sin * dist;

      const gx = Math.floor(tx / cellSize);
      const gy = Math.floor(ty / cellSize);

      if (gx < 0 || gx >= gridWidth || gy < 0 || gy >= gridHeight) {
        hit = true;
        hitX = tx;
        hitY = ty;
        break;
      }

      if (grid[gy][gx] === CELL_WALL) {
        hit = true;
        hitX = tx;
        hitY = ty;
        break;
      }
    }

    if (!hit) {
      hitX = playerPx + cos * maxSightPx;
      hitY = playerPy + sin * maxSightPx;
    }

    points.push({ x: hitX, y: hitY });
  }

  return points;
}

