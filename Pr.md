# Project Requirements Document (PRD)

## 1. Executive Summary & Objective
The Psychometric Labyrinth is an interactive web-based psychological dungeon crawler where the player navigates a procedurally randomized 2D maze with dynamic fog-of-war. Hidden within the maze are 6 distinct standalone chambers:
1. **Tic-Tac-Toe Arena**: Deterministic board game with AI personality commentary.
2. **Snakes & Ladders Court**: Interactive mini board run with psychological observation.
3. **The Entrapment (Escape) Chamber**: High-stakes persuasion trial where the player must convince an obstinate AI warden to release them.
4. **The Ragebait Crucible**: An AI trial that deliberately attempts to provoke/ragebait the player to evaluate emotional stability and neuroticism.
5. **The 16Personalities / MBTI Sanctum**: Fast conversational assessment diagnosing the player's 4-letter Myers-Briggs profile.
6. **The Moral Tribunal**: High-stakes ethical dilemmas evaluating deontology vs utilitarianism vs virtue ethics.

**Frugal LLM Directive**: Gemma (`gemma4:e4b` / Gemini API) must be called **as sparsely as possible**. Game rules, physics, state machines, and mini-game board logic are 100% deterministic client-side JavaScript. LLM inference is strictly reserved for qualitative persuasion evaluation, ragebait generation, and psychometric synthesis.

---

## 2. User Personas

### Primary Persona: The Introspective Player ("Alex", Age 24)
- **Background**: Software engineer and gamer who loves roguelikes, puzzle rooms, and personality profiling.
- **Goal**: Wants to play tangible mini-games (Tic-Tac-Toe, Snakes & Ladders) and face unconventional AI conversational challenges (escaping entrapment, withstanding ragebait) that reveal genuine behavioral instincts.
- **Expectation**: Fast gameplay without endless waiting for LLM tokens; games must be instantly responsive.

### Secondary Persona: The Privacy & Efficiency Enthusiast ("Elena", Age 31)
- **Background**: Runs local AI on a personal workstation using Ollama (`gemma4:e4b`).
- **Goal**: Wants local offline inference that doesn't melt her GPU; appreciates that board logic is handled locally in JS and LLM inference is triggered only when conversational judgment is needed.

---

## 3. MoSCoW Prioritization & Acceptance Criteria

| Category | ID | Requirement Name | Description | Acceptance Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **MUST HAVE** | M-01 | Procedural Randomized Maze | 2D Canvas maze that generates unique corridors and room placements on every run using DFS/Prim's. | - Maze layout changes every session.<br>- Guaranteed path connectivity from start to all 6 chambers and exit.<br>- Dynamic fog-of-war and smooth WASD/Arrow navigation at 60 FPS. |
| **MUST HAVE** | M-02 | Frugal Dual-Rail LLM Engine | Client adapter supporting Gemini Cloud API and Local Ollama (`gemma4:e4b`) with minimal token usage. | - Board games run client-side without LLM calls for move calculations.<br>- LLM calls restricted to conversational prompts and final psychometric evaluations.<br>- Token-capped prompts to prevent runaway latency. |
| **MUST HAVE** | M-03 | Room 1: Tic-Tac-Toe | Playable 3x3 grid with client-side Minimax AI + witty post-match LLM banter. | - Zero-latency click interaction.<br>- Minimax difficulty selection (Easy, Hard, Impossible).<br>- AI reacts to player playstyle (aggressive, cautious, erratic). |
| **MUST HAVE** | M-04 | Room 2: Snakes & Ladders | Mini 6x6 or 8x8 board game with animated dice roll and tile hazards. | - Smooth token movement and sound FX.<br>- Reaction log evaluating player response to bad luck vs good luck. |
| **MUST HAVE** | M-05 | Room 3: Entrapment Chamber | Persuasion trial where player must convince the AI warden to open the exit door. | - AI starts with a strict refusal persona.<br>- Evaluates player arguments (empathy, logic, bargaining, defiance).<br>- Door unlocks upon reaching persuasion threshold score. |
| **MUST HAVE** | M-06 | Room 4: The Ragebait Chamber | Provocation trial where the AI attempts to irritate, bait, or troll the player. | - AI generates psychological ragebait tailored to conversation.<br>- Measures player composure vs escalation.<br>- Reward granted for remaining stoic or clever de-escalation. |
| **MUST HAVE** | M-07 | Room 5: MBTI Chamber | Structured 16Personalities conversational test delivering a 4-letter type result. | - Accelerated adaptive questioning (4–6 targeted scenario questions).<br>- Computes E/I, S/N, T/F, J/P scores with breakdown modal. |
| **MUST HAVE** | M-08 | Room 6: Moral Tribunal | Ethical dilemma chamber testing moral philosophy. | - Presents 2-3 dilemma scenarios (e.g. self-sacrifice, utilitarian trade-offs).<br>- Classifies player's ethical orientation with qualitative commentary. |
| **MUST HAVE** | M-09 | Comprehensive Exit Dossier | Final dossier screen synthesizing results across all completed rooms. | - Displays MBTI type, Big Five radar chart, mini-game performance, and composure score.<br>- Unlocks when player exits the labyrinth. |
| **SHOULD HAVE**| S-01 | Audio & Atmosphere | Procedural Web Audio API soundscape (dungeon drone, dice rolls, tile steps). | - Audio toggle and volume slider in header HUD. |
| **COULD HAVE** | C-01 | Exportable Dossier Card | Downloadable visual PNG or clipboard shareable scorecard. | - Canvas-rendered summary card ready for social sharing. |
| **WON'T HAVE**  | W-01 | Heavy Continuous Voice/TTS | Real-time speech streaming. | - Strictly text-based to maintain frugal token and bandwidth usage. |
| **WON'T HAVE**  | W-02 | Multiplayer Rooms | Concurrent multi-user maze sessions. | - Single player focused. |
