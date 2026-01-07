// app/canvas.tsx
// Main canvas screen with gesture handling, visual grid, and accessibility features
// Blind-first design with visual feedback as optional enhancement

import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useCanvasStore, AVAILABLE_COLORS } from "../src/store/useCanvasStore";
import { useCallback, useMemo, useEffect, useState, useRef } from "react";
import * as Audio from "../src/feedback/audio";
import * as Haptic from "../src/feedback/haptics";
import { VisualGrid } from "../src/ui/VisualGrid";
import { ActionMenu } from "../src/ui/ActionMenu";
import { GuideModal } from "../src/ui/GuideModal";
import { canvasToSummary } from "../src/export/toDescription";

function getColorName(hex: string): string {
  const colorMap: Record<string, string> = {
    "#000000": "black",
    "#FFFFFF": "white",
    "#FF0000": "red",
    "#00FF00": "green",
    "#0000FF": "blue",
    "#FFFF00": "yellow",
    "#FF00FF": "magenta",
    "#00FFFF": "cyan",
    "#FFA500": "orange",
    "#800080": "purple",
    "#FFC0CB": "pink",
    "#A52A2A": "brown",
  };
  return colorMap[hex] || hex;
}

export default function Canvas() {
  const canvas = useCanvasStore((state) => state.canvas);
  const focusPosition = useCanvasStore((state) => state.focusPosition);
  const selectedColor = useCanvasStore((state) => state.selectedColor);
  const isColorMenuOpen = useCanvasStore((state) => state.isColorMenuOpen);
  const colorMenuIndex = useCanvasStore((state) => state.colorMenuIndex);
  const canUndo = useCanvasStore((state) => state.canUndo);
  const canRedo = useCanvasStore((state) => state.canRedo);
  
  const paintFocusedCell = useCanvasStore((state) => state.paintFocusedCell);
  const eraseFocusedCell = useCanvasStore((state) => state.eraseFocusedCell);
  const moveFocusDirection = useCanvasStore((state) => state.moveFocusDirection);
  const performUndo = useCanvasStore((state) => state.performUndo);
  const performRedo = useCanvasStore((state) => state.performRedo);
  const openColorMenu = useCanvasStore((state) => state.openColorMenu);
  const closeColorMenu = useCanvasStore((state) => state.closeColorMenu);
  const nextColor = useCanvasStore((state) => state.nextColor);
  const prevColor = useCanvasStore((state) => state.prevColor);
  const confirmColor = useCanvasStore((state) => state.confirmColor);
  const getFocusedCellInfo = useCanvasStore((state) => state.getFocusedCellInfo);
  
  const [isEraserMode, setIsEraserMode] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [hasAnnounced, setHasAnnounced] = useState(false);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorMenuReminderRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasAnnounced) {
      setTimeout(() => {
        Audio.speak("Canvas ready. Swipe to move. Tap to inspect. Double tap to paint. Long press for color menu.");
        setHasAnnounced(true);
      }, 500);
    }
  }, [hasAnnounced]);

  useEffect(() => {
    return () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (colorMenuReminderRef.current) {
        clearTimeout(colorMenuReminderRef.current);
      }
    };
  }, []);
  
  const handlePaint = useCallback(() => {
    try {
      if (isEraserMode) {
        const result = eraseFocusedCell();
        if (result.success) {
          Haptic.hapticPaint();
          Audio.speak("Erased");
        } else {
          Haptic.hapticWarning();
          if (result.message) {
            Audio.speak(result.message);
          }
        }
      } else {
        const result = paintFocusedCell();
        if (result.success) {
          Haptic.hapticPaint();
          if (result.position && result.color) {
            const colorName = getColorName(result.color);
            Audio.speak(`Painted ${colorName}`);
          }
        } else {
          Haptic.hapticWarning();
          if (result.message) {
            Audio.speak(result.message);
          }
        }
      }
    } catch (error) {
      console.error("Paint error:", error);
    }
  }, [paintFocusedCell, eraseFocusedCell, isEraserMode]);
  
  const handleMove = useCallback((direction: "up" | "down" | "left" | "right") => {
    try {
      const result = moveFocusDirection(direction);
      if (result.success && result.position) {
        Haptic.hapticFocusMove();
        
        if (speechTimeoutRef.current) {
          clearTimeout(speechTimeoutRef.current);
        }
        
        const position = result.position;
        speechTimeoutRef.current = setTimeout(() => {
          Audio.speak(`Row ${position.row}, column ${position.col}`);
        }, 300);
      } else {
        Haptic.hapticBoundary();
        Audio.speak("Boundary");
      }
    } catch (error) {
      console.error("Move error:", error);
    }
  }, [moveFocusDirection]);
  
  const handleInspect = useCallback(() => {
    try {
      const info = getFocusedCellInfo();
      if (info) {
        Haptic.hapticLight();
        const colorName = info.color ? getColorName(info.color) : "empty";
        Audio.speak(`Row ${info.row}, column ${info.col}, ${colorName}`);
      }
    } catch (error) {
      console.error("Inspect error:", error);
    }
  }, [getFocusedCellInfo]);

  const handleDescribeCanvas = useCallback(() => {
    try {
      Haptic.hapticMedium();
      const summary = canvasToSummary(canvas);
      Audio.speak(summary);
    } catch (error) {
      console.error("Describe error:", error);
    }
  }, [canvas]);
  
  const handleOpenMenu = useCallback(() => {
    try {
      const result = openColorMenu();
      if (result.success) {
        Haptic.hapticMenuOpen();
        const colorName = result.color ? getColorName(result.color) : selectedColor;
        Audio.speak(`Color menu opened. ${colorName}. ${colorMenuIndex + 1} of ${AVAILABLE_COLORS.length}. Swipe left or right to browse colors. Double tap to confirm. Long press to close.`);
        
        // Set reminder after 5 seconds
        if (colorMenuReminderRef.current) {
          clearTimeout(colorMenuReminderRef.current);
        }
        colorMenuReminderRef.current = setTimeout(() => {
          if (isColorMenuOpen) {
            Audio.speak("Color menu mode. Swipe to browse. Double tap to confirm.");
          }
        }, 5000);
      }
    } catch (error) {
      console.error("Menu open error:", error);
    }
  }, [openColorMenu, selectedColor, colorMenuIndex, isColorMenuOpen]);
  
  const handleCloseMenu = useCallback(() => {
    try {
      // Clear reminder timeout
      if (colorMenuReminderRef.current) {
        clearTimeout(colorMenuReminderRef.current);
        colorMenuReminderRef.current = null;
      }
      
      closeColorMenu();
      Haptic.hapticMenuClose();
      Audio.speak("Color menu closed. Canvas gestures restored.");
    } catch (error) {
      console.error("Menu close error:", error);
    }
  }, [closeColorMenu]);
  
  const handleNextColor = useCallback(() => {
    try {
      const result = nextColor();
      if (result.success && result.color) {
        Haptic.hapticColorSelect();
        const colorName = getColorName(result.color);
        const newIndex = (colorMenuIndex + 1) % AVAILABLE_COLORS.length;
        Audio.speak(`${colorName}. ${newIndex + 1} of ${AVAILABLE_COLORS.length}`);
      }
    } catch (error) {
      console.error("Next color error:", error);
    }
  }, [nextColor, colorMenuIndex]);
  
  const handlePrevColor = useCallback(() => {
    try {
      const result = prevColor();
      if (result.success && result.color) {
        Haptic.hapticColorSelect();
        const colorName = getColorName(result.color);
        const newIndex = (colorMenuIndex - 1 + AVAILABLE_COLORS.length) % AVAILABLE_COLORS.length;
        Audio.speak(`${colorName}. ${newIndex + 1} of ${AVAILABLE_COLORS.length}`);
      }
    } catch (error) {
      console.error("Prev color error:", error);
    }
  }, [prevColor, colorMenuIndex]);
  
  const handleConfirmColor = useCallback(() => {
    try {
      const result = confirmColor();
      if (result.success && result.color) {
        Haptic.hapticColorConfirm();
        const colorName = getColorName(result.color);
        Audio.speak(`${colorName} selected`);
      }
    } catch (error) {
      console.error("Confirm color error:", error);
    }
  }, [confirmColor]);

  const handleToggleEraser = useCallback(() => {
    const newMode = !isEraserMode;
    setIsEraserMode(newMode);
    Haptic.hapticMedium();
    Audio.speak(newMode ? "Eraser mode on" : "Eraser mode off");
  }, [isEraserMode]);

  const handleUndo = useCallback(() => {
    try {
      const result = performUndo();
      if (result.success) {
        Haptic.hapticMedium();
        Audio.speak("Undo");
      } else {
        Haptic.hapticWarning();
        Audio.speak("Nothing to undo");
      }
    } catch (error) {
      console.error("Undo error:", error);
    }
  }, [performUndo]);

  const handleRedo = useCallback(() => {
    try {
      const result = performRedo();
      if (result.success) {
        Haptic.hapticMedium();
        Audio.speak("Redo");
      } else {
        Haptic.hapticWarning();
        Audio.speak("Nothing to redo");
      }
    } catch (error) {
      console.error("Redo error:", error);
    }
  }, [performRedo]);

  const handleOpenActions = useCallback(() => {
    setIsActionMenuOpen(true);
    Haptic.hapticMedium();
    setTimeout(() => {
      Audio.speak("Actions menu opened. Canvas gestures disabled. Swipe to browse menu options.");
    }, 100);
  }, []);

  const handleCloseActions = useCallback(() => {
    setIsActionMenuOpen(false);
    Haptic.hapticLight();
    setTimeout(() => {
      Audio.speak("Actions menu closed. Canvas gestures restored.");
    }, 100);
  }, []);

  const handleOpenGuide = useCallback(() => {
    setIsGuideOpen(true);
    Haptic.hapticMedium();
    setTimeout(() => {
      Audio.speak("Guide opened. Swipe to browse instructions.");
    }, 100);
  }, []);

  const handleCloseGuide = useCallback(() => {
    setIsGuideOpen(false);
    Haptic.hapticLight();
    setTimeout(() => {
      Audio.speak("Guide closed. Canvas gestures restored.");
    }, 100);
  }, []);
  
  const panGesture = useMemo(() => Gesture.Pan()
    .onEnd((event) => {
      try {
        const { translationX, translationY } = event;
        const absX = Math.abs(translationX);
        const absY = Math.abs(translationY);
        
        if (isColorMenuOpen) {
          if (absX > absY && absX > 50) {
            if (translationX > 0) {
              handleNextColor();
            } else {
              handlePrevColor();
            }
          }
        } else {
          if (absX > absY && absX > 50) {
            if (translationX > 0) {
              handleMove("right");
            } else {
              handleMove("left");
            }
          } else if (absY > absX && absY > 50) {
            if (translationY > 0) {
              handleMove("down");
            } else {
              handleMove("up");
            }
          }
        }
      } catch (error) {
        console.error("Pan gesture error:", error);
      }
    })
    .runOnJS(true), [isColorMenuOpen, handleMove, handleNextColor, handlePrevColor]);
  
  const tapGesture = useMemo(() => Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(250)
    .onStart(() => {
      try {
        if (!isColorMenuOpen) {
          handleInspect();
        }
      } catch (error) {
        console.error("Tap gesture error:", error);
      }
    })
    .runOnJS(true), [isColorMenuOpen, handleInspect]);
  
  const doubleTapGesture = useMemo(() => Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(300)
    .onStart(() => {
      try {
        if (isColorMenuOpen) {
          handleConfirmColor();
        } else {
          handlePaint();
        }
      } catch (error) {
        console.error("Double tap gesture error:", error);
      }
    })
    .runOnJS(true), [isColorMenuOpen, handleConfirmColor, handlePaint]);
  
  const longPressGesture = useMemo(() => Gesture.LongPress()
    .minDuration(500)
    .onStart(() => {
      try {
        if (isColorMenuOpen) {
          handleCloseMenu();
        } else {
          handleOpenMenu();
        }
      } catch (error) {
        console.error("Long press gesture error:", error);
      }
    })
    .runOnJS(true), [isColorMenuOpen, handleOpenMenu, handleCloseMenu]);
  
  // Context awareness: Use longer long press (2 seconds) as alternative to 3-finger tap
  const contextLongPressGesture = useMemo(() => Gesture.LongPress()
    .minDuration(2000)
    .onStart(() => {
      try {
        const info = getFocusedCellInfo();
        if (info) {
          const colorName = info.color ? getColorName(info.color) : "empty";
          const mode = isEraserMode ? "eraser" : "paint";
          Haptic.hapticMedium();
          Audio.speak(`Context: Canvas at row ${info.row}, column ${info.col}, ${colorName}. Mode: ${mode}. Selected color: ${getColorName(selectedColor)}. ${isColorMenuOpen ? 'Color menu open' : 'Canvas active'}`);
        }
      } catch (error) {
        console.error("Context long press error:", error);
      }
    })
    .runOnJS(true), [getFocusedCellInfo, isEraserMode, selectedColor, isColorMenuOpen]);
  
  const composedGesture = useMemo(() => 
    Gesture.Race(
      Gesture.Exclusive(doubleTapGesture, tapGesture),
      contextLongPressGesture,
      longPressGesture,
      panGesture
    ), [doubleTapGesture, tapGesture, longPressGesture, contextLongPressGesture, panGesture]);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <View 
          className="flex-none bg-gray-100 border-b border-gray-300"
          accessible={true}
          accessibilityRole="toolbar"
          accessibilityLabel="Toolbar with 6 action buttons"
        >
          <View className="flex-row flex-wrap p-2 gap-2">
            <Pressable
              onPress={handleToggleEraser}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isEraserMode ? "Eraser mode on" : "Eraser mode off"}
              accessibilityHint="Double tap to toggle eraser mode"
              className={`px-4 py-2 rounded ${isEraserMode ? 'bg-orange-600' : 'bg-gray-600'}`}
            >
              <Text className="text-white font-semibold">
                {isEraserMode ? "Eraser: ON" : "Eraser: OFF"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleUndo}
              disabled={!canUndo}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Undo"
              accessibilityHint="Double tap to undo last action"
              className={`px-4 py-2 rounded ${canUndo ? 'bg-blue-600' : 'bg-gray-400'}`}
            >
              <Text className="text-white font-semibold">Undo</Text>
            </Pressable>

            <Pressable
              onPress={handleRedo}
              disabled={!canRedo}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Redo"
              accessibilityHint="Double tap to redo last undone action"
              className={`px-4 py-2 rounded ${canRedo ? 'bg-blue-600' : 'bg-gray-400'}`}
            >
              <Text className="text-white font-semibold">Redo</Text>
            </Pressable>

            <Pressable
              onPress={handleDescribeCanvas}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Describe canvas"
              accessibilityHint="Double tap to hear what you have drawn so far"
              className="px-4 py-2 rounded bg-teal-600 active:bg-teal-700"
            >
              <Text className="text-white font-semibold">Describe</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenActions}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Actions menu"
              accessibilityHint="Double tap to open save, load, and share options"
              className="px-4 py-2 rounded bg-purple-600 active:bg-purple-700"
            >
              <Text className="text-white font-semibold">Actions</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenGuide}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Guide"
              accessibilityHint="Double tap to open guide showing all gestures and instructions"
              className="px-4 py-2 rounded bg-indigo-600 active:bg-indigo-700"
            >
              <Text className="text-white font-semibold">Guide</Text>
            </Pressable>
          </View>
        </View>

        <GestureDetector gesture={composedGesture}>
          <View 
            className="flex-1"
            accessible={true}
            accessibilityLabel="Drawing canvas"
            accessibilityHint="Swipe to move, tap to inspect, double tap to paint, long press for color menu, extra long press for context"
          >
            {isColorMenuOpen ? (
              <View className="flex-1 items-center justify-center bg-gray-50">
                <View className="items-center">
                  <Text className="text-gray-800 text-xl font-bold mb-4">
                    Color Menu
                  </Text>
                  <View
                    className="w-32 h-32 rounded-lg mb-4 border-4 border-gray-800"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Text className="text-gray-700 text-lg mb-2">
                    {getColorName(selectedColor)}
                  </Text>
                  <Text className="text-gray-600 text-base mb-6">
                    {colorMenuIndex + 1} of {AVAILABLE_COLORS.length}
                  </Text>
                  <Text className="text-gray-500 text-sm text-center px-8">
                    Swipe left/right to browse colors{"\n"}
                    Double tap to confirm and close{"\n"}
                    Long press to close without changing
                  </Text>
                </View>
              </View>
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-50 p-4">
                <View className="mb-4">
                  <VisualGrid canvas={canvas} />
                </View>
                <View className="items-center">
                  <Text className="text-gray-600 text-base mb-2">
                    Focus: Row {focusPosition.row}, Col {focusPosition.col}
                  </Text>
                  <View
                    className="w-16 h-16 rounded mb-2 border-2 border-gray-400"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <Text className="text-gray-600 text-base mb-4">
                    Color: {getColorName(selectedColor)}
                  </Text>
                  <Text className="text-gray-500 text-xs text-center px-8">
                    Mode: {isEraserMode ? "ERASER" : "PAINT"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </GestureDetector>
      </View>

      <Modal
        visible={isActionMenuOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseActions}
      >
        <SafeAreaView className="flex-1">
          <ActionMenu onClose={handleCloseActions} />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isGuideOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseGuide}
      >
        <SafeAreaView className="flex-1">
          <GuideModal onClose={handleCloseGuide} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

