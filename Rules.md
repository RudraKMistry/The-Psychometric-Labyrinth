# Non-Negotiable Engineering Rules & Boundaries (Rules.md)

## 1. The Prime Directive
🔴 **PRIME DIRECTIVE**: The application must run deterministically, fast, and reliably without stalling the UI event loop. All game physics, maze generation, collision detection, and mini-game rules (Tic-Tac-Toe, Snakes & Ladders) MUST execute in pure, local, client-side JavaScript. LLM inference (`gemma4:e4b` / Gemini API) must be called **only** when conversational intelligence, qualitative persuasion evaluation, ragebait generation, or psychometric synthesis is strictly necessary. Never waste tokens or introduce latency for deterministic mechanics.

---

## 2. File Ownership & Boundary Enforcement
🔴 **STRICT MODULAR ENCAPSULATION**: Every room lives in its isolated folder under `src/rooms/`.
- `src/rooms/maze/` has sole authority over the Canvas 2D engine, randomized DFS generation, avatar physics, and fog-of-war.
- `src/rooms/tictactoe/` owns the 3x3 board and Minimax algorithm.
- `src/rooms/snakes/` owns the board layout and dice physics.
- `src/rooms/entrapment/` owns the escape persuasion trial state.
- `src/rooms/ragebait/` owns the provocation engine and composure scoring.
- `src/rooms/mbti/` owns the 16Personalities adaptive questionnaire.
- `src/rooms/moral/` owns the moral dilemma scenarios.
- `src/rooms/dossier/` owns the final personality synthesis radar and exit scorecard.
- `src/services/llm/` owns the dual-rail Gemini/Ollama interface.
No room may directly mutate another room's internal state. Inter-room communication happens strictly via typed events or the central Zustand store (`src/store/`).

---

## 3. Contract & API Discipline
🔴 **TYPE PURITY & CONTRACT RIGOR**: All data passing through the dual-rail LLM adapter, room triggers, and psychometric vector stores MUST have strictly typed TypeScript interfaces located in `src/types/`. No `any` types permitted. If an LLM call fails or times out, the system must trigger fallback behavior without breaking the user experience.

---

## 4. Scope Control & Feature Freezes
🔴 **ZERO SCOPE BLOAT**: We are building a single-player, browser-based psychometric maze.
- Do NOT introduce WebGL 3D meshes or heavy Three.js assets; the maze is a crisp, responsive 2D Canvas tile engine.
- Do NOT implement multiplayer networking, server databases, or real-time voice streaming.
- Do NOT add extraneous rooms beyond the 6 approved chambers without explicit approval.

---

## 5. Secrets, Safety & CORS Compliance
🔴 **CREDENTIAL & NETWORK INTEGRITY**:
- Gemini API keys must never be committed to source code or logged to console/telemetry. They are loaded via environment variables (`VITE_GEMINI_API_KEY`) or user input in the client settings modal.
- Local Ollama communication (`http://localhost:11434`) must route cleanly through Vite's local development proxy (`/ollama-proxy`) or handle CORS gracefully with a fallback status indicator.
- Never crash if Ollama daemon is offline; provide an immediate visual alert and option to switch to Gemini or offline mock mode.

---

## 6. Terminal Sandbox Compliance
🔴 **SANDBOX FIRST DISCIPLINE**:
- All shell and build commands must run in standard sandbox mode (`BypassSandbox: false`) by default.
- Bypassing sandbox is strictly prohibited unless installing packages or explicitly approved for external network operations.
- Avoid command substitutions and multi-command chaining that break prefix-based approval caching.

---

## 7. AI Output Integrity & Frugality
🔴 **TOKEN CONSERVATION & CONCISENESS**:
- Chamber wardens must be prompt-engineered with strict token limits (`max_tokens: 150`).
- Never generate multi-paragraph essays in chamber dialogues.
- Wardens must speak with punchy, atmospheric, and character-driven prose (1–3 sentences).
- Psychometric extractions must be requested in compact JSON deltas.

---

## 8. Code Standards & Architecture Hygiene
🔴 **CLEAN CODE STANDARDS**:
- React 18 functional components with hooks.
- Decouple Canvas render loops (`requestAnimationFrame`) from React component render triggers. Never trigger React state updates inside a 60 FPS animation loop.
- Tailwind CSS utility classes for styling with dark/cyber-mystic theme variables.
- Lucide React for crisp, lightweight iconography.

---

## 9. Continuous Documentation Directive
🔴 **CONTINUOUS MEMORY LOGGING**: Every AI agent operating on this project is strictly required to log all architecture changes, completed features, modified files, and open tasks into `Memory.md` at the conclusion of every step. No code change is complete until documented in `Memory.md`.

