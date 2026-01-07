# Easy-Draw

## Overview

Easy-Draw is an **accessibility-first mobile drawing application** designed for blind and severely visually impaired users.

Unlike traditional drawing apps, Easy-Draw does **not depend on visual interaction**. Drawing is performed through **gesture-based navigation**, **logical spatial understanding**, **audio feedback**, and **haptic cues**.

A minimal visual UI is included **only as a secondary aid** for:
- Sighted collaborators  
- Developers  
- App demos and reviews  

Blind users can use the app **fully with TalkBack or VoiceOver enabled**, even with the screen turned off.

---

## Core Principles

- Blind-first, not visual-first  
- No feature depends on sight to function  
- Predictable and consistent interactions  
- Short, structured audio feedback  
- All actions are safe, reversible, and undoable  
- UI mirrors state and never drives logic  

---

## Key Features

### Drawing & Interaction
- Logical grid-based canvas (state-driven, non-pixel)
- Swipe gestures to navigate between cells
- Double-tap to paint
- Eraser mode and clear canvas (with confirmation)
- Full undo / redo support

### Accessibility
- Designed for TalkBack and VoiceOver
- Explicit speech feedback (no assumptions)
- Haptic feedback for confirmation and errors
- All interactive elements properly labeled

### Colors & Tools
- Audio-based color selection menu
- Safe mode switching (paint / erase)
- No accidental destructive actions

### Save, Load & Export
- Explicit save (no autosave)
- Load previously saved drawings
- Export as:
  - **Textual description** (screen-reader friendly)
  - **SVG image** (for sighted users)
- Share exports via system share sheet (WhatsApp, Messages, Email, etc.)

### Visual UI (Secondary)
- Minimal, modern, flat design
- Optional visual grid and focus indicator
- Highly optimized for performance
- Does not affect blind user workflow

---

## Tech Stack

- React Native  
- Expo (latest)  
- Expo Router  
- TypeScript  
- Zustand (state only)  
- react-native-gesture-handler  
- react-native-reanimated  
- expo-speech  
- expo-haptics  
- AsyncStorage  
- Tailwind / NativeWind (presentation only)

---

## Architecture Overview

``` 
Canvas Logic (pure, testable)
↓
Zustand Store (state only)
↓
Gesture Layer (intent mapping)
↓
UI Layer (speech, haptics, minimal visuals) 

```


- Core drawing logic is framework-agnostic
- UI contains no business logic
- Accessibility feedback is handled only in the UI layer

---

## Who This App Is For

- Blind and visually impaired users
- Educators and accessibility researchers
- Developers learning accessibility-first architecture
- Reviewers evaluating inclusive design

---

## Accessibility Commitment

This app is built with the assumption that:

> **The user may never see the screen.**

If a feature cannot be used without sight, it is redesigned or removed.

---

## Project Status

- Core functionality: ✅ Implemented  
- Accessibility testing: 🔄 Ongoing  
- UI polish & demos: 🔄 Ongoing  

---

## Contributing

Contributions are welcome, especially in:
- Accessibility testing
- UX feedback from blind users
- Documentation improvements

Please **do not add visual-only features** or refactor core logic without discussion.

---

