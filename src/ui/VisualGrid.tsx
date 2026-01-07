// src/ui/VisualGrid.tsx
// Minimal visual representation of canvas grid
// Optional for sighted users, not required for functionality

import { View } from "react-native";
import type { CanvasState } from "../canvas/types";
import { getCellColor } from "../canvas/canvasModel";

interface VisualGridProps {
  canvas: CanvasState;
}

export function VisualGrid({ canvas }: VisualGridProps) {
  const { config, cells, focus } = canvas;
  const cellSize = 32;

  return (
    <View
      style={{
        flexDirection: "column",
        borderWidth: 1,
        borderColor: "#ccc",
      }}
    >
      {Array.from({ length: config.height }).map((_, row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
          }}
        >
          {Array.from({ length: config.width }).map((_, col) => {
            const isFocused = focus.row === row && focus.col === col;
            const color = getCellColor(canvas, { row, col });

            return (
              <View
                key={`${row}-${col}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: color || "#ffffff",
                  borderWidth: isFocused ? 3 : 1,
                  borderColor: isFocused ? "#0000ff" : "#e0e0e0",
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}
