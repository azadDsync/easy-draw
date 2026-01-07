// src/canvas/types.ts
// Core TypeScript types for the logical canvas system
// Framework-agnostic - no React, no UI dependencies

/**
 * Represents a single cell in the grid with its color
 */
export interface Cell {
  row: number;
  col: number;
  color: string; // Hex color code or color name
}

/**
 * Position in the 2D grid
 */
export interface Position {
  row: number;
  col: number;
}

/**
 * Canvas configuration and dimensions
 */
export interface CanvasConfig {
  width: number; // Number of columns
  height: number; // Number of rows
}

/**
 * Complete canvas state
 * Uses sparse storage - only painted cells are stored
 */
export interface CanvasState {
  config: CanvasConfig;
  focus: Position; // Current focus position for navigation
  cells: Map<string, Cell>; // Key format: "row,col"
}

/**
 * Direction for focus movement
 */
export type Direction = "up" | "down" | "left" | "right";

/**
 * Result of an action with success status and optional message
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  position?: Position; // Useful for move actions
  color?: string; // Useful for paint actions
}

/**
 * Snapshot of canvas state for undo/redo
 */
export interface CanvasSnapshot {
  focus: Position;
  cells: Map<string, Cell>; // Deep copy of cells map
  timestamp: number;
}

/**
 * Undo/redo history state
 */
export interface HistoryState {
  undoStack: CanvasSnapshot[];
  redoStack: CanvasSnapshot[];
  maxHistorySize: number;
}
