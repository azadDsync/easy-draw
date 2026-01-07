// src/export/toJSON.ts
// Export canvas to JSON format
// Pure function - no side effects

import type { CanvasState } from "../canvas/types";

/**
 * Exported canvas format (canonical)
 */
export interface ExportedCanvas {
  version: number;
  exportedAt: number;
  canvas: {
    width: number;
    height: number;
    cells: Array<{
      row: number;
      col: number;
      color: string;
    }>;
  };
}

/**
 * Export version
 */
const EXPORT_VERSION = 1;

/**
 * Converts canvas state to exportable JSON format
 * Excludes focus position and other UI-only state
 */
export function canvasToJSON(canvas: CanvasState): ExportedCanvas {
  // Convert cells Map to array
  const cellsArray = Array.from(canvas.cells.values()).map((cell) => ({
    row: cell.row,
    col: cell.col,
    color: cell.color,
  }));

  // Sort cells deterministically by row then col
  cellsArray.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    canvas: {
      width: canvas.config.width,
      height: canvas.config.height,
      cells: cellsArray,
    },
  };
}

/**
 * Converts canvas to JSON string
 */
export function canvasToJSONString(canvas: CanvasState, pretty: boolean = false): string {
  const exported = canvasToJSON(canvas);
  return JSON.stringify(exported, null, pretty ? 2 : undefined);
}

/**
 * Gets export statistics
 */
export function getExportStats(canvas: CanvasState): {
  totalCells: number;
  paintedCells: number;
  emptyPercentage: number;
  colorCount: number;
  colors: string[];
} {
  const totalCells = canvas.config.width * canvas.config.height;
  const paintedCells = canvas.cells.size;
  const emptyPercentage = ((totalCells - paintedCells) / totalCells) * 100;

  // Get unique colors
  const colorsSet = new Set<string>();
  canvas.cells.forEach((cell) => {
    colorsSet.add(cell.color);
  });
  const colors = Array.from(colorsSet).sort();

  return {
    totalCells,
    paintedCells,
    emptyPercentage: Math.round(emptyPercentage * 100) / 100,
    colorCount: colors.length,
    colors,
  };
}
