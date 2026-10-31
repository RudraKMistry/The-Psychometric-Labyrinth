import { create } from 'zustand';
import { ChamberId, PsychometricVector } from '../types';

interface GameState {
  // Navigation & Spatial state
  playerX: number;
  playerY: number;
  activeChamber: ChamberId | null;
  completedChambers: Set<ChamberId>;
  isExited: boolean;
  
  // Psychometric state
  traits: PsychometricVector;

  // Actions
  setPlayerPosition: (x: number, y: number) => void;
  enterChamber: (chamber: ChamberId) => void;
  leaveChamber: () => void;
  completeChamber: (chamber: ChamberId) => void;
  updateTraits: (delta: Partial<PsychometricVector>) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerX: 1,
  playerY: 1,
  activeChamber: null,
  completedChambers: new Set<ChamberId>(),
  isExited: false,

  traits: {
    openness: 0.0,
    conscientiousness: 0.0,
    extraversion: 0.0,
    agreeableness: 0.0,
    neuroticism: 0.0,
    riskTolerance: 0.0,
    composure: 0.8,
  },

  setPlayerPosition: (x, y) => set({ playerX: x, playerY: y }),
  enterChamber: (chamber) => set({ activeChamber: chamber }),
  leaveChamber: () => set({ activeChamber: null }),
  completeChamber: (chamber) => set((state) => {
    const updated = new Set(state.completedChambers);
    updated.add(chamber);
    return { completedChambers: updated, activeChamber: null };
  }),
  updateTraits: (delta) => set((state) => ({
    traits: { ...state.traits, ...delta },
  })),
  resetGame: () => set({
    playerX: 1,
    playerY: 1,
    activeChamber: null,
    completedChambers: new Set<ChamberId>(),
    isExited: false,
    traits: {
      openness: 0.0,
      conscientiousness: 0.0,
      extraversion: 0.0,
      agreeableness: 0.0,
      neuroticism: 0.0,
      riskTolerance: 0.0,
      composure: 0.8,
    },
  }),
}));

