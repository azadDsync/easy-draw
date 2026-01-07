// src/export/CanvasImageRenderer.tsx
// Component that renders canvas as an image for export
// Used with react-native-view-shot to capture as PNG

import { View } from "react-native";
import type { CanvasState } from "../canvas/types";

interface CanvasImageRendererProps {
  canvas: CanvasState;
  cellSize?: number;
}

export function CanvasImageRenderer({ canvas, cellSize = 100 }: CanvasImageRendererProps) {
  const width = canvas.config.width * cellSize;
  const height = canvas.config.height * cellSize;

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: '#ffffff',
        position: 'relative',
      }}
    >
      {/* Render grid lines */}
      {Array.from({ length: canvas.config.height + 1 }).map((_, row) => (
        <View
          key={`h-${row}`}
          style={{
            position: 'absolute',
            top: row * cellSize,
            left: 0,
            width: width,
            height: 2,
            backgroundColor: '#d1d5db',
          }}
        />
      ))}
      {Array.from({ length: canvas.config.width + 1 }).map((_, col) => (
        <View
          key={`v-${col}`}
          style={{
            position: 'absolute',
            top: 0,
            left: col * cellSize,
            width: 2,
            height: height,
            backgroundColor: '#d1d5db',
          }}
        />
      ))}

      {/* Render painted cells */}
      {Array.from(canvas.cells.values()).map((cell) => (
        <View
          key={`${cell.row}-${cell.col}`}
          style={{
            position: 'absolute',
            top: cell.row * cellSize + 4,
            left: cell.col * cellSize + 4,
            width: cellSize - 8,
            height: cellSize - 8,
            backgroundColor: cell.color,
            borderRadius: 8,
            borderWidth: 3,
            borderColor: '#1f2937',
          }}
        />
      ))}
    </View>
  );
}
