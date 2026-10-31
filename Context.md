# Context & Strategic Vision

## 1. Vision & Core Value Proposition
**The Psychometric Labyrinth (Maze of the Mind)** is an interactive, gamified psychological exploration web application where users navigate a procedural or structured maze. As players traverse corridors and enter distinct "Chambers" (Rooms), they encounter AI-driven entities powered either by the **Gemini API** or a local **Ollama instance (specifically configured for `gemma4:e4b` / Gemma variants)**. Each chamber hosts tailored conversational trials, mini-games, and behavioral dilemma prompts. Over the course of the journey, the underlying analytical engine aggregates the player's micro-decisions, conversational tone, puzzle-solving instincts, and moral choices to synthesize a comprehensive, multi-dimensional psychometric profile (e.g., Big Five / MBTI / Archetypal analysis) presented upon maze exit.

### One-Sentence Differentiator
*An immersive spatial labyrinth where gameplay mechanics seamlessly interweave with hybrid cloud/local LLM-driven psychological profiling, transforming conversational AI into an emergent personality evaluation engine.*

---

## 2. Boundaries: What We Are NOT Building
To prevent scope creep and maintain strict hackathon / enterprise delivery discipline:
1. **NOT a Generic Open-Ended Chatbot Interface**: This is not a ChatGPT-style tabbed chat utility. All dialogue is contextualized, room-bound, objective-driven, and tied to psychometric evaluation metrics.
2. **NOT a Full 3D AAA Multiplayer MMORPG**: We are not engineering real-time networked multiplayer, physics-heavy 3D engines (e.g., Unreal Engine WebGL with skeletal animation), or server-side MMO infrastructure. The focus is a responsive, highly immersive 2D/isometric/top-down or retro-dungeon web maze experience.
3. **NOT a Medical-Grade Clinical Psychiatric Diagnostic Instrument**: The application produces entertainment, gamified self-discovery, and behavioral archetypes. It explicitly does not issue certified psychiatric diagnoses or HIPAA/clinical health documentation.
4. **NOT an Arbitrary Multi-Model Playground**: We are not supporting arbitrary dynamic model switching across dozens of vendors. The architecture strictly centers around dual-rail inference: **Google Gemini API** (cloud rail) and **Ollama Local (`gemma4:e4b`)** (air-gapped/local rail).

---

## 3. Strict Glossary of Terms
All team members, subagents, and documentation must strictly adhere to this nomenclature:

| Term | Definition |
| :--- | :--- |
| **Labyrinth / Maze** | The spatial navigation grid through which the player moves their avatar. Composed of corridors, barriers, discovery nodes, and chamber entry portals. |
| **Chamber (Room)** | An isolated interactive zone within the maze dedicated to a specific theme, entity encounter, conversational trial, or mini-game. |
| **Dual-Rail LLM Engine** | The abstraction layer responsible for dispatching prompts and streaming responses to either Google Gemini API (Cloud) or Ollama HTTP Server (`gemma4:e4b` local). |
| **Chamber Warden (NPC)** | The persona-infused AI agent inhabiting a Chamber, programmed with a distinct psychological probe motive, game mechanics, and tone. |
| **Psychometric Vector** | The continuous numerical vector (e.g., Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism, Risk Propensity, Analytical Ratio) updated dynamically via structured JSON extraction from player interactions. |
| **Trial / Mini-Game** | A deterministic or LLM-arbitrated interaction within a chamber (e.g., Prisoner's Dilemma, riddle solving, moral negotiation, spatial puzzle) testing specific traits. |
| **Mind Dossier** | The final analytical report rendered upon exiting the labyrinth, featuring archetype visualization, trait breakdowns, and behavioral transcripts. |

---

## 4. Definition of Done (DoD)
The project reaches completion only when all the following rigorous acceptance benchmarks are verified:
- [ ] **Dual-Rail Connectivity Verified**: Seamless execution and fallback between remote Gemini API and local Ollama (`gemma4:e4b`) endpoints without breaking UI state or blocking the event loop.
- [ ] **Interactive Maze Engine**: Responsive 2D / top-down / grid labyrinth with smooth collision detection, fog of war / line of sight, and dynamic room discovery.
- [ ] **Minimum 4 Functional Chambers**: At least four unique thematic chambers with dedicated AI Wardens, conversational puzzles, and interactive game states.
- [ ] **Real-Time Psychometric Accumulator**: Background extractor parsing user conversation into structured trait deltas without introducing noticeable conversational latency.
- [ ] **Comprehensive Mind Dossier**: Interactive end-screen presenting radar charts, archetypes, and downloadable or shareable summary data.
- [ ] **Bulletproof Error & Offline Handling**: Graceful degradation when local Ollama is offline or when API rate limits / network outages occur.
- [ ] **Strict Documentation Integrity**: All 7 engineering playbook files (`Pr.md`, `Ar.md`, `Rules.md`, `Phase.md`, `Design.md`, `Memory.md`, `Context.md`) fully synchronized and up to date.

