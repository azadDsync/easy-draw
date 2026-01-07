// src/ui/VisualGrid.tsx
// Minimal visual representation of canvas grid
// Optional for sighted users, not required for functionality

import { View, StyleSheet } from "react-native";
import type { CanvasState } from "../canvas/types";
import { getCellColor } from "../canvas/canvasModel";
import { VISUAL_CELL_SIZE } from "../config/canvasConfig";

interface VisualGridProps {
  canvas: CanvasState;
}

export function VisualGrid({ canvas }: VisualGridProps) {
  const { config, cells, focus } = canvas;
  const cellSize = VISUAL_CELL_SIZE;

  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: config.height }).map((_, row) => (
        <View
          key={row}
          style={styles.row}
        >
          {Array.from({ length: config.width }).map((_, col) => {
            const isFocused = focus.row === row && focus.col === col;
            const color = getCellColor(canvas, { row, col });

            return (
              <View
                key={`${row}-${col}`}
                style={[
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: color || '#FFFFFF',
                  },
                  isFocused ? styles.focusedCell : styles.normalCell,
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'column',
    borderWidth: 2,
    borderColor: '#D4D4D8',
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.5,
    borderColor: '#E4E4E7',
  },
  normalCell: {
    borderWidth: 0.5,
    borderColor: '#E4E4E7',
  },
  focusedCell: {
    borderWidth: 2,
    borderColor: '#2563EB',
  },
});
