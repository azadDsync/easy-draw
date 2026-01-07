// src/feedback/haptics.ts
// Haptic feedback using expo-haptics
// Provides vibration patterns for user actions

import * as Haptics from "expo-haptics";

/**
 * Light haptic feedback for successful actions
 * Fire-and-forget - does not wait for completion
 */
export function hapticLight(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Medium haptic feedback for important actions
 * Fire-and-forget - does not wait for completion
 */
export function hapticMedium(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Heavy haptic feedback for critical actions
 * Fire-and-forget - does not wait for completion
 */
export function hapticHeavy(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Success haptic pattern
 * Fire-and-forget - does not wait for completion
 */
export function hapticSuccess(): void {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Warning haptic pattern
 * Fire-and-forget - does not wait for completion
 */
export function hapticWarning(): void {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Error haptic pattern
 * Fire-and-forget - does not wait for completion
 */
export function hapticError(): void {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Selection haptic for focus movement
 * Fire-and-forget - does not wait for completion
 */
export function hapticSelection(): void {
  try {
    Haptics.selectionAsync();
  } catch (error) {
    // Silently ignore
  }
}

/**
 * Haptic for focus movement
 */
export function hapticFocusMove(): void {
  hapticLight();
}

/**
 * Haptic for paint action
 */
export function hapticPaint(): void {
  hapticMedium();
}

/**
 * Haptic for boundary collision
 */
export function hapticBoundary(): void {
  hapticWarning();
}

/**
 * Haptic for menu open
 */
export function hapticMenuOpen(): void {
  hapticMedium();
}

/**
 * Haptic for menu close
 */
export function hapticMenuClose(): void {
  hapticLight();
}

/**
 * Haptic for color selection
 */
export function hapticColorSelect(): void {
  hapticSelection();
}

/**
 * Haptic for color confirmation
 */
export function hapticColorConfirm(): void {
  hapticSuccess();
}

/**
 * Haptic for undo/redo
 */
export function hapticUndoRedo(): void {
  hapticMedium();
}
