# Otis & His Friends — Master Prompt & Style Guide

## Purpose
This prompt is the single source of truth for creating visuals, 3D assets, concept art, environment pieces, character variants, UI art, and promo imagery for **Otis & His Friends**.

The goal is:
- charming, memorable, premium-feeling 3D game art
- mobile/web friendly execution
- strong silhouette readability
- original cohesive design language
- consistent across Otis, his forms, his friends, and the world

---

## Core Creative Direction
Create a **premium stylized 3D adventure game world** for **Otis & His Friends**.

The game concept:
- Otis must rescue his hidden friends
- he transforms into different animals to cross difficult terrain
- each form has a clear gameplay ability
- the world should feel playful, polished, readable, and emotionally warm

This is **not** photoreal horror, gritty realism, or generic asset-store style.
It should feel like a **high-quality stylized family-friendly 3D adventure** with premium presentation.

---

## Visual Style Keywords
- premium stylized 3D
- highly polished game-ready art
- cinematic game-art finish
- stylized realism
- expressive shapes
- readable silhouettes
- playful but sophisticated
- characterful and memorable
- modern polished 3D adventure look
- consistent shape language
- high-quality PBR materials
- mobile/web optimized asset design
- clean topology and performant forms

---

## Lighting & Atmosphere
Use these as **art direction targets**, not literal engine requirements:
- cinematic lighting
- soft directional lighting
- subtle bloom
- atmospheric depth
- soft shadows
- warm storybook adventure feel
- light haze / depth separation
- visually rich but gameplay-readable environments

Avoid over-dark dramatic lighting that hides gameplay.
Readability matters more than realism.

---

## Rendering / Material Intent
Target material quality like:
- polished PBR look
- believable roughness variation
- tactile surfaces
- subtle weathering where useful
- rich but controlled texture detail
- high-quality normal/roughness response
- clean material separation between terrain types

Do **not** overdo realism to the point where the game becomes muddy or visually noisy.

---

## Character Design Rules
### Otis
Otis is the hero.
He should be:
- instantly recognizable
- expressive
- charming
- readable from gameplay camera distance
- iconic enough to be the face of the game

Otis design requirements:
- strong face readability
- distinct silhouette
- hero color palette
- premium stylized materials
- friendly proportions
- clear idle and movement personality

### Otis Forms
Each transformed form must be:
- unmistakably its animal
- visually tied to Otis’s design language
- readable from distance
- mechanically clear

#### Bird Form
Ability: cross / glide over gaps
Requirements:
- clearly bird-like silhouette
- strong wing readability
- light agile shape language
- visually suggests lift, glide, mobility

#### Fish Form
Ability: swim in water only
Requirements:
- unmistakably fish
- believable aquatic motion language
- must never read as a hovering blob
- body, fins, tail should clearly support swimming
- should look wrong on land by design

#### Goat Form
Ability: climb cliffs / rocky terrain
Requirements:
- unmistakably goat
- proper horn language
- sturdy grounded body
- visually communicates balance and climbing capability
- must never be substituted with fox/wolf/dog/deer-like silhouettes

---

## Friend Character Rules
Otis’s friends must:
- feel like they belong to the same universe
- follow a unified design system
- be cute, memorable, and collectible-feeling
- remain readable from gameplay distance
- be visually distinct from decoys and enemies

Friends should feel:
- precious
- stylized
- consistent
- intentionally designed

They must not look like random placeholder capsules.

---

## Environment Art Rules
The world must support gameplay clarity first.
Terrain needs strong visual separation.

### Terrain Types
#### Normal Ground
- safe
- readable
- inviting
- base traversal color language

#### Water
- instantly readable as fish-only zone
- brighter cool palette
- reflective / animated feeling
- should visually communicate “swim here”

#### Gap / Void / Glide Zone
- clearly dangerous / non-walkable
- should visually communicate “bird required”
- unique color family distinct from water and cliff

#### Cliff / Rock Climb Terrain
- rugged, vertical, stable
- clearly communicates “goat required”
- warm rocky color language

---

## UI / HUD Art Direction
UI should feel:
- minimal
- premium
- readable on mobile
- playful but clean
- not crowded

Rules:
- one clear action at a time
- avoid duplicate controls
- strong mobile spacing
- objective clarity over decoration
- terrain guidance should be visual, not verbose

---

## Animation Direction
Animations should be stylized, readable, and ability-driven.

### Otis
- expressive idle
- proper walk cycle
- footfalls should read clearly
- responsive turning

### Bird
- glide / flap energy
- airborne/lightness feeling

### Fish
- side-to-side swim motion
- fin/tail-driven movement
- never walk on land

### Goat
- grounded stepping
- sturdy climbing energy
- sure-footed body motion

### Transformations
- short magical transformation burst
- readable silhouette transition
- satisfying but fast enough for gameplay

---

## Optimization Constraint
All final assets must be:
- game-ready
- optimized for real-time rendering
- suitable for web/mobile
- readable from gameplay camera distance
- light enough for browser delivery

Avoid:
- raw 8K texture assumptions
- ultra-heavy film-quality meshes
- photoreal over-detail that hurts gameplay/performance

---

## Master Prompt
Use this as the base prompt for image/model generation:

"Create premium stylized 3D game assets for a mobile/web adventure game called Otis & His Friends. The world is playful, polished, cinematic, and emotionally warm. Otis rescues his hidden friends and transforms into different animals to cross difficult terrain. Art style: premium stylized 3D, highly polished game-art finish, cinematic but gameplay-readable lighting, strong silhouettes, expressive characters, cohesive shape language, polished PBR materials, subtle bloom, atmospheric depth, mobile/web optimized, readable from mid-distance gameplay camera, not generic asset-store style, not muddy photoreal overload. Bird form must clearly read as a bird built for gliding gaps. Fish form must clearly read as a real fish with believable aquatic anatomy and swim motion, usable only in water. Goat form must unmistakably read as a goat with proper horns, grounded body structure, and climbing capability. Otis’s friends must feel cute, collectible, and part of the same original design language. Terrain must be visually separated so players instantly understand which form is needed for water, gaps, cliffs, and normal ground." 

---

## Negative Prompt / Avoid
- generic placeholder character
- random asset pack mismatch
- photoreal mud
- horror tone
- dark unreadable lighting
- fox/wolf substitute for goat
- floating fish on land
- inconsistent art style
- cluttered UI
- overly realistic textures that reduce gameplay clarity
