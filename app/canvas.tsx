// app/canvas.tsx
// Main canvas screen with gesture handling, visual grid, and accessibility features
// Blind-first design with visual feedback as optional enhancement

import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
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
import { getDeviceInfo } from "../src/config/canvasConfig";

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
  const [showDeviceInfo, setShowDeviceInfo] = useState(false);
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorMenuReminderRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const deviceInfo = useMemo(() => getDeviceInfo(), []);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.mainView}>
        <View 
          style={styles.toolbar}
          accessible={true}
          accessibilityRole="toolbar"
          accessibilityLabel="Toolbar with 6 action buttons"
        >
          <View style={styles.toolbarButtons}>
            <Pressable
              onPress={handleToggleEraser}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isEraserMode ? "Eraser mode on" : "Eraser mode off"}
              accessibilityHint="Double tap to toggle eraser mode"
              style={[styles.toolbarButton, isEraserMode ? styles.eraserButton : styles.defaultButton]}
            >
              <Text style={styles.buttonText}>
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
              style={[styles.toolbarButton, canUndo ? styles.activeButton : styles.disabledButton]}
            >
              <Text style={canUndo ? styles.buttonText : styles.disabledButtonText}>Undo</Text>
            </Pressable>

            <Pressable
              onPress={handleRedo}
              disabled={!canRedo}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Redo"
              accessibilityHint="Double tap to redo last undone action"
              style={[styles.toolbarButton, canRedo ? styles.activeButton : styles.disabledButton]}
            >
              <Text style={canRedo ? styles.buttonText : styles.disabledButtonText}>Redo</Text>
            </Pressable>

            <Pressable
              onPress={handleDescribeCanvas}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Describe canvas"
              accessibilityHint="Double tap to hear what you have drawn so far"
              style={[styles.toolbarButton, styles.defaultButton]}
            >
              <Text style={styles.buttonText}>Describe</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenActions}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Actions menu"
              accessibilityHint="Double tap to open save, load, and share options"
              style={[styles.toolbarButton, styles.defaultButton]}
            >
              <Text style={styles.buttonText}>Actions</Text>
            </Pressable>

            <Pressable
              onPress={handleOpenGuide}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Guide"
              accessibilityHint="Double tap to open guide showing all gestures and instructions"
              style={[styles.toolbarButton, styles.defaultButton]}
            >
              <Text style={styles.buttonText}>Guide</Text>
            </Pressable>
          </View>
        </View>

        <GestureDetector gesture={composedGesture}>
          <View 
            style={styles.canvasArea}
            accessible={true}
            accessibilityLabel="Drawing canvas"
            accessibilityHint="Swipe to move, tap to inspect, double tap to paint, long press for color menu, extra long press for context"
          >
            {isColorMenuOpen ? (
              <View style={styles.colorMenuContainer}>
                <View style={styles.colorMenuContent}>
                  <Text style={styles.colorMenuTitle}>
                    Color Menu
                  </Text>
                  <View
                    style={[styles.colorPreview, { backgroundColor: selectedColor }]}
                  />
                  <Text style={styles.colorName}>
                    {getColorName(selectedColor)}
                  </Text>
                  <Text style={styles.colorCounter}>
                    {colorMenuIndex + 1} of {AVAILABLE_COLORS.length}
                  </Text>
                  <Text style={styles.colorMenuInstructions}>
                    Swipe left/right to browse colors{"\n"}
                    Double tap to confirm and close{"\n"}
                    Long press to close without changing
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.canvasContainer}>
                <View style={styles.gridWrapper}>
                  <VisualGrid canvas={canvas} />
                </View>
                
                {/* Device Info Toggle */}
                <Pressable
                  onPress={() => setShowDeviceInfo(!showDeviceInfo)}
                  style={styles.deviceInfoToggle}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Device info"
                  accessibilityHint="Double tap to show device and grid information"
                >
                  <Text style={styles.deviceInfoToggleText}>ℹ️</Text>
                </Pressable>
                
                {showDeviceInfo && (
                  <View style={styles.deviceInfoContainer}>
                    <Text style={styles.deviceInfoTitle}>Dynamic Grid Config</Text>
                    <Text style={styles.deviceInfoText}>Device: {deviceInfo.isTablet ? 'Tablet' : 'Mobile'}</Text>
                    <Text style={styles.deviceInfoText}>Screen: {Math.round(deviceInfo.screenWidth)}x{Math.round(deviceInfo.screenHeight)}</Text>
                    <Text style={styles.deviceInfoText}>Grid: {deviceInfo.gridSize}</Text>
                    <Text style={styles.deviceInfoText}>Cell Size: {deviceInfo.cellSize}px</Text>
                    <Text style={styles.deviceInfoText}>Platform: {deviceInfo.platform}</Text>
                  </View>
                )}
                <View style={styles.canvasInfo}>
                  <Text style={styles.focusText}>
                    Focus: Row {focusPosition.row}, Col {focusPosition.col}
                  </Text>
                  <View
                    style={[styles.selectedColorBox, { backgroundColor: selectedColor }]}
                  />
                  <Text style={styles.selectedColorName}>
                    {getColorName(selectedColor)}
                  </Text>
                  <Text style={styles.modeText}>
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
        <SafeAreaView style={styles.modalContainer}>
          <ActionMenu onClose={handleCloseActions} />
        </SafeAreaView>
      </Modal>

      <Modal
        visible={isGuideOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseGuide}
      >
        <SafeAreaView style={styles.modalContainer}>
          <GuideModal onClose={handleCloseGuide} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  mainView: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  
  // Toolbar
  toolbar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
  },
  toolbarButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  toolbarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  defaultButton: {
    backgroundColor: '#3F3F46',
  },
  primaryButton: {
    backgroundColor: '#18181B',
  },
  activeButton: {
    backgroundColor: '#2563EB',
  },
  eraserButton: {
    backgroundColor: '#DC2626',
  },
  disabledButton: {
    backgroundColor: '#D4D4D8',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  disabledButtonText: {
    color: '#71717A',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Canvas Area
  canvasArea: {
    flex: 1,
  },
  
  // Color Menu
  colorMenuContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  colorMenuContent: {
    alignItems: 'center',
  },
  colorMenuTitle: {
    color: '#18181B',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  colorPreview: {
    width: 160,
    height: 160,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 4,
    borderColor: '#18181B',
  },
  colorName: {
    color: '#18181B',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  colorCounter: {
    color: '#52525B',
    fontSize: 18,
    marginBottom: 32,
  },
  colorMenuInstructions: {
    color: '#71717A',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  
  // Canvas Container
  canvasContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    padding: 24,
  },
  gridWrapper: {
    marginBottom: 24,
  },
  canvasInfo: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  focusText: {
    color: '#52525B',
    fontSize: 14,
    marginBottom: 12,
  },
  selectedColorBox: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#A1A1AA',
  },
  selectedColorName: {
    color: '#3F3F46',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  modeText: {
    color: '#71717A',
    fontSize: 12,
  },
  
  // Device Info Styles
  deviceInfoToggle: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  deviceInfoToggleText: {
    fontSize: 18,
  },
  deviceInfoContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#18181B',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
    zIndex: 10,
  },
  deviceInfoTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  deviceInfoText: {
    color: '#E4E4E7',
    fontSize: 12,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});