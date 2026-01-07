// src/gestures/gestureMapper.ts
// Maps raw gesture events to semantic canvas intents
// Framework-agnostic - no React, no side effects

import type { Direction } from "../canvas/types";

/**
 * Semantic gesture intents for canvas interaction
 */
export enum GestureIntent {
  MOVE_UP = "MOVE_UP",
  MOVE_DOWN = "MOVE_DOWN",
  MOVE_LEFT = "MOVE_LEFT",
  MOVE_RIGHT = "MOVE_RIGHT",
  PAINT = "PAINT",
  ERASE = "ERASE",
  INSPECT = "INSPECT",
  UNDO = "UNDO",
  REDO = "REDO",
  MENU = "MENU",
  HOME = "HOME",
  COLOR_MENU_NEXT = "COLOR_MENU_NEXT",
  COLOR_MENU_PREV = "COLOR_MENU_PREV",
  COLOR_MENU_CONFIRM = "COLOR_MENU_CONFIRM",
  COLOR_MENU_CANCEL = "COLOR_MENU_CANCEL",
  UNKNOWN = "UNKNOWN",
}

/**
 * Gesture type identifiers
 */
export enum GestureType {
  PAN = "PAN",
  TAP = "TAP",
  DOUBLE_TAP = "DOUBLE_TAP",
  LONG_PRESS = "LONG_PRESS",
  SWIPE = "SWIPE",
}

/**
 * Swipe direction thresholds
 */
const SWIPE_VELOCITY_THRESHOLD = 500; // pixels per second
const SWIPE_ANGLE_TOLERANCE = 45; // degrees

/**
 * Pan gesture data
 */
interface PanData {
  translationX: number;
  translationY: number;
  velocityX: number;
  velocityY: number;
}

/**
 * Determines swipe direction from pan gesture data
 * Returns null if gesture doesn't meet swipe criteria
 */
export function detectSwipeDirection(pan: PanData): Direction | null {
  const { translationX, translationY, velocityX, velocityY } = pan;
  
  // Calculate total velocity
  const totalVelocity = Math.sqrt(velocityX ** 2 + velocityY ** 2);
  
  // Check if velocity meets threshold
  if (totalVelocity < SWIPE_VELOCITY_THRESHOLD) {
    return null;
  }
  
  // Calculate angle in degrees
  const angle = Math.atan2(Math.abs(translationY), Math.abs(translationX)) * (180 / Math.PI);
  
  // Determine primary direction based on translation
  const absX = Math.abs(translationX);
  const absY = Math.abs(translationY);
  
  // Horizontal swipe
  if (absX > absY && angle < SWIPE_ANGLE_TOLERANCE) {
    return translationX > 0 ? "right" : "left";
  }
  
  // Vertical swipe
  if (absY > absX && angle > (90 - SWIPE_ANGLE_TOLERANCE)) {
    return translationY > 0 ? "down" : "up";
  }
  
  return null;
}

/**
 * Maps swipe direction to movement intent
 */
export function swipeToMoveIntent(direction: Direction): GestureIntent {
  switch (direction) {
    case "up":
      return GestureIntent.MOVE_UP;
    case "down":
      return GestureIntent.MOVE_DOWN;
    case "left":
      return GestureIntent.MOVE_LEFT;
    case "right":
      return GestureIntent.MOVE_RIGHT;
    default:
      return GestureIntent.UNKNOWN;
  }
}

/**
 * Maps a single tap to paint intent
 */
export function mapTapToPaint(): GestureIntent {
  return GestureIntent.PAINT;
}

/**
 * Maps double tap to inspect intent
 */
export function mapDoubleTapToInspect(): GestureIntent {
  return GestureIntent.INSPECT;
}

/**
 * Maps long press to menu intent
 */
export function mapLongPressToMenu(): GestureIntent {
  return GestureIntent.MENU;
}

/**
 * Maps two-finger tap to undo
 */
export function mapTwoFingerTapToUndo(): GestureIntent {
  return GestureIntent.UNDO;
}

/**
 * Maps three-finger tap to redo
 */
export function mapThreeFingerTapToRedo(): GestureIntent {
  return GestureIntent.REDO;
}

/**
 * Maps gesture type and data to semantic intent
 */
export function mapGestureToIntent(
  gestureType: GestureType,
  data?: any
): GestureIntent {
  switch (gestureType) {
    case GestureType.TAP:
      return mapTapToPaint();
      
    case GestureType.DOUBLE_TAP:
      return mapDoubleTapToInspect();
      
    case GestureType.LONG_PRESS:
      return mapLongPressToMenu();
      
    case GestureType.SWIPE:
      if (data && data.direction) {
        return swipeToMoveIntent(data.direction);
      }
      return GestureIntent.UNKNOWN;
      
    case GestureType.PAN:
      if (data) {
        const direction = detectSwipeDirection(data);
        if (direction) {
          return swipeToMoveIntent(direction);
        }
      }
      return GestureIntent.UNKNOWN;
      
    default:
      return GestureIntent.UNKNOWN;
  }
}

/**
 * Converts GestureIntent to Direction for movement actions
 * Returns null if intent is not a movement
 */
export function intentToDirection(intent: GestureIntent): Direction | null {
  switch (intent) {
    case GestureIntent.MOVE_UP:
      return "up";
    case GestureIntent.MOVE_DOWN:
      return "down";
    case GestureIntent.MOVE_LEFT:
      return "left";
    case GestureIntent.MOVE_RIGHT:
      return "right";
    default:
      return null;
  }
}

/**
 * Checks if intent is a movement action
 */
export function isMovementIntent(intent: GestureIntent): boolean {
  return [
    GestureIntent.MOVE_UP,
    GestureIntent.MOVE_DOWN,
    GestureIntent.MOVE_LEFT,
    GestureIntent.MOVE_RIGHT,
  ].includes(intent);
}

/**
 * Checks if intent is an action that modifies canvas
 */
export function isModifyingIntent(intent: GestureIntent): boolean {
  return [
    GestureIntent.PAINT,
    GestureIntent.ERASE,
    GestureIntent.UNDO,
    GestureIntent.REDO,
  ].includes(intent);
}
