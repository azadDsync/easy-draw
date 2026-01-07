// src/store/useCanvasStore.ts
// Zustand store for canvas state management
// STRICT RULE: State only, no side effects (speech, haptics, etc.)

import { create } from "zustand";
import type {
  CanvasState,
  Direction,
  ActionResult,
  HistoryState,
} from "../canvas/types";
import { createCanvas } from "../canvas/canvasModel";
import {
  paintCell,
  eraseCell,
  moveFocus,
  setFocus,
  moveFocusToHome,
} from "../canvas/canvasActions";
import {
  createHistory,
  createSnapshot,
  pushUndo,
  undo as undoAction,
  redo as redoAction,
  canUndo,
  canRedo,
} from "../canvas/undoRedo";
import { getCellColor } from "../canvas/canvasModel";

/**
 * Available colors for painting
 */
export const AVAILABLE_COLORS = [
  "#000000", // Black
  "#FFFFFF", // White
  "#FF0000", // Red
  "#00FF00", // Green
  "#0000FF", // Blue
  "#FFFF00", // Yellow
  "#FF00FF", // Magenta
  "#00FFFF", // Cyan
  "#FFA500", // Orange
  "#800080", // Purple
  "#FFC0CB", // Pink
  "#A52A2A", // Brown
];

/**
 * Canvas store state shape
 */
interface CanvasStore {
  // Core state
  canvas: CanvasState;
  history: HistoryState;
  selectedColor: string;
  
  // Color menu state
  isColorMenuOpen: boolean;
  colorMenuIndex: number;
  previousColor: string; // Store color before opening menu for cancel
  
  // Derived state helpers
  focusPosition: { row: number; col: number };
  canUndo: boolean;
  canRedo: boolean;
  
  // Actions
  initializeCanvas: (width: number, height: number) => void;
  setSelectedColor: (color: string) => void;
  moveFocusDirection: (direction: Direction) => ActionResult;
  setFocusPosition: (row: number, col: number) => ActionResult;
  moveFocusHome: () => ActionResult;
  paintFocusedCell: () => ActionResult;
  eraseFocusedCell: () => ActionResult;
  performUndo: () => ActionResult;
  performRedo: () => ActionResult;
  getFocusedCellInfo: () => { row: number; col: number; color: string | null };
  clearCanvas: () => void;
  
  // Color menu actions
  openColorMenu: () => ActionResult;
  closeColorMenu: () => ActionResult;
  nextColor: () => ActionResult;
  prevColor: () => ActionResult;
  confirmColor: () => ActionResult;
}

/**
 * Default canvas configuration
 */
const DEFAULT_CANVAS_WIDTH = 8;
const DEFAULT_CANVAS_HEIGHT = 8;
const DEFAULT_COLOR = "#000000";

/**
 * Canvas store using Zustand
 * All actions return ActionResult for UI feedback
 * No side effects - pure state management only
 */
export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // Initial state
  canvas: createCanvas({
    width: DEFAULT_CANVAS_WIDTH,
    height: DEFAULT_CANVAS_HEIGHT,
  }),
  history: createHistory(),
  selectedColor: DEFAULT_COLOR,
  
  // Color menu state
  isColorMenuOpen: false,
  colorMenuIndex: 0,
  previousColor: DEFAULT_COLOR,
  
  // Derived state
  focusPosition: { row: 0, col: 0 },
  canUndo: false,
  canRedo: false,

  /**
   * Initialize canvas with custom dimensions
   */
  initializeCanvas: (width: number, height: number) => {
    const newCanvas = createCanvas({ width, height });
    const newHistory = createHistory();
    
    set({
      canvas: newCanvas,
      history: newHistory,
      focusPosition: { row: 0, col: 0 },
      canUndo: false,
      canRedo: false,
    });
  },

  /**
   * Set the currently selected color for painting
   */
  setSelectedColor: (color: string) => {
    set({ selectedColor: color });
  },

  /**
   * Move focus in a direction (up, down, left, right)
   * Returns ActionResult indicating success or boundary collision
   * Disabled when color menu is open
   */
  moveFocusDirection: (direction: Direction): ActionResult => {
    const { canvas, isColorMenuOpen } = get();
    
    // Prevent focus movement while color menu is open
    if (isColorMenuOpen) {
      return {
        success: false,
        message: "Cannot move focus while color menu is open",
      };
    }
    
    const { canvas: newCanvas, result } = moveFocus(canvas, direction);
    
    if (result.success) {
      set({
        canvas: newCanvas,
        focusPosition: newCanvas.focus,
      });
    }
    
    return result;
  },

  /**
   * Set focus to a specific position
   */
  setFocusPosition: (row: number, col: number): ActionResult => {
    const { canvas } = get();
    const { canvas: newCanvas, result } = setFocus(canvas, { row, col });
    
    if (result.success) {
      set({
        canvas: newCanvas,
        focusPosition: newCanvas.focus,
      });
    }
    
    return result;
  },

  /**
   * Move focus to home position (0, 0)
   */
  moveFocusHome: (): ActionResult => {
    const { canvas } = get();
    const { canvas: newCanvas, result } = moveFocusToHome(canvas);
    
    set({
      canvas: newCanvas,
      focusPosition: newCanvas.focus,
    });
    
    return result;
  },

  /**
   * Paint the currently focused cell with selected color
   * Saves state to undo stack before painting
   * Fails if color menu is open
   */
  paintFocusedCell: (): ActionResult => {
    const { canvas, history, selectedColor, isColorMenuOpen } = get();
    
    // Prevent painting while color menu is open
    if (isColorMenuOpen) {
      return {
        success: false,
        message: "Cannot paint while color menu is open",
      };
    }
    
    // Create snapshot before painting
    const snapshot = createSnapshot(canvas);
    
    // Paint the cell
    const { canvas: newCanvas, result } = paintCell(canvas, selectedColor);
    
    if (result.success) {
      // Push to undo stack
      const newHistory = pushUndo(history, snapshot);
      
      set({
        canvas: newCanvas,
        history: newHistory,
        canUndo: canUndo(newHistory),
        canRedo: canRedo(newHistory),
      });
    }
    
    return result;
  },

  /**
   * Erase the currently focused cell
   * Saves state to undo stack before erasing
   */
  eraseFocusedCell: (): ActionResult => {
    const { canvas, history } = get();
    
    // Create snapshot before erasing
    const snapshot = createSnapshot(canvas);
    
    // Erase the cell
    const { canvas: newCanvas, result } = eraseCell(canvas);
    
    if (result.success) {
      // Push to undo stack
      const newHistory = pushUndo(history, snapshot);
      
      set({
        canvas: newCanvas,
        history: newHistory,
        canUndo: canUndo(newHistory),
        canRedo: canRedo(newHistory),
      });
    }
    
    return result;
  },

  /**
   * Undo the last action
   */
  performUndo: (): ActionResult => {
    const { canvas, history } = get();
    
    const {
      canvas: newCanvas,
      history: newHistory,
      result,
    } = undoAction(canvas, history);
    
    if (result.success) {
      set({
        canvas: newCanvas,
        history: newHistory,
        focusPosition: newCanvas.focus,
        canUndo: canUndo(newHistory),
        canRedo: canRedo(newHistory),
      });
    }
    
    return result;
  },

  /**
   * Redo the last undone action
   */
  performRedo: (): ActionResult => {
    const { canvas, history } = get();
    
    const {
      canvas: newCanvas,
      history: newHistory,
      result,
    } = redoAction(canvas, history);
    
    if (result.success) {
      set({
        canvas: newCanvas,
        history: newHistory,
        focusPosition: newCanvas.focus,
        canUndo: canUndo(newHistory),
        canRedo: canRedo(newHistory),
      });
    }
    
    return result;
  },

  /**
   * Get information about the currently focused cell
   * Returns position and color (or null if unpainted)
   */
  getFocusedCellInfo: () => {
    const { canvas } = get();
    const color = getCellColor(canvas, canvas.focus);
    
    return {
      row: canvas.focus.row,
      col: canvas.focus.col,
      color,
    };
  },

  /**
   * Clear all painted cells from canvas
   * Saves state to undo stack before clearing
   */
  clearCanvas: () => {
    const { canvas, history } = get();
    
    // Create snapshot before clearing
    const snapshot = createSnapshot(canvas);
    
    // Clear all cells
    const newCanvas = {
      ...canvas,
      cells: new Map(),
    };
    
    // Push to undo stack
    const newHistory = pushUndo(history, snapshot);
    
    set({
      canvas: newCanvas,
      history: newHistory,
      canUndo: canUndo(newHistory),
      canRedo: canRedo(newHistory),
    });
  },

  /**
   * Open color menu
   * Stores current color for cancel functionality
   */
  openColorMenu: (): ActionResult => {
    const { selectedColor, isColorMenuOpen } = get();
    
    if (isColorMenuOpen) {
      return {
        success: false,
        message: "Color menu is already open",
      };
    }
    
    // Find current color index
    const currentIndex = AVAILABLE_COLORS.indexOf(selectedColor);
    const menuIndex = currentIndex >= 0 ? currentIndex : 0;
    
    set({
      isColorMenuOpen: true,
      colorMenuIndex: menuIndex,
      previousColor: selectedColor,
    });
    
    return {
      success: true,
      message: `Color menu opened at ${AVAILABLE_COLORS[menuIndex]}`,
      color: AVAILABLE_COLORS[menuIndex],
    };
  },

  /**
   * Close color menu without changing color
   * Restores previous color selection
   */
  closeColorMenu: (): ActionResult => {
    const { isColorMenuOpen, previousColor } = get();
    
    if (!isColorMenuOpen) {
      return {
        success: false,
        message: "Color menu is not open",
      };
    }
    
    set({
      isColorMenuOpen: false,
      selectedColor: previousColor,
    });
    
    return {
      success: true,
      message: `Color menu closed, restored color ${previousColor}`,
      color: previousColor,
    };
  },

  /**
   * Navigate to next color in menu
   * Wraps around to beginning
   */
  nextColor: (): ActionResult => {
    const { isColorMenuOpen, colorMenuIndex } = get();
    
    if (!isColorMenuOpen) {
      return {
        success: false,
        message: "Color menu is not open",
      };
    }
    
    const newIndex = (colorMenuIndex + 1) % AVAILABLE_COLORS.length;
    const newColor = AVAILABLE_COLORS[newIndex];
    
    set({
      colorMenuIndex: newIndex,
      selectedColor: newColor,
    });
    
    return {
      success: true,
      message: `Selected ${newColor}`,
      color: newColor,
    };
  },

  /**
   * Navigate to previous color in menu
   * Wraps around to end
   */
  prevColor: (): ActionResult => {
    const { isColorMenuOpen, colorMenuIndex } = get();
    
    if (!isColorMenuOpen) {
      return {
        success: false,
        message: "Color menu is not open",
      };
    }
    
    const newIndex = (colorMenuIndex - 1 + AVAILABLE_COLORS.length) % AVAILABLE_COLORS.length;
    const newColor = AVAILABLE_COLORS[newIndex];
    
    set({
      colorMenuIndex: newIndex,
      selectedColor: newColor,
    });
    
    return {
      success: true,
      message: `Selected ${newColor}`,
      color: newColor,
    };
  },

  /**
   * Confirm color selection and close menu
   */
  confirmColor: (): ActionResult => {
    const { isColorMenuOpen, selectedColor } = get();
    
    if (!isColorMenuOpen) {
      return {
        success: false,
        message: "Color menu is not open",
      };
    }
    
    set({
      isColorMenuOpen: false,
      previousColor: selectedColor,
    });
    
    return {
      success: true,
      message: `Confirmed color ${selectedColor}`,
      color: selectedColor,
    };
  },
}));
