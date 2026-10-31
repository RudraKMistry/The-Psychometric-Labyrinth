# Development Phases & Milestone Roadmap (Phase.md)

## 1. Project Phase Breakdown

### Phase 0: Scaffolding, Design Tokens & Foundational UI Theme Base
- **Objective**: Establish the project directory skeleton, install core dependencies (React 18, Vite, Tailwind CSS, Lucide React, Recharts, Zustand), configure Tailwind with the Arcane Cognitive Brutalism design tokens (`--bg-abyss`, `--surface-slate`, `--accent-spectral`, etc.), and verify Vite dev server execution.
- **Ends When**:
  - `pnpm dev` (or `npm run dev`) boots cleanly with 0 console errors.
  - Base layout shell renders with dark obsidian canvas background, custom typography, and responsive HUD header.
  - Vite dev proxy (`/ollama-proxy`) is configured and verified for `http://localhost:11434`.

### Phase 1: Procedural Maze Engine (`src/rooms/maze/`)
- **Objective**: Implement the 2D Canvas tile engine, DFS randomized corridor generator, guaranteed room placement algorithm, player collision detection, keyboard navigation (WASD/Arrows), and dynamic line-of-sight fog-of-war lighting.
- **Ends When**:
  - The player avatar moves smoothly at 60 FPS across the randomized maze grid.
  - 6 chamber entrance portals and 1 exit portal are reliably reachable on every generated seed.
  - Fog-of-war dynamically illuminates corridors within radius and remembers discovered pathways.

### Phase 2: Frugal Dual-Rail LLM & Settings Service (`src/services/llm/`)
- **Objective**: Implement unified LLM interface supporting Google Gemini Cloud API and Local Ollama (`gemma4:e4b`), with token conservation limits (`max_tokens: 150`), streaming output, and fallback offline mock mode.
- **Ends When**:
  - Settings modal allows toggling between Gemini and Ollama with live ping indicator.
  - Test prompt streams responses in both modes without freezing UI or exceeding token budgets.

### Phase 3: Deterministic Mini-Game Chambers (`tictactoe/` & `snakes/`) — [COMPLETE]
- **Objective**: Build the standalone game engines for Room 1 (Tic-Tac-Toe with client-side Minimax AI) and Room 2 (Snakes & Ladders board with dice mechanics). Add optional post-match LLM personality banter.
- **Completed**:
  - `src/rooms/tictactoe/TicTacToeChamber.tsx`: Chiseled stone tablet aesthetic, client-side recursive Minimax AI (Easy/Medium/Hard), instant zero-token moves, psychometric trait updates (+Conscientiousness, +Composure, +Openness), and optional atmospheric banter via `streamLLM`.
  - `src/rooms/snakes/SnakesChamber.tsx`: 64-tile boustrophedon Canvas court with hand-rendered crimson serpents and copper ladders, rolling golden die, animated pawn hopping, sound FX, trait updates (+RiskTolerance, +Conscientiousness), and post-match Arbiter analysis.
  - Wired both mini-games into `src/App.tsx` active chamber modal system, persisting completions in `useGameStore`.

### Phase 4: Conversational Psychological Chambers (`entrapment/`, `ragebait/`, `mbti/`, `moral/`) — [COMPLETE]
- **Objective**: Implement the four narrative and psychometric chambers:
  - Room 3: Entrapment persuasion chamber with escape threshold scoring (`src/rooms/entrapment/EntrapmentChamber.tsx`).
  - Room 4: Ragebait provocation chamber with composure and stress tolerance evaluation (`src/rooms/ragebait/RagebaitChamber.tsx`).
  - Room 5: 16Personalities adaptive 4-axis MBTI diagnosis with celestial astrolabe mandala (`src/rooms/mbti/MbtiChamber.tsx`).
  - Room 6: Moral dilemma tribunal testing utilitarian vs deontological frameworks with twin obelisks (`src/rooms/moral/MoralChamber.tsx`).
- **Completed**:
  - All four rooms run on Gemma (`gemma4:e4b` locally via `/ollama-proxy` or Gemini API) with token frugality clamps removed (350–400 tokens) for rich, articulate psychological prose.
  - Interactive 60 FPS vector Canvas animations integrated across all chambers (grinding iron portcullis, reactive ocular visor avatar, rotating 4-ring astrolabe mandala, twin runic obelisks).
  - All chambers wired directly into `src/App.tsx` modal routing and seamlessly update the unified Zustand `useGameStore`.

### Phase 5: Psychometric Dossier & Final Synthesis (`src/rooms/dossier/`) — [COMPLETE]
- **Objective**: Implement the end-game Mind Dossier unlocked upon reaching the maze exit or clicking the top HUD archive.
- **Completed**:
  - `src/rooms/dossier/DossierModal.tsx`:
    - 7-Dimensional Recharts Spider Matrix (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism, Risk Tolerance, Composure) styled in The Resonant Blueprint aesthetic.
    - MBTI Cognitive Archetype badge synthesized from Chamber 05.
    - Moral Framework verdict badge synthesized from Chamber 06.
    - Chamber trial completion grid tracking all 6 chambers with live checkmarks.
    - Holistic Gemma AI Dossier Synthesis delivering an eloquent 3-part psychological analysis (The Core Persona, Behavioral Dynamics, Moral Alignment).
    - Re-synthesize and Copy-to-Clipboard archival export controls.
  - Wired into `src/App.tsx` exit portal trigger and header HUD button.

---

## 2. Demo Risk Plan & Triage Cut-Order
If development time runs short or hackathon deadlines approach, strictly execute this cut-order to safeguard demo viability:
1. **Cut Level 1**: Replace dynamic Snakes & Ladders animations with instant dice step transitions.
2. **Cut Level 2**: Reduce MBTI questions from 6 down to 3 high-impact scenario questions.
3. **Cut Level 3**: Fall back to pre-seeded maze layouts if DFS randomizer requires seed debugging.
4. **Non-Negotiable Core (Must Never Be Cut)**:
   - 2D Maze exploration with fog-of-war.
   - Dual-rail toggle (Gemini / Ollama `gemma4:e4b`).
   - At least 3 fully operational chambers (Tic-Tac-Toe, Entrapment, and Ragebait).
   - Final personality dossier radar display.

