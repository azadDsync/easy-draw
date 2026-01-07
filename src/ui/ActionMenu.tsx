// src/ui/ActionMenu.tsx
// Action menu for save/load/export/clear operations
// Fully accessible with speech and haptics

import { View, Pressable, Text, Alert, Share, TextInput, ScrollView, StyleSheet } from "react-native";
import { useCanvasStore } from "../store/useCanvasStore";
import { EXPORT_CELL_SIZE } from "../config/canvasConfig";
import { canvasToDescription, canvasToSummary } from "../export/toDescription";
import { canvasToSVG } from "../export/toSVG";
import { shareCanvasAsImage, getImageDescription } from "../export/toImage";
import { CanvasImageRenderer } from "../export/CanvasImageRenderer";
import * as Audio from "../feedback/audio";
import * as Haptic from "../feedback/haptics";
import {
  saveCanvas,
  loadCanvas,
  getSavedCanvases,
  deleteCanvas,
  hasSavedCanvas,
  type CanvasListItem,
} from "../storage/canvasStorage";
import { useState, useEffect, useRef } from "react";

interface ActionMenuProps {
  onClose: () => void;
}

export function ActionMenu({ onClose }: ActionMenuProps) {
  const canvas = useCanvasStore((state) => state.canvas);
  const clearCanvas = useCanvasStore((state) => state.clearCanvas);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [savedCanvases, setSavedCanvases] = useState<CanvasListItem[]>([]);
  const imageViewRef = useRef(null);

  useEffect(() => {
    loadSavedCanvasesList();
  }, []);

  const loadSavedCanvasesList = async () => {
    const result = await getSavedCanvases();
    if (result.success && result.canvasList) {
      setSavedCanvases(result.canvasList);
    }
  };

  const handleSavePrompt = () => {
    if (canvas.cells.size === 0) {
      Haptic.hapticWarning();
      Audio.speak("Cannot save empty canvas. Paint some cells first");
      return;
    }
    
    setShowSaveDialog(true);
    Haptic.hapticLight();
    Audio.speak("Enter canvas name");
  };

  const handleSave = async () => {
    if (canvas.cells.size === 0) {
      Haptic.hapticWarning();
      Audio.speak("Cannot save empty canvas");
      setIsProcessing(false);
      return;
    }

    try {
      setIsProcessing(true);
      Haptic.hapticMedium();
      Audio.speak("Saving canvas");

      await saveCanvas(canvas, saveName || undefined);
      await loadSavedCanvasesList();

      Haptic.hapticSuccess();
      Audio.speak("Canvas saved successfully");
      setShowSaveDialog(false);
      setSaveName("");
    } catch (error) {
      Haptic.hapticError();
      Audio.speak("Failed to save canvas");
      console.error("Save error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadPrompt = async () => {
    Haptic.hapticLight();
    Audio.speak("Loading canvas list");
    await loadSavedCanvasesList();
    
    const result = await getSavedCanvases();
    const currentList = result.success && result.canvasList ? result.canvasList : [];
    
    if (currentList.length === 0) {
      Haptic.hapticWarning();
      Audio.speak("No saved canvases found");
      return;
    }
    setShowLoadDialog(true);
    Audio.speak(`${currentList.length} saved ${currentList.length === 1 ? 'canvas' : 'canvases'} available. Swipe to browse. Double tap to load. Long press to delete`);
  };

  const loadCanvasById = async (id: string, name: string) => {
    try {
      setIsProcessing(true);
      Haptic.hapticMedium();
      Audio.speak(`Loading ${name}`);

      const result = await loadCanvas(id);
      if (!result.success || !result.canvas) {
        Haptic.hapticError();
        Audio.speak(result.message || "Failed to load canvas");
        setIsProcessing(false);
        return;
      }

      const loadedCanvas = result.canvas;

      useCanvasStore.setState({
        canvas: loadedCanvas,
        focusPosition: loadedCanvas.focus,
        canUndo: false,
        canRedo: false,
      });

      await loadSavedCanvasesList();
      Haptic.hapticSuccess();
      Audio.speak("Canvas loaded successfully");
      setShowLoadDialog(false);
      onClose();
    } catch (error) {
      Haptic.hapticError();
      Audio.speak("Failed to load canvas");
      console.error("Load error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoad = (id: string, name: string) => {
    const currentCanvas = canvas;
    const hasPaintedCells = currentCanvas.cells.size > 0;

    if (hasPaintedCells) {
      Alert.alert(
        "Existing Canvas",
        "You have an unsaved canvas with painted cells. What would you like to do?",
        [
          {
            text: "Cancel",
            onPress: () => {
              Haptic.hapticLight();
              Audio.speak("Load cancelled");
            },
            style: "cancel",
          },
          {
            text: "Save Current",
            onPress: async () => {
              Haptic.hapticMedium();
              Audio.speak("Opening save dialog");
              setShowLoadDialog(false);
              setShowSaveDialog(true);
            },
          },
          {
            text: "Overwrite",
            onPress: () => {
              Haptic.hapticHeavy();
              Audio.speak("Overwriting current canvas");
              loadCanvasById(id, name);
            },
            style: "destructive",
          },
        ],
        { cancelable: true }
      );
    } else {
      loadCanvasById(id, name);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    Alert.alert(
      "Delete Canvas",
      `Delete "${name}"?`,
      [
        {
          text: "Cancel",
          onPress: () => {
            Haptic.hapticLight();
            Audio.speak("Delete cancelled");
          },
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              Haptic.hapticHeavy();
              Audio.speak(`Deleting ${name}`);
              await deleteCanvas(id);
              await loadSavedCanvasesList();
              
              const result = await getSavedCanvases();
              const remaining = result.success && result.canvasList ? result.canvasList.length : 0;
              
              if (remaining === 0) {
                Audio.speak("Canvas deleted. No more saved canvases");
                setShowLoadDialog(false);
              } else {
                Audio.speak(`Canvas deleted. ${remaining} ${remaining === 1 ? 'canvas' : 'canvases'} remaining`);
              }
            } catch (error) {
              Haptic.hapticError();
              Audio.speak("Failed to delete canvas");
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleClear = () => {
    Alert.alert(
      "Clear Canvas",
      "This will remove all painted cells. You can undo this action. Continue?",
      [
        {
          text: "Cancel",
          onPress: () => {
            Haptic.hapticLight();
            Audio.speak("Clear cancelled");
          },
          style: "cancel",
        },
        {
          text: "Clear",
          onPress: () => {
            Haptic.hapticHeavy();
            clearCanvas();
            Audio.speak("Canvas cleared");
            onClose();
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  const handleShareDescription = async () => {
    try {
      setIsProcessing(true);
      Haptic.hapticMedium();
      Audio.speak("Generating text description");

      const description = canvasToDescription(canvas);

      await Share.share({
        message: description,
        title: "Canvas Description",
      });

      Haptic.hapticSuccess();
      Audio.speak("Description ready to share");
    } catch (error) {
      Haptic.hapticError();
      Audio.speak("Failed to generate description");
      console.error("Export description error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareSVG = async () => {
    try {
      setIsProcessing(true);
      Haptic.hapticMedium();
      Audio.speak("Generating S V G image");

      const svg = canvasToSVG(canvas);

      await Share.share({
        message: svg,
        title: "Canvas SVG",
      });

      Haptic.hapticSuccess();
      Audio.speak("S V G ready to share");
    } catch (error) {
      Haptic.hapticError();
      Audio.speak("Failed to generate S V G");
      console.error("Export SVG error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareImage = async () => {
    try {
      setIsProcessing(true);
      Haptic.hapticMedium();
      Audio.speak("Generating image for sighted users");

      const result = await shareCanvasAsImage(imageViewRef, canvas);

      if (result.success) {
        Haptic.hapticSuccess();
        Audio.speak("Image ready to share");
      } else {
        Haptic.hapticError();
        Audio.speak(result.message || "Failed to share image");
      }
    } catch (error) {
      Haptic.hapticError();
      Audio.speak("Failed to generate image");
      console.error("Export image error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSaveDialog) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Save Canvas</Text>
        </View>

        <View style={styles.content}>
          <Text
            style={styles.instructionText}
            accessible={true}
            accessibilityRole="text"
          >
            Enter a name for your canvas or leave blank for auto-generated name:
          </Text>
          <TextInput
            value={saveName}
            onChangeText={setSaveName}
            placeholder="Canvas name (optional)"
            accessible={true}
            accessibilityLabel="Canvas name"
            accessibilityHint="Enter a name for your canvas"
            style={styles.textInput}
          />

          <Pressable
            onPress={handleSave}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Save canvas"
            accessibilityHint="Double tap to save with entered name"
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {isProcessing ? "Saving..." : "Save"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setShowSaveDialog(false);
              setSaveName("");
              Haptic.hapticLight();
              Audio.speak("Cancelled");
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            accessibilityHint="Double tap to cancel save"
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showLoadDialog) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Saved Canvases ({savedCanvases.length})
          </Text>
        </View>

        <ScrollView style={styles.scrollContent}>
          {savedCanvases.length === 0 ? (
            <View style={styles.emptyState}>
              <Text 
                style={styles.emptyStateText}
                accessible={true}
                accessibilityRole="text"
              >
                No saved canvases yet. Create your first drawing and save it from the actions menu.
              </Text>
            </View>
          ) : (
            savedCanvases.map((item, index) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (!isProcessing) {
                    Haptic.hapticMedium();
                    Audio.speak(`Loading ${item.name}`);
                    handleLoad(item.id, item.name);
                  }
                }}
                onLongPress={() => {
                  if (!isProcessing) {
                    Haptic.hapticHeavy();
                    handleDelete(item.id, item.name);
                  }
                }}
                delayLongPress={800}
                disabled={isProcessing}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Canvas ${index + 1} of ${savedCanvases.length}. ${item.name}. ${item.cellCount} cells painted. Saved ${new Date(item.timestamp).toLocaleString()}`}
                accessibilityHint="Double tap to load canvas, long press to delete canvas"
                style={styles.canvasCard}
              >
                <Text
                  style={styles.canvasCardTitle}
                  accessible={false}
                >
                  {item.name}
                </Text>
                <Text
                  style={styles.canvasCardInfo}
                  accessible={false}
                >
                  {new Date(item.timestamp).toLocaleString()} • {item.cellCount} cells
                </Text>
                <Text
                  style={styles.canvasCardHint}
                  accessible={false}
                >
                  Double tap to load • Long press to delete
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={() => {
              setShowLoadDialog(false);
              Haptic.hapticLight();
              Audio.speak("Closed");
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityHint="Double tap to return to actions menu"
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Actions</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>
            Canvas
          </Text>
          
          <Pressable
            onPress={handleSavePrompt}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Save canvas"
            accessibilityHint="Double tap to save your current canvas with a name"
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Save Canvas</Text>
          </Pressable>

          <Pressable
            onPress={handleLoadPrompt}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Load saved canvas"
            accessibilityHint="Double tap to view and load your saved canvases"
            style={styles.successButton}
          >
            <Text style={styles.successButtonText}>
              Load Canvas
            </Text>
          </Pressable>

          <Pressable
            onPress={handleClear}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Clear canvas"
            accessibilityHint="Double tap to clear all painted cells"
            style={styles.dangerButton}
          >
            <Text style={styles.dangerButtonText}>Clear Canvas</Text>
          </Pressable>
        </View>

        <View style={[styles.section, styles.sectionSpacing]}>
          <Text style={styles.sectionHeader}>
            Share
          </Text>
          
          <Pressable
            onPress={handleShareDescription}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share text description"
            accessibilityHint="Double tap to share a screen reader friendly text description of your drawing"
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>
              Text Description
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareImage}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share image"
            accessibilityHint="Double tap to share a visual image that sighted users can see"
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>
              Image (PNG)
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShareSVG}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share S V G image"
            accessibilityHint="Double tap to share an S V G image for sighted users"
            style={styles.shareButton}
          >
            <Text style={styles.shareButtonText}>
              SVG Image
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close actions menu"
          accessibilityHint="Double tap to return to canvas"
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.hiddenImageView} ref={imageViewRef} collapsable={false}>
        <CanvasImageRenderer canvas={canvas} cellSize={EXPORT_CELL_SIZE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#18181B',
  },

  // Content Areas
  content: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    flex: 1,
    padding: 24,
  },

  // Footer
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionSpacing: {
    paddingTop: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  // Primary Button (Save - Blue)
  primaryButton: {
    backgroundColor: '#3F3F46',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Success Button (Load - Green)
  successButton: {
    backgroundColor: '#3F3F46',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Danger Button (Clear - Red)
  dangerButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Secondary Button (Cancel, Close)
  secondaryButton: {
    backgroundColor: '#E4E4E7',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#18181B',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Share Buttons
  shareButton: {
    backgroundColor: '#E4E4E7',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  shareButtonText: {
    color: '#18181B',
    fontSize: 16,
    fontWeight: '600',
  },

  // Close Button (Dark)
  closeButton: {
    backgroundColor: '#3F3F46',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Text Input
  textInput: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#18181B',
  },
  instructionText: {
    fontSize: 16,
    color: '#3F3F46',
    marginBottom: 12,
  },

  // Canvas Card (Load Dialog)
  canvasCard: {
    borderWidth: 1,
    borderColor: '#D4D4D8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  canvasCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 8,
  },
  canvasCardInfo: {
    fontSize: 14,
    color: '#52525B',
    marginBottom: 12,
  },
  canvasCardHint: {
    fontSize: 12,
    color: '#A1A1AA',
  },

  // Empty State
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#71717A',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Hidden Image View
  hiddenImageView: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    opacity: 0,
  },
});