// src/export/toDescription.ts
// Generate human-readable text description of canvas
// Pure function - no side effects

import type { CanvasState, Cell } from "../canvas/types";

/**
 * Color group with cells
 */
interface ColorGroup {
  color: string;
  cells: Cell[];
}

/**
 * Horizontal run of cells
 */
interface HorizontalRun {
  row: number;
  startCol: number;
  endCol: number;
}

/**
 * Vertical run of cells
 */
interface VerticalRun {
  col: number;
  startRow: number;
  endRow: number;
}

/**
 * Groups cells by color
 */
function groupCellsByColor(canvas: CanvasState): ColorGroup[] {
  const groups = new Map<string, Cell[]>();

  canvas.cells.forEach((cell) => {
    const existing = groups.get(cell.color) || [];
    existing.push(cell);
    groups.set(cell.color, existing);
  });

  // Convert to array and sort by color
  const result: ColorGroup[] = [];
  groups.forEach((cells, color) => {
    // Sort cells by row then col
    cells.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    result.push({ color, cells });
  });

  // Sort groups by color for deterministic output
  result.sort((a, b) => a.color.localeCompare(b.color));

  return result;
}

/**
 * Detects horizontal runs in a group of cells
 */
function detectHorizontalRuns(cells: Cell[]): HorizontalRun[] {
  const runs: HorizontalRun[] = [];
  const cellsByRow = new Map<number, number[]>();

  // Group cells by row
  cells.forEach((cell) => {
    const cols = cellsByRow.get(cell.row) || [];
    cols.push(cell.col);
    cellsByRow.set(cell.row, cols);
  });

  // Find runs in each row
  cellsByRow.forEach((cols, row) => {
    cols.sort((a, b) => a - b);

    let startCol = cols[0];
    let endCol = cols[0];

    for (let i = 1; i < cols.length; i++) {
      if (cols[i] === endCol + 1) {
        endCol = cols[i];
      } else {
        if (endCol - startCol >= 2) {
          // Run of 3+ cells
          runs.push({ row, startCol, endCol });
        }
        startCol = cols[i];
        endCol = cols[i];
      }
    }

    // Check final run
    if (endCol - startCol >= 2) {
      runs.push({ row, startCol, endCol });
    }
  });

  return runs;
}

/**
 * Detects vertical runs in a group of cells
 */
function detectVerticalRuns(cells: Cell[]): VerticalRun[] {
  const runs: VerticalRun[] = [];
  const cellsByCol = new Map<number, number[]>();

  // Group cells by column
  cells.forEach((cell) => {
    const rows = cellsByCol.get(cell.col) || [];
    rows.push(cell.row);
    cellsByCol.set(cell.col, rows);
  });

  // Find runs in each column
  cellsByCol.forEach((rows, col) => {
    rows.sort((a, b) => a - b);

    let startRow = rows[0];
    let endRow = rows[0];

    for (let i = 1; i < rows.length; i++) {
      if (rows[i] === endRow + 1) {
        endRow = rows[i];
      } else {
        if (endRow - startRow >= 2) {
          // Run of 3+ cells
          runs.push({ col, startRow, endRow });
        }
        startRow = rows[i];
        endRow = rows[i];
      }
    }

    // Check final run
    if (endRow - startRow >= 2) {
      runs.push({ col, startRow, endRow });
    }
  });

  return runs;
}

/**
 * Formats a color name for readability
 */
function formatColor(color: string): string {
  // Remove # from hex colors
  if (color.startsWith("#")) {
    return color.substring(1).toUpperCase();
  }
  return color;
}

/**
 * Generates description for a color group
 */
function describeColorGroup(group: ColorGroup): string[] {
  const lines: string[] = [];
  const colorName = formatColor(group.color);

  lines.push(`Color: ${colorName} (${group.cells.length} cells)`);

  // Detect horizontal runs
  const hRuns = detectHorizontalRuns(group.cells);
  if (hRuns.length > 0) {
    lines.push("  Horizontal lines:");
    hRuns.forEach((run) => {
      const length = run.endCol - run.startCol + 1;
      lines.push(
        `    Row ${run.row}, columns ${run.startCol} to ${run.endCol} (${length} cells)`
      );
    });
  }

  // Detect vertical runs
  const vRuns = detectVerticalRuns(group.cells);
  if (vRuns.length > 0) {
    lines.push("  Vertical lines:");
    vRuns.forEach((run) => {
      const length = run.endRow - run.startRow + 1;
      lines.push(
        `    Column ${run.col}, rows ${run.startRow} to ${run.endRow} (${length} cells)`
      );
    });
  }

  // List individual cells if there are few or no runs
  if (hRuns.length === 0 && vRuns.length === 0) {
    lines.push("  Individual cells:");
    group.cells.forEach((cell) => {
      lines.push(`    Row ${cell.row}, Column ${cell.col}`);
    });
  }

  return lines;
}

/**
 * Generates human-readable description of canvas
 */
export function canvasToDescription(canvas: CanvasState): string {
  const lines: string[] = [];

  // Header
  lines.push("Canvas Description");
  lines.push("=".repeat(50));
  lines.push(`Dimensions: ${canvas.config.width} columns × ${canvas.config.height} rows`);
  lines.push(`Total cells: ${canvas.config.width * canvas.config.height}`);
  lines.push(`Painted cells: ${canvas.cells.size}`);
  lines.push("");

  // Handle empty canvas
  if (canvas.cells.size === 0) {
    lines.push("Canvas is empty - no painted cells.");
    return lines.join("\n");
  }

  // Group by color
  const groups = groupCellsByColor(canvas);
  lines.push(`Colors used: ${groups.length}`);
  lines.push("");

  // Describe each color group
  groups.forEach((group, index) => {
    if (index > 0) {
      lines.push("");
    }
    const groupLines = describeColorGroup(group);
    lines.push(...groupLines);
  });

  return lines.join("\n");
}

/**
 * Generates a concise one-line summary
 */
export function canvasToSummary(canvas: CanvasState): string {
  if (canvas.cells.size === 0) {
    return "Empty canvas";
  }

  const groups = groupCellsByColor(canvas);
  const colorCount = groups.length;
  const totalCells = canvas.config.width * canvas.config.height;
  const percentage = Math.round((canvas.cells.size / totalCells) * 100);

  return `${canvas.cells.size} cells painted with ${colorCount} ${
    colorCount === 1 ? "color" : "colors"
  } (${percentage}% filled)`;
}
