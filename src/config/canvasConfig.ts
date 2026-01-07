// src/config/canvasConfig.ts
// Central configuration for canvas and grid dimensions
// SINGLE SOURCE OF TRUTH: Change grid/canvas sizes here

import { Dimensions, Platform } from 'react-native';

/**
 * Canvas Grid Configuration
 * 
 * Dynamically calculates optimal grid and cell sizes based on device screen
 */

/**
 * Get device screen dimensions
 */
function getScreenDimensions() {
  const { width, height } = Dimensions.get('window');
  return { width, height };
}

/**
 * Determine if device is a tablet
 * Based on screen size and platform
 */
function isTablet(): boolean {
  const { width, height } = getScreenDimensions();
  const minDimension = Math.min(width, height);
  
  // Tablets typically have min dimension > 600px
  if (Platform.OS === 'ios') {
    return minDimension >= 768; // iPad minimum
  }
  return minDimension >= 600; // Android tablet minimum
}

/**
 * Calculate optimal canvas dimensions based on device
 * @returns Grid dimensions (width x height in cells)
 */
export function getCanvasDimensions() {
  const tablet = isTablet();
  const { width, height } = getScreenDimensions();
  
  // Calculate available space (accounting for UI elements)
  const availableWidth = Math.min(width, height) * 0.75; // 75% of shorter dimension
  
  if (tablet) {
    // Tablets: 16x16 to 20x20 grid depending on size
    const gridSize = width > 1024 ? 20 : 16;
    return { width: gridSize, height: gridSize };
  } else {
    // Mobile: 10x10 to 14x14 grid depending on size
    const gridSize = availableWidth > 400 ? 14 : 12;
    return { width: gridSize, height: gridSize };
  }
}

/**
 * Calculate optimal visual cell size based on device
 * @returns Cell size in pixels for on-screen display
 */
export function getVisualCellSize(): number {
  const tablet = isTablet();
  const { width, height } = getScreenDimensions();
  const minDimension = Math.min(width, height);
  
  if (tablet) {
    // Tablets: 45-60px cells
    return minDimension > 1024 ? 60 : 50;
  } else {
    // Mobile: 28-40px cells
    const dimensions = getCanvasDimensions();
    const availableSpace = minDimension * 0.75;
    const calculatedSize = Math.floor(availableSpace / dimensions.width);
    return Math.max(28, Math.min(40, calculatedSize));
  }
}

/**
 * Static canvas dimensions (fallback/default)
 * Used if dynamic calculation fails
 * @default { width: 12, height: 12 } - 12x12 grid
 */
export const CANVAS_DIMENSIONS = getCanvasDimensions();

/**
 * Visual cell size for on-screen grid (in pixels)
 * Dynamically calculated based on device
 */
export const VISUAL_CELL_SIZE = getVisualCellSize();

/**
 * Export cell size for image/PNG export (in pixels)
 * Used in CanvasImageRenderer for high-quality exports
 * @default 100 - Each cell is 100x100 pixels in exported images
 */
export const EXPORT_CELL_SIZE = 100;

/**
 * SVG cell size for SVG export (in pixels)
 * Used in toSVG for vector graphics export
 * @default 20 - Each cell is 20x20 pixels in SVG
 */
export const SVG_CELL_SIZE = 20;

/**
 * Default color for new cells
 * @default "#000000" - Black
 */
export const DEFAULT_COLOR = "#000000";

/**
 * Get device info for debugging
 */
export function getDeviceInfo() {
  const dimensions = getScreenDimensions();
  const tablet = isTablet();
  const canvasDims = getCanvasDimensions();
  const cellSize = getVisualCellSize();
  
  return {
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,
    isTablet: tablet,
    gridSize: `${canvasDims.width}x${canvasDims.height}`,
    cellSize: cellSize,
    platform: Platform.OS,
  };
}
