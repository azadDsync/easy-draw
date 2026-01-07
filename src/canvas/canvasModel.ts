// src/canvas/canvasModel.ts
// Core canvas model and utility functions
// Pure functions for canvas state management

import type {
  CanvasState,
  CanvasConfig,
  Position,
  Cell,
  ActionResult,
} from "./types";

/**
 * Creates a new empty canvas with default focus at (0, 0)
 * Validates dimensions are positive integers
 */
export function createCanvas(config: CanvasConfig): CanvasState {
  // Validate dimensions
  if (config.width <= 0 || config.height <= 0) {
    throw new Error("Canvas dimensions must be positive");
  }

  if (!Number.isInteger(config.width) || !Number.isInteger(config.height)) {
    throw new Error("Canvas dimensions must be integers");
  }

  return {
    config,
    focus: { row: 0, col: 0 },
    cells: new Map<string, Cell>(),
  };
}

/**
 * Generates a unique key for cell storage in the sparse map
 * Format: "row,col"
 */
export function getCellKey(position: Position): string {
  return `${position.row},${position.col}`;
}

/**
 * Parses a cell key back into a Position
 * Returns null if key format is invalid
 */
export function parseCellKey(key: string): Position | null {
  const parts = key.split(",");
  if (parts.length !== 2) return null;

  const row = parseInt(parts[0], 10);
  const col = parseInt(parts[1], 10);

  if (isNaN(row) || isNaN(col)) return null;

  return { row, col };
}

/**
 * Checks if a position is within canvas bounds
 */
export function isValidPosition(
  position: Position,
  config: CanvasConfig
): boolean {
  return (
    position.row >= 0 &&
    position.row < config.height &&
    position.col >= 0 &&
    position.col < config.width
  );
}

/**
 * Gets the cell at a specific position
 * Returns null if no cell is painted at that position
 */
export function getCell(
  canvas: CanvasState,
  position: Position
): Cell | null {
  const key = getCellKey(position);
  return canvas.cells.get(key) || null;
}

/**
 * Gets the color at a specific position
 * Returns null if no cell is painted at that position
 */
export function getCellColor(
  canvas: CanvasState,
  position: Position
): string | null {
  const cell = getCell(canvas, position);
  return cell ? cell.color : null;
}

/**
 * Checks if a cell is painted at the given position
 */
export function isCellPainted(
  canvas: CanvasState,
  position: Position
): boolean {
  const key = getCellKey(position);
  return canvas.cells.has(key);
}

/**
 * Gets all painted cells as an array
 * Useful for serialization or iteration
 */
export function getAllCells(canvas: CanvasState): Cell[] {
  return Array.from(canvas.cells.values());
}

/**
 * Gets the total count of painted cells
 */
export function getPaintedCellCount(canvas: CanvasState): number {
  return canvas.cells.size;
}

/**
 * Clears all painted cells from the canvas
 * Focus position remains unchanged
 */
export function clearAllCells(canvas: CanvasState): CanvasState {
  return {
    ...canvas,
    cells: new Map<string, Cell>(),
  };
}

/**
 * Deep clones the cells map for snapshots
 * Necessary for undo/redo to avoid reference issues
 */
export function cloneCellsMap(cells: Map<string, Cell>): Map<string, Cell> {
  const cloned = new Map<string, Cell>();
  cells.forEach((cell, key) => {
    cloned.set(key, { ...cell });
  });
  return cloned;
}

/**
 * Validates a color string
 * Accepts hex colors (#RGB, #RRGGBB) and named colors
 */
export function isValidColor(color: string): boolean {
  if (!color || typeof color !== "string") return false;

  // Check for hex color format
  const hexPattern = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  if (hexPattern.test(color)) return true;

  // Allow common CSS named colors
  const namedColors = [
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "gray",
    "grey",
  ];
  return namedColors.includes(color.toLowerCase());
}
