import { ChamberId } from '../../types';

export const CELL_WALL = 0;
export const CELL_CORRIDOR = 1;
export const CELL_CHAMBER_TICTACTOE = 2;
export const CELL_CHAMBER_SNAKES = 3;
export const CELL_CHAMBER_ENTRAPMENT = 4;
export const CELL_CHAMBER_RAGEBAIT = 5;
export const CELL_CHAMBER_MBTI = 6;
export const CELL_CHAMBER_MORAL = 7;
export const CELL_EXIT_PORTAL = 8;

export type CellType = number;

export interface Point {
  x: number;
  y: number;
}

export interface ChamberPlacement {
  id: ChamberId;
  cellType: CellType;
  name: string;
  subtitle: string;
  position: Point;
}

export interface MazeLayout {
  width: number;
  height: number;
  grid: CellType[][];
  start: Point;
  exit: Point;
  chambers: ChamberPlacement[];
}

export interface RaycastPoint {
  x: number;
  y: number;
}

