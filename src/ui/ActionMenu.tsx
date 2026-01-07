// src/ui/ActionMenu.tsx
// Action menu for save/load/export/clear operations
// Fully accessible with speech and haptics

import { View, Pressable, Text, Alert, Share, TextInput, ScrollView } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useCanvasStore } from "../store/useCanvasStore";
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
    // Check if canvas is empty
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
    // Double check canvas is not empty
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
    
    // Use updated state after refresh
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
    // Check if current canvas has painted cells
    const currentCanvas = canvas;
    const hasPaintedCells = currentCanvas.cells.size > 0;

    if (hasPaintedCells) {
      // Show warning alert
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
      // Canvas is empty, load directly
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
              
              // Check if list is now empty
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
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">Save Canvas</Text>
        </View>

        <View className="flex-1 p-4">
          <Text
            className="text-base text-gray-700 mb-2"
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
            className="border border-gray-300 rounded-lg p-3 mb-4 text-base"
          />

          <Pressable
            onPress={handleSave}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Save canvas"
            accessibilityHint="Double tap to save with entered name"
            className="bg-blue-600 p-4 rounded-lg mb-3 active:bg-blue-700"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Save
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
            className="bg-gray-600 p-4 rounded-lg active:bg-gray-700"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (showLoadDialog) {
    return (
      <View className="flex-1 bg-white">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-800">
            Saved Canvases ({savedCanvases.length})
          </Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {savedCanvases.length === 0 ? (
            <View className="p-8 items-center">
              <Text 
                className="text-gray-600 text-lg text-center"
                accessible={true}
                accessibilityRole="text"
              >
                No saved canvases yet. Create your first drawing and save it from the actions menu.
              </Text>
            </View>
          ) : (
            savedCanvases.map((item, index) => {
              const doubleTap = Gesture.Tap()
                .numberOfTaps(2)
                .onEnd(() => {
                  if (!isProcessing) {
                    Haptic.hapticMedium();
                    Audio.speak(`Loading ${item.name}`);
                    handleLoad(item.id, item.name);
                  }
                });

              const longPress = Gesture.LongPress()
                .minDuration(800)
                .onEnd(() => {
                  if (!isProcessing) {
                    Haptic.hapticHeavy();
                    handleDelete(item.id, item.name);
                  }
                });

              const combinedGesture = Gesture.Race(doubleTap, longPress);

              return (
                <GestureDetector key={item.id} gesture={combinedGesture}>
                  <View
                    className="border border-gray-300 rounded-lg p-4 mb-3 bg-gray-50 active:bg-gray-100"
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Canvas ${index + 1} of ${savedCanvases.length}. ${item.name}. ${item.cellCount} cells painted. Saved ${new Date(item.timestamp).toLocaleString()}`}
                    accessibilityHint="Double tap to load canvas, long press to delete canvas"
                  >
                    <Text
                      className="text-lg font-semibold text-gray-800 mb-1"
                      accessible={false}
                    >
                      {item.name}
                    </Text>
                    <Text
                      className="text-sm text-gray-600"
                      accessible={false}
                    >
                      {new Date(item.timestamp).toLocaleString()} • {item.cellCount}{" "}
                      cells painted
                    </Text>
                    <Text
                      className="text-xs text-gray-500 mt-2 italic"
                      accessible={false}
                    >
                      Double tap to load • Long press to delete
                    </Text>
                  </View>
                </GestureDetector>
              );
            })
          )}
        </ScrollView>

        <View className="p-4 border-t border-gray-200">
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
            className="bg-gray-600 p-4 rounded-lg active:bg-gray-700"
          >
            <Text className="text-white text-lg font-semibold text-center">
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Actions</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <Pressable
          onPress={handleSavePrompt}
          disabled={isProcessing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Save canvas"
          accessibilityHint="Double tap to save your current canvas with a name"
          className="bg-blue-600 p-4 rounded-lg mb-3 active:bg-blue-700"
        >
          <Text className="text-white text-lg font-semibold">Save Canvas</Text>
        </Pressable>

        <Pressable
          onPress={handleLoadPrompt}
          disabled={isProcessing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Load saved canvas"
          accessibilityHint="Double tap to view and load your saved canvases"
          className="bg-green-600 p-4 rounded-lg mb-3 active:bg-green-700"
        >
          <Text className="text-white text-lg font-semibold">
            Load Saved Canvas
          </Text>
        </Pressable>

        <Pressable
          onPress={handleClear}
          disabled={isProcessing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Clear canvas"
          accessibilityHint="Double tap to clear all painted cells"
          className="bg-orange-600 p-4 rounded-lg mb-3 active:bg-orange-700"
        >
          <Text className="text-white text-lg font-semibold">Clear Canvas</Text>
        </Pressable>

        <View className="my-4 border-t border-gray-300" />

        <Pressable
          onPress={handleShareDescription}
          disabled={isProcessing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share text description"
          accessibilityHint="Double tap to share a screen reader friendly text description of your drawing"
          className="bg-purple-600 p-4 rounded-lg mb-3 active:bg-purple-700"
        >
          <Text className="text-white text-lg font-semibold">
            Share Text Description
          </Text>
        </Pressable>

        <Pressable
          onPress={handleShareImage}
          disabled={isProcessing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share image"
          accessibilityHint="Double tap to share a visual image that sighted users can see"
          className="bg-pink-600 p-4 rounded-lg mb-3 active:bg-pink-700"
        >
          <Text className="text-white text-lg font-semibold">
            Share Image
          </Text>
        </Pressable>

        <Pressable
          onPress={handleShareSVG}
          disabled={isProcessing}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Share S V G image"
          accessibilityHint="Double tap to share an S V G image for sighted users"
          className="bg-indigo-600 p-4 rounded-lg mb-3 active:bg-indigo-700"
        >
          <Text className="text-white text-lg font-semibold">
            Share SVG Image
          </Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close actions menu"
          accessibilityHint="Double tap to return to canvas"
          className="bg-gray-600 p-4 rounded-lg mt-4 active:bg-gray-700"
        >
          <Text className="text-white text-lg font-semibold">Close</Text>
        </Pressable>
      </ScrollView>

      {/* Hidden canvas image renderer for PNG export */}
      <View
        style={{
          position: 'absolute',
          left: -10000,
          top: -10000,
          opacity: 0,
        }}
        ref={imageViewRef}
        collapsable={false}
      >
        <CanvasImageRenderer canvas={canvas} cellSize={100} />
      </View>
    </View>
  );
}
