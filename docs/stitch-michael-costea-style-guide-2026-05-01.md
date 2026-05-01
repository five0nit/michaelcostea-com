---
name: Win98 Classic Desktop
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3e4949'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#6e7979'
  outline-variant: '#bdc9c8'
  surface-tint: '#006a6a'
  primary: '#006565'
  on-primary: '#ffffff'
  primary-container: '#008080'
  on-primary-container: '#e3fffe'
  inverse-primary: '#76d6d5'
  secondary: '#4b53bc'
  on-secondary: '#ffffff'
  secondary-container: '#8991fe'
  on-secondary-container: '#1b218f'
  tertiary: '#595a5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#727373'
  on-tertiary-container: '#fafaf9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#93f2f2'
  primary-fixed-dim: '#76d6d5'
  on-primary-fixed: '#002020'
  on-primary-fixed-variant: '#004f4f'
  secondary-fixed: '#e0e0ff'
  secondary-fixed-dim: '#bfc2ff'
  on-secondary-fixed: '#00006e'
  on-secondary-fixed-variant: '#3239a3'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  title-bar:
    fontFamily: Work Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.5px
  ui-label:
    fontFamily: Work Sans
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 12px
  body-text:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  terminal-text:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  start-button:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '900'
    lineHeight: 14px
spacing:
  border-width: 1px
  bevel-width: 2px
  margin-sm: 4px
  margin-md: 8px
  padding-button: 4px 10px
  window-gap: 0px
---

## Brand & Style

This design system is a rigorous homage to the late-90s computing era, prioritizing functional density and physical metaphors. The brand personality is **Tactile**, **Reliable**, and **Methodical**. It targets users who appreciate high-information density and the "operating system" metaphor as a way to organize complex workflows.

The design style is **Skeuomorphic/Retro-Technical**. It rejects modern trends like rounded corners, transparency, and vast whitespace in favor of a rigid, 3D-beveled environment. The emotional response is one of nostalgia coupled with professional "workstation" efficiency, where every pixel has a clear purpose and every button feels like a physical switch.

## Colors

The color palette is strictly limited to the VGA-era standard. The primary identity is defined by the **Classic Desktop Teal** (#008080), used exclusively for the application's base background layer. 

UI surfaces utilize **Neutral Grey** (#C0C0C0). Depth is created not through shading, but through a specific four-color border system: White and Light Grey for highlights, and Dark Grey and Black for shadows. Active focal points, such as title bars, use the **Deep Navy** (#000080), while inactive elements transition to a flat grey. Text is almost exclusively black for maximum contrast against the grey or white surfaces.

## Typography

Typography focuses on high-density legibility. **Work Sans** is used for the general UI to simulate the look of MS Sans Serif; it must be rendered with minimal smoothing where possible to maintain a crisp, pixel-aligned feel. 

**Space Grotesk** serves the monospaced requirements for data readouts and terminal components. Font sizes are intentionally small, rarely exceeding 12px for standard interface elements. All headers are bold but maintain the same font size as body text, differentiated only by their container (e.g., the Blue Title Bar).

## Layout & Spacing

The layout follows a **Fixed/Windowed** model. Instead of fluid web containers, content is organized into "Windows" that behave like independent objects. 

The spacing rhythm is extremely tight, utilizing a 4px base grid. Gutters are minimal. Information density is prioritized over "breathability." Elements are aligned to the top-left, and containers use fixed padding (typically 2px or 4px) to keep content close to its decorative borders. Components like toolbars use 2px spacing between icons to maximize horizontal real estate.

## Elevation & Depth

Elevation is achieved through **Simulated Beveling** (3D Outset/Inset). There are no soft shadows or transparency blurs.

1.  **Outset (Raised):** Used for buttons and unselected tabs. Top and left borders use White/Light Grey; bottom and right borders use Black/Dark Grey.
2.  **Inset (Sunken):** Used for input fields, progress bar tracks, and the main viewport area. Top and left borders use Dark Grey/Black; bottom and right borders use White/Light Grey.
3.  **Flat:** Used only for decorative lines (separators) which are composed of one Dark Grey line paired with one White line to create a "etched" look.

The Z-index hierarchy is literal: the Desktop is the base, Taskbars are docked, and Windows are stacked on top with distinct 1px black outlines to separate them from the background.

## Shapes

The shape language is strictly **Rectangular**. There are no rounded corners in this design system (roundedness value of 0). Every button, window, input, and tooltip must have 90-degree sharp corners. 

The "physicality" of shapes is defined by their borders rather than their geometry. A "circle" should only appear in specific metaphors (like radio buttons) and must be rendered with visible aliasing (pixelated edges) to maintain the 1998 aesthetic.

## Components

### Buttons
Standard buttons use the **Outset** bevel. Upon `:active` (click), they switch to **Inset**, and the text/icon shifts 1px down and to the right to simulate physical depression.

### Windows & Dialogs
Every window must have a **Title Bar** (#000080 background) containing the title in white text and a cluster of three square buttons on the far right (Minimize, Maximize, Close). The window frame is the standard #C0C0C0 with a 2-tier 3D border.

### Input Fields
Inputs are **Inset** rectangles with a white background and black text. The cursor should be a non-blinking or block-style vertical line.

### Checkboxes & Radios
Checkboxes are 13x13px inset squares. Radio buttons are inset circles. The "checked" state is indicated by a heavy black "L" shape (checkmark) or a centered black circle.

### The 'Start' Menu
The primary navigation is a button in the bottom-left corner. It triggers a vertical pop-up menu with an outset border. High-level categories are indicated by a vertical gray bar with text rotated 90 degrees.

### Tabs
Tabs are positioned at the top of a container. Selected tabs are raised (outset) and physically connect to the pane below by removing the bottom border, while unselected tabs are slightly shorter and have a bottom border.