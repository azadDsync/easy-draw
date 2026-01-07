// src/ui/GuideModal.tsx
// Accessible guide modal showing all gestures and instructions

import { View, Text, ScrollView, Pressable } from "react-native";

interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <View className="flex-1 bg-white">
      <View className="p-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Drawing Guide</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Basic Gestures
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Swipe up/down/left/right: Move focus to adjacent cell
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Tap: Inspect current cell (safe exploration)
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Double tap: Paint or erase current cell
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Long press (0.5 sec): Open color menu
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Extra long press (2 sec): Hear context (where am I, current mode and color)
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Color Menu
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Swipe left/right: Browse colors
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Double tap: Confirm selected color and close menu
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Long press: Close menu without changing color
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Note: Color menu reminds you after 5 seconds if still open
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Toolbar Navigation
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Toolbar is at the top of screen
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Swipe down from top to find toolbar buttons
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Swipe right/left to navigate between buttons
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Double tap to activate any button
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Swipe down past toolbar to return to canvas
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Toolbar Buttons
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Eraser: Toggle between paint and erase mode
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Undo: Undo last paint or erase action
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Redo: Redo last undone action
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Describe: Hear what you've drawn
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Actions: Save, load, clear, and share options
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Guide: Show this guide
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Available Colors
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            Black, White, Red, Green, Blue, Yellow, Magenta, Cyan, Orange,
            Purple, Pink, Brown
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Canvas Size
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            8 rows by 8 columns (64 cells total)
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-2">
            Tips
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • All actions are announced with speech
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Haptic feedback confirms each action
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Hitting canvas boundary gives distinct feedback
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Save multiple canvases with custom names
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Export as text description or image
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Use extra long press (2 sec) anytime if you get lost
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Modals announce when they open and close
          </Text>
          <Text className="text-base text-gray-700 mb-2">
            • Toolbar swipes don't affect canvas focus
          </Text>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-gray-200">
        <Pressable
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close guide"
          accessibilityHint="Double tap to return to canvas"
          className="bg-blue-600 p-4 rounded-lg active:bg-blue-700"
        >
          <Text className="text-white text-lg font-semibold text-center">
            Close Guide
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
