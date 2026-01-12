// src/ui/GuideModal.tsx
// Accessible guide modal showing all gestures and instructions

import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { getCanvasDimensions, getDeviceInfo } from "../config/canvasConfig";

interface GuideModalProps {
  onClose: () => void;
}

export function GuideModal({ onClose }: GuideModalProps) {
  const canvasDimensions = getCanvasDimensions();
  const deviceInfo = getDeviceInfo();
  const totalCells = canvasDimensions.width * canvasDimensions.height;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guide</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Basic Gestures
          </Text>
          <Text style={styles.instruction}>
            • Swipe up/down/left/right: Move focus to adjacent cell
          </Text>
          <Text style={styles.instruction}>
            • Tap: Inspect current cell (safe exploration)
          </Text>
          <Text style={styles.instruction}>
            • Double tap: Paint or erase current cell
          </Text>
          <Text style={styles.instruction}>
            • Long press (0.5 sec): Open color menu
          </Text>
          <Text style={styles.instruction}>
            • Extra long press (2 sec): Hear context (where am I, current mode and color)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Color Menu
          </Text>
          <Text style={styles.instruction}>
            • Swipe left/right: Browse colors
          </Text>
          <Text style={styles.instruction}>
            • Double tap: Confirm selected color and close menu
          </Text>
          <Text style={styles.instruction}>
            • Long press: Close menu without changing color
          </Text>
          <Text style={styles.instruction}>
            • Note: Color menu reminds you after 5 seconds if still open
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Toolbar Navigation
          </Text>
          <Text style={styles.instruction}>
            • Toolbar is at the top of screen
          </Text>
          <Text style={styles.instruction}>
            • Swipe down from top to find toolbar buttons
          </Text>
          <Text style={styles.instruction}>
            • Swipe right/left to navigate between buttons
          </Text>
          <Text style={styles.instruction}>
            • Double tap to activate any button
          </Text>
          <Text style={styles.instruction}>
            • Swipe down past toolbar to return to canvas
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Toolbar Buttons
          </Text>
          <Text style={styles.instruction}>
            • Eraser: Toggle between paint and erase mode
          </Text>
          <Text style={styles.instruction}>
            • Undo: Undo last paint or erase action
          </Text>
          <Text style={styles.instruction}>
            • Redo: Redo last undone action
          </Text>
          <Text style={styles.instruction}>
            • Describe: Hear what you've drawn
          </Text>
          <Text style={styles.instruction}>
            • Actions: Save, load, clear, and share options
          </Text>
          <Text style={styles.instruction}>
            • Guide: Show this guide
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Available Colors
          </Text>
          <Text style={styles.instruction}>
            Black, White, Red, Green, Blue, Yellow, Magenta, Cyan, Orange,
            Purple, Pink, Brown
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Canvas Size
          </Text>
          <Text style={styles.instruction}>
            {canvasDimensions.height} rows by {canvasDimensions.width} columns ({totalCells} cells total)
          </Text>
          <Text style={styles.instruction}>
            Device: {deviceInfo.isTablet ? 'Tablet' : 'Mobile'} • Cell Size: {deviceInfo.cellSize}px
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tips
          </Text>
          <Text style={styles.instruction}>
            • All actions are announced with speech
          </Text>
          <Text style={styles.instruction}>
            • Haptic feedback confirms each action
          </Text>
          <Text style={styles.instruction}>
            • Hitting canvas boundary gives distinct feedback
          </Text>
          <Text style={styles.instruction}>
            • Save multiple canvases with custom names
          </Text>
          <Text style={styles.instruction}>
            • Export as text description or image
          </Text>
          <Text style={styles.instruction}>
            • Use extra long press (2 sec) anytime if you get lost
          </Text>
          <Text style={styles.instruction}>
            • Modals announce when they open and close
          </Text>
          <Text style={styles.instruction}>
            • Toolbar swipes don't affect canvas focus
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={onClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close guide"
          accessibilityHint="Double tap to return to canvas"
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
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
  scrollContent: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 16,
    color: '#3F3F46',
    marginBottom: 8,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#3F3F46',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});