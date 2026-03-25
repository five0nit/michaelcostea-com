# DO NOT TOUCH — 3D Resume Rebuild Plan

## Goal
Rebuild `DO NOT TOUCH` from scratch as a standalone 3D resume adventure inspired by retro Pokémon world exploration and the interaction feel of `Otis & His Friends`, but with its **own original 3D assets, world, mechanics, and content structure**.

## Creative Direction
- **Theme / world vibe:** retro Pokémon-inspired overworld exploration
- **Story loop:** the player explores the world and finds clues to reconstruct Michael Costea's resume
- **Tone:** playful, intelligent
- **Visual style:** high-poly, high-end retro look
- **Positioning:** this is not a gimmick page — it becomes a flagship interactive portfolio experience

## Core Experience
The player starts with an incomplete "resume dex" / profile archive.
Each area of the world contains:
- clue objects
- NPCs
- collectible memory shards
- challenge gates
- interactable scene props

By completing exploration goals, the player unlocks resume sections.

## Resume Structure Requirements
All resume sections must be modular and future-expandable.
Recommended section model:
- profile / summary
- work experience
- projects
- technical skills
- licenses / certifications
- education / training
- achievements / impact
- contact / links
- optional future sections
  - testimonials
  - timeline milestones
  - media / gallery
  - downloadable CV variants

## Proposed Game Loop
1. Player enters the world with a partially corrupted resume archive.
2. NPCs, objects, and environmental clues reveal missing sections.
3. Each biome represents a resume domain.
4. Completing tasks unlocks structured resume entries.
5. A central hub assembles the final resume dynamically.
6. Player can review unlocked sections at any time from an in-game menu.

## World Design
### Suggested hub-and-zone structure
- **Starter Town / Profile Town**
  - intro
  - personal summary
  - who Michael is
- **Trades District**
  - electrician / field work / practical capability
- **Builder Labs**
  - automations, systems, web tools, product thinking
- **Operations City**
  - process improvement, execution, reliability, leadership
- **Growth Route**
  - partnerships, commercial thinking, customer outcomes
- **Archive Tower**
  - complete resume view, unlock recap, contact links

## Mechanics
### Core mechanics
- 3D top-down or angled exploration
- interact prompt on objects / NPCs
- clue collection
- unlockable resume entries
- in-game journal / resume log
- simple puzzle gates
- future-ready content loader

### Optional mechanics for later
- mini-quests per zone
- hidden lore collectibles
- skill badges as items
- branching dialogue
- downloadable CV generated from unlocked data

## Asset Direction
This rebuild should use its **own 3D asset language**, not recycled Otis characters.

### Required original asset categories
- player character
- NPC set
- biome tiles / terrain kit
- buildings and props
- clue objects / collectible items
- UI icons / journal assets
- resume shard collectibles
- portal / gate / milestone objects

### Style guidance
- polished retro proportions
- playful silhouettes
- readable from distance
- premium color palette
- nostalgic game feel without looking cheap or low-effort

## Technical Architecture
## Recommended folder structure
```text
apps/games/do-not-touch-3d/
  index.html
  styles.css
  game.js
  engine/
  data/
    resume-sections.json
    world-zones.json
    npcs.json
    interactions.json
  assets/
    models/
    textures/
    ui/
    audio/
  docs/
```

## Data model principles
- world content should be data-driven
- resume sections should load from JSON
- zones should be independently extendable
- interactions should not be hard-coded into one giant file
- future additions should require mostly data edits, not engine rewrites

## Resume Content System
Each unlockable item should support:
- `id`
- `type`
- `title`
- `summary`
- `details`
- `tags`
- `zone`
- `order`
- `visible`
- `future`

This allows future expansion without rebuilding the experience.

## Build Strategy
### Phase 1 — Design + structure
- define content architecture
- define world zones
- define interaction model
- define asset list
- define MVP scope

### Phase 2 — New scaffold
- create new `do-not-touch-3d` app folder
- set up scene, camera, movement, UI shell
- load resume data from JSON

### Phase 3 — Core gameplay
- exploration
- interact system
- clue collection
- journal / resume menu
- unlock flow

### Phase 4 — Visual pass
- replace placeholders with original 3D assets
- tune lighting / retro post-processing
- mobile responsiveness + performance pass

### Phase 5 — Replace legacy build
- keep current `do-not-touch.html` as legacy backup
- switch site entry once new build is stable/playable

## MVP Recommendation
For the first playable version, ship:
- 1 hub area
- 3 unlockable zones
- 1 player character
- 3–5 NPCs
- 8–12 unlockable resume entries
- in-game resume journal
- clean mobile + desktop support

## Important Product Rule
Do **not** keep growing the current story-run page. Treat it as legacy.
The new version should be a fresh game architecture with reusable systems and asset pipelines.

## Immediate Next Step
Create:
1. new game scaffold
2. JSON-driven resume data schema
3. zone/content map
4. asset production checklist
