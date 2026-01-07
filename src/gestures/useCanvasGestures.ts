// src/gestures/useCanvasGestures.ts
// React hook for canvas gesture handling
// Binds react-native-gesture-handler to Zustand store actions

import { useRef } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useCanvasStore } from "../store/useCanvasStore";
import {
  GestureIntent,
  detectSwipeDirection,
  intentToDirection,
  isMovementIntent,
  mapTapToPaint,
  mapDoubleTapToInspect,
  mapLongPressToMenu,
} from "./gestureMapper";
import type { ActionResult } from "../canvas/types";

/**
 * Result of gesture processing
 */
interface GestureResult {
  intent: GestureIntent;
  actionResult: ActionResult | null;
}

/**
 * Gesture handler callbacks
 */
interface GestureHandlers {
  onGestureResult?: (result: GestureResult) => void;
}

/**
 * Hook for canvas gesture handling
 * Returns composed gesture for attachment to GestureDetector
 */
export function useCanvasGestures(handlers?: GestureHandlers) {
  const store = useCanvasStore();
  
  // Track last gesture time to prevent duplicate triggers
  const lastGestureTime = useRef<number>(0);
  const GESTURE_DEBOUNCE_MS = 100;

  /**
   * Processes a gesture intent and calls appropriate store action
   * Routes differently based on color menu state
   */
  const processIntent = (intent: GestureIntent): ActionResult | null => {
    // Prevent rapid duplicate gestures
    const now = Date.now();
    if (now - lastGestureTime.current < GESTURE_DEBOUNCE_MS) {
      return null;
    }
    lastGestureTime.current = now;

    let result: ActionResult | null = null;
    const isMenuOpen = store.isColorMenuOpen;

    // Handle color menu intents (only when menu is open)
    if (intent === GestureIntent.COLOR_MENU_NEXT) {
      result = store.nextColor();
    }
    else if (intent === GestureIntent.COLOR_MENU_PREV) {
      result = store.prevColor();
    }
    else if (intent === GestureIntent.COLOR_MENU_CONFIRM) {
      result = store.confirmColor();
    }
    else if (intent === GestureIntent.COLOR_MENU_CANCEL) {
      result = store.closeColorMenu();
    }
    // Handle menu open intent
    else if (intent === GestureIntent.MENU) {
      if (isMenuOpen) {
        result = store.closeColorMenu();
      } else {
        result = store.openColorMenu();
      }
    }
    // Handle movement intents (disabled when menu is open)
    else if (isMovementIntent(intent)) {
      const direction = intentToDirection(intent);
      if (direction) {
        result = store.moveFocusDirection(direction);
      }
    }
    // Handle paint intent (disabled when menu is open)
    else if (intent === GestureIntent.PAINT) {
      result = store.paintFocusedCell();
    }
    // Handle erase intent
    else if (intent === GestureIntent.ERASE) {
      result = store.eraseFocusedCell();
    }
    // Handle undo intent
    else if (intent === GestureIntent.UNDO) {
      result = store.performUndo();
    }
    // Handle redo intent
    else if (intent === GestureIntent.REDO) {
      result = store.performRedo();
    }
    // Handle home intent
    else if (intent === GestureIntent.HOME) {
      result = store.moveFocusHome();
    }
    // Handle inspect intent (get cell info)
    else if (intent === GestureIntent.INSPECT) {
      const info = store.getFocusedCellInfo();
      result = {
        success: true,
        message: `Cell at (${info.row}, ${info.col}) ${info.color ? `is ${info.color}` : "is empty"}`,
        position: { row: info.row, col: info.col },
        color: info.color || undefined,
      };
    }

    return result;
  };

  /**
   * Notifies handler of gesture result
   */
  const notifyResult = (intent: GestureIntent, actionResult: ActionResult | null) => {
    if (handlers?.onGestureResult) {
      handlers.onGestureResult({ intent, actionResult });
    }
  };

  /**
   * Pan gesture for swipe-based movement or color menu navigation
   * Routes based on menu state
   */
  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const direction = detectSwipeDirection({
        translationX: event.translationX,
        translationY: event.translationY,
        velocityX: event.velocityX,
        velocityY: event.velocityY,
      });

      if (direction) {
        const isMenuOpen = store.isColorMenuOpen;
        let intent: GestureIntent;

        // Map gestures based on menu state
        if (isMenuOpen) {
          // In menu: horizontal swipes navigate colors
          if (direction === "right") {
            intent = GestureIntent.COLOR_MENU_NEXT;
          } else if (direction === "left") {
            intent = GestureIntent.COLOR_MENU_PREV;
          } else {
            // Vertical swipes ignored in menu
            return;
          }
        } else {
          // Normal mode: swipes move focus
          intent =
            direction === "up"
              ? GestureIntent.MOVE_UP
              : direction === "down"
              ? GestureIntent.MOVE_DOWN
              : direction === "left"
              ? GestureIntent.MOVE_LEFT
              : GestureIntent.MOVE_RIGHT;
        }

        const result = processIntent(intent);
        notifyResult(intent, result);
      }
    })
    .minDistance(20)
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10]);

  /**
   * Single tap gesture for painting
   */
  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .onEnd(() => {
      const intent = mapTapToPaint();
      const result = processIntent(intent);
      notifyResult(intent, result);
    });

  /**
   * Double tap gesture for inspecting cell or confirming color
   * Routes based on menu state
   */
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      const isMenuOpen = store.isColorMenuOpen;
      const intent = isMenuOpen
        ? GestureIntent.COLOR_MENU_CONFIRM
        : mapDoubleTapToInspect();
      const result = processIntent(intent);
      notifyResult(intent, result);
    });

  /**
   * Long press gesture for opening/closing color menu
   */
  const longPressGesture = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      const intent = mapLongPressToMenu();
      const result = processIntent(intent);
      notifyResult(intent, result);
    });

  /**
   * Two-finger tap for canceling color menu
   */
  const twoFingerTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .onEnd(() => {
      const isMenuOpen = store.isColorMenuOpen;
      if (isMenuOpen) {
        const intent = GestureIntent.COLOR_MENU_CANCEL;
        const result = processIntent(intent);
        notifyResult(intent, result);
      }
    });

  /**
   * Compose all gestures
   * Order matters: more specific gestures should be exclusive
   */
  const composedGesture = Gesture.Exclusive(
    doubleTapGesture, // Check double tap before single tap
    Gesture.Simultaneous(
      tapGesture,
      longPressGesture
    ),
    panGesture
  );

  return {
    gesture: composedGesture,
    processIntent, // Expose for manual intent processing
    store, // Expose store for direct action calls (e.g., undo/redo buttons)
  };
}
