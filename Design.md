# Design System & Baseline Aesthetic Specification (Design.md)

## 1. Aesthetic Direction: "The Resonant Blueprint" (LOCKED IN)
Chosen as the definitive visual system by the user. Rooted in avant-garde architectural drafting and esoteric blueprints:
- **Palette**: Deep void graphite (`#090B0E`), architectural slate walls (`#1A202C`), corridor chalk floors (`#10141C`), resonant spectral mint accents (`#70C1B3`), warm chamber portal seals (`#E0A96D`), and high-contrast chalk typography (`#F0F6FC`).
- **Physical Line-of-Sight Raycasting**: 320-ray dynamic raymarching calculates physical light propagation. In straight corridors, vision pierces deep down the hallway until it hits a wall/corner.
- **Ephemeral Unrevealing**: Zero static map memory. Corridors behind the avatar dissolve and sink back into the void as the player moves forward.
- **Avatar Reticle**: Minimalist architectural compass reticle with dynamic crosshairs and ambient radial attenuation.

---

## 2. Core Color Palette & Design Tokens

| Token Name | Hex Code | Semantic Role & Psychological Resonance |
| :--- | :--- | :--- |
| `--bg-abyss` | `#0A0B0E` | Base canvas background; deep obsidian void creating absolute spatial isolation. |
| `--surface-slate` | `#15181E` | Walkable corridor tiles and modal backdrops; raw basalt texture. |
| `--border-granite` | `#252B35` | Maze wall barriers, card outlines, and structural frames. |
| `--accent-spectral` | `#00F5D4` | Line-of-sight lantern beam, active radar lines, and player glyph radiance. |
| `--portal-amber` | `#FFB703` | Active chamber discovery nodes, completed room seals, and enlightenment triggers. |
| `--tension-crimson` | `#EF233C` | Ragebait crucible indicator, entrapment alert warnings, and high-stress state. |
| `--text-bone` | `#F4F4F6` | Primary high-contrast typography, warden titles, and vital scorecards. |
| `--text-ash` | `#8E98A5` | Secondary metadata, trait descriptions, coordinates, and subtle timestamps. |

---

## 3. Strict Typography Discipline

| Font Role | Family | Fallbacks | Weight / Style | Application Context |
| :--- | :--- | :--- | :--- | :--- |
| **Primary (Display & Chambers)** | `Syne` / `Space Grotesk` | `sans-serif` | 700 / 800 Bold, Uppercase Tracking | Chamber headers, title banners, personality archetype badges. Monumental and imposing. |
| **Secondary (Body & Dialogue)** | `Plus Jakarta Sans` / `Inter` | `system-ui`, `sans-serif` | 400 Regular / 500 Medium | Chamber warden dialogue text, instructions, moral dilemma narratives. Clean and unyielding. |
| **Input & Telemetry (Code & Monospace)** | `JetBrains Mono` | `monospace` | 400 / 600 Mono | User text input fields, coordinates HUD, trait numeric deltas, Ollama latency counters. |

---

## 4. Base Layout Shell & Spatial Orchestration
The user interface is architected around a unified 100vh viewport divided into three spatial layers:
1. **Background Layer (Canvas 2D)**: Full-bleed HTML5 Canvas rendering the randomized maze grid, procedural stone texture, player avatar, and dynamic raycasted light halo with gradient falloff into `#0A0B0E`.
2. **Foreground HUD Layer (Minimalist Precision)**:
   - *Top-Left*: Minimal compass coordinates `[X: 14, Y: 09]` and FPS / latency counter.
   - *Top-Right*: Settings toggle (Gemini vs Ollama indicator pill) and procedural audio volume slider.
   - *Bottom-Left*: Compact psychometric mini-radar preview tracking trait shifts in real time.
   - *Bottom-Right*: Discovered rooms counter (`[Chambers: 2 / 6 Cleared]`).
3. **Modal Chamber Overlay (Spatial Focus)**:
   - When stepping into an active chamber tile, the canvas gently dims with a radial vignette blur.
   - A centered, monolithic chamber interface slides upward with a 150ms spring transition.
   - Split layout: Left column features the Chamber Warden portrait / interactive game board (Tic-Tac-Toe, Snakes & Ladders, or Moral Tribunal); Right column hosts the streaming dialogue console and response input bar.

---

## 5. UI Concept Mockup
The overarching visual aesthetic, line-of-sight illumination, and modal overlay are captured in the baseline visual mockup below:

![Psychometric Labyrinth UI Mockup](C:/Users/ASUS/.gemini/antigravity/brain/460e404a-68f5-4604-8f94-c238ea0332ec/psychometric_labyrinth_ui_mockup_1793425396791.jpg)

