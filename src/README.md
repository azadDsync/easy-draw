// src/ folder structure for future implementation
// This folder will contain:

// src/logic/
//   - canvas.ts (pure canvas logic: grid, shapes, drawing operations)
//   - validation.ts (input validation, bounds checking)
//   - serialization.ts (save/load canvas state)

// src/feedback/
//   - audio.ts (expo-speech announcements)
//   - haptics.ts (expo-haptics vibration patterns)

// src/gestures/
//   - canvasGestures.ts (react-native-gesture-handler configurations)
//   - gestureHandlers.ts (gesture event processing)

// src/store/
//   - canvasStore.ts (Zustand store for canvas state ONLY - no side effects)

// src/types/
//   - canvas.types.ts (TypeScript interfaces and types)

// src/utils/
//   - storage.ts (AsyncStorage persistence)
//   - constants.ts (app-wide constants)

// IMPORTANT RULES:
// - Logic files must be framework-agnostic and testable
// - No UI code in src/
// - No side effects in Zustand stores
// - Feedback modules handle audio/haptics independently
// - Gestures are configured separately from logic
