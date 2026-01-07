// src/storage/canvasStorage.ts
// Canvas persistence using AsyncStorage
// Handles saving and loading multiple named canvas states

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CanvasState } from "../canvas/types";
import { createCanvas } from "../canvas/canvasModel";

/**
 * Storage key prefix for canvas data
 */
const CANVAS_STORAGE_PREFIX = "@easy-draw:canvas:";
const CANVAS_LIST_KEY = "@easy-draw:canvas-list";

/**
 * Storage version for migration support
 */
const STORAGE_VERSION = 1;

/**
 * Saved canvas format
 */
interface SavedCanvas {
  id: string;
  name: string;
  version: number;
  timestamp: number;
  canvas: {
    width: number;
    height: number;
    focus: { row: number; col: number };
    cells: Array<{ row: number; col: number; color: string }>;
  };
}

/**
 * Canvas list item
 */
export interface CanvasListItem {
  id: string;
  name: string;
  timestamp: number;
  cellCount: number;
}

/**
 * Result of storage operation
 */
interface StorageResult {
  success: boolean;
  message?: string;
  canvas?: CanvasState;
  canvasList?: CanvasListItem[];
}

/**
 * Converts canvas state to serializable format
 */
function canvasToSaved(canvas: CanvasState, name: string, id?: string): SavedCanvas {
  const cellsArray = Array.from(canvas.cells.values()).map((cell) => ({
    row: cell.row,
    col: cell.col,
    color: cell.color,
  }));

  cellsArray.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return {
    id: id || Date.now().toString(),
    name,
    version: STORAGE_VERSION,
    timestamp: Date.now(),
    canvas: {
      width: canvas.config.width,
      height: canvas.config.height,
      focus: { ...canvas.focus },
      cells: cellsArray,
    },
  };
}

/**
 * Converts saved format back to canvas state
 */
function savedToCanvas(saved: SavedCanvas): CanvasState {
  const canvas = createCanvas({
    width: saved.canvas.width,
    height: saved.canvas.height,
  });

  canvas.focus = { ...saved.canvas.focus };

  saved.canvas.cells.forEach((cell) => {
    const key = `${cell.row},${cell.col}`;
    canvas.cells.set(key, {
      row: cell.row,
      col: cell.col,
      color: cell.color,
    });
  });

  return canvas;
}

/**
 * Validates saved canvas data
 */
function validateSavedCanvas(data: any): data is SavedCanvas {
  if (!data || typeof data !== "object") return false;
  if (typeof data.id !== "string") return false;
  if (typeof data.name !== "string") return false;
  if (typeof data.version !== "number") return false;
  if (typeof data.timestamp !== "number") return false;
  if (!data.canvas || typeof data.canvas !== "object") return false;

  const { canvas } = data;
  if (typeof canvas.width !== "number" || canvas.width <= 0) return false;
  if (typeof canvas.height !== "number" || canvas.height <= 0) return false;
  if (!canvas.focus || typeof canvas.focus !== "object") return false;
  if (typeof canvas.focus.row !== "number") return false;
  if (typeof canvas.focus.col !== "number") return false;
  if (!Array.isArray(canvas.cells)) return false;

  for (const cell of canvas.cells) {
    if (!cell || typeof cell !== "object") return false;
    if (typeof cell.row !== "number") return false;
    if (typeof cell.col !== "number") return false;
    if (typeof cell.color !== "string") return false;
  }

  return true;
}

/**
 * Gets list of saved canvases
 */
async function getCanvasList(): Promise<CanvasListItem[]> {
  try {
    const json = await AsyncStorage.getItem(CANVAS_LIST_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    return [];
  }
}

/**
 * Updates canvas list
 */
async function updateCanvasList(list: CanvasListItem[]): Promise<void> {
  await AsyncStorage.setItem(CANVAS_LIST_KEY, JSON.stringify(list));
}

/**
 * Saves canvas to AsyncStorage with name
 */
export async function saveCanvas(
  canvas: CanvasState,
  name?: string
): Promise<StorageResult> {
  try {
    const canvasName = name || `Untitled ${new Date().toLocaleString()}`;
    const id = Date.now().toString();
    const saved = canvasToSaved(canvas, canvasName, id);
    
    const key = `${CANVAS_STORAGE_PREFIX}${id}`;
    await AsyncStorage.setItem(key, JSON.stringify(saved));

    const list = await getCanvasList();
    list.unshift({
      id,
      name: canvasName,
      timestamp: saved.timestamp,
      cellCount: saved.canvas.cells.length,
    });
    await updateCanvasList(list);

    return {
      success: true,
      message: "Canvas saved successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to save canvas: ${error}`,
    };
  }
}

/**
 * Loads canvas by ID
 */
export async function loadCanvas(id: string): Promise<StorageResult> {
  try {
    const key = `${CANVAS_STORAGE_PREFIX}${id}`;
    const json = await AsyncStorage.getItem(key);

    if (!json) {
      return {
        success: false,
        message: "Canvas not found",
      };
    }

    const data = JSON.parse(json);

    if (!validateSavedCanvas(data)) {
      return {
        success: false,
        message: "Invalid canvas data",
      };
    }

    if (data.version > STORAGE_VERSION) {
      return {
        success: false,
        message: "Canvas saved with newer version",
      };
    }

    const canvas = savedToCanvas(data);

    return {
      success: true,
      message: "Canvas loaded successfully",
      canvas,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to load canvas: ${error}`,
    };
  }
}

/**
 * Gets all saved canvases list
 */
export async function getSavedCanvases(): Promise<StorageResult> {
  try {
    const list = await getCanvasList();
    return {
      success: true,
      canvasList: list,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get canvas list: ${error}`,
    };
  }
}

/**
 * Deletes a saved canvas
 */
export async function deleteCanvas(id: string): Promise<StorageResult> {
  try {
    const key = `${CANVAS_STORAGE_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);

    const list = await getCanvasList();
    const updatedList = list.filter((item) => item.id !== id);
    await updateCanvasList(updatedList);

    return {
      success: true,
      message: "Canvas deleted",
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to delete canvas: ${error}`,
    };
  }
}

/**
 * Checks if any saved canvases exist
 */
export async function hasSavedCanvas(): Promise<boolean> {
  try {
    const list = await getCanvasList();
    return list.length > 0;
  } catch (error) {
    return false;
  }
}
