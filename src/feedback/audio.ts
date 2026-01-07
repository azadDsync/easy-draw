// src/feedback/audio.ts
// Audio feedback using expo-speech
// Provides text-to-speech announcements for blind users

import * as Speech from "expo-speech";

/**
 * Speech configuration
 */
interface SpeechConfig {
  language?: string;
  pitch?: number;
  rate?: number;
}

const DEFAULT_SPEECH_CONFIG: SpeechConfig = {
  language: "en",
  pitch: 1.0,
  rate: 1.0,
};

/**
 * Global speech timeout for debouncing
 */
let speechTimeout: ReturnType<typeof setTimeout> | null = null;
const SPEECH_DEBOUNCE_MS = 100;

/**
 * Speaks text using text-to-speech with automatic debouncing
 * Prevents speech overlap by cancelling pending announcements
 */
export function speak(
  text: string,
  config: SpeechConfig = DEFAULT_SPEECH_CONFIG
): void {
  try {
    // Clear any pending speech
    if (speechTimeout) {
      clearTimeout(speechTimeout);
      speechTimeout = null;
    }
    
    // Stop current speech
    Speech.stop();
    
    // Schedule new speech with small delay to prevent overlap
    speechTimeout = setTimeout(() => {
      Speech.speak(text, {
        language: config.language || DEFAULT_SPEECH_CONFIG.language,
        pitch: config.pitch || DEFAULT_SPEECH_CONFIG.pitch,
        rate: config.rate || DEFAULT_SPEECH_CONFIG.rate,
      });
      speechTimeout = null;
    }, SPEECH_DEBOUNCE_MS);
  } catch (error) {
    console.error("Speech error:", error);
  }
}

/**
 * Stops current speech
 * Fire-and-forget - does not wait for completion
 */
export function stopSpeech(): void {
  try {
    Speech.stop();
  } catch (error) {
    console.error("Stop speech error:", error);
  }
}

/**
 * Announces focus position
 */
export function announceFocusPosition(row: number, col: number): void {
  speak(`Row ${row}, Column ${col}`);
}

/**
 * Announces paint action
 */
export function announcePaint(color: string, row: number, col: number): void {
  speak(`Painted ${color} at row ${row}, column ${col}`);
}

/**
 * Announces cell inspection
 */
export function announceCellInfo(
  row: number,
  col: number,
  color: string | null
): void {
  if (color) {
    speak(`Row ${row}, column ${col}, color ${color}`);
  } else {
    speak(`Row ${row}, column ${col}, empty`);
  }
}

/**
 * Announces boundary collision
 */
export function announceBoundary(direction: string): void {
  speak(`Cannot move ${direction}, boundary reached`);
}

/**
 * Announces color menu opened
 */
export function announceColorMenuOpened(color: string, index: number, total: number): void {
  speak(`Color menu opened. ${color}. ${index} of ${total}`);
}

/**
 * Announces color menu closed
 */
export function announceColorMenuClosed(): void {
  speak("Color menu closed");
}

/**
 * Announces color selection
 */
export function announceColorSelection(color: string, index: number, total: number): void {
  speak(`${color}. ${index} of ${total}`);
}

/**
 * Announces color confirmed
 */
export function announceColorConfirmed(color: string): void {
  speak(`Color confirmed. ${color} selected`);
}

/**
 * Announces undo action
 */
export function announceUndo(): void {
  speak("Undo");
}

/**
 * Announces redo action
 */
export function announceRedo(): void {
  speak("Redo");
}

/**
 * Announces action failure
 */
export function announceFailure(message: string): void {
  speak(message);
}
