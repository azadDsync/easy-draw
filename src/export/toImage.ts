// src/export/toImage.ts
// Export canvas to PNG image for sharing
// Creates actual PNG files that work in WhatsApp, Messages, etc.

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { CanvasState } from "../canvas/types";

/**
 * Share canvas as PNG image using a ref to the rendered component
 */
export async function shareCanvasAsImage(
  viewRef: any,
  canvas: CanvasState
): Promise<{ success: boolean; message?: string }> {
  try {
    // Check if canvas has any painted cells
    if (canvas.cells.size === 0) {
      return {
        success: false,
        message: 'Cannot share empty canvas. Paint some cells first',
      };
    }

    console.log('Capturing canvas as PNG with', canvas.cells.size, 'cells');
    
    // Capture the view as PNG
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1.0,
      result: 'tmpfile',
    });
    
    console.log('PNG captured at:', uri);
    
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'Sharing is not available on this device',
      };
    }
    
    console.log('Sharing PNG file...');
    
    // Share the PNG file
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: `Canvas Drawing - ${canvas.cells.size} cells painted`,
      UTI: 'public.png',
    });
    
    console.log('Share completed successfully');
    
    return {
      success: true,
      message: 'Image shared successfully',
    };
  } catch (error) {
    console.error('Share image error:', error);
    return {
      success: false,
      message: `Failed to share image: ${error}`,
    };
  }
}

/**
 * Get image info for description
 */
export function getImageDescription(canvas: CanvasState): string {
  const cellCount = canvas.cells.size;
  return `Canvas Drawing: ${canvas.config.width}x${canvas.config.height} grid with ${cellCount} painted cell${cellCount === 1 ? '' : 's'}`;
}

