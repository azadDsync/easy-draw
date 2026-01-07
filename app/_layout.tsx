// app/_layout.tsx
// Root layout with GestureHandlerRootView for gesture support
// Wraps all screens in the app

import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import './global.css';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none", // Predictable navigation for screen readers
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="canvas" />
      </Stack>
    </GestureHandlerRootView>
  );
}
