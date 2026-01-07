// src/canvas/canvasActions.ts
// Pure action functions for canvas manipulation
// All functions return new state objects (immutable updates)

import type {
  CanvasState,
  Position,
  Direction,
  ActionResult,
  Cell,
} from "./types";
import {
  getCellKey,
  isValidPosition,
  isValidColor,
} from "./canvasModel";

/**
 * Paints a cell at the current focus position with the given color
 * Overwrites existing color if cell is already painted
 * Returns new canvas state and action result
 */
export function paintCell(
  canvas: CanvasState,
  color: string
): { canvas: CanvasState; result: ActionResult } {
  // Validate color
  if (!isValidColor(color)) {
    return {
      canvas,
      result: {
        success: false,
        message: `Invalid color: ${color}`,
      },
    };
  }

  // Create new cell
  const cell: Cell = {
    row: canvas.focus.row,
    col: canvas.focus.col,
    color,
  };

  // Create new cells map with updated cell
  const newCells = new Map(canvas.cells);
  const key = getCellKey(canvas.focus);
  newCells.set(key, cell);

  // Return new canvas state
  return {
    canvas: {
      ...canvas,
      cells: newCells,
    },
    result: {
      success: true,
      message: `Painted cell at (${canvas.focus.row}, ${canvas.focus.col}) with ${color}`,
      position: { ...canvas.focus },
      color,
    },
  };
}

/**
 * Erases the cell at the current focus position
 * Does nothing if cell is not painted
 */
export function eraseCell(
  canvas: CanvasState
): { canvas: CanvasState; result: ActionResult } {
  const key = getCellKey(canvas.focus);

  // Check if cell exists
  if (!canvas.cells.has(key)) {
    return {
      canvas,
      result: {
        success: false,
        message: `No cell to erase at (${canvas.focus.row}, ${canvas.focus.col})`,
        position: { ...canvas.focus },
      },
    };
  }

  // Create new cells map without the erased cell
  const newCells = new Map(canvas.cells);
  newCells.delete(key);

  return {
    canvas: {
      ...canvas,
      cells: newCells,
    },
    result: {
      success: true,
      message: `Erased cell at (${canvas.focus.row}, ${canvas.focus.col})`,
      position: { ...canvas.focus },
    },
  };
}

/**
 * Calculates the new position based on direction
 * Does not modify canvas state - pure calculation
 */
export function calculateNewPosition(
  current: Position,
  direction: Direction
): Position {
  switch (direction) {
    case "up":
      return { row: current.row - 1, col: current.col };
    case "down":
      return { row: current.row + 1, col: current.col };
    case "left":
      return { row: current.row, col: current.col - 1 };
    case "right":
      return { row: current.row, col: current.col + 1 };
    default:
      return current;
  }
}

/**
 * Moves focus in the specified direction
 * Validates boundaries - focus cannot move outside canvas
 * Returns new canvas state and action result
 */
export function moveFocus(
  canvas: CanvasState,
  direction: Direction
): { canvas: CanvasState; result: ActionResult } {
  const newPosition = calculateNewPosition(canvas.focus, direction);

  // Check if new position is valid
  if (!isValidPosition(newPosition, canvas.config)) {
    return {
      canvas,
      result: {
        success: false,
        message: `Cannot move ${direction} - boundary reached`,
        position: { ...canvas.focus },
      },
    };
  }

  // Move focus to new position
  return {
    canvas: {
      ...canvas,
      focus: newPosition,
    },
    result: {
      success: true,
      message: `Moved ${direction} to (${newPosition.row}, ${newPosition.col})`,
      position: newPosition,
    },
  };
}

/**
 * Sets focus to a specific position
 * Validates that position is within canvas bounds
 */
export function setFocus(
  canvas: CanvasState,
  position: Position
): { canvas: CanvasState; result: ActionResult } {
  // Validate position
  if (!isValidPosition(position, canvas.config)) {
    return {
      canvas,
      result: {
        success: false,
        message: `Invalid position: (${position.row}, ${position.col})`,
        position: { ...canvas.focus },
      },
    };
  }

  return {
    canvas: {
      ...canvas,
      focus: { ...position },
    },
    result: {
      success: true,
      message: `Focus set to (${position.row}, ${position.col})`,
      position: { ...position },
    },
  };
}

/**
 * Moves focus to the home position (0, 0)
 */
export function moveFocusToHome(
  canvas: CanvasState
): { canvas: CanvasState; result: ActionResult } {
  return setFocus(canvas, { row: 0, col: 0 });
}

/**
 * Moves focus to the end position (bottom-right corner)
 */
export function moveFocusToEnd(
  canvas: CanvasState
): { canvas: CanvasState; result: ActionResult } {
  const endPosition: Position = {
    row: canvas.config.height - 1,
    col: canvas.config.width - 1,
  };
  return setFocus(canvas, endPosition);
}
