# System Architecture Specification (Ar.md)

## 1. System Topology & Flow Diagram

```
+---------------------------------------------------------------------------------------------------------+
|                                              BROWSER CLIENT                                             |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  |                                  React 18 + Vite Modular Shell                                    |  |
|  |                                                                                                   |  |
|  |  +---------------------------------------------------------------------------------------------+  |  |
|  |  |                                  HUD & Navigation State                                     |  |  |
|  |  |       [Minimap]  |  [Active Chamber Banner]  |  [Settings: Gemini / Ollama]  |  [Audio]        |  |  |
|  |  +---------------------------------------------+-----------------------------------------------+  |  |
|  |                                                |                                                  |  |
|  |  +---------------------------------------------v-----------------------------------------------+  |  |
|  |  |                                   PROCEDURAL MAZE ENGINE                                    |  |  |
|  |  |                         `src/rooms/maze/` (Canvas 2D / 60 FPS)                              |  |  |
|  |  |    - Randomized DFS Corridor Generator with Seedable Connectivity Matrix                    |  |  |
|  |  |    - Dynamic Room Allocator (Guarantees accessible placement for all 6 chambers + exit)     |  |  |
|  |  |    - Line-of-Sight Fog-of-War Shader & Smooth Keyboard Navigation                          |  |  |
|  |  +---------------------------------------------+-----------------------------------------------+  |  |
|  |                                                | (Triggers Chamber Entry Modal)                   |  |
|  |  +---------------------------------------------v-----------------------------------------------+  |  |
|  |  |                             ISOLATED CHAMBER SUBSYSTEMS                                     |  |  |
|  |  |  +-----------------------+  +------------------------+  +--------------------------------+  |  |
|  |  |  | `src/rooms/tictactoe/`|  | `src/rooms/snakes/`    |  | `src/rooms/entrapment/`        |  |  |
|  |  |  | Deterministic MiniMax|  | Board State Machine    |  | Persuasion & Escape Threshold  |  |  |
|  |  |  +-----------------------+  +------------------------+  +--------------------------------+  |  |
|  |  |  +-----------------------+  +------------------------+  +--------------------------------+  |  |
|  |  |  | `src/rooms/ragebait/` |  | `src/rooms/mbti/`      |  | `src/rooms/moral/`             |  |  |
|  |  |  | Provocation Engine   |  | Adaptive 4-Axis Quiz   |  | Ethical Dilemma Tribunal       |  |  |
|  |  |  +-----------------------+  +------------------------+  +--------------------------------+  |  |
|  |  +---------------------------------------------+-----------------------------------------------+  |  |
|  |                                                |                                                  |  |
|  |  +---------------------------------------------v-----------------------------------------------+  |  |
|  |  |                           FRUGAL DUAL-RAIL LLM ORCHESTRATOR                                 |  |  |
|  |  |                         `src/services/llm/` (Token Conservation Layer)                      |  |  |
|  |  |    - In-browser MiniMax/Dice logic runs with 0 LLM calls                                    |  |  |
|  |  |    - Concise, prompt-engineered calls for dialogue, ragebaiting & scoring only             |  |  |
|  |  |    - Cloud Rail: Google Gemini API (streaming)                                              |  |  |
|  |  |    - Local Rail: Ollama HTTP (`gemma4:e4b` via `/ollama-proxy`)                             |  |  |
|  |  +---------------------------------------------+-----------------------------------------------+  |  |
|  |                                                |                                                  |  |
|  |  +---------------------------------------------v-----------------------------------------------+  |  |
|  |  |                             PSYCHOMETRIC DOSSIER SYNTHESIZER                                |  |  |
|  |  |                       `src/rooms/dossier/` & `src/services/psychometrics/`                  |  |  |
|  |  |    - Big Five Vector + MBTI 4-Letter Profile + Composure / Risk Index                       |  |  |
|  |  |    - Recharts Interactive Radar Display & Downloadable Summary                              |  |  |
|  |  +---------------------------------------------------------------------------------------------+  |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------+-----------------------------------------------------+
                                                    |
                          +-------------------------+-------------------------+
                          |                                                   |
                          v                                                   v
             +-------------------------+                         +-------------------------+
             |    Google Gemini API    |                         |    Local Ollama Daemon  |
             | generativelanguage.     |                         |  http://localhost:11434 |
             | googleapis.com/v1beta   |                         |  model: "gemma4:e4b"    |
             +-------------------------+                         +-------------------------+
```

---

## 2. Directory Structure Matrix

As requested, each room and the maze itself are allocated dedicated, decoupled folders:

| Directory Path | Owner / Responsibility | Purpose & Technical Boundaries |
| :--- | :--- | :--- |
| `src/rooms/maze/` | Maze Engine Lead | Canvas 2D procedural generation, randomized DFS maze paths, collision detection, player avatar, line-of-sight fog-of-war. Zero LLM dependencies. |
| `src/rooms/tictactoe/` | Mini-game Lead | 3x3 grid game engine with client-side Minimax algorithm (zero LLM calls for moves). Optional LLM banter call on win/loss/draw. |
| `src/rooms/snakes/` | Mini-game Lead | Snakes & Ladders board state machine, dice roller, tile hazard triggers. 100% deterministic local execution. |
| `src/rooms/entrapment/` | Narrative AI Lead | Persuasion escape room. Player must converse with an obstinate AI warden to convince them to unlock the exit door. |
| `src/rooms/ragebait/` | Behavioral AI Lead | Composure trial. AI warden generates tailored provocations/ragebait; measures emotional stability and de-escalation skill. |
| `src/rooms/mbti/` | Psychometrics Lead | 16Personalities conversational chamber. Adaptive questioning computing E/I, S/N, T/F, J/P traits and MBTI result. |
| `src/rooms/moral/` | Ethics AI Lead | Moral dilemma tribunal presenting trolley/ethical dilemmas and evaluating moral reasoning frameworks. |
| `src/rooms/dossier/` | Reporting Lead | Final dossier screen synthesizing radar charts, MBTI type, and behavioral scorecards upon maze exit. |
| `src/services/llm/` | Dual-Rail Infrastructure | Unified adapter for Gemini API and Ollama (`gemma4:e4b`) with streaming, token frugality, and fallback handling. |
| `src/services/psychometrics/` | Scoring Core | Vector state models, trait extractors, and summary aggregators. |
| `src/store/` | State Architecture | Zustand global stores (`useGameStore`, `useChamberStore`, `useSettingsStore`). |

---

## 3. Frugal LLM Strategy & Token Conservation Protocol

To respect the directive that **Gemma / LLM should be used as sparsely as possible**:
1. **Zero LLM Board Moves**: Tic-Tac-Toe move calculations are 100% deterministic client-side JavaScript Minimax. Snakes & Ladders dice rolls and movements are pure JavaScript math. Zero tokens spent on game mechanics.
2. **Short Token Caps (`max_tokens: 150`)**: Dialogue turns from Chamber Wardens are capped to concise, impactful replies (1–3 sentences), preventing rambling generation and drastically speeding up local Ollama inference on `gemma4:e4b`.
3. **Structured Single-Pass Extraction**: Psychometric adjustments are extracted using compact JSON deltas or evaluated once per chamber completion rather than continuously on every keystroke.
4. **Local Minimax & Logic**: All win/loss checks, room unlocks, and puzzle verifications occur immediately in browser memory without server or model roundtrips.

---

## 4. Multi-Agent Teamwork Spec & Guardrails

| Agent Role | Isolation Mode | Execution Boundary & Guardrails |
| :--- | :--- | :--- |
| **Maze Specialist** | `inherit` | Confined to `src/rooms/maze/`. Must guarantee random DFS paths and valid room placements every run without touching room logic. |
| **Deterministic Games Engineer** | `inherit` | Confined to `src/rooms/tictactoe/` and `src/rooms/snakes/`. Must never invoke LLMs for move calculations. |
| **Conversational AI Engineer** | `inherit` | Confined to `src/rooms/entrapment/`, `src/rooms/ragebait/`, `src/rooms/mbti/`, and `src/rooms/moral/`. Strict token budget enforcement. |
| **Dossier & Viz Engineer** | `inherit` | Confined to `src/rooms/dossier/` and `src/services/psychometrics/`. Implements radar charts and personality badges. |
