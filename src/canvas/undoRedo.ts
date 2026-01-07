// src/canvas/undoRedo.ts
// Undo/redo functionality using snapshot-based history
// Pure functions for history management

import type {
  CanvasState,
  CanvasSnapshot,
  HistoryState,
  ActionResult,
} from "./types";
import { cloneCellsMap } from "./canvasModel";

/**
 * Default maximum size for undo/redo stacks
 * Prevents unbounded memory growth
 */
const DEFAULT_MAX_HISTORY_SIZE = 50;

/**
 * Creates a new empty history state
 */
export function createHistory(
  maxHistorySize: number = DEFAULT_MAX_HISTORY_SIZE
): HistoryState {
  return {
    undoStack: [],
    redoStack: [],
    maxHistorySize: Math.max(1, maxHistorySize), // Ensure at least 1
  };
}

/**
 * Creates a snapshot of the current canvas state
 * Deep clones the cells map to prevent reference issues
 */
export function createSnapshot(canvas: CanvasState): CanvasSnapshot {
  return {
    focus: { ...canvas.focus },
    cells: cloneCellsMap(canvas.cells),
    timestamp: Date.now(),
  };
}

/**
 * Restores canvas state from a snapshot
 * Returns new canvas state without modifying the snapshot
 */
export function restoreFromSnapshot(
  canvas: CanvasState,
  snapshot: CanvasSnapshot
): CanvasState {
  return {
    ...canvas,
    focus: { ...snapshot.focus },
    cells: cloneCellsMap(snapshot.cells),
  };
}

/**
 * Pushes a snapshot onto the undo stack
 * Maintains maximum stack size by removing oldest entries
 * Clears the redo stack (new action invalidates redo history)
 */
export function pushUndo(
  history: HistoryState,
  snapshot: CanvasSnapshot
): HistoryState {
  const newUndoStack = [...history.undoStack, snapshot];

  // Trim stack if it exceeds maximum size
  const trimmedUndoStack =
    newUndoStack.length > history.maxHistorySize
      ? newUndoStack.slice(newUndoStack.length - history.maxHistorySize)
      : newUndoStack;

  return {
    ...history,
    undoStack: trimmedUndoStack,
    redoStack: [], // Clear redo stack on new action
  };
}

/**
 * Performs an undo operation
 * Moves current state to redo stack and restores previous state from undo stack
 * Returns updated canvas, history, and result
 */
export function undo(
  canvas: CanvasState,
  history: HistoryState
): {
  canvas: CanvasState;
  history: HistoryState;
  result: ActionResult;
} {
  // Check if undo stack is empty
  if (history.undoStack.length === 0) {
    return {
      canvas,
      history,
      result: {
        success: false,
        message: "Nothing to undo",
      },
    };
  }

  // Create snapshot of current state for redo
  const currentSnapshot = createSnapshot(canvas);

  // Pop from undo stack
  const newUndoStack = [...history.undoStack];
  const previousSnapshot = newUndoStack.pop()!;

  // Push current state to redo stack
  const newRedoStack = [...history.redoStack, currentSnapshot];

  // Restore canvas from snapshot
  const restoredCanvas = restoreFromSnapshot(canvas, previousSnapshot);

  return {
    canvas: restoredCanvas,
    history: {
      ...history,
      undoStack: newUndoStack,
      redoStack: newRedoStack,
    },
    result: {
      success: true,
      message: "Undo successful",
      position: { ...restoredCanvas.focus },
    },
  };
}

/**
 * Performs a redo operation
 * Moves state from redo stack back to canvas and updates undo stack
 * Returns updated canvas, history, and result
 */
export function redo(
  canvas: CanvasState,
  history: HistoryState
): {
  canvas: CanvasState;
  history: HistoryState;
  result: ActionResult;
} {
  // Check if redo stack is empty
  if (history.redoStack.length === 0) {
    return {
      canvas,
      history,
      result: {
        success: false,
        message: "Nothing to redo",
      },
    };
  }

  // Create snapshot of current state for undo
  const currentSnapshot = createSnapshot(canvas);

  // Pop from redo stack
  const newRedoStack = [...history.redoStack];
  const nextSnapshot = newRedoStack.pop()!;

  // Push current state to undo stack
  const newUndoStack = [...history.undoStack, currentSnapshot];

  // Trim undo stack if needed
  const trimmedUndoStack =
    newUndoStack.length > history.maxHistorySize
      ? newUndoStack.slice(newUndoStack.length - history.maxHistorySize)
      : newUndoStack;

  // Restore canvas from snapshot
  const restoredCanvas = restoreFromSnapshot(canvas, nextSnapshot);

  return {
    canvas: restoredCanvas,
    history: {
      ...history,
      undoStack: trimmedUndoStack,
      redoStack: newRedoStack,
    },
    result: {
      success: true,
      message: "Redo successful",
      position: { ...restoredCanvas.focus },
    },
  };
}

/**
 * Checks if undo is available
 */
export function canUndo(history: HistoryState): boolean {
  return history.undoStack.length > 0;
}

/**
 * Checks if redo is available
 */
export function canRedo(history: HistoryState): boolean {
  return history.redoStack.length > 0;
}

/**
 * Gets the number of available undo operations
 */
export function getUndoCount(history: HistoryState): number {
  return history.undoStack.length;
}

/**
 * Gets the number of available redo operations
 */
export function getRedoCount(history: HistoryState): number {
  return history.redoStack.length;
}

/**
 * Clears all undo/redo history
 * Use when starting a new canvas or after major operations
 */
export function clearHistory(history: HistoryState): HistoryState {
  return {
    ...history,
    undoStack: [],
    redoStack: [],
  };
}
